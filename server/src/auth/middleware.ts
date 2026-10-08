import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import { config, isAuthConfigured } from "../env.js";
import {
  AuthNotConfiguredError,
  AuthServiceError,
  isEmailAllowed,
  verifyNeonSession,
} from "./neonAuth.js";

/**
 * Authentication middleware backed by Neon Auth.
 *
 * The browser holds one first-party, HttpOnly cookie containing the Neon session
 * token. Every protected request re-validates that token against Neon Auth
 * (memoised for a few seconds), so revoking a session upstream takes effect here
 * without any shared secret or signing key of our own.
 */

declare module "fastify" {
  interface FastifyRequest {
    sessionUser?: SessionUser;
  }
}

export interface SessionUser {
  userId: string;
  email: string;
  name?: string;
}

function cookieOptions(): Parameters<FastifyReply["setCookie"]>[2] {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: config.session.secureCookie,
    maxAge: Math.floor(config.session.ttlMs / 1000),
  };
}

export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(config.session.cookieName, token, cookieOptions());
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(config.session.cookieName, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: config.session.secureCookie,
  });
}

export function readSessionToken(request: FastifyRequest): string | null {
  return request.cookies?.[config.session.cookieName] ?? null;
}

export function clientIp(request: FastifyRequest): string {
  return request.ip || "unknown";
}

/**
 * Rejects the request unless a valid Neon Auth session is presented.
 *
 * Status codes are deliberate:
 *   401 — no cookie, or the token is not (or no longer) valid.
 *   403 — valid session, but the email is not on the allowlist.
 *   503 — the auth service is unreachable, so we cannot prove validity. Failing
 *         closed is the only safe answer here.
 */
export const requireAuth: preHandlerHookHandler = async (request, reply) => {
  if (!isAuthConfigured) {
    return reply.code(503).send({
      success: false,
      error: "Authentication is not configured. Set NEON_AUTH_URL and restart the API.",
    });
  }

  const token = readSessionToken(request);
  if (!token) {
    return reply.code(401).send({ success: false, error: "Not signed in." });
  }

  let session;
  try {
    session = await verifyNeonSession(token);
  } catch (error) {
    if (error instanceof AuthServiceError || error instanceof AuthNotConfiguredError) {
      request.log.error({ err: error }, "auth verification failed");
      return reply.code(503).send({
        success: false,
        error: "Sign-in is temporarily unavailable. Please try again in a moment.",
      });
    }
    throw error;
  }

  if (!session) {
    clearSessionCookie(reply);
    return reply
      .code(401)
      .send({ success: false, error: "Your session has expired. Please sign in again." });
  }

  if (!isEmailAllowed(session.user.email)) {
    clearSessionCookie(reply);
    request.log.warn({ email: session.user.email }, "rejected sign-in: email not on allowlist");
    return reply.code(403).send({
      success: false,
      error: "This account is not permitted to manage this site.",
    });
  }

  request.sessionUser = {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
};

/** Cached so every write is attributed without another auth round-trip. */
export function actorEmail(request: FastifyRequest): string {
  return request.sessionUser?.email ?? "unknown";
}

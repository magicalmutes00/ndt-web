import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { config, isAuthConfigured } from "../env.js";
import {
  AuthNotConfiguredError,
  AuthServiceError,
  isEmailAllowed,
  signInWithPassword,
  signOutUpstream,
} from "./neonAuth.js";
import {
  clearSessionCookie,
  clientIp,
  readSessionToken,
  requireAuth,
  setSessionCookie,
} from "./middleware.js";
import { countRecentFailures, recordLoginAttempt } from "./loginAttempts.js";

/**
 * Auth routes.
 *
 * Sign-in is proxied through this API rather than called from the browser: the
 * Neon session token then lands in an HttpOnly cookie instead of JavaScript,
 * the browser only ever holds a first-party cookie, and the allowlist is
 * enforced server-side where it cannot be bypassed.
 */

const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/auth/login", async (request, reply) => {
    if (!isAuthConfigured) {
      return reply.code(503).send({
        success: false,
        error: "Authentication is not configured. Set NEON_AUTH_URL and restart the API.",
      });
    }

    const parsed = loginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: "Enter a valid email and password." });
    }

    const { email, password } = parsed.data;
    const ip = clientIp(request);

    // Our own lockout on top of whatever Neon Auth applies, because a compromised
    // account password is the main risk here.
    const failures = await countRecentFailures(ip, email, LOCKOUT_WINDOW_MS);
    if (failures >= MAX_FAILURES) {
      return reply.code(429).send({
        success: false,
        error: "Too many failed attempts. Try again in a few minutes.",
      });
    }

    let result: Awaited<ReturnType<typeof signInWithPassword>>;
    try {
      /**
       * Neon Auth requires a trusted Origin on sign-in, so forward the caller's.
       * Behind a proxy this reflects the browser's origin as long as
       * `trustProxy` is on (it is, in app.ts).
       */
      const origin =
        (request.headers.origin as string | undefined) ??
        (request.headers.referer ? new URL(request.headers.referer).origin : undefined) ??
        config.publicOrigin;

      result = await signInWithPassword(email, password, origin);
    } catch (error) {
      if (error instanceof AuthServiceError || error instanceof AuthNotConfiguredError) {
        request.log.error({ err: error }, "sign-in failed");
        return reply.code(503).send({
          success: false,
          error: "Sign-in is temporarily unavailable. Please try again in a moment.",
        });
      }
      throw error;
    }

    if (!result) {
      await recordLoginAttempt(ip, email, false).catch(() => undefined);
      return reply.code(401).send({ success: false, error: "Incorrect email or password." });
    }

    // Credentials are valid, but the account may still be outside the allowlist.
    if (!isEmailAllowed(result.user.email)) {
      await recordLoginAttempt(ip, email, false).catch(() => undefined);
      request.log.warn({ email: result.user.email }, "rejected sign-in: email not on allowlist");
      return reply.code(403).send({
        success: false,
        error: "This account is not permitted to manage this site.",
      });
    }

    await recordLoginAttempt(ip, email, true).catch(() => undefined);
    setSessionCookie(reply, result.value);

    return reply.send({
      success: true,
      data: {
        email: result.user.email,
        name: result.user.name ?? null,
        expiresAt: new Date(Date.now() + config.session.ttlMs).toISOString(),
      },
    });
  });

  app.post("/api/auth/logout", async (request, reply) => {
    const credential = readSessionToken(request);
    if (credential) await signOutUpstream(credential);
    clearSessionCookie(reply);
    return reply.send({ success: true, data: { signedOut: true } });
  });

  app.get("/api/auth/me", { preHandler: requireAuth }, async (request, reply) => {
    const user = request.sessionUser!;
    return reply.send({
      success: true,
      data: {
        email: user.email,
        name: user.name ?? null,
        expiresAt: new Date(Date.now() + config.session.ttlMs).toISOString(),
      },
    });
  });
}

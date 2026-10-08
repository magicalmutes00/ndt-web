import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { config, isAuthConfigured } from "../env.js";

/**
 * Neon Auth (managed Better Auth) integration.
 *
 * Verification strategy, cheapest first:
 *
 *   1. **JWT + JWKS** — if the token is a JWT signed by Neon's Ed25519 key, it is
 *      verified locally with no network round-trip. This is the fast path once
 *      you enable the JWT plugin and sign in through the SDK's token flow.
 *   2. **Session introspection** — `GET /get-session` with the token as a Bearer
 *      credential. This is what a plain email/password sign-in produces (an
 *      opaque session token), and it is the path used out of the box.
 *
 * Both paths are cached briefly, because introspection costs a request to the
 * auth service and the dashboard makes many calls per page.
 */

export class AuthNotConfiguredError extends Error {
  readonly code = "AUTH_NOT_CONFIGURED";
  constructor() {
    super("NEON_AUTH_URL is not set, so the admin dashboard is disabled.");
    this.name = "AuthNotConfiguredError";
  }
}

export class AuthServiceError extends Error {
  readonly code = "AUTH_SERVICE_UNAVAILABLE";
  constructor(message: string) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export interface NeonUser {
  id: string;
  email: string;
  name?: string;
}

export interface VerifiedSession {
  user: NeonUser;
  expiresAt: Date | null;
  /** How the token was validated — useful in logs and tests. */
  method: "jwt" | "introspection";
}

function assertConfigured(): string {
  if (!isAuthConfigured || !config.neonAuth.url) throw new AuthNotConfiguredError();
  return config.neonAuth.url;
}

/* -------------------------------------------------------------------------- */
/*                                    JWKS                                    */
/* -------------------------------------------------------------------------- */

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(baseUrl: string) {
  if (!jwks) {
    // jose caches keys internally and refetches on an unknown `kid`, so a key
    // rotation does not require a restart.
    jwks = createRemoteJWKSet(new URL(`${baseUrl}/.well-known/jwks.json`), {
      timeoutDuration: 5_000,
      cooldownDuration: 30_000,
    });
  }
  return jwks;
}

/** A JWT has three dot-separated segments; a session token does not. */
export function looksLikeJwt(token: string): boolean {
  return token.split(".").length === 3;
}

/**
 * Better Auth puts the user id in `sub` and the email in `email`; some versions
 * also expose `user.id`. Read defensively rather than assuming one shape.
 */
export function userFromClaims(payload: JWTPayload & Record<string, unknown>): NeonUser | null {
  const nested = payload.user as { id?: unknown; email?: unknown; name?: unknown } | undefined;
  const id = (payload.sub ?? nested?.id) as string | undefined;
  const email = (payload.email ?? nested?.email) as string | undefined;
  const name = (payload.name ?? nested?.name) as string | undefined;

  if (typeof id !== "string" || typeof email !== "string") return null;
  return { id, email, name: typeof name === "string" ? name : undefined };
}

async function verifyJwt(token: string): Promise<VerifiedSession | null> {
  const baseUrl = assertConfigured();
  try {
    const { payload } = await jwtVerify(token, getJwks(baseUrl), {
      // Better Auth's issuer/audience conventions vary by deployment, so the
      // signature plus our own claim validation is the trust anchor here.
      clockTolerance: 5,
    });

    const user = userFromClaims(payload as JWTPayload & Record<string, unknown>);
    if (!user) return null;

    return {
      user,
      expiresAt: typeof payload.exp === "number" ? new Date(payload.exp * 1000) : null,
      method: "jwt",
    };
  } catch {
    // Not a verifiable JWT (or not a JWT at all) — fall through to introspection.
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                              introspection                                 */
/* -------------------------------------------------------------------------- */

interface SessionResponse {
  session?: { expiresAt?: string };
  user?: { id?: string; email?: string; name?: string };
}

/**
 * Reads the session cookie out of the auth service's `Set-Cookie` header.
 *
 * Crucial detail: Better Auth's `/get-session` expects the **signed cookie
 * value** (`<token>.<signature>`), not the bare `token` that `/sign-in/email`
 * returns in its JSON body. Sending the bare token yields `null`, which looks
 * exactly like an expired session. We therefore keep the whole cookie value and
 * replay the same cookie name on introspection.
 */
function readAuthSessionCookie(headers: Headers): { name: string; value: string } | null {
  const raw = headers.getSetCookie?.() ?? [];
  for (const cookie of raw) {
    const separator = cookie.indexOf("=");
    if (separator === -1) continue;
    const name = cookie.slice(0, separator).trim();
    const value = cookie.slice(separator + 1).split(";")[0].trim();
    // Handles both "__Secure-neon-auth.session_token" and the non-secure variant.
    if (name.includes("session_token") && value) return { name, value };
  }
  return null;
}

async function introspect(
  credential: { kind: "bearer"; token: string } | { kind: "cookie"; name: string; value: string }
): Promise<VerifiedSession | null> {
  const baseUrl = assertConfigured();

  const authHeaders: Record<string, string> =
    credential.kind === "bearer"
      ? { authorization: `Bearer ${credential.token}` }
      : { cookie: `${credential.name}=${credential.value}` };

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/get-session`, {
      method: "GET",
      headers: { accept: "application/json", ...authHeaders },
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    // Distinguish "auth service is down" from "session is invalid": the first is
    // a 503 for the caller, the second a 401. Never treat an outage as valid.
    throw new AuthServiceError(
      `Could not reach the auth service: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) {
    throw new AuthServiceError(`Auth service returned HTTP ${response.status}`);
  }

  const body = (await response.json().catch(() => null)) as SessionResponse | null;
  const user = body?.user;
  if (!user?.id || !user.email) return null;

  return {
    user: { id: user.id, email: user.email, name: user.name },
    expiresAt: body?.session?.expiresAt ? new Date(body.session.expiresAt) : null,
    method: "introspection",
  };
}

/* -------------------------------------------------------------------------- */
/*                                   cache                                    */
/* -------------------------------------------------------------------------- */

interface CacheEntry {
  session: VerifiedSession | null;
  expiresAt: number;
}

const sessionCache = new Map<string, CacheEntry>();

/**
 * Never key the cache by the raw token, so a heap dump does not expose them.
 * Collision resistance only needs to separate live sessions, not resist an
 * attacker who already holds the token.
 */
function cacheKey(token: string): string {
  let hash = 0;
  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) | 0;
  }
  return `${token.length}:${hash}`;
}

function readCache(token: string): VerifiedSession | null | undefined {
  if (config.neonAuth.sessionCacheMs <= 0) return undefined;
  const entry = sessionCache.get(cacheKey(token));
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    sessionCache.delete(cacheKey(token));
    return undefined;
  }
  return entry.session;
}

function writeCache(token: string, session: VerifiedSession | null): void {
  if (config.neonAuth.sessionCacheMs <= 0) return;
  sessionCache.set(cacheKey(token), {
    session,
    expiresAt: Date.now() + config.neonAuth.sessionCacheMs,
  });
  // Bound the map so a flood of bad tokens cannot grow it without limit.
  if (sessionCache.size > 500) {
    const oldest = sessionCache.keys().next().value;
    if (oldest !== undefined) sessionCache.delete(oldest);
  }
}

/** Test seam: drop memoised sessions. */
export function clearSessionCache(): void {
  sessionCache.clear();
}

/* -------------------------------------------------------------------------- */
/*                                 public API                                 */
/* -------------------------------------------------------------------------- */

/**
 * Returns the Neon Auth user for a token, or null when the token is not valid.
 * Throws AuthServiceError when the auth service cannot be reached, so callers
 * can answer 503 rather than silently treating the user as signed out.
 */
export async function verifyNeonSession(credential: string): Promise<VerifiedSession | null> {
  if (!credential) return null;

  const cached = readCache(credential);
  if (cached !== undefined) return cached;

  let session: VerifiedSession | null = null;

  /*
   * Our cookie holds the auth service's signed session-cookie value, which is
   * what introspection accepts. Try the secure cookie name first (the one Neon
   * Auth uses over HTTPS), then the plain one, then the value as a bearer token
   * for JWT-style flows.
   */
  session = await introspect({ kind: "cookie", name: AUTH_SESSION_COOKIE, value: credential });

  if (!session) {
    session = await introspect({
      kind: "cookie",
      name: AUTH_SESSION_COOKIE_INSECURE,
      value: credential,
    });
  }

  if (!session) {
    session = await introspect({ kind: "bearer", token: credential });
  }
  if (!session && looksLikeJwt(credential)) {
    session = await verifyJwt(credential);
  }

  writeCache(credential, session);
  return session;
}

/** Cookie names Better Auth uses for the session; introspection replays one. */
const AUTH_SESSION_COOKIE = "__Secure-neon-auth.session_token";
const AUTH_SESSION_COOKIE_INSECURE = "neon-auth.session_token";

/**
 * Returns the credential to persist in our own cookie.
 *
 * Preferred is the signed session cookie the auth service sets, because that is
 * what `/get-session` accepts. The bare JSON `token` is only a fallback for
 * JWT-style flows.
 */
export interface NeonCredential {
  /** Value we store in our HttpOnly cookie. */
  value: string;
  user: NeonUser;
}

export async function signInWithPassword(
  email: string,
  password: string,
  /**
   * The browser's Origin, forwarded verbatim.
   *
   * Neon Auth rejects a sign-in with no Origin at all (`MISSING_OR_NULL_ORIGIN`)
   * and rejects an untrusted one (`INVALID_ORIGIN`), so this must be the real
   * caller origin — which also means the deploying site must be on the project's
   * trusted-domain list in the Neon Console.
   */
  origin?: string
): Promise<NeonCredential | null> {
  const baseUrl = assertConfigured();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/sign-in/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(origin ? { origin } : {}),
      },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new AuthServiceError(
      `Could not reach the auth service: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (response.status === 401 || response.status === 403) {
    // 403 here is almost always a missing/untrusted Origin rather than bad
    // credentials, so surface it instead of reporting a wrong password.
    if (response.status === 403) {
      const body = (await response.clone().json().catch(() => null)) as { code?: string } | null;
      if (body?.code === "MISSING_OR_NULL_ORIGIN" || body?.code === "INVALID_ORIGIN") {
        throw new AuthServiceError(
          `Sign-in was rejected because the site origin is missing or not trusted by Neon Auth (${body.code}). ` +
            "Add this site's origin to the project's trusted domains in the Neon Console."
        );
      }
    }
    return null;
  }
  if (!response.ok) {
    throw new AuthServiceError(`Sign-in failed with HTTP ${response.status}`);
  }

  const body = (await response.json().catch(() => null)) as
    | { token?: string; user?: { id?: string; email?: string; name?: string } }
    | null;

  if (!body?.user?.id || !body.user.email) return null;

  /*
   * Prefer the signed session cookie over the JSON token: `/get-session` only
   * accepts the former, and the bare token looks identical to an expired
   * session when introspected.
   */
  const cookie = readAuthSessionCookie(response.headers);

  return {
    value: cookie?.value ?? body.token ?? "",
    user: { id: body.user.id, email: body.user.email, name: body.user.name },
  };
}

/** Best-effort upstream sign-out; our own cookie is cleared regardless. */
export async function signOutUpstream(credential: string): Promise<void> {
  if (!isAuthConfigured || !config.neonAuth.url) return;
  try {
    await fetch(`${config.neonAuth.url}/sign-out`, {
      method: "POST",
      // Sent the same way the session was validated.
      headers: { cookie: `${AUTH_SESSION_COOKIE}=${credential}`, "content-type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // A failed upstream sign-out must not block the user from signing out here.
  }
}

/**
 * Enforces the optional email allowlist. With no allowlist configured, any
 * authenticated Neon Auth user is accepted — which is only safe if you control
 * who can sign up in the Neon Console.
 */
export function isEmailAllowed(email: string): boolean {
  const allowlist = config.neonAuth.allowedEmails;
  if (allowlist.length === 0) return true;
  return allowlist.includes(email.toLowerCase());
}

/**
 * Creates a user through Neon Auth's admin API. Used by the setup script so the
 * first admin can be provisioned without touching the Console by hand.
 */
export async function adminCreateUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ id: string; email: string }> {
  const baseUrl = assertConfigured();
  const apiKey = config.neonAuth.adminApiKey;
  if (!apiKey) {
    throw new AuthNotConfiguredError();
  }

  const response = await fetch(`${baseUrl}/admin/create-user`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      accept: "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      name: input.name ?? input.email.split("@")[0],
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const body = (await response.json().catch(() => null)) as
    | { user?: { id?: string; email?: string }; message?: string }
    | null;

  if (!response.ok || !body?.user?.id) {
    throw new AuthServiceError(body?.message ?? `create-user failed with HTTP ${response.status}`);
  }

  return { id: body.user.id, email: body.user.email ?? input.email };
}

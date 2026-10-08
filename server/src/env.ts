import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

/**
 * Environment loading.
 *
 * Deliberately forgiving: only the database URL is required, and only at the
 * point of use. That lets the API boot (and serve fallback content) in a fresh
 * checkout with no .env at all, which keeps local development and CI painless.
 *
 * The .env parser is inlined rather than pulling in `dotenv` — supporting the
 * handful of syntaxes we actually use costs less code than the dependency.
 */

const here = dirname(fileURLToPath(import.meta.url));
/** Repository root: this file lives at <root>/server/src/env.ts */
export const repoRoot = resolve(here, "..", "..");

function parseDotEnv(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    if (!key) continue;

    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function readDotEnv(): Record<string, string> {
  const file = resolve(repoRoot, ".env");
  if (!existsSync(file)) return {};
  try {
    return parseDotEnv(readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

const rawEnv: Record<string, string | undefined> = {
  ...readDotEnv(),
  ...process.env,
};

const booleanish = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (typeof value === "boolean") return value;
    if (value === undefined || value === "") return undefined;
    return /^(1|true|yes|on)$/i.test(value);
  });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(8787),
  HOST: z.string().default("0.0.0.0"),

  DATABASE_URL: z.string().trim().optional(),
  NEON_AUTH_TOKEN: z.string().trim().optional(),

  /**
   * Neon Auth (managed Better Auth) base URL, e.g.
   * https://ep-xxx.neonauth.us-east-2.aws.neon.tech/neondb/auth
   * When unset, the dashboard is disabled and only public content is served.
   */
  NEON_AUTH_URL: z.string().trim().url().optional(),
  /** Enables the /admin/* user-management calls. Sent as x-api-key. */
  NEON_AUTH_ADMIN_API_KEY: z.string().trim().optional(),
  /** Comma-separated allowlist; empty means "any authenticated Neon Auth user". */
  NEON_AUTH_ALLOWED_EMAILS: z.string().trim().default(""),
  NEON_AUTH_SESSION_CACHE_SECONDS: z.coerce.number().min(0).max(300).default(30),

  CLOUDINARY_CLOUD_NAME: z.string().trim().optional(),
  CLOUDINARY_API_KEY: z.string().trim().optional(),
  CLOUDINARY_API_SECRET: z.string().trim().optional(),
  CLOUDINARY_FOLDER: z.string().trim().default("ndt"),

  /** Neon Object Storage (or any S3-compatible endpoint). */
  AWS_ENDPOINT_URL_S3: z.string().trim().url().optional(),
  AWS_REGION: z.string().trim().optional(),
  AWS_ACCESS_KEY_ID: z.string().trim().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().trim().optional(),
  S3_BUCKET: z.string().trim().optional(),
  S3_FOLDER: z.string().trim().default("uploads"),
  /**
   * Which provider new uploads use. Left unset, S3 wins when configured,
   * otherwise Cloudinary. Useful for migrating without a code change.
   */
  STORAGE_PROVIDER: z.enum(["s3", "cloudinary"]).optional(),
  /** Lifetime of the presigned upload URL, in seconds. */
  S3_UPLOAD_URL_TTL_SECONDS: z.coerce.number().min(30).max(3600).default(300),

  /** Length of the browser session cookie (the Neon session itself is longer). */
  SESSION_TTL_HOURS: z.coerce.number().min(1).max(24 * 30).default(12),
  COOKIE_SECURE: booleanish,

  /** Comma-separated origins allowed to call the API with credentials. */
  CORS_ORIGINS: z.string().trim().default(""),
  /**
   * Origin forwarded to Neon Auth on sign-in when the caller sends none (a
   * script or curl, for example). Must be on the project's trusted domains.
   */
  PUBLIC_ORIGIN: z.string().trim().url().optional(),
  /** Serve the built SPA from this process (single-origin deployment). */
  SERVE_STATIC: booleanish,
});

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${details}`);
}

const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  host: env.HOST,

  databaseUrl: env.DATABASE_URL,
  neonAuthToken: env.NEON_AUTH_TOKEN,

  neonAuth: {
    /** Base URL of the managed auth service; absent means dashboard is disabled. */
    url: env.NEON_AUTH_URL?.replace(/\/$/, ""),
    adminApiKey: env.NEON_AUTH_ADMIN_API_KEY,
    /** Empty list = any authenticated Neon Auth user may use the dashboard. */
    allowedEmails: env.NEON_AUTH_ALLOWED_EMAILS.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
    /** How long a validated session is trusted before re-checking upstream. */
    sessionCacheMs: env.NEON_AUTH_SESSION_CACHE_SECONDS * 1000,
  },

  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    folder: env.CLOUDINARY_FOLDER,
  },

  s3: {
    endpoint: env.AWS_ENDPOINT_URL_S3,
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    bucket: env.S3_BUCKET,
    folder: env.S3_FOLDER,
    uploadUrlTtlSeconds: env.S3_UPLOAD_URL_TTL_SECONDS,
  },

  /** Explicit override, or undefined to pick the best configured provider. */
  storageProviderOverride: env.STORAGE_PROVIDER,

  session: {
    ttlMs: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
    secureCookie: env.COOKIE_SECURE ?? isProduction,
    /**
     * Our own opaque cookie holding the Neon session token. Deliberately not the
     * Neon cookie itself, so the browser only ever holds a first-party cookie
     * and the token is invisible to JavaScript.
     */
    cookieName: "ndt_admin_sid",
  },

  corsOrigins: env.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  /** Forwarded to Neon Auth when a sign-in request carries no Origin. */
  publicOrigin: env.PUBLIC_ORIGIN,

  serveStatic: env.SERVE_STATIC ?? isProduction,
} as const;

export const isDatabaseConfigured = Boolean(config.databaseUrl);
export const isCloudinaryConfigured = Boolean(
  config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret
);
export const isS3Configured = Boolean(
  config.s3.endpoint &&
    config.s3.region &&
    config.s3.accessKeyId &&
    config.s3.secretAccessKey &&
    config.s3.bucket
);
export const isAuthConfigured = Boolean(config.neonAuth.url);

/**
 * Which storage backend new uploads use. An explicit STORAGE_PROVIDER wins;
 * otherwise S3 is preferred when configured, since it keeps credentials and
 * data on the same platform as the database.
 */
export const activeStorageProvider: "s3" | "cloudinary" | null =
  config.storageProviderOverride ??
  (isS3Configured ? "s3" : isCloudinaryConfigured ? "cloudinary" : null);

/** Human-readable startup summary. Never logs secret values. */
export function describeConfig(): string[] {
  return [
    `env: ${config.nodeEnv}`,
    `listen: http://${config.host}:${config.port}`,
    `database: ${isDatabaseConfigured ? "configured" : "MISSING — serving fallback content"}`,
    `auth: ${isAuthConfigured ? `Neon Auth at ${config.neonAuth.url}` : "MISSING — dashboard disabled, public site only"}`,
    `auth allowlist: ${
      config.neonAuth.allowedEmails.length > 0
        ? config.neonAuth.allowedEmails.join(", ")
        : "any authenticated user"
    }`,
    `storage: ${
      activeStorageProvider === "s3"
        ? `S3 (bucket "${config.s3.bucket}" at ${config.s3.endpoint})`
        : activeStorageProvider === "cloudinary"
          ? `Cloudinary (${config.cloudinary.cloudName})`
          : "MISSING — uploads disabled"
    }`,
    `static hosting: ${config.serveStatic ? "enabled" : "disabled"}`,
  ];
}

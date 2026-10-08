import { existsSync } from "node:fs";
import { resolve } from "node:path";
import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { ZodError } from "zod";
import {
  config,
  describeConfig,
  isAuthConfigured,
  isProduction,
  repoRoot,
} from "./env.js";
import { StorageNotConfiguredError } from "./storage/provider.js";
import { storageProviderName } from "./storage/index.js";
import { DatabaseNotConfiguredError, checkDatabase, ensureSchema } from "./db/index.js";
import { registerAuthRoutes } from "./auth/routes.js";
import { registerAdminContentRoutes, registerContentRoutes } from "./content/routes.js";
import { registerMediaRoutes } from "./media/routes.js";

/** Built SPA output: <root>/dist */
const distDir = resolve(repoRoot, "dist");

/**
 * Content Security Policy.
 *
 * `'unsafe-inline'` for styles is required by Framer Motion's inline transforms
 * and Tailwind's runtime-injected styles. Scripts stay strict — the only inline
 * script is the JSON-LD block in index.html, which is data, not executable.
 */
// Origins the browser must be allowed to reach, derived from configuration so a
// provider swap cannot silently break uploads or image loads.
const imageOrigins = ["https://res.cloudinary.com"];
const connectOrigins = ["https://res.cloudinary.com", "https://api.cloudinary.com"];
if (config.s3.endpoint) connectOrigins.push(config.s3.endpoint);

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  `img-src 'self' data: blob: ${imageOrigins.join(" ")}`,
  // Google Maps embeds plus the outbound imagery the current design loads.
  "frame-src 'self' https://www.google.com https://maps.google.com",
  // The browser PUTs uploads straight to the bucket, so its origin is required.
  `connect-src 'self' ${connectOrigins.join(" ")}`,
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

export interface BuildAppOptions {
  /** Disables logging noise in tests. */
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? (!isProduction && config.nodeEnv !== "test"),
    trustProxy: true,
    bodyLimit: 2 * 1024 * 1024,
  });

  // No cookie secret: the session cookie is an opaque Neon Auth token, never a
  // signed value we need to trust on its own — every request re-validates it.
  await app.register(cookie);
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10 },
  });

  // Only needed when the SPA is served from a different origin than the API.
  if (config.corsOrigins.length > 0) {
    const { default: cors } = await import("@fastify/cors");
    await app.register(cors, {
      origin: config.corsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });
  }

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header("Content-Security-Policy", CSP);
    return payload;
  });

  /* ---------------------------------------------------------------- routes */

  app.get("/api/health", async (_request, reply) => {
    const database = await checkDatabase();
    return reply.send({
      success: true,
      data: {
        status: database.reachable || !database.configured ? "ok" : "degraded",
        uptimeSeconds: Math.round(process.uptime()),
        database,
        auth: { configured: isAuthConfigured },
        storage: { provider: storageProviderName() },
      },
    });
  });

  await app.register(registerAuthRoutes);
  await app.register(registerContentRoutes);
  await app.register(registerAdminContentRoutes);
  await app.register(registerMediaRoutes);

  /* --------------------------------------------------------- static + SPA */

  if (config.serveStatic && existsSync(distDir)) {
    await app.register(fastifyStatic, {
      root: distDir,
      // Let the catch-all below decide when to serve index.html.
      wildcard: false,
    });

    app.setNotFoundHandler(async (request, reply) => {
      if (request.method !== "GET" || request.url.startsWith("/api/")) {
        return reply.code(404).send({ success: false, error: "Not found." });
      }
      return reply.sendFile("index.html");
    });
  } else {
    app.setNotFoundHandler(async (request, reply) => {
      void request;
      return reply.code(404).send({ success: false, error: "Not found." });
    });
  }

  /* -------------------------------------------------------- error handling */

  app.setErrorHandler(async (error, request, reply) => {
    const code = (error as { code?: string }).code;
    const message = error instanceof Error ? error.message : String(error);

    if (error instanceof DatabaseNotConfiguredError || code === "DATABASE_NOT_CONFIGURED") {
      return reply.code(503).send({
        success: false,
        error: "The database is not configured. Set DATABASE_URL and restart the API.",
      });
    }
    if (
      error instanceof StorageNotConfiguredError ||
      code === "STORAGE_NOT_CONFIGURED" ||
      code === "CLOUDINARY_NOT_CONFIGURED"
    ) {
      return reply.code(503).send({ success: false, error: message });
    }
    if (error instanceof ZodError) {
      return reply.code(422).send({ success: false, error: "Invalid request.", fields: error.issues });
    }
    if ((error as { statusCode?: number }).statusCode === 429) {
      return reply.code(429).send({ success: false, error: "Too many requests. Slow down." });
    }

    request.log.error(error);
    return reply.code(500).send({
      success: false,
      error: isProduction ? "Internal server error." : message,
    });
  });

  return app;
}

/**
 * Runs migrations and loads the published content. Non-fatal when the database
 * is unconfigured: the API still serves the compiled fallback document, which
 * keeps the public site up and lets the dashboard explain what is missing.
 *
 * There is no user seeding any more — accounts live in Neon Auth.
 */
export async function prepareApp(app: FastifyInstance): Promise<void> {
  try {
    await ensureSchema();

    const { bootstrapContent } = await import("./content/store.js");
    const { seeded, snapshot } = await bootstrapContent();
    app.log.info(
      `[content] ready (source=${snapshot.source}, version=${snapshot.version}${seeded ? ", seeded" : ""})`
    );
  } catch (error) {
    app.log.warn(
      `[content] running without a database: ${error instanceof Error ? error.message : error}`
    );
  }
}

export { describeConfig };

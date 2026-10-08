import { Pool, type PoolClient } from "@neondatabase/serverless";
import { config, isDatabaseConfigured } from "../env.js";
import { migrations } from "./migrations.js";

/**
 * Neon Postgres access.
 *
 * The pool is created lazily so the process can boot without DATABASE_URL and
 * still serve the compiled fallback content. Callers that need the database
 * should use `requirePool()` so the failure is an explicit 503 rather than a
 * confusing null dereference.
 */

let pool: Pool | null = null;
let migrationPromise: Promise<void> | null = null;

export function getPool(): Pool | null {
  if (!isDatabaseConfigured) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    // A dropped idle client must not take the process down.
    pool.on("error", (error: Error) => {
      console.error("[db] idle client error:", error.message);
    });
  }
  return pool;
}

export function requirePool(): Pool {
  const instance = getPool();
  if (!instance) {
    throw new DatabaseNotConfiguredError();
  }
  return instance;
}

export class DatabaseNotConfiguredError extends Error {
  readonly code = "DATABASE_NOT_CONFIGURED";
  constructor() {
    super("DATABASE_URL is not set. Add it to .env to enable the admin dashboard.");
    this.name = "DatabaseNotConfiguredError";
  }
}

/** Runs `fn` inside a transaction, rolling back on any throw. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await requirePool().connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      // The connection may already be gone; the original error matters more.
    }
    throw error;
  } finally {
    client.release();
  }
}

async function applyMigrations(): Promise<void> {
  const client = await requirePool().connect();
  try {
    await client.query("begin");
    await client.query(
      `create table if not exists schema_migrations (
         id text primary key,
         applied_at timestamptz not null default now()
       )`
    );

    const applied = new Set(
      (await client.query<{ id: string }>("select id from schema_migrations")).rows.map((row) => row.id)
    );

    for (const migration of migrations) {
      if (applied.has(migration.id)) continue;
      for (const statement of migration.statements) {
        await client.query(statement);
      }
      await client.query("insert into schema_migrations (id) values ($1)", [migration.id]);
      console.log(`[db] applied migration ${migration.id}`);
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Idempotent and safe to call from every request path — the work happens once,
 * and concurrent callers share the same promise.
 */
export function ensureSchema(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = applyMigrations().catch((error) => {
      migrationPromise = null; // allow a later retry
      throw error;
    });
  }
  return migrationPromise;
}

export interface DatabaseHealth {
  configured: boolean;
  reachable: boolean;
  error?: string;
}

export async function checkDatabase(): Promise<DatabaseHealth> {
  if (!isDatabaseConfigured) return { configured: false, reachable: false };
  try {
    await requirePool().query("select 1");
    return { configured: true, reachable: true };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  const instance = pool;
  pool = null;
  migrationPromise = null;
  await instance.end().catch(() => undefined);
}

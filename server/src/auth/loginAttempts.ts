import { ensureSchema, requirePool } from "../db/index.js";

/**
 * Login lockout accounting.
 *
 * Kept in our own database rather than delegated to Neon Auth so the limit is
 * per (ip, email) and survives a restart. The lockout is only a defence in
 * depth: Neon Auth applies its own rate limiting upstream.
 */

export async function recordLoginAttempt(ip: string, email: string, success: boolean): Promise<void> {
  await ensureSchema();
  await requirePool().query(
    "insert into login_attempts (ip, email, success) values ($1, $2, $3)",
    [ip, email, success]
  );
}

export async function countRecentFailures(ip: string, email: string, windowMs: number): Promise<number> {
  await ensureSchema();
  const { rows } = await requirePool().query<{ count: string }>(
    `select count(*)::text as count
       from login_attempts
      where ip = $1
        and email = $2
        and success = false
        and attempted_at > now() - ($3::bigint * interval '1 millisecond')`,
    [ip, email, String(windowMs)]
  );
  return Number(rows[0]?.count ?? "0");
}

export async function clearLoginFailures(ip: string, email: string): Promise<void> {
  await requirePool().query(
    "delete from login_attempts where ip = $1 and email = $2 and success = false",
    [ip, email]
  );
}

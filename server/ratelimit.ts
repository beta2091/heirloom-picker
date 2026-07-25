import { sql } from "drizzle-orm";
import { db } from "./db";

// Durable rate limiter backed by Postgres. The previous in-memory Map was
// ineffective on serverless (each invocation can hit a fresh instance, so the
// counter reset constantly). This persists counters in the DB and does the
// whole check-and-increment in ONE atomic `INSERT ... ON CONFLICT` statement,
// so concurrent requests can't race past the limit.
//
// Keyed by (ip + bucket), e.g. `login:1.2.3.4` or `sibling-pin:<id>:<ip>`, so
// unrelated actions are tracked independently.
//
// Fails OPEN: if the DB is briefly unavailable we allow the request rather than
// lock out legitimate users. The tradeoff (a short window of reduced
// protection) is preferable to a hard outage on auth endpoints.

// Returns null if allowed, or the seconds remaining in the block if limited.
export async function rateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
  blockMs = 15 * 60 * 1000,
): Promise<number | null> {
  const now = Date.now();
  const windowEnd = now + windowMs;
  const blockEnd = now + blockMs;
  try {
    const result: any = await db.execute(sql`
      INSERT INTO rate_limits (key, count, reset_at, blocked_until)
      VALUES (${key}, 1, ${windowEnd}, 0)
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.blocked_until > ${now} THEN rate_limits.count
          WHEN rate_limits.reset_at < ${now} THEN 1
          ELSE rate_limits.count + 1
        END,
        reset_at = CASE
          WHEN rate_limits.blocked_until > ${now} THEN rate_limits.reset_at
          WHEN rate_limits.reset_at < ${now} THEN ${windowEnd}
          ELSE rate_limits.reset_at
        END,
        blocked_until = CASE
          WHEN rate_limits.blocked_until > ${now} THEN rate_limits.blocked_until
          WHEN rate_limits.reset_at < ${now} THEN 0
          WHEN rate_limits.count + 1 > ${maxAttempts} THEN ${blockEnd}
          ELSE rate_limits.blocked_until
        END
      RETURNING blocked_until
    `);
    const rows = (result?.rows ?? result) as Array<{ blocked_until: string | number }>;
    const blockedUntil = Number(rows?.[0]?.blocked_until ?? 0);
    if (blockedUntil > now) return Math.ceil((blockedUntil - now) / 1000);
    return null;
  } catch (err) {
    console.error("[ratelimit] check failed (failing open):", err);
    return null;
  }
}

// Clear a key on successful auth so a legitimate user isn't punished after they
// finally get it right.
export async function rateLimitClear(key: string): Promise<void> {
  try {
    await db.execute(sql`DELETE FROM rate_limits WHERE key = ${key}`);
  } catch (err) {
    console.error("[ratelimit] clear failed:", err);
  }
}

// Periodic cleanup of fully-expired rows so the table doesn't grow unbounded.
// Runs on long-lived servers; harmless (just never fires) on serverless, where
// stale rows are tiny and ignored by the check logic anyway.
setInterval(() => {
  const now = Date.now();
  db.execute(sql`DELETE FROM rate_limits WHERE blocked_until < ${now} AND reset_at < ${now}`)
    .catch(() => { /* ignore */ });
}, 60 * 60 * 1000).unref?.();

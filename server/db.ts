import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // A frozen serverless instance often wakes holding a socket Neon already
  // closed overnight. Fail that checkout quickly so the caller can retry on a
  // fresh connection instead of hanging until the platform kills the request.
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 20_000,
  ssl: process.env.DATABASE_URL?.includes("railway") || process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

// Idle clients error when the database drops them. Without a listener Node
// treats that as an unhandled 'error' and can crash the instance — the next
// request then succeeds on a new one. That matches a 500 on the first call
// after a quiet night.
pool.on("error", (err) => {
  console.error("[db] idle client error", err);
});

export const db = drizzle(pool, { schema });

/** Connection drops and Neon cold starts. Safe to retry once. */
export function isTransientDbError(err: unknown): boolean {
  const code = typeof err === "object" && err && "code" in err ? String((err as { code?: unknown }).code) : "";
  const message = err instanceof Error ? err.message : String(err ?? "");
  if (["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EPIPE", "57P01", "08000", "08001", "08003", "08004", "08006", "57P03"].includes(code)) {
    return true;
  }
  return /connection terminated|Connection terminated|timeout exceeded when trying to connect|sorry, too many clients|remaining connection slots|Cannot acquire|Client has encountered a connection error/i.test(message);
}

import { db } from "./db";
import { sql } from "drizzle-orm";
import { DEFAULT_ESTATE_ID } from "./tenant";

const statements = [
  sql`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )`,
  sql`CREATE TABLE IF NOT EXISTS siblings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    draft_order INTEGER NOT NULL DEFAULT 0,
    share_token VARCHAR NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366f1',
    pin VARCHAR(64),
    wishlist_submitted BOOLEAN NOT NULL DEFAULT false,
    lottery_number INTEGER,
    opted_out BOOLEAN NOT NULL DEFAULT false
  )`,
  // Add opted_out column for existing deployments where siblings table already exists
  sql`ALTER TABLE siblings ADD COLUMN IF NOT EXISTS opted_out BOOLEAN NOT NULL DEFAULT false`,
  // Email invites
  sql`ALTER TABLE siblings ADD COLUMN IF NOT EXISTS email TEXT`,
  sql`ALTER TABLE siblings ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP`,
  sql`CREATE TABLE IF NOT EXISTS items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    audio_url TEXT,
    picked_by_sibling_id VARCHAR REFERENCES siblings(id),
    pick_round INTEGER
  )`,
  sql`CREATE TABLE IF NOT EXISTS wishlist_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    sibling_id VARCHAR NOT NULL REFERENCES siblings(id),
    item_id VARCHAR NOT NULL REFERENCES items(id),
    priority INTEGER NOT NULL,
    rating INTEGER,
    comment TEXT
  )`,
  sql`CREATE TABLE IF NOT EXISTS item_ratings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    sibling_id VARCHAR NOT NULL REFERENCES siblings(id),
    item_id VARCHAR NOT NULL REFERENCES items(id),
    rating INTEGER NOT NULL,
    rank_within_tier INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT unique_sibling_item UNIQUE (sibling_id, item_id)
  )`,
  sql`CREATE TABLE IF NOT EXISTS family_members (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    sibling_id VARCHAR NOT NULL REFERENCES siblings(id),
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  sql`CREATE TABLE IF NOT EXISTS family_suggestions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    family_member_id VARCHAR NOT NULL REFERENCES family_members(id),
    sibling_id VARCHAR NOT NULL REFERENCES siblings(id),
    item_id VARCHAR NOT NULL REFERENCES items(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  sql`CREATE TABLE IF NOT EXISTS draft_state (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    current_round INTEGER NOT NULL DEFAULT 1,
    current_pick_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_complete BOOLEAN NOT NULL DEFAULT false
  )`,
  sql`CREATE TABLE IF NOT EXISTS app_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_pin VARCHAR(64),
    admin_name TEXT,
    recovery_code VARCHAR(16),
    family_name TEXT,
    contact_name TEXT,
    hero_photo TEXT
  )`,

  // ===== Multi-tenancy =====
  sql`CREATE TABLE IF NOT EXISTS organizers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  sql`CREATE TABLE IF NOT EXISTS estates (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id VARCHAR REFERENCES organizers(id),
    name TEXT NOT NULL DEFAULT 'My Family',
    status TEXT NOT NULL DEFAULT 'trial',
    stripe_customer_id TEXT,
    stripe_checkout_id TEXT,
    activated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  // Add estate_id to every domain table (nullable so existing rows migrate
  // cleanly; the backfill below assigns them all to the default estate).
  sql`ALTER TABLE siblings ADD COLUMN IF NOT EXISTS estate_id VARCHAR REFERENCES estates(id)`,
  sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS estate_id VARCHAR REFERENCES estates(id)`,
  sql`ALTER TABLE wishlist_items ADD COLUMN IF NOT EXISTS estate_id VARCHAR REFERENCES estates(id)`,
  sql`ALTER TABLE item_ratings ADD COLUMN IF NOT EXISTS estate_id VARCHAR REFERENCES estates(id)`,
  sql`ALTER TABLE family_members ADD COLUMN IF NOT EXISTS estate_id VARCHAR REFERENCES estates(id)`,
  sql`ALTER TABLE family_suggestions ADD COLUMN IF NOT EXISTS estate_id VARCHAR REFERENCES estates(id)`,
  sql`ALTER TABLE draft_state ADD COLUMN IF NOT EXISTS estate_id VARCHAR REFERENCES estates(id)`,
  sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS estate_id VARCHAR REFERENCES estates(id)`,
  // The default estate that owns all pre-multi-tenant data. Marked "active" so
  // the existing family's draft is never blocked by the new billing gate.
  sql`INSERT INTO estates (id, name, status, activated_at)
      VALUES (${DEFAULT_ESTATE_ID}, 'My Family', 'active', NOW())
      ON CONFLICT (id) DO NOTHING`,
  // Backfill: assign all orphaned rows to the default estate.
  sql`UPDATE siblings SET estate_id = ${DEFAULT_ESTATE_ID} WHERE estate_id IS NULL`,
  sql`UPDATE items SET estate_id = ${DEFAULT_ESTATE_ID} WHERE estate_id IS NULL`,
  sql`UPDATE wishlist_items SET estate_id = ${DEFAULT_ESTATE_ID} WHERE estate_id IS NULL`,
  sql`UPDATE item_ratings SET estate_id = ${DEFAULT_ESTATE_ID} WHERE estate_id IS NULL`,
  sql`UPDATE family_members SET estate_id = ${DEFAULT_ESTATE_ID} WHERE estate_id IS NULL`,
  sql`UPDATE family_suggestions SET estate_id = ${DEFAULT_ESTATE_ID} WHERE estate_id IS NULL`,
  sql`UPDATE draft_state SET estate_id = ${DEFAULT_ESTATE_ID} WHERE estate_id IS NULL`,
  sql`UPDATE app_settings SET estate_id = ${DEFAULT_ESTATE_ID} WHERE estate_id IS NULL`,
  // Helpful indexes for tenant-scoped lookups.
  sql`CREATE INDEX IF NOT EXISTS idx_siblings_estate ON siblings(estate_id)`,
  sql`CREATE INDEX IF NOT EXISTS idx_items_estate ON items(estate_id)`,
  sql`CREATE INDEX IF NOT EXISTS idx_wishlist_estate ON wishlist_items(estate_id)`,
  sql`CREATE INDEX IF NOT EXISTS idx_ratings_estate ON item_ratings(estate_id)`,
  // Session store for organizer logins (connect-pg-simple).
  sql`CREATE TABLE IF NOT EXISTS "session" (
    "sid" VARCHAR NOT NULL COLLATE "default",
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
  )`,
  sql`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`,
  // Durable rate limiting (persists across serverless instances).
  sql`CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at BIGINT NOT NULL,
    blocked_until BIGINT NOT NULL DEFAULT 0
  )`,
  // Password reset tokens (organizer account recovery via email).
  sql`CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY,
    organizer_id VARCHAR NOT NULL REFERENCES organizers(id),
    expires_at BIGINT NOT NULL
  )`,
];

export async function runMigrations() {
  let failed = 0;
  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch (error: any) {
      console.error("[migrate] Statement failed (non-fatal):", error?.message ?? error);
      failed++;
    }
  }
  if (failed === 0) {
    console.log("[migrate] All tables ready");
  } else {
    console.warn(`[migrate] ${failed} statement(s) failed — app will start anyway`);
  }
}

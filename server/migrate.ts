import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS siblings (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        draft_order INTEGER NOT NULL DEFAULT 0,
        share_token VARCHAR NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT '#6366f1',
        pin VARCHAR(4),
        wishlist_submitted BOOLEAN NOT NULL DEFAULT false,
        lottery_number INTEGER
      );

      CREATE TABLE IF NOT EXISTS items (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        audio_url TEXT,
        picked_by_sibling_id VARCHAR REFERENCES siblings(id),
        pick_round INTEGER
      );

      CREATE TABLE IF NOT EXISTS wishlist_items (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        sibling_id VARCHAR NOT NULL REFERENCES siblings(id),
        item_id VARCHAR NOT NULL REFERENCES items(id),
        priority INTEGER NOT NULL,
        rating INTEGER,
        comment TEXT
      );

      CREATE TABLE IF NOT EXISTS item_ratings (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        sibling_id VARCHAR NOT NULL REFERENCES siblings(id),
        item_id VARCHAR NOT NULL REFERENCES items(id),
        rating INTEGER NOT NULL,
        rank_within_tier INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT unique_sibling_item UNIQUE (sibling_id, item_id)
      );

      CREATE TABLE IF NOT EXISTS family_members (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        sibling_id VARCHAR NOT NULL REFERENCES siblings(id),
        name TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS family_suggestions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        family_member_id VARCHAR NOT NULL REFERENCES family_members(id),
        sibling_id VARCHAR NOT NULL REFERENCES siblings(id),
        item_id VARCHAR NOT NULL REFERENCES items(id),
        note TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS draft_state (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        current_round INTEGER NOT NULL DEFAULT 1,
        current_pick_index INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT false,
        is_complete BOOLEAN NOT NULL DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_pin VARCHAR(64),
        admin_name TEXT,
        recovery_code VARCHAR(16),
        family_name TEXT,
        contact_name TEXT,
        hero_photo TEXT
      );
    `);
    console.log("[migrate] Database tables ready");
  } catch (error) {
    console.error("[migrate] Failed to create tables:", error);
    throw error;
  }
}

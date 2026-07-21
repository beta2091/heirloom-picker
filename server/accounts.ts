import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { organizers, estates, siblings, items, type Organizer, type Estate } from "@shared/schema";

const scryptAsync = promisify(scrypt);

// ===== Password hashing (scrypt, salted per-user) =====
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashBuf = Buffer.from(hash, "hex");
  return hashBuf.length === derived.length && timingSafeEqual(hashBuf, derived);
}

// ===== Organizers =====
export async function createOrganizer(email: string, password: string, name?: string): Promise<Organizer> {
  const passwordHash = await hashPassword(password);
  const result = await db.insert(organizers)
    .values({ email: email.toLowerCase().trim(), passwordHash, name: name ?? null })
    .returning();
  return result[0];
}

export async function getOrganizerByEmail(email: string): Promise<Organizer | undefined> {
  const result = await db.select().from(organizers).where(eq(organizers.email, email.toLowerCase().trim()));
  return result[0];
}

export async function getOrganizerById(id: string): Promise<Organizer | undefined> {
  const result = await db.select().from(organizers).where(eq(organizers.id, id));
  return result[0];
}

export async function updateOrganizerPassword(id: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  await db.update(organizers).set({ passwordHash }).where(eq(organizers.id, id));
}

// ===== Password reset tokens (account recovery via email) =====
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// Create a single-use reset token (valid 1 hour). Returns the raw token to email.
export async function createPasswordReset(organizerId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 60 * 60 * 1000;
  await db.execute(sql`
    INSERT INTO password_resets (token_hash, organizer_id, expires_at)
    VALUES (${sha256(token)}, ${organizerId}, ${expiresAt})
  `);
  return token;
}

// Validate + consume a reset token. Returns the organizerId, or null if invalid
// or expired. Deletes the token (single use).
export async function consumePasswordReset(token: string): Promise<string | null> {
  const hash = sha256(token);
  const result: any = await db.execute(sql`SELECT organizer_id, expires_at FROM password_resets WHERE token_hash = ${hash}`);
  const rows = (result?.rows ?? result) as Array<{ organizer_id: string; expires_at: string | number }>;
  const row = rows?.[0];
  await db.execute(sql`DELETE FROM password_resets WHERE token_hash = ${hash}`);
  if (!row || Number(row.expires_at) < Date.now()) return null;
  return row.organizer_id;
}

// ===== Estates =====
export async function createEstate(ownerId: string, name: string): Promise<Estate> {
  const result = await db.insert(estates)
    .values({ ownerId, name: name.trim() || "My Family", status: "trial" })
    .returning();
  return result[0];
}

export async function getEstateById(id: string): Promise<Estate | undefined> {
  const result = await db.select().from(estates).where(eq(estates.id, id));
  return result[0];
}

export async function getEstatesByOwner(ownerId: string): Promise<Estate[]> {
  return db.select().from(estates).where(eq(estates.ownerId, ownerId));
}

export async function updateEstate(id: string, updates: Partial<Estate>): Promise<Estate | undefined> {
  const result = await db.update(estates).set(updates).where(eq(estates.id, id)).returning();
  return result[0];
}

// ===== Unscoped estate resolvers (used by tenant middleware only) =====
// These deliberately bypass the estate-scoped storage layer: they are how an
// incoming participant request first discovers which estate it belongs to.
export async function estateIdForSibling(siblingId: string): Promise<string | null> {
  const result = await db.select({ estateId: siblings.estateId }).from(siblings).where(eq(siblings.id, siblingId));
  return result[0]?.estateId ?? null;
}

export async function estateIdForShareToken(token: string): Promise<string | null> {
  const result = await db.select({ estateId: siblings.estateId }).from(siblings).where(eq(siblings.shareToken, token));
  return result[0]?.estateId ?? null;
}

export async function estateIdForItem(itemId: string): Promise<string | null> {
  const result = await db.select({ estateId: items.estateId }).from(items).where(eq(items.id, itemId));
  return result[0]?.estateId ?? null;
}

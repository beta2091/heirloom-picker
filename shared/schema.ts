import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Siblings - the family members who will be picking items
export const siblings = pgTable("siblings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  draftOrder: integer("draft_order").notNull().default(0), // 0 = unassigned, randomized when draft starts
  shareToken: varchar("share_token").notNull().unique(), // unique token for shareable link
  color: text("color").notNull().default("#6366f1"), // color to identify them
  pin: varchar("pin", { length: 4 }), // 4-digit PIN for private wishlist access
  wishlistSubmitted: boolean("wishlist_submitted").notNull().default(false),
  lotteryNumber: integer("lottery_number"),
  // When a sibling is satisfied with their picks, they can opt out of the
  // rest of the draft. Remaining items they'd have picked go to donation.
  optedOut: boolean("opted_out").notNull().default(false),
});

export const insertSiblingSchema = createInsertSchema(siblings).omit({
  id: true,
  shareToken: true,
  pin: true,
});
export type InsertSibling = z.infer<typeof insertSiblingSchema>;
export type Sibling = typeof siblings.$inferSelect;

// Items - the belongings to be divided
export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"), // URL or base64 data
  audioUrl: text("audio_url"), // Audio recording - base64 data, max 3 minutes
  pickedBySiblingId: varchar("picked_by_sibling_id").references(() => siblings.id),
  pickRound: integer("pick_round"), // which round was this picked in
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  pickedBySiblingId: true,
  pickRound: true,
});
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

// Wishlist - siblings rank items they want (before the draft)
export const wishlistItems = pgTable("wishlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siblingId: varchar("sibling_id").notNull().references(() => siblings.id),
  itemId: varchar("item_id").notNull().references(() => items.id),
  priority: integer("priority").notNull(), // 1 = top choice, 2 = second, etc.
  rating: integer("rating"), // 1-5 star rating for quick initial ranking
  comment: text("comment"), // Comment explaining why this item is important
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({
  id: true,
});
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;

// Item ratings - per-sibling ratings and tier rankings for items
export const itemRatings = pgTable("item_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siblingId: varchar("sibling_id").notNull().references(() => siblings.id),
  itemId: varchar("item_id").notNull().references(() => items.id),
  rating: integer("rating").notNull(),
  rankWithinTier: integer("rank_within_tier").notNull().default(0),
}, (table) => [
  unique("unique_sibling_item").on(table.siblingId, table.itemId),
]);

export const insertItemRatingSchema = createInsertSchema(itemRatings).omit({
  id: true,
});
export type InsertItemRating = z.infer<typeof insertItemRatingSchema>;
export type ItemRating = typeof itemRatings.$inferSelect;

// Family members - extended family who visit via share links
export const familyMembers = pgTable("family_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siblingId: varchar("sibling_id").notNull().references(() => siblings.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  createdAt: true,
});
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;

// Family suggestions - items suggested by family members via share links
export const familySuggestions = pgTable("family_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  familyMemberId: varchar("family_member_id").notNull().references(() => familyMembers.id),
  siblingId: varchar("sibling_id").notNull().references(() => siblings.id),
  itemId: varchar("item_id").notNull().references(() => items.id),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFamilySuggestionSchema = createInsertSchema(familySuggestions).omit({
  id: true,
  createdAt: true,
});
export type InsertFamilySuggestion = z.infer<typeof insertFamilySuggestionSchema>;
export type FamilySuggestion = typeof familySuggestions.$inferSelect;

// Draft state - tracks the current state of the draft
export const draftState = pgTable("draft_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currentRound: integer("current_round").notNull().default(1),
  currentPickIndex: integer("current_pick_index").notNull().default(0), // index into the pick order
  isActive: boolean("is_active").notNull().default(false),
  isComplete: boolean("is_complete").notNull().default(false),
});

export const insertDraftStateSchema = createInsertSchema(draftState).omit({
  id: true,
});
export type InsertDraftState = z.infer<typeof insertDraftStateSchema>;
export type DraftState = typeof draftState.$inferSelect;

// App settings - stores admin PIN and other configuration
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminPin: varchar("admin_pin", { length: 64 }),
  adminName: text("admin_name"),
  recoveryCode: varchar("recovery_code", { length: 16 }),
  familyName: text("family_name"),
  contactName: text("contact_name"),
  heroPhoto: text("hero_photo"),
});

export type AppSettings = typeof appSettings.$inferSelect;

// Legacy user table for compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

import { 
  type User, type InsertUser, 
  type Sibling, type InsertSibling, 
  type Item, type InsertItem,
  type WishlistItem, type InsertWishlistItem,
  type DraftState, type InsertDraftState,
  type FamilyMember, type InsertFamilyMember,
  type FamilySuggestion, type InsertFamilySuggestion,
  type ItemRating, type InsertItemRating,
  type AppSettings,
  users, siblings, items, wishlistItems, draftState, familyMembers, familySuggestions, itemRatings, appSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users (legacy)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Siblings
  getAllSiblings(): Promise<Sibling[]>;
  getSibling(id: string): Promise<Sibling | undefined>;
  getSiblingByShareToken(token: string): Promise<Sibling | undefined>;
  createSibling(sibling: InsertSibling): Promise<Sibling>;
  updateSibling(id: string, updates: Partial<Sibling>): Promise<Sibling | undefined>;
  deleteSibling(id: string): Promise<void>;

  // Items
  getAllItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<void>;
  deleteAllItems(): Promise<void>;

  // Wishlist
  getWishlistBySibling(siblingId: string): Promise<WishlistItem[]>;
  createWishlistItem(item: InsertWishlistItem): Promise<WishlistItem>;
  updateWishlistItem(id: string, updates: Partial<WishlistItem>): Promise<WishlistItem | undefined>;
  deleteWishlistItem(id: string): Promise<void>;
  deleteWishlistBySibling(siblingId: string): Promise<void>;

  // Family Members
  getFamilyMembersBySibling(siblingId: string): Promise<FamilyMember[]>;
  getFamilyMember(id: string): Promise<FamilyMember | undefined>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;

  // Family Suggestions
  getSuggestionsBySibling(siblingId: string): Promise<FamilySuggestion[]>;
  getSuggestionsByFamilyMember(familyMemberId: string): Promise<FamilySuggestion[]>;
  createFamilySuggestion(suggestion: InsertFamilySuggestion): Promise<FamilySuggestion>;
  deleteFamilySuggestion(id: string): Promise<void>;

  // Item Ratings
  getRatingsBySibling(siblingId: string): Promise<ItemRating[]>;
  upsertRating(siblingId: string, itemId: string, rating: number): Promise<ItemRating>;
  updateRankWithinTier(id: string, rankWithinTier: number): Promise<ItemRating | undefined>;
  deleteRating(siblingId: string, itemId: string): Promise<void>;
  deleteRatingsBySibling(siblingId: string): Promise<void>;
  deleteRatingsByItem(itemId: string): Promise<void>;

  // Draft State
  getDraftState(): Promise<DraftState | undefined>;
  createOrUpdateDraftState(state: Partial<DraftState>): Promise<DraftState>;
  resetDraft(): Promise<void>;

  // App Settings
  getAppSettings(): Promise<AppSettings | undefined>;
  setAdminPin(pin: string | null): Promise<AppSettings>;
  updateAppSettings(updates: Partial<AppSettings>): Promise<AppSettings>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Siblings
  async getAllSiblings(): Promise<Sibling[]> {
    return db.select().from(siblings);
  }

  async getSibling(id: string): Promise<Sibling | undefined> {
    const result = await db.select().from(siblings).where(eq(siblings.id, id));
    return result[0];
  }

  async getSiblingByShareToken(token: string): Promise<Sibling | undefined> {
    const result = await db.select().from(siblings).where(eq(siblings.shareToken, token));
    return result[0];
  }

  async createSibling(sibling: InsertSibling): Promise<Sibling> {
    const shareToken = randomUUID();
    const result = await db.insert(siblings).values({
      ...sibling,
      shareToken,
    }).returning();
    return result[0];
  }

  async updateSibling(id: string, updates: Partial<Sibling>): Promise<Sibling | undefined> {
    const result = await db.update(siblings).set(updates).where(eq(siblings.id, id)).returning();
    return result[0];
  }

  async deleteSibling(id: string): Promise<void> {
    await db.delete(familySuggestions).where(eq(familySuggestions.siblingId, id));
    const members = await db.select().from(familyMembers).where(eq(familyMembers.siblingId, id));
    for (const member of members) {
      await db.delete(familySuggestions).where(eq(familySuggestions.familyMemberId, member.id));
    }
    await db.delete(familyMembers).where(eq(familyMembers.siblingId, id));
    await db.delete(itemRatings).where(eq(itemRatings.siblingId, id));
    await db.delete(wishlistItems).where(eq(wishlistItems.siblingId, id));
    const siblingItems = await db.select().from(items).where(eq(items.pickedBySiblingId, id));
    for (const item of siblingItems) {
      await db.update(items).set({ pickedBySiblingId: null, pickRound: null }).where(eq(items.id, item.id));
    }
    await db.delete(siblings).where(eq(siblings.id, id));
  }

  // Items
  async getAllItems(): Promise<Item[]> {
    return db.select().from(items);
  }

  async getItem(id: string): Promise<Item | undefined> {
    const result = await db.select().from(items).where(eq(items.id, id));
    return result[0];
  }

  async createItem(item: InsertItem): Promise<Item> {
    const result = await db.insert(items).values(item).returning();
    return result[0];
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined> {
    const result = await db.update(items).set(updates).where(eq(items.id, id)).returning();
    return result[0];
  }

  async deleteItem(id: string): Promise<void> {
    await db.delete(familySuggestions).where(eq(familySuggestions.itemId, id));
    await db.delete(itemRatings).where(eq(itemRatings.itemId, id));
    await db.delete(wishlistItems).where(eq(wishlistItems.itemId, id));
    await db.delete(items).where(eq(items.id, id));
  }

  async deleteAllItems(): Promise<void> {
    await db.delete(familySuggestions);
    await db.delete(itemRatings);
    await db.delete(wishlistItems);
    await db.delete(items);
  }

  // Wishlist
  async getWishlistBySibling(siblingId: string): Promise<WishlistItem[]> {
    return db.select().from(wishlistItems).where(eq(wishlistItems.siblingId, siblingId));
  }

  async createWishlistItem(item: InsertWishlistItem): Promise<WishlistItem> {
    const result = await db.insert(wishlistItems).values(item).returning();
    return result[0];
  }

  async updateWishlistItem(id: string, updates: Partial<WishlistItem>): Promise<WishlistItem | undefined> {
    const result = await db.update(wishlistItems).set(updates).where(eq(wishlistItems.id, id)).returning();
    return result[0];
  }

  async deleteWishlistItem(id: string): Promise<void> {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
  }

  async deleteWishlistBySibling(siblingId: string): Promise<void> {
    await db.delete(wishlistItems).where(eq(wishlistItems.siblingId, siblingId));
  }

  // Family Members
  async getFamilyMembersBySibling(siblingId: string): Promise<FamilyMember[]> {
    return db.select().from(familyMembers).where(eq(familyMembers.siblingId, siblingId));
  }

  async getFamilyMember(id: string): Promise<FamilyMember | undefined> {
    const result = await db.select().from(familyMembers).where(eq(familyMembers.id, id));
    return result[0];
  }

  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    const result = await db.insert(familyMembers).values(member).returning();
    return result[0];
  }

  // Family Suggestions
  async getSuggestionsBySibling(siblingId: string): Promise<FamilySuggestion[]> {
    return db.select().from(familySuggestions).where(eq(familySuggestions.siblingId, siblingId));
  }

  async getSuggestionsByFamilyMember(familyMemberId: string): Promise<FamilySuggestion[]> {
    return db.select().from(familySuggestions).where(eq(familySuggestions.familyMemberId, familyMemberId));
  }

  async createFamilySuggestion(suggestion: InsertFamilySuggestion): Promise<FamilySuggestion> {
    const result = await db.insert(familySuggestions).values(suggestion).returning();
    return result[0];
  }

  async deleteFamilySuggestion(id: string): Promise<void> {
    await db.delete(familySuggestions).where(eq(familySuggestions.id, id));
  }

  // Item Ratings
  async getRatingsBySibling(siblingId: string): Promise<ItemRating[]> {
    return db.select().from(itemRatings).where(eq(itemRatings.siblingId, siblingId));
  }

  async upsertRating(siblingId: string, itemId: string, rating: number): Promise<ItemRating> {
    const existing = await db.select().from(itemRatings).where(
      and(eq(itemRatings.siblingId, siblingId), eq(itemRatings.itemId, itemId))
    );
    if (existing.length > 0) {
      const oldRating = existing[0].rating;
      const newTierItems = await db.select().from(itemRatings).where(
        and(eq(itemRatings.siblingId, siblingId), eq(itemRatings.rating, rating))
      );
      const result = await db.update(itemRatings)
        .set({ rating, rankWithinTier: newTierItems.length })
        .where(eq(itemRatings.id, existing[0].id))
        .returning();
      if (oldRating !== rating) {
        const oldTierItems = await db.select().from(itemRatings).where(
          and(eq(itemRatings.siblingId, siblingId), eq(itemRatings.rating, oldRating))
        );
        const sorted = oldTierItems.sort((a, b) => a.rankWithinTier - b.rankWithinTier);
        for (let i = 0; i < sorted.length; i++) {
          if (sorted[i].rankWithinTier !== i) {
            await db.update(itemRatings).set({ rankWithinTier: i }).where(eq(itemRatings.id, sorted[i].id));
          }
        }
      }
      return result[0];
    } else {
      const maxRank = await db.select().from(itemRatings).where(
        and(eq(itemRatings.siblingId, siblingId), eq(itemRatings.rating, rating))
      );
      const result = await db.insert(itemRatings).values({
        siblingId,
        itemId,
        rating,
        rankWithinTier: maxRank.length,
      }).returning();
      return result[0];
    }
  }

  async updateRankWithinTier(id: string, rankWithinTier: number): Promise<ItemRating | undefined> {
    const result = await db.update(itemRatings)
      .set({ rankWithinTier })
      .where(eq(itemRatings.id, id))
      .returning();
    return result[0];
  }

  async deleteRating(siblingId: string, itemId: string): Promise<void> {
    await db.delete(itemRatings).where(
      and(eq(itemRatings.siblingId, siblingId), eq(itemRatings.itemId, itemId))
    );
  }

  async deleteRatingsBySibling(siblingId: string): Promise<void> {
    await db.delete(itemRatings).where(eq(itemRatings.siblingId, siblingId));
  }

  async deleteRatingsByItem(itemId: string): Promise<void> {
    await db.delete(itemRatings).where(eq(itemRatings.itemId, itemId));
  }

  // Draft State
  async getDraftState(): Promise<DraftState | undefined> {
    const result = await db.select().from(draftState);
    return result[0];
  }

  async createOrUpdateDraftState(state: Partial<DraftState>): Promise<DraftState> {
    const existing = await this.getDraftState();
    if (existing) {
      const result = await db.update(draftState).set(state).where(eq(draftState.id, existing.id)).returning();
      return result[0];
    } else {
      const result = await db.insert(draftState).values({
        currentRound: state.currentRound ?? 1,
        currentPickIndex: state.currentPickIndex ?? 0,
        isActive: state.isActive ?? false,
        isComplete: state.isComplete ?? false,
      }).returning();
      return result[0];
    }
  }

  async resetDraft(): Promise<void> {
    // Reset all items to unpicked
    await db.update(items).set({ pickedBySiblingId: null, pickRound: null });
    // Reset draft state
    const existing = await this.getDraftState();
    if (existing) {
      await db.update(draftState).set({
        currentRound: 1,
        currentPickIndex: 0,
        isActive: false,
        isComplete: false,
      }).where(eq(draftState.id, existing.id));
    }
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    const result = await db.select().from(appSettings);
    return result[0];
  }

  async setAdminPin(pin: string | null): Promise<AppSettings> {
    const existing = await this.getAppSettings();
    if (existing) {
      const result = await db.update(appSettings).set({ adminPin: pin }).where(eq(appSettings.id, existing.id)).returning();
      return result[0];
    } else {
      const result = await db.insert(appSettings).values({ adminPin: pin }).returning();
      return result[0];
    }
  }

  async updateAppSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const existing = await this.getAppSettings();
    if (existing) {
      const result = await db.update(appSettings).set(updates).where(eq(appSettings.id, existing.id)).returning();
      return result[0];
    } else {
      const result = await db.insert(appSettings).values(updates).returning();
      return result[0];
    }
  }
}

export const storage = new DatabaseStorage();

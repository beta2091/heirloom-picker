import type { Express } from "express";
import { createServer, type Server } from "http";
import { createHash, randomBytes } from "crypto";
import { storage } from "./storage";
import { insertSiblingSchema, insertItemSchema } from "@shared/schema";
import { z } from "zod";

function hashPin(pin: string): string {
  return createHash("sha256").update(`estate-draft-${pin}`).digest("hex").slice(0, 32);
}

function generateRecoveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code.slice(0, 4) + "-" + code.slice(4);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============ ADMIN PIN ============

  app.get("/api/admin/status", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json({ 
        hasAdminPin: !!settings?.adminPin,
        adminName: settings?.adminName || null,
        familyName: settings?.familyName || null,
        contactName: settings?.contactName || null,
        hasHeroPhoto: !!settings?.heroPhoto,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get admin status" });
    }
  });

  const adminPinSchema = z.object({
    pin: z.string().length(4).regex(/^\d{4}$/),
    currentPin: z.string().length(4).regex(/^\d{4}$/).optional(),
    adminName: z.string().min(1).max(100).optional(),
    familyName: z.string().max(100).optional(),
    contactName: z.string().max(100).optional(),
    heroPhoto: z.string().max(15 * 1024 * 1024).optional(),
  });

  app.post("/api/admin/set-pin", async (req, res) => {
    try {
      const data = adminPinSchema.parse(req.body);
      const settings = await storage.getAppSettings();
      const isFirstSetup = !settings?.adminPin;
      
      if (settings?.adminPin && (!data.currentPin || settings.adminPin !== hashPin(data.currentPin))) {
        return res.status(403).json({ error: "Current PIN is incorrect" });
      }

      if (data.heroPhoto && data.heroPhoto.length > 0 && !data.heroPhoto.startsWith("data:image/")) {
        return res.status(400).json({ error: "Invalid image format" });
      }
      
      const recoveryCode = generateRecoveryCode();
      const updates: Record<string, any> = {
        adminPin: hashPin(data.pin),
        adminName: data.adminName || settings?.adminName || null,
        recoveryCode: recoveryCode,
      };
      if (isFirstSetup) {
        if (data.familyName !== undefined) updates.familyName = data.familyName || null;
        if (data.contactName !== undefined) updates.contactName = data.contactName || null;
        if (data.heroPhoto !== undefined) updates.heroPhoto = data.heroPhoto || null;
      }
      await storage.updateAppSettings(updates);
      
      res.json({ success: true, recoveryCode, isFirstSetup });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "PIN must be 4 digits" });
      }
      res.status(500).json({ error: "Failed to set admin PIN" });
    }
  });

  app.post("/api/admin/recover", async (req, res) => {
    try {
      const schema = z.object({
        recoveryCode: z.string().min(1),
        newPin: z.string().length(4).regex(/^\d{4}$/),
        adminName: z.string().min(1).max(100).optional(),
      });
      const data = schema.parse(req.body);
      const settings = await storage.getAppSettings();
      
      if (!settings?.recoveryCode) {
        return res.status(400).json({ error: "No recovery code set" });
      }
      
      if (settings.recoveryCode !== data.recoveryCode) {
        return res.status(403).json({ error: "Invalid recovery code" });
      }
      
      const newRecoveryCode = generateRecoveryCode();
      await storage.updateAppSettings({
        adminPin: hashPin(data.newPin),
        adminName: data.adminName || settings.adminName,
        recoveryCode: newRecoveryCode,
      });
      
      res.json({ success: true, recoveryCode: newRecoveryCode });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input" });
      }
      res.status(500).json({ error: "Failed to recover admin access" });
    }
  });

  app.post("/api/admin/update-name", async (req, res) => {
    try {
      const schema = z.object({
        adminName: z.string().min(1).max(100),
        pin: z.string().length(4).regex(/^\d{4}$/),
      });
      const data = schema.parse(req.body);
      const settings = await storage.getAppSettings();
      
      if (!settings?.adminPin || settings.adminPin !== hashPin(data.pin)) {
        return res.status(403).json({ error: "Incorrect PIN" });
      }
      
      await storage.updateAppSettings({ adminName: data.adminName });
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input" });
      }
      res.status(500).json({ error: "Failed to update admin name" });
    }
  });

  app.post("/api/admin/reset", async (req, res) => {
    try {
      const schema = z.object({
        pin: z.string().length(4).regex(/^\d{4}$/),
      });
      const data = schema.parse(req.body);
      const settings = await storage.getAppSettings();
      
      if (!settings?.adminPin || settings.adminPin !== hashPin(data.pin)) {
        return res.status(403).json({ error: "Incorrect PIN" });
      }
      
      await storage.updateAppSettings({ 
        adminPin: null, 
        adminName: null, 
        recoveryCode: null 
      });
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input" });
      }
      res.status(500).json({ error: "Failed to reset admin" });
    }
  });

  const verifyPinSchema = z.object({
    pin: z.string().length(4).regex(/^\d{4}$/),
  });

  app.post("/api/admin/verify-pin", async (req, res) => {
    try {
      const data = verifyPinSchema.parse(req.body);
      const settings = await storage.getAppSettings();
      if (!settings?.adminPin) {
        return res.json({ verified: true, hasPin: false });
      }
      const verified = settings.adminPin === hashPin(data.pin);
      res.json({ verified, hasPin: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "PIN must be 4 digits" });
      }
      res.status(500).json({ error: "Failed to verify admin PIN" });
    }
  });

  // ============ FAMILY SETTINGS ============

  app.get("/api/family-settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json({
        familyName: settings?.familyName || null,
        contactName: settings?.contactName || null,
        hasHeroPhoto: !!settings?.heroPhoto,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get family settings" });
    }
  });

  app.get("/api/family-settings/hero-photo", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      if (!settings?.heroPhoto) {
        return res.status(404).json({ error: "No hero photo" });
      }
      const matches = settings.heroPhoto.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        res.set("Content-Type", contentType);
        res.set("Cache-Control", "public, max-age=3600");
        return res.send(buffer);
      }
      res.status(404).json({ error: "Invalid photo data" });
    } catch (error) {
      res.status(500).json({ error: "Failed to get hero photo" });
    }
  });

  const familySettingsSchema = z.object({
    pin: z.string().length(4).regex(/^\d{4}$/),
    familyName: z.string().max(100).optional(),
    contactName: z.string().max(100).optional(),
    heroPhoto: z.string().max(15 * 1024 * 1024).optional(),
  });

  app.post("/api/admin/family-settings", async (req, res) => {
    try {
      const data = familySettingsSchema.parse(req.body);
      const settings = await storage.getAppSettings();
      if (!settings?.adminPin || settings.adminPin !== hashPin(data.pin)) {
        return res.status(401).json({ error: "Invalid admin PIN" });
      }
      if (data.heroPhoto && data.heroPhoto.length > 0 && !data.heroPhoto.startsWith("data:image/")) {
        return res.status(400).json({ error: "Invalid image format" });
      }
      const updates: Record<string, any> = {};
      if (data.familyName !== undefined) updates.familyName = data.familyName || null;
      if (data.contactName !== undefined) updates.contactName = data.contactName || null;
      if (data.heroPhoto !== undefined) updates.heroPhoto = data.heroPhoto || null;
      await storage.updateAppSettings(updates);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input" });
      }
      res.status(500).json({ error: "Failed to update family settings" });
    }
  });

  // ============ SIBLINGS ============
  
  const sanitizeSibling = (sibling: any) => {
    const { pin, ...rest } = sibling;
    return { ...rest, hasPin: !!pin };
  };

  // Get all siblings
  app.get("/api/siblings", async (req, res) => {
    try {
      const siblings = await storage.getAllSiblings();
      res.json(siblings.map(sanitizeSibling));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch siblings" });
    }
  });

  // Get single sibling
  app.get("/api/siblings/:id", async (req, res) => {
    try {
      const sibling = await storage.getSibling(req.params.id);
      if (!sibling) {
        return res.status(404).json({ error: "Sibling not found" });
      }
      res.json(sanitizeSibling(sibling));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sibling" });
    }
  });

  // Create sibling
  app.post("/api/siblings", async (req, res) => {
    try {
      const data = insertSiblingSchema.parse(req.body);
      const sibling = await storage.createSibling(data);
      res.status(201).json(sanitizeSibling(sibling));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create sibling" });
    }
  });

  // Update sibling
  const updateSiblingSchema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
    pin: z.string().length(4).regex(/^\d{4}$/).nullable().optional(),
    draftOrder: z.number().optional(),
  });

  app.put("/api/siblings/:id", async (req, res) => {
    try {
      const data = updateSiblingSchema.parse(req.body);
      const sibling = await storage.updateSibling(req.params.id, data);
      if (!sibling) {
        return res.status(404).json({ error: "Sibling not found" });
      }
      res.json(sanitizeSibling(sibling));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update sibling" });
    }
  });

  // Verify sibling PIN
  app.post("/api/siblings/:id/verify-pin", async (req, res) => {
    try {
      const { pin } = req.body;
      const sibling = await storage.getSibling(req.params.id);
      if (!sibling) {
        return res.status(404).json({ error: "Sibling not found" });
      }
      if (!sibling.pin) {
        return res.json({ verified: true, hasPin: false });
      }
      const verified = sibling.pin === pin;
      res.json({ verified, hasPin: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify PIN" });
    }
  });

  // Delete sibling
  app.delete("/api/siblings/:id", async (req, res) => {
    try {
      await storage.deleteSibling(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sibling" });
    }
  });

  // ============ ITEMS ============

  const stripBlobFields = (item: any) => {
    const { imageUrl, audioUrl, ...rest } = item;
    return { ...rest, hasImage: !!imageUrl, hasAudio: !!audioUrl };
  };

  // Get all items (without large blob fields)
  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getAllItems();
      res.json(items.map(stripBlobFields));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  // Get item image
  app.get("/api/items/:id/image", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item || !item.imageUrl) {
        return res.status(404).json({ error: "Image not found" });
      }
      const match = item.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const buffer = Buffer.from(match[2], "base64");
        res.set("Content-Type", mimeType);
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        res.send(buffer);
      } else {
        res.redirect(item.imageUrl);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch image" });
    }
  });

  // Get item audio
  app.get("/api/items/:id/audio", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item || !item.audioUrl) {
        return res.status(404).json({ error: "Audio not found" });
      }
      const match = item.audioUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const buffer = Buffer.from(match[2], "base64");
        res.set("Content-Type", mimeType);
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        res.send(buffer);
      } else {
        res.redirect(item.audioUrl);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audio" });
    }
  });

  // Create item
  app.post("/api/items", async (req, res) => {
    try {
      const data = insertItemSchema.parse(req.body);
      const item = await storage.createItem(data);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  // Update item
  const updateItemSchema = z.object({
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    audioUrl: z.string().nullable().optional(),
  });

  app.put("/api/items/:id", async (req, res) => {
    try {
      const data = updateItemSchema.parse(req.body);
      const item = await storage.updateItem(req.params.id, data);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Delete item
  app.delete("/api/items/:id", async (req, res) => {
    try {
      await storage.deleteItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  app.delete("/api/items", async (req, res) => {
    try {
      await storage.deleteAllItems();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete all items" });
    }
  });

  // ============ WISHLIST ============
  
  // Get wishlist by sibling (requires PIN verification if sibling has PIN set)
  app.get("/api/wishlist/:siblingId", async (req, res) => {
    try {
      const sibling = await storage.getSibling(req.params.siblingId);
      if (!sibling) {
        return res.status(404).json({ error: "Sibling not found" });
      }
      
      if (sibling.pin) {
        const pin = req.query.pin as string;
        if (!pin || pin !== sibling.pin) {
          return res.status(401).json({ error: "PIN required", requiresPin: true });
        }
      }
      
      const wishlist = await storage.getWishlistBySibling(req.params.siblingId);
      res.json(wishlist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  // Helper to verify PIN for wishlist mutations
  const verifyWishlistAccess = async (siblingId: string, pin?: string): Promise<boolean> => {
    const sibling = await storage.getSibling(siblingId);
    if (!sibling) return false;
    if (!sibling.pin) return true;
    return sibling.pin === pin;
  };

  // Add to wishlist
  app.post("/api/wishlist", async (req, res) => {
    try {
      const { siblingId, itemId, priority, pin } = req.body;
      if (!siblingId || !itemId || priority === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      if (!(await verifyWishlistAccess(siblingId, pin))) {
        return res.status(401).json({ error: "PIN required", requiresPin: true });
      }
      
      const wishlistItem = await storage.createWishlistItem({ siblingId, itemId, priority });
      res.status(201).json(wishlistItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });

  // Reorder wishlist
  app.put("/api/wishlist/reorder", async (req, res) => {
    try {
      const { items, siblingId, pin } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Items must be an array" });
      }
      
      if (siblingId && !(await verifyWishlistAccess(siblingId, pin))) {
        return res.status(401).json({ error: "PIN required", requiresPin: true });
      }
      
      for (const item of items) {
        await storage.updateWishlistItem(item.wishlistId, { priority: item.newPriority });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reorder wishlist" });
    }
  });

  // Update wishlist item (rating/comment)
  app.put("/api/wishlist/:id", async (req, res) => {
    try {
      const { siblingId, pin, rating, comment } = req.body;
      
      if (siblingId && !(await verifyWishlistAccess(siblingId, pin))) {
        return res.status(401).json({ error: "PIN required", requiresPin: true });
      }
      
      const updates: { rating?: number | null; comment?: string | null } = {};
      if (rating !== undefined) updates.rating = rating;
      if (comment !== undefined) updates.comment = comment;
      
      const updated = await storage.updateWishlistItem(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update wishlist item" });
    }
  });

  // Remove from wishlist
  app.delete("/api/wishlist/:id", async (req, res) => {
    try {
      const pin = req.query.pin as string | undefined;
      const siblingId = req.query.siblingId as string | undefined;
      
      if (siblingId && !(await verifyWishlistAccess(siblingId, pin))) {
        return res.status(401).json({ error: "PIN required", requiresPin: true });
      }
      
      await storage.deleteWishlistItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });

  // ============ ITEM RATINGS ============

  app.get("/api/ratings/:siblingId", async (req, res) => {
    try {
      const sibling = await storage.getSibling(req.params.siblingId);
      if (!sibling) {
        return res.status(404).json({ error: "Sibling not found" });
      }
      if (sibling.pin) {
        const pin = req.query.pin as string;
        if (!pin || pin !== sibling.pin) {
          return res.status(401).json({ error: "PIN required", requiresPin: true });
        }
      }
      const ratings = await storage.getRatingsBySibling(req.params.siblingId);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  });

  app.put("/api/ratings/:siblingId/rate", async (req, res) => {
    try {
      const { itemId, rating, pin } = req.body;
      if (!itemId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Valid itemId and rating (1-5) required" });
      }
      if (!(await verifyWishlistAccess(req.params.siblingId, pin))) {
        return res.status(401).json({ error: "PIN required", requiresPin: true });
      }
      const sibling = await storage.getSibling(req.params.siblingId);
      if (sibling?.wishlistSubmitted) {
        return res.status(400).json({ error: "Wishlist already submitted" });
      }
      const result = await storage.upsertRating(req.params.siblingId, itemId, rating);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to save rating" });
    }
  });

  app.put("/api/ratings/:siblingId/reorder-tier", async (req, res) => {
    try {
      const { items, pin } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Items must be an array" });
      }
      if (!(await verifyWishlistAccess(req.params.siblingId, pin))) {
        return res.status(401).json({ error: "PIN required", requiresPin: true });
      }
      const sibling = await storage.getSibling(req.params.siblingId);
      if (sibling?.wishlistSubmitted) {
        return res.status(400).json({ error: "Wishlist already submitted" });
      }
      const siblingRatings = await storage.getRatingsBySibling(req.params.siblingId);
      const siblingRatingIds = new Set(siblingRatings.map(r => r.id));
      for (const item of items) {
        if (!siblingRatingIds.has(item.id)) {
          return res.status(403).json({ error: "Cannot modify ratings belonging to another sibling" });
        }
        await storage.updateRankWithinTier(item.id, item.rankWithinTier);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reorder tier" });
    }
  });

  app.post("/api/siblings/:id/submit-wishlist", async (req, res) => {
    try {
      const { pin } = req.body;
      if (!(await verifyWishlistAccess(req.params.id, pin))) {
        return res.status(401).json({ error: "PIN required", requiresPin: true });
      }
      const allItems = await storage.getAllItems();
      const availableItems = allItems.filter(i => !i.pickedBySiblingId);
      const ratings = await storage.getRatingsBySibling(req.params.id);
      if (ratings.length < availableItems.length) {
        return res.status(400).json({ error: "You must rate all available items before submitting" });
      }
      const updated = await storage.updateSibling(req.params.id, { wishlistSubmitted: true });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit wishlist" });
    }
  });

  app.post("/api/siblings/:id/unlock-wishlist", async (req, res) => {
    try {
      const { pin } = req.body;
      if (!(await verifyWishlistAccess(req.params.id, pin))) {
        return res.status(401).json({ error: "PIN required", requiresPin: true });
      }
      const updated = await storage.updateSibling(req.params.id, { wishlistSubmitted: false });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to unlock wishlist" });
    }
  });

  // ============ LOTTERY ============

  app.get("/api/lottery", async (req, res) => {
    try {
      const allSiblings = await storage.getAllSiblings();
      const lotteryData = allSiblings.map(s => ({
        id: s.id,
        name: s.name,
        color: s.color,
        lotteryNumber: s.lotteryNumber,
        wishlistSubmitted: s.wishlistSubmitted,
      }));
      res.json(lotteryData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lottery data" });
    }
  });

  app.post("/api/lottery/:siblingId/lock-number", async (req, res) => {
    try {
      const { number, pin } = req.body;
      if (!number || number < 1 || number > 50) {
        return res.status(400).json({ error: "Number must be between 1 and 50" });
      }
      if (!(await verifyWishlistAccess(req.params.siblingId, pin))) {
        return res.status(401).json({ error: "PIN required", requiresPin: true });
      }
      const allSiblings = await storage.getAllSiblings();
      const taken = allSiblings.find(s => s.lotteryNumber === number && s.id !== req.params.siblingId);
      if (taken) {
        return res.status(400).json({ error: `Number ${number} is already taken by ${taken.name}` });
      }
      const updated = await storage.updateSibling(req.params.siblingId, { lotteryNumber: number });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to lock lottery number" });
    }
  });

  app.post("/api/lottery/spin", async (req, res) => {
    try {
      const { adminPin } = req.body;
      const settings = await storage.getAppSettings();
      if (settings?.adminPin && (!adminPin || settings.adminPin !== hashPin(adminPin))) {
        return res.status(401).json({ error: "Admin PIN required to spin the lottery" });
      }
      const allSiblings = await storage.getAllSiblings();
      const allLocked = allSiblings.every(s => s.lotteryNumber !== null);
      if (!allLocked) {
        return res.status(400).json({ error: "Not all siblings have locked in their numbers" });
      }
      const entropy = randomBytes(4);
      const seed = (entropy.readUInt32BE(0) ^ (Date.now() & 0xFFFFFFFF)) >>> 0;
      const winningNumber = (seed % 50) + 1;
      const circularDist = (a: number, b: number) => {
        const linear = Math.abs(a - b);
        return Math.min(linear, 50 - linear);
      };

      const withDistances = allSiblings.map(s => ({
        ...s,
        distance: circularDist(s.lotteryNumber || 0, winningNumber),
        tiebreakerDistance: null as number | null,
      }));

      withDistances.sort((a, b) => a.distance - b.distance);

      let tiebreakerNumber: number | null = null;
      const hasTies = withDistances.some((entry, i) =>
        i > 0 && entry.distance === withDistances[i - 1].distance
      );

      if (hasTies) {
        const tbEntropy = randomBytes(4);
        const tbSeed = (tbEntropy.readUInt32BE(0) ^ (Date.now() & 0xFFFFFFFF)) >>> 0;
        tiebreakerNumber = (tbSeed % 50) + 1;

        for (const entry of withDistances) {
          entry.tiebreakerDistance = circularDist(entry.lotteryNumber || 0, tiebreakerNumber);
        }

        withDistances.sort((a, b) => {
          if (a.distance !== b.distance) return a.distance - b.distance;
          return (a.tiebreakerDistance ?? 0) - (b.tiebreakerDistance ?? 0);
        });
      }

      for (let i = 0; i < withDistances.length; i++) {
        await storage.updateSibling(withDistances[i].id, { draftOrder: i + 1 });
      }
      res.json({
        winningNumber,
        tiebreakerNumber,
        draftOrder: withDistances.map((s, i) => ({
          id: s.id,
          name: s.name,
          lotteryNumber: s.lotteryNumber,
          distance: s.distance,
          tiebreakerDistance: s.tiebreakerDistance,
          draftPosition: i + 1,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to spin lottery" });
    }
  });

  // ============ DRAFT ============
  
  // Get draft state
  app.get("/api/draft", async (req, res) => {
    try {
      let state = await storage.getDraftState();
      if (!state) {
        state = await storage.createOrUpdateDraftState({
          currentRound: 1,
          currentPickIndex: 0,
          isActive: false,
          isComplete: false,
        });
      }
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch draft state" });
    }
  });

  // Start draft
  app.post("/api/draft/start", async (req, res) => {
    try {
      const allSiblings = await storage.getAllSiblings();
      if (allSiblings.length === 0) {
        return res.status(400).json({ error: "No family members to draft" });
      }

      const shuffled = [...allSiblings].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length; i++) {
        await storage.updateSibling(shuffled[i].id, { draftOrder: i + 1 });
      }

      const state = await storage.createOrUpdateDraftState({
        isActive: true,
        isComplete: false,
        currentRound: 1,
        currentPickIndex: 0,
      });
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: "Failed to start draft" });
    }
  });

  // Pause draft
  app.post("/api/draft/pause", async (req, res) => {
    try {
      const state = await storage.createOrUpdateDraftState({
        isActive: false,
      });
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: "Failed to pause draft" });
    }
  });

  // Reset draft
  app.post("/api/draft/reset", async (req, res) => {
    try {
      await storage.resetDraft();

      const allSiblings = await storage.getAllSiblings();
      for (const sib of allSiblings) {
        await storage.updateSibling(sib.id, { draftOrder: 0 });
      }

      const state = await storage.getDraftState();
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: "Failed to reset draft" });
    }
  });

  // Make a pick
  app.post("/api/draft/pick", async (req, res) => {
    try {
      const { itemId } = req.body;
      if (!itemId) {
        return res.status(400).json({ error: "Item ID is required" });
      }

      const draftState = await storage.getDraftState();
      if (!draftState || !draftState.isActive) {
        return res.status(400).json({ error: "Draft is not active" });
      }

      const siblings = await storage.getAllSiblings();
      const sortedSiblings = siblings.sort((a, b) => a.draftOrder - b.draftOrder);
      
      if (sortedSiblings.length === 0) {
        return res.status(400).json({ error: "No siblings in draft" });
      }

      const currentPickerIndex = draftState.currentPickIndex % sortedSiblings.length;
      const currentPicker = sortedSiblings[currentPickerIndex];

      // Update the item
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      if (item.pickedBySiblingId) {
        return res.status(400).json({ error: "Item already picked" });
      }

      await storage.updateItem(itemId, {
        pickedBySiblingId: currentPicker.id,
        pickRound: draftState.currentRound,
      });

      // Advance to next pick
      const nextPickIndex = draftState.currentPickIndex + 1;
      const nextRound = Math.floor(nextPickIndex / sortedSiblings.length) + 1;
      
      // Check if draft is complete
      const allItems = await storage.getAllItems();
      const unpickedItems = allItems.filter(i => !i.pickedBySiblingId && i.id !== itemId);
      const isComplete = unpickedItems.length === 0;

      await storage.createOrUpdateDraftState({
        currentPickIndex: nextPickIndex,
        currentRound: nextRound,
        isComplete,
        isActive: !isComplete,
      });

      const newState = await storage.getDraftState();
      res.json(newState);
    } catch (error) {
      res.status(500).json({ error: "Failed to make pick" });
    }
  });

  // ============ SHARE ============
  
  // Get share data by token
  app.get("/api/share/:token", async (req, res) => {
    try {
      const sibling = await storage.getSiblingByShareToken(req.params.token);
      if (!sibling) {
        return res.status(404).json({ error: "Share link not found" });
      }

      const items = await storage.getAllItems();
      const wishlist = await storage.getWishlistBySibling(sibling.id);
      const allSiblings = await storage.getAllSiblings();
      const familyMembersList = await storage.getFamilyMembersBySibling(sibling.id);
      const suggestions = await storage.getSuggestionsBySibling(sibling.id);

      res.json({
        sibling: sanitizeSibling(sibling),
        items: items.map(stripBlobFields),
        wishlist,
        allSiblings: allSiblings.map(sanitizeSibling),
        familyMembers: familyMembersList,
        suggestions,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch share data" });
    }
  });

  // Register or find a family member via share token
  app.post("/api/share/:token/family-members", async (req, res) => {
    try {
      const sibling = await storage.getSiblingByShareToken(req.params.token);
      if (!sibling) {
        return res.status(404).json({ error: "Share link not found" });
      }

      const { name } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Name is required" });
      }

      const existingMembers = await storage.getFamilyMembersBySibling(sibling.id);
      const existing = existingMembers.find(
        (m) => m.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (existing) {
        return res.json(existing);
      }

      const member = await storage.createFamilyMember({
        siblingId: sibling.id,
        name: name.trim(),
      });
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to register family member" });
    }
  });

  // Add a suggestion from a family member
  app.post("/api/share/:token/suggestions", async (req, res) => {
    try {
      const sibling = await storage.getSiblingByShareToken(req.params.token);
      if (!sibling) {
        return res.status(404).json({ error: "Share link not found" });
      }

      const { familyMemberId, itemId, note } = req.body;
      if (!familyMemberId || !itemId || !note || typeof note !== "string" || note.trim().length === 0) {
        return res.status(400).json({ error: "Family member ID, item ID, and note are required" });
      }

      const member = await storage.getFamilyMember(familyMemberId);
      if (!member || member.siblingId !== sibling.id) {
        return res.status(403).json({ error: "Invalid family member" });
      }

      const suggestion = await storage.createFamilySuggestion({
        familyMemberId,
        siblingId: sibling.id,
        itemId,
        note: note.trim(),
      });
      res.json(suggestion);
    } catch (error) {
      res.status(500).json({ error: "Failed to add suggestion" });
    }
  });

  // Delete a suggestion (sibling lead can remove, or the family member who made it)
  app.delete("/api/share/:token/suggestions/:id", async (req, res) => {
    try {
      const sibling = await storage.getSiblingByShareToken(req.params.token);
      if (!sibling) {
        return res.status(404).json({ error: "Share link not found" });
      }

      await storage.deleteFamilySuggestion(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove suggestion" });
    }
  });

  // Also allow sibling to delete suggestions from their page (with PIN check)
  app.delete("/api/siblings/:siblingId/suggestions/:id", async (req, res) => {
    try {
      const sibling = await storage.getSibling(req.params.siblingId);
      if (!sibling) {
        return res.status(404).json({ error: "Sibling not found" });
      }

      if (sibling.pin) {
        const pin = req.query.pin as string;
        if (pin !== sibling.pin) {
          return res.status(403).json({ error: "Invalid PIN" });
        }
      }

      await storage.deleteFamilySuggestion(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove suggestion" });
    }
  });

  // Get suggestions for a sibling (for their wishlist page)
  app.get("/api/siblings/:siblingId/suggestions", async (req, res) => {
    try {
      const sibling = await storage.getSibling(req.params.siblingId);
      if (!sibling) {
        return res.status(404).json({ error: "Sibling not found" });
      }

      if (sibling.pin) {
        const pin = req.query.pin as string;
        if (pin !== sibling.pin) {
          return res.status(403).json({ error: "Invalid PIN" });
        }
      }

      const suggestions = await storage.getSuggestionsBySibling(sibling.id);
      const familyMembersList = await storage.getFamilyMembersBySibling(sibling.id);
      res.json({ suggestions, familyMembers: familyMembersList });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  // ============ VIEWER (READ-ONLY CHILD VIEW) ============

  app.get("/api/viewer/:siblingId", async (req, res) => {
    try {
      const sibling = await storage.getSibling(req.params.siblingId);
      if (!sibling) {
        return res.status(404).json({ error: "Family member not found" });
      }

      const allItems = await storage.getAllItems();
      const familyMembersList = await storage.getFamilyMembersBySibling(sibling.id);
      const suggestions = await storage.getSuggestionsBySibling(sibling.id);

      res.json({
        sibling: sanitizeSibling(sibling),
        items: allItems.map(stripBlobFields),
        familyMembers: familyMembersList,
        suggestions,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch viewer data" });
    }
  });

  app.post("/api/viewer/:siblingId/family-members", async (req, res) => {
    try {
      const sibling = await storage.getSibling(req.params.siblingId);
      if (!sibling) {
        return res.status(404).json({ error: "Family member not found" });
      }

      const { name } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Name is required" });
      }

      const existingMembers = await storage.getFamilyMembersBySibling(sibling.id);
      const existing = existingMembers.find(
        (m) => m.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (existing) {
        return res.json(existing);
      }

      const member = await storage.createFamilyMember({
        siblingId: sibling.id,
        name: name.trim(),
      });
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to register family member" });
    }
  });

  app.post("/api/viewer/:siblingId/suggestions", async (req, res) => {
    try {
      const sibling = await storage.getSibling(req.params.siblingId);
      if (!sibling) {
        return res.status(404).json({ error: "Family member not found" });
      }

      const { familyMemberId, itemId, note } = req.body;
      if (!familyMemberId || !itemId || !note || typeof note !== "string" || note.trim().length === 0) {
        return res.status(400).json({ error: "Family member ID, item ID, and note are required" });
      }

      const member = await storage.getFamilyMember(familyMemberId);
      if (!member || member.siblingId !== sibling.id) {
        return res.status(403).json({ error: "Invalid family member" });
      }

      const suggestion = await storage.createFamilySuggestion({
        familyMemberId,
        siblingId: sibling.id,
        itemId,
        note: note.trim(),
      });
      res.json(suggestion);
    } catch (error) {
      res.status(500).json({ error: "Failed to add suggestion" });
    }
  });

  app.delete("/api/viewer/:siblingId/suggestions/:id", async (req, res) => {
    try {
      const sibling = await storage.getSibling(req.params.siblingId);
      if (!sibling) {
        return res.status(404).json({ error: "Family member not found" });
      }

      await storage.deleteFamilySuggestion(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove suggestion" });
    }
  });

  // ============ OWNER (APP OWNER BYPASS) ============

  const ownerPasswordSchema = z.object({
    password: z.string().min(1),
  });

  app.post("/api/owner/verify", async (req, res) => {
    try {
      const { password } = ownerPasswordSchema.parse(req.body);
      const ownerPassword = process.env.OWNER_PASSWORD;
      if (!ownerPassword) {
        return res.status(503).json({ error: "Owner access not configured" });
      }
      if (password !== ownerPassword) {
        return res.status(403).json({ error: "Invalid owner password" });
      }
      res.json({ verified: true });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/owner/status", async (req, res) => {
    try {
      const { password } = ownerPasswordSchema.parse(req.body);
      const ownerPassword = process.env.OWNER_PASSWORD;
      if (!ownerPassword || password !== ownerPassword) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const settings = await storage.getAppSettings();
      const allSiblings = await storage.getAllSiblings();
      const allItems = await storage.getAllItems();
      const draft = await storage.getDraftState();
      const pickedItems = allItems.filter((i) => i.pickedBySiblingId);

      res.json({
        admin: {
          hasPin: !!settings?.adminPin,
          name: settings?.adminName || null,
        },
        siblings: allSiblings.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          hasPin: !!s.pin,
        })),
        items: {
          total: allItems.length,
          picked: pickedItems.length,
          unpicked: allItems.length - pickedItems.length,
        },
        draft: {
          isActive: draft?.isActive || false,
          isComplete: draft?.isComplete || false,
          currentRound: draft?.currentRound || 0,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get status" });
    }
  });

  app.post("/api/owner/reset-admin", async (req, res) => {
    try {
      const { password } = ownerPasswordSchema.parse(req.body);
      const ownerPassword = process.env.OWNER_PASSWORD;
      if (!ownerPassword || password !== ownerPassword) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await storage.updateAppSettings({
        adminPin: null,
        adminName: null,
        recoveryCode: null,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset admin" });
    }
  });

  return httpServer;
}

app.delete("/api/ratings/:siblingId/rate/:itemId", async (req, res) => {
  try {
    const { siblingId, itemId } = req.params;
    const { pin } = req.body;
    const sibling = await storage.getSibling(siblingId);
    if (!sibling) return res.status(404).json({ error: "Sibling not found" });
    if (sibling.hasPin) {
      const verified = await storage.verifySiblingPin(siblingId, pin);
      if (!verified) return res.status(403).json({ error: "Invalid PIN" });
    }
    await storage.deleteRating(siblingId, itemId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting rating:", error);
    res.status(500).json({ error: "Failed to delete rating" });
  }
});

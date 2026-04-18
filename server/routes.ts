import type { Express } from "express";
import { createServer, type Server } from "http";
import { createHash, randomBytes } from "crypto";
import { storage } from "./storage";
import { insertSiblingSchema, insertItemSchema } from "@shared/schema";
import { z } from "zod";

function hashPin(pin: string): string {
  return createHash("sha256").update(`estate-draft-${pin}`).digest("hex").slice(0, 32);
}

// Simple in-memory rate limiter for PIN-verification endpoints. Single-instance
// app on Railway, so in-memory is fine. Keyed by (ip + bucket) — e.g. admin
// login attempts and per-sibling PIN attempts are tracked separately so
// brute-forcing one sibling doesn't lock out another.
type RateEntry = { count: number; resetAt: number; blockedUntil: number };
const rateStore = new Map<string, RateEntry>();

const ipOf = (req: any): string => {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "unknown";
};

// Returns null if allowed, or a seconds-remaining number if rate-limited.
function rateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000, blockMs = 15 * 60 * 1000): number | null {
  const now = Date.now();
  const entry = rateStore.get(key);

  // Currently in a block window
  if (entry && entry.blockedUntil > now) {
    return Math.ceil((entry.blockedUntil - now) / 1000);
  }

  // Expired window — reset
  if (!entry || entry.resetAt < now) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs, blockedUntil: 0 });
    return null;
  }

  entry.count += 1;
  if (entry.count > maxAttempts) {
    entry.blockedUntil = now + blockMs;
    rateStore.set(key, entry);
    return Math.ceil(blockMs / 1000);
  }
  rateStore.set(key, entry);
  return null;
}

// Clear rate limit for a key (call on successful auth so you don't punish
// the legitimate user after they finally get it right)
function rateLimitClear(key: string) {
  rateStore.delete(key);
}

// Periodic sweep to keep the map from growing unbounded
setInterval(() => {
  const now = Date.now();
  rateStore.forEach((v, k) => {
    if (v.blockedUntil < now && v.resetAt < now) rateStore.delete(k);
  });
}, 5 * 60 * 1000).unref?.();

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
    heroPhoto: z.string().max(50 * 1024 * 1024).optional(),
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
      const key = `admin-recover:${ipOf(req)}`;
      const blockedFor = rateLimit(key, 5, 60 * 60 * 1000, 60 * 60 * 1000);
      if (blockedFor !== null) {
        return res.status(429).json({
          error: `Too many attempts. Try again in ${Math.ceil(blockedFor / 60)} minute(s).`,
          retryAfter: blockedFor,
        });
      }
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
      rateLimitClear(key);
      
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
      const key = `admin-pin:${ipOf(req)}`;
      const blockedFor = rateLimit(key);
      if (blockedFor !== null) {
        return res.status(429).json({
          error: `Too many attempts. Try again in ${Math.ceil(blockedFor / 60)} minute(s).`,
          retryAfter: blockedFor,
        });
      }
      const data = verifyPinSchema.parse(req.body);
      const settings = await storage.getAppSettings();
      if (!settings?.adminPin) {
        rateLimitClear(key);
        return res.json({ verified: true, hasPin: false });
      }
      const verified = settings.adminPin === hashPin(data.pin);
      if (verified) rateLimitClear(key);
      res.json({ verified, hasPin: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "PIN must be 4 digits" });
      }
      res.status(500).json({ error: "Failed to verify admin PIN" });
    }
  });

  const adminDashboardSchema = z.object({
    pin: z.string().length(4).regex(/^\d{4}$/),
  });

  app.post("/api/admin/dashboard", async (req, res) => {
    try {
      const key = `admin-dashboard:${ipOf(req)}`;
      const blockedFor = rateLimit(key);
      if (blockedFor !== null) {
        return res.status(429).json({
          error: `Too many attempts. Try again in ${Math.ceil(blockedFor / 60)} minute(s).`,
          retryAfter: blockedFor,
        });
      }
      const data = adminDashboardSchema.parse(req.body);
      const settings = await storage.getAppSettings();
      if (!settings?.adminPin || settings.adminPin !== hashPin(data.pin)) {
        return res.status(401).json({ error: "Invalid admin PIN" });
      }
      rateLimitClear(key);
      
      const siblings = await storage.getAllSiblings();
      const draft = await storage.getDraftState();
      
      res.json({
        siblings: siblings.map(s => ({
          id: s.id,
          name: s.name,
          color: s.color,
          wishlistSubmitted: s.wishlistSubmitted,
          draftOrder: s.draftOrder,
        })),
        draft: {
          isActive: draft?.isActive || false,
          isComplete: draft?.isComplete || false,
          currentRound: draft?.currentRound || 0,
          currentPickIndex: draft?.currentPickIndex || 0,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input" });
      }
      res.status(500).json({ error: "Failed to get dashboard data" });
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

  // Public-safe sanitizer: strips pin AND shareToken so public endpoints
  // never leak private tokens that would let anyone impersonate a sibling.
  const sanitizeSibling = (sibling: any) => {
    const { pin, shareToken, ...rest } = sibling;
    return { ...rest, hasPin: !!pin };
  };

  // Admin sanitizer: includes shareToken (for the copy-link UI). Only used
  // by endpoints gated behind a verified admin PIN.
  const sanitizeSiblingForAdmin = (sibling: any) => {
    const { pin, ...rest } = sibling;
    return { ...rest, hasPin: !!pin };
  };

  // Helper to verify admin PIN from a request (header or body).
  // Also rate-limits by IP so attackers can't brute-force the admin PIN by
  // firing floods at any admin-gated endpoint (not just /verify-pin).
  // Returns false both for "wrong pin" and "rate-limited" — callers treat
  // both the same way (401). To surface 429 on the dedicated verify endpoints
  // we still rate-limit there explicitly.
  const verifyAdminPin = async (req: any): Promise<boolean> => {
    const pin = (req.headers["x-admin-pin"] as string) || req.body?.adminPin || req.query?.adminPin;
    if (!pin) return false;
    const key = `admin-verify:${ipOf(req)}`;
    const blockedFor = rateLimit(key, 20, 15 * 60 * 1000, 15 * 60 * 1000);
    if (blockedFor !== null) return false;
    const settings = await storage.getAppSettings();
    if (!settings?.adminPin) return false;
    const ok = settings.adminPin === hashPin(pin);
    if (ok) rateLimitClear(key);
    return ok;
  };

  // Get all siblings (PUBLIC — shareToken is stripped)
  app.get("/api/siblings", async (req, res) => {
    try {
      const siblings = await storage.getAllSiblings();
      res.json(siblings.map(sanitizeSibling));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch siblings" });
    }
  });

  // Admin-only: returns full sibling records including shareTokens, for the copy-link UI
  app.get("/api/admin/siblings", async (req, res) => {
    try {
      if (!(await verifyAdminPin(req))) {
        return res.status(401).json({ error: "Admin PIN required" });
      }
      const siblings = await storage.getAllSiblings();
      res.json(siblings.map(sanitizeSiblingForAdmin));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch siblings" });
    }
  });

  // Get single sibling (PUBLIC — shareToken stripped)
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

  // Create sibling (admin-only — sets pin/shareToken on the server, admin needs shareToken back)
  app.post("/api/siblings", async (req, res) => {
    try {
      if (!(await verifyAdminPin(req))) {
        return res.status(401).json({ error: "Admin PIN required" });
      }
      const data = insertSiblingSchema.parse(req.body);
      const sibling = await storage.createSibling(data);
      res.status(201).json(sanitizeSiblingForAdmin(sibling));
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
      if (!(await verifyAdminPin(req))) {
        return res.status(401).json({ error: "Admin PIN required" });
      }
      const data = updateSiblingSchema.parse(req.body);
      // Hash the PIN before storing, same as admin PIN
      const updates = { ...data };
      if (data.pin !== undefined && data.pin !== null) {
        updates.pin = hashPin(data.pin);
      }
      const sibling = await storage.updateSibling(req.params.id, updates);
      if (!sibling) {
        return res.status(404).json({ error: "Sibling not found" });
      }
      res.json(sanitizeSiblingForAdmin(sibling));
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
      const key = `sibling-pin:${req.params.id}:${ipOf(req)}`;
      const blockedFor = rateLimit(key);
      if (blockedFor !== null) {
        return res.status(429).json({
          error: `Too many attempts. Try again in ${Math.ceil(blockedFor / 60)} minute(s).`,
          retryAfter: blockedFor,
        });
      }
      const { pin } = req.body;
      const sibling = await storage.getSibling(req.params.id);
      if (!sibling) {
        return res.status(404).json({ error: "Sibling not found" });
      }
      if (!sibling.pin) {
        rateLimitClear(key);
        return res.json({ verified: true, hasPin: false });
      }
      const verified = sibling.pin === hashPin(pin);
      if (verified) rateLimitClear(key);
      res.json({ verified, hasPin: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify PIN" });
    }
  });

  // Delete sibling
  app.delete("/api/siblings/:id", async (req, res) => {
    try {
      if (!(await verifyAdminPin(req))) {
        return res.status(401).json({ error: "Admin PIN required" });
      }
      await storage.deleteSibling(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sibling" });
    }
  });

  // Full-wipe: deletes all siblings, items, ratings, wishlists, and resets draft state.
  // Preserves app settings (admin PIN, family name, hero photo) so the admin can
  // wipe and test without having to re-run first-time setup.
  app.post("/api/admin/wipe-all", async (req, res) => {
    try {
      if (!(await verifyAdminPin(req))) {
        return res.status(401).json({ error: "Admin PIN required" });
      }
      // Delete siblings — deleteSibling cascades to ratings/wishlists/suggestions/family-members
      const allSiblings = await storage.getAllSiblings();
      for (const s of allSiblings) {
        await storage.deleteSibling(s.id);
      }
      // Delete all items
      await storage.deleteAllItems();
      // Reset draft state
      await storage.resetDraft();
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to wipe all data:", error);
      res.status(500).json({ error: "Failed to wipe data" });
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
      if (!(await verifyAdminPin(req))) {
        return res.status(401).json({ error: "Admin PIN required" });
      }
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
      if (!(await verifyAdminPin(req))) {
        return res.status(401).json({ error: "Admin PIN required" });
      }
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
      if (!(await verifyAdminPin(req))) {
        return res.status(401).json({ error: "Admin PIN required" });
      }
      await storage.deleteItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  app.delete("/api/items", async (req, res) => {
    try {
      if (!(await verifyAdminPin(req))) {
        return res.status(401).json({ error: "Admin PIN required" });
      }
      await storage.deleteAllItems();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete all items" });
    }
  });

  // ============ WISHLIST ============
  
  // Get wishlist by sibling. Private: requires admin PIN, matching shareToken,
  // or matching sibling PIN. "No PIN set" is NOT open — that was the old leak.
  app.get("/api/wishlist/:siblingId", async (req, res) => {
    try {
      const sibling = await storage.getSibling(req.params.siblingId);
      if (!sibling) {
        return res.status(404).json({ error: "Sibling not found" });
      }

      const pin = req.query.pin as string | undefined;
      const shareToken = req.query.shareToken as string | undefined;
      const adminPinOk = await verifyAdminPin(req);
      const tokenOk = !!shareToken && sibling.shareToken === shareToken;
      const pinOk = !!sibling.pin && !!pin && sibling.pin === hashPin(pin);
      if (!adminPinOk && !tokenOk && !pinOk) {
        return res.status(401).json({ error: "Access denied. Use your private link.", requiresAuth: true });
      }

      const wishlist = await storage.getWishlistBySibling(req.params.siblingId);
      res.json(wishlist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  // Helper to verify PIN for wishlist mutations
  const verifyWishlistAccess = async (siblingId: string, pin?: string, shareToken?: string): Promise<boolean> => {
    const sibling = await storage.getSibling(siblingId);
    if (!sibling) return false;
    // Always require proof of identity (shareToken OR matching PIN).
    // Rankings are private — "no PIN set" must NOT mean "open to everyone."
    if (shareToken && sibling.shareToken === shareToken) return true;
    if (sibling.pin && pin && sibling.pin === hashPin(pin)) return true;
    return false;
  };

  // Add to wishlist
  app.post("/api/wishlist", async (req, res) => {
    try {
      const { siblingId, itemId, priority, pin, shareToken } = req.body;
      if (!siblingId || !itemId || priority === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!(await verifyWishlistAccess(siblingId, pin, shareToken))) {
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
      const { items, siblingId, pin, shareToken } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Items must be an array" });
      }

      if (siblingId && !(await verifyWishlistAccess(siblingId, pin, shareToken))) {
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
      const { siblingId, pin, shareToken, rating, comment } = req.body;

      if (siblingId && !(await verifyWishlistAccess(siblingId, pin, shareToken))) {
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
      const shareToken = req.query.shareToken as string | undefined;
      const siblingId = req.query.siblingId as string | undefined;

      if (siblingId && !(await verifyWishlistAccess(siblingId, pin, shareToken))) {
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
      // Rankings are always private. Require EITHER a matching shareToken,
      // a matching PIN (if set), or a valid admin PIN. No more "no PIN = no auth."
      const pin = req.query.pin as string | undefined;
      const shareToken = req.query.shareToken as string | undefined;
      const adminPinOk = await verifyAdminPin(req);
      const tokenOk = !!shareToken && sibling.shareToken === shareToken;
      const pinOk = !!sibling.pin && !!pin && sibling.pin === hashPin(pin);
      if (!adminPinOk && !tokenOk && !pinOk) {
        return res.status(401).json({ error: "Access denied. Use your private link.", requiresAuth: true });
      }
      const ratings = await storage.getRatingsBySibling(req.params.siblingId);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  });

  app.put("/api/ratings/:siblingId/rate", async (req, res) => {
    try {
      const { itemId, rating, pin, shareToken } = req.body;
      if (!itemId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Valid itemId and rating (1-5) required" });
      }
      if (!(await verifyWishlistAccess(req.params.siblingId, pin, shareToken))) {
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
      const { items, pin, shareToken } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Items must be an array" });
      }
      if (!(await verifyWishlistAccess(req.params.siblingId, pin, shareToken))) {
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
      const { pin, shareToken } = req.body;
      if (!(await verifyWishlistAccess(req.params.id, pin, shareToken))) {
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
      const { pin, shareToken } = req.body;
      if (!(await verifyWishlistAccess(req.params.id, pin, shareToken))) {
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
      const { number, pin, shareToken } = req.body;
      if (!number || number < 1 || number > 50) {
        return res.status(400).json({ error: "Number must be between 1 and 50" });
      }
      if (!(await verifyWishlistAccess(req.params.siblingId, pin, shareToken))) {
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
  
  // Get draft state (with who's on the clock, so the sibling page can
  // show the right view without doing the math itself).
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
      const allSiblings = await storage.getAllSiblings();
      const sortedSiblings = allSiblings
        .filter(s => (s.draftOrder || 0) > 0)
        .sort((a, b) => a.draftOrder - b.draftOrder);

      let currentPickerId: string | null = null;
      let currentPickerName: string | null = null;
      let currentPickerColor: string | null = null;
      if (state.isActive && sortedSiblings.length > 0) {
        const idx = pickerForIndex(state.currentPickIndex, sortedSiblings.length);
        const picker = sortedSiblings[idx];
        currentPickerId = picker.id;
        currentPickerName = picker.name;
        currentPickerColor = picker.color;
      }

      res.json({
        ...state,
        currentPickerId,
        currentPickerName,
        currentPickerColor,
        totalSiblings: sortedSiblings.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch draft state" });
    }
  });

  // Snake-draft picker: for N siblings sorted by draftOrder (1..N),
  // pickIndex advances 0,1,...,N-1,N-1,N-2,...,0,0,1,... (round reverses each round)
  const pickerForIndex = (pickIndex: number, n: number) => {
    if (n <= 0) return 0;
    const round = Math.floor(pickIndex / n); // 0-indexed round
    const posInRound = pickIndex % n;
    return round % 2 === 0 ? posInRound : n - 1 - posInRound;
  };

  // Start draft (admin only). Preserves an existing lottery-assigned order;
  // only randomizes if no order has been set yet.
  app.post("/api/draft/start", async (req, res) => {
    try {
      if (!(await verifyAdminPin(req))) {
        return res.status(401).json({ error: "Admin PIN required" });
      }
      const allSiblings = await storage.getAllSiblings();
      if (allSiblings.length === 0) {
        return res.status(400).json({ error: "No family members to draft" });
      }

      // Preserve any existing lottery-assigned order. Only assign new
      // draftOrder values to siblings who don't have one yet (draftOrder = 0
      // or null). This means:
      //   - If nobody has an order: randomize everyone.
      //   - If lottery already ran: keep it. Siblings added post-lottery
      //     get appended to the end in random order (never reshuffling the
      //     people who already have positions).
      const withOrder = allSiblings.filter(s => (s.draftOrder || 0) > 0);
      const withoutOrder = allSiblings.filter(s => (s.draftOrder || 0) <= 0);

      if (withOrder.length === 0) {
        // Full shuffle — no lottery has run
        const shuffled = [...withoutOrder].sort(() => Math.random() - 0.5);
        for (let i = 0; i < shuffled.length; i++) {
          await storage.updateSibling(shuffled[i].id, { draftOrder: i + 1 });
        }
      } else if (withoutOrder.length > 0) {
        // Append new siblings to end, keeping existing lottery order intact
        const maxOrder = Math.max(...withOrder.map(s => s.draftOrder || 0));
        const shuffled = [...withoutOrder].sort(() => Math.random() - 0.5);
        for (let i = 0; i < shuffled.length; i++) {
          await storage.updateSibling(shuffled[i].id, { draftOrder: maxOrder + i + 1 });
        }
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

  // Pause draft (admin only)
  app.post("/api/draft/pause", async (req, res) => {
    try {
      if (!(await verifyAdminPin(req))) {
        return res.status(401).json({ error: "Admin PIN required" });
      }
      const state = await storage.createOrUpdateDraftState({
        isActive: false,
      });
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: "Failed to pause draft" });
    }
  });

  // Reset draft (admin only).
  // Body: { adminPin, keepOrder?: boolean }
  // - keepOrder true: clears picks and draft state but PRESERVES the lottery
  //   pick order on each sibling. Useful for running mock drafts without
  //   having to re-run the lottery every time.
  // - keepOrder false (default): full reset — also zeroes out draftOrder so
  //   the lottery would have to run again before starting.
  app.post("/api/draft/reset", async (req, res) => {
    try {
      if (!(await verifyAdminPin(req))) {
        return res.status(401).json({ error: "Admin PIN required" });
      }
      const keepOrder = req.body?.keepOrder === true;

      await storage.resetDraft();

      if (!keepOrder) {
        const allSiblings = await storage.getAllSiblings();
        for (const sib of allSiblings) {
          await storage.updateSibling(sib.id, { draftOrder: 0 });
        }
      }

      const state = await storage.getDraftState();
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: "Failed to reset draft" });
    }
  });

  // Make a pick. Authorized by EITHER admin PIN (admin override picking on
  // behalf of whoever is on the clock) OR a shareToken that matches the
  // CURRENT picker (the sibling picking for themselves via their private link).
  app.post("/api/draft/pick", async (req, res) => {
    try {
      const { itemId, shareToken } = req.body;
      if (!itemId) {
        return res.status(400).json({ error: "Item ID is required" });
      }

      const draftState = await storage.getDraftState();
      if (!draftState || !draftState.isActive) {
        return res.status(400).json({ error: "Draft is not active" });
      }

      const siblings = await storage.getAllSiblings();
      // Only siblings with an assigned draftOrder participate. Must match
      // the filter in GET /api/draft so the picker index agrees with what
      // the UI displays.
      const sortedSiblings = siblings
        .filter(s => (s.draftOrder || 0) > 0)
        .sort((a, b) => a.draftOrder - b.draftOrder);

      if (sortedSiblings.length === 0) {
        return res.status(400).json({ error: "No siblings in draft" });
      }

      const currentPickerIndex = pickerForIndex(draftState.currentPickIndex, sortedSiblings.length);
      const currentPicker = sortedSiblings[currentPickerIndex];

      // Auth: admin OR the current picker's own shareToken.
      // A sibling can never pick for someone else, even with a valid share link.
      const adminOk = await verifyAdminPin(req);
      const tokenOk = !!shareToken && currentPicker.shareToken === shareToken;
      if (!adminOk && !tokenOk) {
        return res.status(401).json({ error: "Not your turn or invalid auth" });
      }

      // Pre-check: item exists
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      // Pre-compute what the next state should look like
      const nextPickIndex = draftState.currentPickIndex + 1;
      const nextRound = Math.floor(nextPickIndex / sortedSiblings.length) + 1;
      const allItems = await storage.getAllItems();
      const unpickedItems = allItems.filter(i => !i.pickedBySiblingId && i.id !== itemId);
      const isComplete = unpickedItems.length === 0;

      // Atomic: claim the item and advance the draft in one transaction,
      // gated on the currentPickIndex NOT having moved since we read it.
      // This blocks the race where two concurrent /pick requests both pass
      // auth, both claim different items, but only one pickIndex++ wins and
      // the next sibling's turn gets skipped.
      const result = await storage.atomicPick({
        itemId,
        siblingId: currentPicker.id,
        expectedPickIndex: draftState.currentPickIndex,
        pickRound: draftState.currentRound,
        nextPickIndex,
        nextRound,
        isComplete,
        isActive: !isComplete,
      });

      if (!result.ok) {
        if (result.reason === "already_picked") {
          return res.status(409).json({ error: "Item was already picked. Refresh and try again." });
        }
        if (result.reason === "race") {
          return res.status(409).json({ error: "Someone else just picked. Refresh and try again." });
        }
        return res.status(400).json({ error: "Draft is not active" });
      }

      res.json(result.state);
    } catch (error) {
      res.status(500).json({ error: "Failed to make pick" });
    }
  });

  // ============ SHARE ============

  // Resolve a share token to a sibling ID (lightweight, for join links)
  app.get("/api/join/:token", async (req, res) => {
    try {
      const sibling = await storage.getSiblingByShareToken(req.params.token);
      if (!sibling) {
        return res.status(404).json({ error: "Link not found" });
      }
      res.json({ siblingId: sibling.id, name: sibling.name, shareToken: sibling.shareToken });
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve link" });
    }
  });

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

  // Allow sibling to delete suggestions from their page. Requires admin OR
  // shareToken OR matching sibling PIN — "no PIN set" is NOT open.
  app.delete("/api/siblings/:siblingId/suggestions/:id", async (req, res) => {
    try {
      const sibling = await storage.getSibling(req.params.siblingId);
      if (!sibling) {
        return res.status(404).json({ error: "Sibling not found" });
      }
      const pin = req.query.pin as string | undefined;
      const shareToken = req.query.shareToken as string | undefined;
      const adminPinOk = await verifyAdminPin(req);
      const tokenOk = !!shareToken && sibling.shareToken === shareToken;
      const pinOk = !!sibling.pin && !!pin && sibling.pin === hashPin(pin);
      if (!adminPinOk && !tokenOk && !pinOk) {
        return res.status(403).json({ error: "Access denied", requiresAuth: true });
      }

      // Verify the suggestion actually belongs to this sibling before deleting
      const allSuggestions = await storage.getSuggestionsBySibling(sibling.id);
      if (!allSuggestions.some(s => s.id === req.params.id)) {
        return res.status(404).json({ error: "Suggestion not found for this sibling" });
      }

      await storage.deleteFamilySuggestion(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove suggestion" });
    }
  });

  // Get suggestions for a sibling (for their wishlist page). Private.
  app.get("/api/siblings/:siblingId/suggestions", async (req, res) => {
    try {
      const sibling = await storage.getSibling(req.params.siblingId);
      if (!sibling) {
        return res.status(404).json({ error: "Sibling not found" });
      }
      const pin = req.query.pin as string | undefined;
      const shareToken = req.query.shareToken as string | undefined;
      const adminPinOk = await verifyAdminPin(req);
      const tokenOk = !!shareToken && sibling.shareToken === shareToken;
      const pinOk = !!sibling.pin && !!pin && sibling.pin === hashPin(pin);
      if (!adminPinOk && !tokenOk && !pinOk) {
        return res.status(401).json({ error: "Access denied. Use your private link.", requiresAuth: true });
      }

      const suggestions = await storage.getSuggestionsBySibling(sibling.id);
      const familyMembersList = await storage.getFamilyMembersBySibling(sibling.id);
      res.json({ suggestions, familyMembers: familyMembersList });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  // NOTE: The old /api/viewer/:siblingId endpoints were removed. They had no
  // auth and leaked items/family/suggestions to anyone who guessed a sibling
  // UUID. Use /api/share/:token/* (shareToken-gated) instead.

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

  // Delete a single rating for a sibling/item pair
  app.delete("/api/ratings/:siblingId/rate/:itemId", async (req, res) => {
    try {
      const { siblingId, itemId } = req.params;
      const { pin, shareToken } = req.body;
      if (!(await verifyWishlistAccess(siblingId, pin, shareToken))) {
        return res.status(403).json({ error: "PIN required", requiresPin: true });
      }
      await storage.deleteRating(siblingId, itemId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting rating:", error);
      res.status(500).json({ error: "Failed to delete rating" });
    }
  });

  return httpServer;
}

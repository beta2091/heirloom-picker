import type { Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { runWithEstate, DEFAULT_ESTATE_ID } from "./tenant";
import {
  getEstateById,
  estateIdForSibling,
  estateIdForShareToken,
  estateIdForItem,
} from "./accounts";

declare module "express-session" {
  interface SessionData {
    organizerId?: string;
    estateId?: string;
  }
}

const PgStore = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgStore({ pool, tableName: "session", createTableIfMissing: true }),
  name: "heirloom.sid",
  secret: process.env.SESSION_SECRET || "heirloom-dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  },
});

// Derive the estate for a participant request that hasn't yet learned its
// estate id (the first request from a share/PIN link). Only matches unambiguous
// bootstrap patterns where the first path param is a globally-unique id/token.
async function estateFromPath(req: Request): Promise<string | null> {
  const p = req.path;
  let m: RegExpMatchArray | null;
  if ((m = p.match(/^\/api\/(?:share|join)\/([^/]+)/))) return estateIdForShareToken(m[1]);
  if ((m = p.match(/^\/api\/siblings\/([^/]+)/))) return estateIdForSibling(m[1]);
  if (req.method === "GET" && (m = p.match(/^\/api\/(?:wishlist|ratings)\/([^/]+)/))) return estateIdForSibling(m[1]);
  if ((m = p.match(/^\/api\/items\/([^/]+)/))) return estateIdForItem(m[1]);
  return null;
}

// Resolve the current estate once per request, then run the rest of the
// pipeline inside that estate's AsyncLocalStorage context so every storage
// call is automatically tenant-scoped. Resolution order:
//   1. Logged-in organizer's session estate (trusted)
//   2. x-estate-id header (client-supplied; still gated by per-estate admin PIN)
//   3. Path-derived estate for participant bootstrap requests
//   4. Default estate (keeps the legacy single-family deployment working)
export async function tenantMiddleware(req: Request, _res: Response, next: NextFunction) {
  let estateId: string | null = null;

  if (req.session?.estateId) {
    estateId = req.session.estateId;
  }

  if (!estateId) {
    const header = req.headers["x-estate-id"];
    const headerId = Array.isArray(header) ? header[0] : header;
    if (headerId) {
      const estate = await getEstateById(headerId);
      if (estate) estateId = estate.id;
    }
  }

  if (!estateId) {
    estateId = await estateFromPath(req).catch(() => null);
  }

  runWithEstate(estateId || DEFAULT_ESTATE_ID, () => next());
}

// Guard for organizer-account routes.
export function requireOrganizer(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.organizerId) {
    return res.status(401).json({ error: "Not signed in" });
  }
  next();
}

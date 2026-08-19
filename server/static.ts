import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { PRERENDER_PAGES } from "@shared/seo";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Prefer the prerendered marketing HTML (unique title / OG tags) when present.
  for (const page of PRERENDER_PAGES) {
    const slug = page.path.replace(/^\//, "");
    const file = path.resolve(distPath, slug, "index.html");
    const send = (_req: Request, res: Response) => res.sendFile(file);
    app.get(page.path, send);
    app.get(`${page.path}/`, send);
  }

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

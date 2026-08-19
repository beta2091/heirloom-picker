import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { mkdir, readdir, rm, readFile, writeFile, cp } from "fs/promises";
import path from "path";
import {
  applySeoToHtml,
  PRERENDER_PAGES,
  renderRobotsTxt,
  renderSitemapXml,
  SEO,
  SITE_ORIGIN,
} from "../shared/seo";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function writePublicFile(relPath: string, contents: string) {
  const dest = path.join("dist/public", relPath);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, contents);
}

function pageSlug(pagePath: string): string {
  return pagePath.replace(/^\//, "");
}

function pageCanonical(pagePath: string): string {
  return pagePath === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${pagePath}`;
}

async function writeSeoHtmlCopies(spaHtml: string) {
  const homeHtml = applySeoToHtml(spaHtml, SEO.home);
  await writeFile("dist/public/index.html", homeHtml);

  for (const page of PRERENDER_PAGES) {
    const injected = applySeoToHtml(spaHtml, page);
    await writePublicFile(path.join(pageSlug(page.path), "index.html"), injected);
  }
}

/** Fail the build if a prerendered file still has homepage title/canonical. */
async function assertPrerenderedSeo(rootDir: string) {
  const pages = [SEO.home, ...PRERENDER_PAGES];
  for (const page of pages) {
    const rel =
      page.path === "/" ? "index.html" : path.join(pageSlug(page.path), "index.html");
    const file = path.join(rootDir, rel);
    const html = await readFile(file, "utf-8");
    const title = `<title>${page.title}</title>`;
    const canonical = `rel="canonical" href="${pageCanonical(page.path)}"`;
    if (!html.includes(title)) {
      throw new Error(`Prerender missing unique title in ${file}`);
    }
    if (!html.includes(canonical)) {
      throw new Error(`Prerender missing unique canonical in ${file}`);
    }
    if (page.path !== "/" && html.includes(`rel="canonical" href="${SITE_ORIGIN}/"`)) {
      throw new Error(`Prerender still has homepage canonical in ${file}`);
    }
    if (page.jsonLd && !html.includes("application/ld+json")) {
      throw new Error(`Prerender missing JSON-LD in ${file}`);
    }
  }
}

/** Copy every dist/public file to the repo root so Vercel rewrites can find them. */
async function copyPublicOutputToRoot() {
  const entries = await readdir("dist/public", { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join("dist/public", entry.name);
    await cp(from, entry.name, { recursive: true, force: true });
  }
}

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("writing sitemap, robots, and per-route SEO html...");
  await writeFile("dist/public/sitemap.xml", renderSitemapXml());
  await writeFile("dist/public/robots.txt", renderRobotsTxt());
  const spaHtml = await readFile("dist/public/index.html", "utf-8");
  await writeSeoHtmlCopies(spaHtml);

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // Copy the full static output — including nested /guides/<slug>/index.html —
  // to the project root. Vercel rewrites resolve destinations from here. The
  // previous copy listed only index/assets/marketing/sitemap and relied on a
  // side-effect write for route HTML; one explicit copy keeps new nested
  // routes from being omitted.
  console.log("copying static assets for Vercel...");
  await copyPublicOutputToRoot();
  await assertPrerenderedSeo("dist/public");
  await assertPrerenderedSeo(".");

  const sitemap = await readFile("dist/public/sitemap.xml", "utf-8");
  for (const page of PRERENDER_PAGES) {
    const loc = pageCanonical(page.path);
    if (!sitemap.includes(`<loc>${loc}</loc>`)) {
      throw new Error(`sitemap.xml missing ${loc}`);
    }
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});

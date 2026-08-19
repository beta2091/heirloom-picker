import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { mkdir, rm, readFile, writeFile, cp } from "fs/promises";
import path from "path";
import {
  applySeoToHtml,
  PRERENDER_PAGES,
  renderRobotsTxt,
  renderSitemapXml,
  SEO,
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

async function writeSeoHtmlCopies(spaHtml: string) {
  const homeHtml = applySeoToHtml(spaHtml, SEO.home);
  await writeFile("dist/public/index.html", homeHtml);

  for (const page of PRERENDER_PAGES) {
    const slug = page.path.replace(/^\//, "");
    const injected = applySeoToHtml(spaHtml, page);
    await writePublicFile(path.join(slug, "index.html"), injected);
    await mkdir(slug, { recursive: true });
    await writeFile(path.join(slug, "index.html"), injected);
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

  // Copy built static files to project root for Vercel static serving
  // Vercel serves files from the project root as static assets, so
  // dist/public/index.html and dist/public/assets/* need to be at
  // ./index.html and ./assets/* for the rewrites to find them
  console.log("copying static assets for Vercel...");
  await cp("dist/public/index.html", "index.html");
  await cp("dist/public/assets", "assets", { recursive: true });
  await cp("dist/public/favicon.png", "favicon.png", { force: true }).catch(() => {});
  await cp("dist/public/marketing", "marketing", { recursive: true }).catch(() => {});
  await cp("dist/public/sitemap.xml", "sitemap.xml");
  await cp("dist/public/robots.txt", "robots.txt");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});

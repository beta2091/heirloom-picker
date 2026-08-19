/** Public site origin — used for canonical URLs, OG tags, sitemap, and robots. */
export const SITE_ORIGIN = "https://evenkeep.app";

export const DEFAULT_OG_IMAGE = "/marketing/hero-keepsakes.jpg";

export type SeoPage = {
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  image?: string;
};

export const SEO = {
  home: {
    path: "/",
    title: "Evenkeep — The fair, kind way for families to divide a loved one's belongings",
    description:
      "Evenkeep helps families fairly and peacefully divide a loved one's belongings — photograph each item, let everyone privately rank what matters, then take turns in a fair draft. Keep the memories, not the conflict. $99 one-time per estate.",
    ogTitle: "Evenkeep — Divide what matters, with fairness and care",
    ogDescription:
      "A calm, private place for your family to share a loved one's belongings. Set up and invite free; $99 once to run the live draft and export.",
  },
  howItWorks: {
    path: "/how-it-works",
    title: "How Evenkeep works — catalog, private ranking, and a fair draft",
    description:
      "A calm walkthrough of how families photograph belongings, privately say what matters, draw a fair turn order, and take turns until every keepsake has a home. Free to set up; $99 once to run the draft.",
    ogTitle: "How Evenkeep works",
    ogDescription:
      "Catalog the belongings. Everyone ranks in private. A fair order is drawn. Then you take turns — no one has to be the judge.",
  },
  forFamilies: {
    path: "/for-families",
    title: "Divide a parent's belongings fairly, without a fight | Evenkeep",
    description:
      "A private, unhurried way for siblings and executors to divide a parent's belongings fairly — so a hard week does not have to become a family fight. Free to set up; $99 once to run the draft.",
    ogTitle: "Divide a parent's belongings fairly, without a fight",
    ogDescription:
      "For the sibling or executor holding the house this week. Photograph what is left, let everyone speak in private, and let a fair draft do the deciding.",
  },
  forProfessionals: {
    path: "/for-professionals",
    title: "Refer a family to Evenkeep — $99, no software training",
    description:
      "Estate attorneys, funeral homes, senior living, and hospice can point a family to a private draft. $99 once per family you refer. Elderly relatives get a simple link — not an app to learn.",
    ogTitle: "Refer a family — $99, no software to learn",
    ogDescription:
      "For estate attorneys, funeral homes, senior living, and hospice. One private link per relative. You do not train the family on software.",
  },
  demo: {
    path: "/demo",
    title: "Sample estate — see how an Evenkeep draft works",
    description:
      "A read-only walkthrough of a fictional estate. See the catalog, a private ranking, a fair draft, and results. Nothing here is saved, and no account is required.",
    ogTitle: "Walk through a sample estate",
    ogDescription:
      "A fictional, read-only catalog so you can see the draft before you create your own. Nothing here touches a real family's estate.",
  },
  privacy: {
    path: "/privacy",
    title: "Privacy Policy | Evenkeep",
    description:
      "How Evenkeep treats family photos, ratings, and organizer accounts. We do not sell family data or use memories for advertising.",
  },
  terms: {
    path: "/terms",
    title: "Terms of Use | Evenkeep",
    description:
      "Evenkeep is a family coordination tool. Setup is free; $99 once per estate to run the live draft and export. Not a will and not legal advice.",
  },
  legal: {
    path: "/legal",
    title: "Not a will — not legal advice | Evenkeep",
    description:
      "Evenkeep helps a family divide belongings fairly. It is not a will, not legal advice, and not a substitute for an attorney.",
  },
  account: {
    path: "/account",
    title: "Create your estate | Evenkeep",
    description:
      "Set up a private Evenkeep estate for your family. Photograph belongings and invite relatives free. Pay $99 once when you run the live draft.",
  },
  login: {
    path: "/login",
    title: "Sign in | Evenkeep",
    description: "Sign in to manage your family's Evenkeep estate.",
  },
} satisfies Record<string, SeoPage>;

/** Public URLs that belong in sitemap.xml. */
export const SITEMAP_PAGES: SeoPage[] = [
  SEO.home,
  SEO.howItWorks,
  SEO.forFamilies,
  SEO.forProfessionals,
  SEO.demo,
  SEO.privacy,
  SEO.terms,
  SEO.legal,
];

/** Marketing routes that get a prerendered index.html with unique meta tags. */
export const PRERENDER_PAGES: SeoPage[] = [
  SEO.howItWorks,
  SEO.forFamilies,
  SEO.forProfessionals,
  SEO.demo,
];

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function replaceMeta(
  html: string,
  attr: "name" | "property",
  key: string,
  content: string,
): string {
  const re = new RegExp(`<meta ${attr}="${key}" content="[^"]*"\\s*/?>`, "i");
  const tag = `<meta ${attr}="${key}" content="${esc(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace("</title>", `</title>\n    ${tag}`);
}

/** Rewrite the SPA index.html so crawlers see per-route title, description, and OG tags. */
export function applySeoToHtml(html: string, page: SeoPage): string {
  const url = page.path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${page.path}`;
  const image = `${SITE_ORIGIN}${page.image ?? DEFAULT_OG_IMAGE}`;
  const ogTitle = page.ogTitle ?? page.title;
  const ogDescription = page.ogDescription ?? page.description;

  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`);

  if (/<link rel="canonical" href="[^"]*"\s*\/?>/i.test(out)) {
    out = out.replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${url}" />`,
    );
  } else {
    out = out.replace("</title>", `</title>\n    <link rel="canonical" href="${url}" />`);
  }

  out = replaceMeta(out, "name", "description", page.description);
  out = replaceMeta(out, "property", "og:title", ogTitle);
  out = replaceMeta(out, "property", "og:description", ogDescription);
  out = replaceMeta(out, "property", "og:type", "website");
  out = replaceMeta(out, "property", "og:url", url);
  out = replaceMeta(out, "property", "og:site_name", "Evenkeep");
  out = replaceMeta(out, "property", "og:image", image);
  out = replaceMeta(out, "name", "twitter:card", "summary_large_image");
  out = replaceMeta(out, "name", "twitter:title", ogTitle);
  out = replaceMeta(out, "name", "twitter:description", ogDescription);
  out = replaceMeta(out, "name", "twitter:image", image);
  return out;
}

export function renderSitemapXml(lastmod = "2026-08-19"): string {
  const urls = SITEMAP_PAGES.map((page) => {
    const loc = page.path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${page.path}`;
    const priority = page.path === "/" ? "1.0" : page.path === "/demo" ? "0.8" : "0.9";
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderRobotsTxt(): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /sibling/",
    "Disallow: /draft",
    "Disallow: /draft-master",
    "Disallow: /lottery",
    "Disallow: /owner",
    "Disallow: /join/",
    "Disallow: /share/",
    "Disallow: /reset-password",
    "Disallow: /api/",
    "",
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");
}

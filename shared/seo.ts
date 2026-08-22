/** Public site origin — used for canonical URLs, OG tags, sitemap, and robots. */
import { GUIDE_FAQS, type GuideFaq } from "./guides";

export const SITE_ORIGIN = "https://evenkeep.app";

export const DEFAULT_OG_IMAGE = "/marketing/hero-keepsakes.jpg";

export const JSON_LD_SCRIPT_ID = "evenkeep-jsonld";

export type SeoPage = {
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  image?: string;
  ogType?: "website" | "article";
  jsonLd?: unknown;
};

function pageUrl(path: string): string {
  return path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}

function pageImage(page: Pick<SeoPage, "image">): string {
  return `${SITE_ORIGIN}${page.image ?? DEFAULT_OG_IMAGE}`;
}

function faqEntities(faqs: readonly GuideFaq[]) {
  return faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  }));
}

function organizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}/#organization`,
    name: "Evenkeep",
    url: `${SITE_ORIGIN}/`,
    description:
      "Evenkeep is a private, fair process for families dividing belongings — so nobody has to be the judge. $99 one-time per estate.",
    logo: `${SITE_ORIGIN}/favicon.png`,
  };
}

function websiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    name: "Evenkeep",
    url: `${SITE_ORIGIN}/`,
    description:
      "A private, fair process for families dividing a loved one's belongings. Nobody has to be the judge.",
    publisher: { "@id": `${SITE_ORIGIN}/#organization` },
  };
}

function articleGuideJsonLd(page: SeoPage, faqs: readonly GuideFaq[]) {
  const url = pageUrl(page.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: page.ogTitle ?? page.title,
        description: page.description,
        url,
        image: pageImage(page),
        datePublished: "2026-08-19",
        dateModified: "2026-08-19",
        author: { "@id": `${SITE_ORIGIN}/#organization` },
        publisher: { "@id": `${SITE_ORIGIN}/#organization` },
        mainEntityOfPage: url,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqEntities(faqs),
      },
    ],
  };
}

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [organizationJsonLd(), websiteJsonLd()],
};

export const SEO = {
  home: {
    path: "/",
    title: "Evenkeep — The hard part is not the stuff",
    description:
      "Dividing belongings can split a family. What something is worth in dollars is not what it is worth to the person. Evenkeep is a private, fair process: rank what you love, then take turns one item at a time. Nobody has to be the judge. $99 one-time per estate.",
    ogTitle: "Evenkeep — The hard part is not the stuff",
    ogDescription:
      "What it is worth in dollars is not what it is worth to the person. Private lists, a fair order, one item at a time. Free to set up; $99 once to run the draft.",
    jsonLd: homeJsonLd,
  },
  howItWorks: {
    path: "/how-it-works",
    title: "How Evenkeep works — catalog, private ranking, and a fair draft",
    description:
      "A calm walkthrough of how families photograph belongings, privately rank what they love, draw a fair turn order, and take turns one item at a time — so no one has to play judge. Free to set up; $99 once to run the draft.",
    ogTitle: "How Evenkeep works",
    ogDescription:
      "Private lists. A fair order. One item at a time. No one has to play judge. The process does not have to be the fight.",
  },
  forFamilies: {
    path: "/for-families",
    title: "Divide a parent's belongings fairly, without anyone playing judge | Evenkeep",
    description:
      "A private, unhurried way for siblings and executors to divide a parent's belongings fairly — so no one has to play judge. The process does not have to be the fight. Free to set up; $99 once to run the draft.",
    ogTitle: "Divide a parent's belongings fairly, without anyone playing judge",
    ogDescription:
      "For the sibling or executor holding the house this week. Photograph what is left, let everyone rank what they love in private, and let a fair draft do the deciding.",
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
  divideParentsBelongings: {
    path: "/guides/divide-parents-belongings-fairly",
    title: "How to divide a parent's belongings fairly, without a fight | Evenkeep",
    description:
      "A practical guide to dividing inherited household items between siblings — stickers, points, selling, and a private snake draft — without turning grief into a fight.",
    ogTitle: "Divide a parent's belongings fairly, without a fight",
    ogDescription:
      "Methods families already try after a death, and when a private turn-based draft is the kinder way to share what is left.",
    ogType: "article",
    image: "/marketing/hero-keepsakes.jpg",
    jsonLd: articleGuideJsonLd(
      {
        path: "/guides/divide-parents-belongings-fairly",
        title: "How to divide a parent's belongings fairly, without a fight | Evenkeep",
        description:
          "A practical guide to dividing inherited household items between siblings — stickers, points, selling, and a private snake draft — without turning grief into a fight.",
        ogTitle: "Divide a parent's belongings fairly, without a fight",
        image: "/marketing/hero-keepsakes.jpg",
      },
      GUIDE_FAQS.divideParents,
    ),
  },
  siblingsFighting: {
    path: "/guides/siblings-fighting-over-things",
    title: "When siblings start fighting over things | Evenkeep",
    description:
      "What to do when siblings are fighting over inheritance items and household belongings after a death — and how a private ranking plus a fair draft can lower the temperature.",
    ogTitle: "When siblings start fighting over things",
    ogDescription:
      "The fight is rarely about the lamp. A calmer process for families already arguing over what a parent left behind.",
    ogType: "article",
    image: "/marketing/locket.jpg",
    jsonLd: articleGuideJsonLd(
      {
        path: "/guides/siblings-fighting-over-things",
        title: "When siblings start fighting over things | Evenkeep",
        description:
          "What to do when siblings are fighting over inheritance items and household belongings after a death — and how a private ranking plus a fair draft can lower the temperature.",
        ogTitle: "When siblings start fighting over things",
        image: "/marketing/locket.jpg",
      },
      GUIDE_FAQS.siblingsFighting,
    ),
  },
  executorPersonalProperty: {
    path: "/guides/executor-personal-property",
    title: "A calmer way for executors to divide personal property | Evenkeep",
    description:
      "How executors can divide household items without becoming the family judge — catalog, private wishes, and a fair turn order. Not a will and not legal advice.",
    ogTitle: "A calmer way for executors to divide personal property",
    ogDescription:
      "Personal property is often missing from the will. Here is a process you can offer without picking winners.",
    ogType: "article",
    image: "/marketing/table-catalog.jpg",
    jsonLd: articleGuideJsonLd(
      {
        path: "/guides/executor-personal-property",
        title: "A calmer way for executors to divide personal property | Evenkeep",
        description:
          "How executors can divide household items without becoming the family judge — catalog, private wishes, and a fair turn order. Not a will and not legal advice.",
        ogTitle: "A calmer way for executors to divide personal property",
        image: "/marketing/table-catalog.jpg",
      },
      GUIDE_FAQS.executor,
    ),
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
  SEO.divideParentsBelongings,
  SEO.siblingsFighting,
  SEO.executorPersonalProperty,
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
  SEO.divideParentsBelongings,
  SEO.siblingsFighting,
  SEO.executorPersonalProperty,
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

function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function applyJsonLd(html: string, data: unknown | undefined): string {
  const scriptRe = new RegExp(
    `<script[^>]*id="${JSON_LD_SCRIPT_ID}"[^>]*>[\\s\\S]*?<\\/script>`,
    "i",
  );
  if (data == null) {
    return html.replace(scriptRe, "");
  }
  const tag = `<script type="application/ld+json" id="${JSON_LD_SCRIPT_ID}">${serializeJsonLd(data)}</script>`;
  if (scriptRe.test(html)) return html.replace(scriptRe, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

/** Rewrite the SPA index.html so crawlers see per-route title, description, and OG tags. */
export function applySeoToHtml(html: string, page: SeoPage): string {
  const url = pageUrl(page.path);
  const image = pageImage(page);
  const ogTitle = page.ogTitle ?? page.title;
  const ogDescription = page.ogDescription ?? page.description;
  const ogType = page.ogType ?? "website";

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
  out = replaceMeta(out, "property", "og:type", ogType);
  out = replaceMeta(out, "property", "og:url", url);
  out = replaceMeta(out, "property", "og:site_name", "Evenkeep");
  out = replaceMeta(out, "property", "og:image", image);
  out = replaceMeta(out, "name", "twitter:card", "summary_large_image");
  out = replaceMeta(out, "name", "twitter:title", ogTitle);
  out = replaceMeta(out, "name", "twitter:description", ogDescription);
  out = replaceMeta(out, "name", "twitter:image", image);
  out = applyJsonLd(out, page.jsonLd);
  return out;
}

export function renderSitemapXml(lastmod = "2026-08-19"): string {
  const urls = SITEMAP_PAGES.map((page) => {
    const loc = pageUrl(page.path);
    const priority =
      page.path === "/"
        ? "1.0"
        : page.path === "/demo"
          ? "0.8"
          : page.path.startsWith("/guides/")
            ? "0.9"
            : "0.9";
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

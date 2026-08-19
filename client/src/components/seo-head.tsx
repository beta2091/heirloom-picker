import { useEffect } from "react";
import {
  DEFAULT_OG_IMAGE,
  SITE_ORIGIN,
  type SeoPage,
} from "@shared/seo";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/** Sets unique title, description, and Open Graph tags for a public page. */
export function SeoHead({ page }: { page: SeoPage }) {
  useEffect(() => {
    const url = page.path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${page.path}`;
    const image = `${SITE_ORIGIN}${page.image ?? DEFAULT_OG_IMAGE}`;
    const ogTitle = page.ogTitle ?? page.title;
    const ogDescription = page.ogDescription ?? page.description;

    document.title = page.title;
    upsertCanonical(url);
    upsertMeta("name", "description", page.description);
    upsertMeta("property", "og:title", ogTitle);
    upsertMeta("property", "og:description", ogDescription);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:site_name", "Evenkeep");
    upsertMeta("property", "og:image", image);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", ogTitle);
    upsertMeta("name", "twitter:description", ogDescription);
    upsertMeta("name", "twitter:image", image);
  }, [page]);

  return null;
}

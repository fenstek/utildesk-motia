import { getToolContextHints } from "../../shared/toolDetailViewModel.mjs";
import type { RuntimeContentEntry, RuntimeGuideContextEntry, RuntimeLocale, RuntimeToolContextEntry } from "./runtimeContent";

const stringValue = (data: Record<string, unknown>, key: string) => typeof data[key] === "string" ? String(data[key]) : "";
const stringArray = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : [];
const cleanDescription = (value: string) => value
  .replace(/!\[[^\]]*]\([^)]*\)/g, "")
  .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
  .replace(/[`*_>#]/g, "")
  .replace(/(^|\s)-\s+/g, "$1")
  .replace(/\s+/g, " ")
  .trim();
const avatar = (title: string) => {
  const text = title.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="#E8F0FE"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="44" font-weight="700" fill="#1A73E8">${text}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const favicon = (url: string, title: string) => {
  try {
    const parsed = new URL(url);
    return {
      iconUrl: `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(parsed.toString())}`,
      iconFallbacks: [
        `https://icons.duckduckgo.com/ip3/${parsed.hostname}.ico`,
        `${parsed.origin}/favicon.ico`,
        avatar(title),
      ],
    };
  } catch {
    return { iconUrl: null, iconFallbacks: [avatar(title)] };
  }
};

export function runtimeToolEntryLike(entry: RuntimeContentEntry) {
  return {
    slug: entry.slug,
    data: {
      ...entry.metadata,
      editorial_reviewed: entry.editorialReviewed || entry.metadata.editorial_reviewed,
      category: entry.category || entry.metadata.category,
      price_model: entry.priceModel || entry.metadata.price_model,
    },
    content: entry.markdown,
  };
}

export function runtimeToolContextRequest(markdown: string, currentSlug: string) {
  const hints = getToolContextHints(markdown);
  return { slugs: [...new Set([currentSlug, ...hints.slugs])], titles: hints.titles };
}

export function runtimeToolDescription(entry: RuntimeContentEntry, locale: RuntimeLocale) {
  if (locale === "en") return cleanDescription(entry.excerpt);
  return stringValue(entry.metadata, "description")
    || stringValue(entry.metadata, "summary")
    || stringValue(entry.metadata, "excerpt")
    || stringValue(entry.metadata, "tagline")
    || entry.excerpt;
}

export function runtimeDisplayTools(entries: RuntimeToolContextEntry[]) {
  return entries.map((entry) => {
    const data = entry.metadata;
    const title = entry.title;
    const providerUrl = stringValue(data, "affiliate_url") || stringValue(data, "official_url");
    const brandLogo = stringValue(data, "brandLogo");
    const resolved = brandLogo ? { iconUrl: brandLogo, iconFallbacks: [] } : favicon(providerUrl, title);
    return {
      slug: entry.slug,
      title,
      category: entry.category,
      priceModel: entry.priceModel,
      price_model: entry.priceModel,
      tags: stringArray(data.tags),
      excerpt: entry.excerpt,
      ...resolved,
    };
  });
}

export function runtimeGuideBacklinks(guides: RuntimeGuideContextEntry[], slug: string, locale: RuntimeLocale) {
  const prefix = locale === "en" ? "/en/tools/" : "/tools/";
  return guides.flatMap((guide) => {
    const related = Array.isArray(guide.metadata.relatedTools) ? guide.metadata.relatedTools : [];
    const matches = related.some((item) => {
      if (!item || typeof item !== "object") return false;
      const href = typeof (item as Record<string, unknown>).href === "string" ? String((item as Record<string, unknown>).href) : "";
      return href === `${prefix}${slug}/` || href === `/tools/${slug}/` || href === `/en/tools/${slug}/`;
    });
    return matches ? [{ slug: guide.slug, title: guide.title, excerpt: guide.excerpt }] : [];
  }).sort((left, right) => left.slug.localeCompare(right.slug));
}

import { stat } from "node:fs/promises";
import { getEnglishToolMeta } from "./englishContent";
import { getAvatarFallbackDataUrl, getFaviconCandidates } from "./favicon";
import { normalizePriceModel } from "./priceModel";
import { resolveLocalLogo } from "./resolveLogoPath";
import { listActiveToolEntries } from "./toolEntries.mjs";
import toolAddedAtManifest from "../data/tool-added-at.json";

type Locale = "de" | "en";

const toolAddedAtBySlug = toolAddedAtManifest as Record<string, number>;

export type DisplayTool = {
  slug: string;
  title: string;
  category: string | null;
  priceModel: string | null;
  price_model: string | null;
  iconUrl: string | null;
  iconFallbacks: string[];
  tags: string[];
  rawTags: string[];
  excerpt: string;
  description: string;
  addedAtMs: number;
  addedAtOrderMs: number;
  popularity: number;
  fallbackIcon: "ai" | "automation" | "design" | "generic";
};

export const stripMarkdown = (text: string) =>
  text
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[`*_>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const getExcerpt = (content: string) => {
  const paragraphs = content.split(/\n\s*\n/);
  for (const paragraph of paragraphs) {
    if (paragraph.trim().startsWith("#")) continue;
    const cleaned = stripMarkdown(paragraph);
    if (cleaned) return cleaned;
  }
  return "";
};

export const resolveToolFallbackIcon = (category: string | null, tags: string[]) => {
  const normalizedCategory = category ? category.toLowerCase() : "";
  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  const combined = [normalizedCategory, ...normalizedTags].join(" ");

  if (combined.includes("design") || combined.includes("ui") || combined.includes("ux")) {
    return "design";
  }
  if (combined.includes("automation") || combined.includes("workflow")) {
    return "automation";
  }
  if (combined.includes("ai") || combined.includes("ml") || combined.includes("machine")) {
    return "ai";
  }
  return "generic";
};

const readAddedAtInfo = async (entry: any, slug: string) => {
  const createdAt = entry.data.created_at ? String(entry.data.created_at) : "";
  const parsedCreatedAtMs = createdAt ? new Date(createdAt).getTime() : 0;
  const manifestAddedAtMs = Number(toolAddedAtBySlug[slug] || 0);

  let statAddedAtMs = 0;
  try {
    const stats = await stat(entry.sourcePath);
    statAddedAtMs = stats.mtimeMs;
  } catch {
    statAddedAtMs = 0;
  }

  const addedAtMs =
    (Number.isFinite(parsedCreatedAtMs) && parsedCreatedAtMs > 0 ? parsedCreatedAtMs : 0) ||
    manifestAddedAtMs ||
    statAddedAtMs;

  return {
    addedAtMs,
    addedAtOrderMs: statAddedAtMs,
  };
};

export const buildDisplayTool = async (entry: any, locale: Locale = "de"): Promise<DisplayTool> => {
  const slug = String(entry.slug ?? entry.data.slug ?? "");
  const rawTags = Array.isArray(entry.data.tags) ? entry.data.tags.map(String) : [];
  const popularity = entry.data.popularity ? Number(entry.data.popularity) : 0;

  const germanDescription =
    entry.data.description
      ? String(entry.data.description)
      : entry.data.summary
        ? String(entry.data.summary)
        : entry.data.excerpt
          ? String(entry.data.excerpt)
          : entry.data.tagline
            ? String(entry.data.tagline)
            : getExcerpt(entry.content || "");

  const englishMeta = locale === "en" ? getEnglishToolMeta(entry) : null;
  const title = englishMeta?.title ?? String(entry.data.title ?? slug);
  const category = englishMeta?.category ?? (entry.data.category ? String(entry.data.category) : null);
  const priceModel = englishMeta?.priceModel ?? normalizePriceModel(entry.data.price_model);
  const tags = englishMeta?.tags ?? rawTags;
  const description = englishMeta?.description ?? germanDescription;

  const affiliateUrl = entry.data.affiliate_url ? String(entry.data.affiliate_url) : null;
  const officialUrl = entry.data.official_url ? String(entry.data.official_url) : null;
  const providerUrl = affiliateUrl || officialUrl;
  const brandLogo = entry.data.brandLogo ? String(entry.data.brandLogo) : null;
  const localLogo = resolveLocalLogo(slug);
  const faviconCandidates = getFaviconCandidates(providerUrl, 128);
  const faviconLogo = faviconCandidates[0] ?? null;
  const iconUrl = brandLogo || localLogo || faviconLogo;
  const iconFallbacks =
    brandLogo || localLogo || !faviconLogo
      ? []
      : [...faviconCandidates.slice(1), getAvatarFallbackDataUrl(title)];
  const addedAtInfo = await readAddedAtInfo(entry, slug);

  return {
    slug,
    title,
    category,
    priceModel,
    price_model: priceModel,
    iconUrl,
    iconFallbacks,
    tags,
    rawTags,
    excerpt: description,
    description,
    addedAtMs: addedAtInfo.addedAtMs,
    addedAtOrderMs: addedAtInfo.addedAtOrderMs,
    popularity,
    fallbackIcon: resolveToolFallbackIcon(category, tags),
  };
};

export const listDisplayTools = async (locale: Locale = "de") => {
  const globalCache = globalThis as typeof globalThis & {
    __utildeskDisplayToolsCache?: Map<Locale, Promise<DisplayTool[]>>;
  };

  if (!globalCache.__utildeskDisplayToolsCache) {
    globalCache.__utildeskDisplayToolsCache = new Map();
  }

  const cached = globalCache.__utildeskDisplayToolsCache.get(locale);
  if (cached) return cached;

  const promise = (async () => {
    const entries = await listActiveToolEntries();
    return Promise.all(entries.map((entry) => buildDisplayTool(entry, locale)));
  })();

  globalCache.__utildeskDisplayToolsCache.set(locale, promise);
  return promise;
};

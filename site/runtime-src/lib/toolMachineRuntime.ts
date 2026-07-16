import toolAddedAtManifest from "../../src/data/tool-added-at.json";
import { getAvatarFallbackDataUrl, getFaviconCandidates } from "../../src/lib/favicon";
import {
  buildMarkdownFrontmatter,
  extractFeatureList,
  getWordCountFromMarkdown,
} from "../../src/lib/machineReadable";
import { normalizePriceModel } from "../../src/lib/priceModel";
import { translateLabel, translatePriceModel, translateTags } from "../../src/lib/englishContent";
import { normalizeToolEditorialVerdict } from "../../src/lib/toolVerdict";
import { classifyToolEntry, isCuratedToolEntry, stripTemplateBoilerplate } from "../../src/lib/toolQuality.mjs";
import type { RuntimeContentEntry, RuntimeLocale } from "./runtimeContent";
import { runtimeToolDescription, runtimeToolEntryLike } from "./toolRuntime";

const SITE_URL = "https://tools.utildesk.de";
const SITE_NAME = "Utildesk";
const LOCAL_LOGOS = new Map([
  ["botpress", "png"], ["endnote", "png"], ["interpretml", "png"],
  ["jovian", "png"], ["looker-studio", "png"], ["marvel", "png"],
  ["slick-write", "png"], ["storymapjs", "png"], ["theia", "png"],
]);

const stringValue = (data: Record<string, unknown>, key: string) => data[key] == null ? "" : String(data[key]);
const stringArray = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : [];
const parseDateMs = (value: unknown) => {
  const parsed = value ? new Date(String(value)).getTime() : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};
const fallbackIcon = (category: string | null, tags: string[]) => {
  const combined = [category ?? "", ...tags].join(" ").toLowerCase();
  if (/design|\bui\b|\bux\b/.test(combined)) return "design";
  if (/automation|workflow/.test(combined)) return "automation";
  if (/\bai\b|\bml\b|machine/.test(combined)) return "ai";
  return "generic";
};

function curatedContent(entry: RuntimeContentEntry, primaryEntry: RuntimeContentEntry = entry) {
  const entryLike = runtimeToolEntryLike(entry);
  const primaryEntryLike = runtimeToolEntryLike(primaryEntry);
  const quality = classifyToolEntry(primaryEntryLike);
  const curated = isCuratedToolEntry(primaryEntryLike, quality);
  return {
    entryLike,
    quality,
    curated,
    content: curated ? entry.markdown : stripTemplateBoilerplate(entry.markdown),
  };
}

export function buildRuntimeDisplayTool(entry: RuntimeContentEntry, locale: RuntimeLocale, primaryEntry: RuntimeContentEntry = entry) {
  const data = entry.metadata;
  const primaryData = primaryEntry.metadata;
  const rawTags = stringArray(primaryData.tags);
  const tags = locale === "en" && !Array.isArray(data.tags) ? translateTags(rawTags) : stringArray(data.tags);
  const title = entry.title;
  const description = runtimeToolDescription(entry, locale);
  const category = entry.category || stringValue(data, "category")
    || (locale === "en" ? translateLabel(primaryEntry.category || stringValue(primaryData, "category")) : "")
    || null;
  const normalizedPriceModel = normalizePriceModel(entry.priceModel || data.price_model || primaryEntry.priceModel || primaryData.price_model);
  const priceModel = locale === "en" ? translatePriceModel(normalizedPriceModel) : normalizedPriceModel;
  const providerUrl = stringValue(primaryData, "affiliate_url") || stringValue(primaryData, "official_url") || stringValue(data, "affiliate_url") || stringValue(data, "official_url") || null;
  const brandLogo = stringValue(primaryData, "brandLogo") || stringValue(data, "brandLogo") || null;
  const localLogoExtension = LOCAL_LOGOS.get(entry.slug);
  const localLogo = localLogoExtension ? `/images/logos/${entry.slug}.${localLogoExtension}` : null;
  const candidates = getFaviconCandidates(providerUrl, 128);
  const iconUrl = brandLogo || localLogo || candidates[0] || null;
  const iconFallbacks = brandLogo || localLogo || !candidates[0]
    ? []
    : [...candidates.slice(1), getAvatarFallbackDataUrl(title)];
  const addedAtMs = Number((toolAddedAtManifest as Record<string, number>)[entry.slug] || 0)
    || parseDateMs(primaryData.created_at || primaryData.createdAt || primaryData.generated_at);
  return {
    slug: entry.slug,
    title,
    category,
    priceModel,
    price_model: priceModel,
    iconUrl,
    iconFallbacks,
    editorialImage: primaryEntry.illustrationPath || entry.illustrationPath,
    tags,
    rawTags,
    excerpt: description,
    description,
    addedAtMs,
    addedAtOrderMs: addedAtMs,
    popularity: primaryEntry.popularity,
    editorialVerdict: primaryData.editorial_verdict ? normalizeToolEditorialVerdict(primaryData.editorial_verdict) : null,
    fallbackIcon: fallbackIcon(category, tags),
  };
}

export function buildRuntimeHomeTool(entry: RuntimeContentEntry, locale: RuntimeLocale, primaryEntry: RuntimeContentEntry = entry) {
  const display = buildRuntimeDisplayTool(entry, locale, primaryEntry);
  const data = primaryEntry.metadata;
  const providerUrl = stringValue(data, "affiliate_url") || stringValue(data, "official_url") || null;
  let providerHost: string | null = null;
  try { providerHost = providerUrl ? new URL(providerUrl).hostname.replace(/^www\./, "") : null; } catch { providerHost = null; }
  const contentImage = primaryEntry.markdown.match(/!\[[^\]]*]\(([^)]+)\)/)?.[1]?.trim() || null;
  const homeCardImage = stringValue(data, "homeImage") || stringValue(data, "image") || stringValue(data, "icon") || contentImage || null;
  return {
    ...display,
    rawCategory: primaryEntry.category,
    rawTags: stringArray(primaryEntry.metadata.tags),
    homeCardImage,
    homeCardLogo: display.iconUrl,
    homeCardLogoFallbacks: display.iconFallbacks,
    providerHost,
  };
}

export function buildRuntimeRatgeberPageEntry(entry: RuntimeContentEntry) {
  return {
    slug: entry.slug,
    data: {
      ...entry.metadata,
      title: entry.title,
      excerpt: entry.excerpt,
    },
    content: entry.markdown,
  };
}

export function buildRuntimeToolCatalog(entries: RuntimeContentEntry[], locale: RuntimeLocale, generatedAt: string, primaryEntries: RuntimeContentEntry[] = entries) {
  const prefix = locale === "en" ? "/en" : "";
  const primaryBySlug = new Map(primaryEntries.map((entry) => [entry.slug, entry]));
  return {
    version: 1,
    site: SITE_NAME,
    siteUrl: `${SITE_URL}${locale === "en" ? "/en/" : ""}`,
    ...(locale === "en" ? { language: "en" } : {}),
    generatedAt,
    count: entries.length,
    items: entries.map((entry) => buildRuntimeDisplayTool(entry, locale, primaryBySlug.get(entry.slug) ?? entry)),
  };
}

export function buildRuntimeToolJson(entry: RuntimeContentEntry, locale: RuntimeLocale, primaryEntry: RuntimeContentEntry = entry) {
  const { quality, curated, content } = curatedContent(entry, primaryEntry);
  const serializedContent = locale === "de" && curated ? `${content}\n` : content;
  const data = entry.metadata;
  const primaryData = primaryEntry.metadata;
  const prefix = locale === "en" ? "/en" : "";
  const canonicalUrl = `${SITE_URL}${prefix}/tools/${entry.slug}/`;
  const markdownUrl = `${SITE_URL}${prefix}/markdown/tools/${entry.slug}.md`;
  const normalizedPrice = normalizePriceModel(entry.priceModel || data.price_model || primaryEntry.priceModel || primaryData.price_model);
  const priceModel = locale === "en" ? translatePriceModel(normalizedPrice) : normalizedPrice;
  const officialUrl = stringValue(primaryData, "official_url") || stringValue(data, "official_url") || null;
  const affiliateUrl = stringValue(primaryData, "affiliate_url") || stringValue(data, "affiliate_url") || null;
  return {
    version: 1,
    type: "tool",
    canonicalUrl,
    markdownUrl,
    ...(locale === "en" ? { language: "en" } : {}),
    data: locale === "en" ? {
      slug: entry.slug,
      title: entry.title,
      category: entry.category || stringValue(data, "category") || null,
      priceModel,
      tags: stringArray(data.tags),
      description: runtimeToolDescription(entry, locale),
      officialUrl,
      affiliateUrl,
      tier: quality.tier,
      editorialStatus: curated ? "curated" : "automatic",
      wordCount: getWordCountFromMarkdown(content),
      contentMarkdown: serializedContent,
    } : {
      slug: entry.slug,
      title: entry.title,
      url: canonicalUrl,
      category: entry.category || stringValue(data, "category") || null,
      priceModel,
      tags: stringArray(data.tags),
      description: runtimeToolDescription(entry, locale),
      officialUrl,
      affiliateUrl,
      inLanguage: "de-DE",
      tier: quality.tier,
      editorialStatus: curated ? "curated" : "automatic",
      featureList: extractFeatureList(content),
      wordCount: getWordCountFromMarkdown(content),
      contentMarkdown: serializedContent,
    },
  };
}

export function buildRuntimeToolMarkdown(entry: RuntimeContentEntry, locale: RuntimeLocale, primaryEntry: RuntimeContentEntry = entry) {
  const payload = buildRuntimeToolJson(entry, locale, primaryEntry);
  const data = payload.data;
  const automaticNotice = locale === "en"
    ? [
      "> This entry was generated automatically from public provider information and has not been editorially reviewed.",
      "> For curated context, see our guides: https://tools.utildesk.de/en/ratgeber/",
    ]
    : [
      "> Dieser Eintrag wurde automatisch aus öffentlichen Anbieterinformationen erstellt und nicht redaktionell geprüft.",
      "> Für eine kuratierte Einordnung siehe unsere Ratgeber: https://tools.utildesk.de/ratgeber/",
    ];
  const content = data.editorialStatus === "curated"
    ? String(data.contentMarkdown).trim()
    : [...automaticNotice, "", String(data.contentMarkdown).trim()].join("\n");
  const frontmatter = locale === "en" ? {
    slug: data.slug,
    title: data.title,
    language: "en",
    canonicalUrl: payload.canonicalUrl,
    category: data.category,
    priceModel: data.priceModel,
    tags: data.tags,
    officialUrl: data.officialUrl || undefined,
    affiliateUrl: data.affiliateUrl || undefined,
    tier: data.tier,
    editorialStatus: data.editorialStatus,
  } : {
    title: data.title,
    slug: data.slug,
    url: payload.canonicalUrl,
    category: data.category,
    priceModel: data.priceModel,
    officialUrl: data.officialUrl || undefined,
    affiliateUrl: data.affiliateUrl || undefined,
    tier: data.tier,
    editorialStatus: data.editorialStatus,
    tags: data.tags,
    description: data.description,
    featureList: "featureList" in data ? data.featureList : [],
  };
  const serialized = locale === "en"
    ? [buildMarkdownFrontmatter(frontmatter), content].join("\n")
    : [buildMarkdownFrontmatter(frontmatter), content, ""].join("\n");
  return serialized;
}

export function machineResponse(request: Request, body: string, contentType: string, etag: string, extraHeaders: HeadersInit = {}) {
  const headers = new Headers({
    "Content-Type": contentType,
    "X-Robots-Tag": "noindex",
    "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    ETag: etag,
    ...extraHeaders,
  });
  if (request.headers.get("If-None-Match") === etag) return new Response(null, { status: 304, headers });
  return new Response(body, { headers });
}

export function runtimeEntryIsPublic(entry: RuntimeContentEntry | null): entry is RuntimeContentEntry {
  return Boolean(entry?.isActive && entry.routeState === "active");
}

export function unavailableMachineResponse(entry: RuntimeContentEntry | null) {
  return new Response("Not found", {
    status: entry?.routeState === "tombstone" ? 410 : 404,
    headers: {
      "X-Robots-Tag": "noindex",
      ...(entry?.routeState ? { "X-Utildesk-Route-State": entry.routeState } : {}),
    },
  });
}

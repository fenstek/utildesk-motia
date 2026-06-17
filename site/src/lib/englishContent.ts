import { marked } from "marked";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { fromContent } from "./contentRoot.mjs";
import { stripMarkdown } from "./machineReadable";
import { normalizePriceModel } from "./priceModel";

export const CATEGORY_EN: Record<string, { title: string; description: string }> = {
  "ai-chatbots": {
    title: "Chatbots & Assistants",
    description: "AI chatbots, language models and assistants for conversations, research and daily work.",
  },
  "schreiben-content": {
    title: "Writing & Content",
    description: "Tools for writing, editing, content generation and structured communication with AI.",
  },
  "design-kreativ": {
    title: "Design & Creativity",
    description: "AI tools for visual design, image generation, creative workflows and production assets.",
  },
  "audio-video": {
    title: "Audio & Video",
    description: "AI-assisted audio and video tools for editing, generation, transcription and media workflows.",
  },
  produktivitaet: {
    title: "Productivity",
    description: "Tools that help teams plan, write, organize, automate and move faster in everyday work.",
  },
  "entwickler-tools": {
    title: "Developer Tools",
    description: "AI tools for developers, coding assistants, APIs, DevOps and software delivery workflows.",
  },
  automatisierung: {
    title: "Automation",
    description: "Workflow automation tools for integrations, recurring processes and operational handoffs.",
  },
  "marketing-vertrieb": {
    title: "Marketing & Sales",
    description: "AI tools for SEO, content marketing, campaigns, CRM, ads and sales automation.",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  produktivitaet: "Productivity",
  produktivität: "Productivity",
  schreiben: "Writing",
  content: "Content",
  audio: "Audio",
  video: "Video",
  design: "Design",
  marketing: "Marketing",
  vertrieb: "Sales",
  automatisierung: "Automation",
  automation: "Automation",
  entwickler: "Developer Tools",
  "developer tools": "Developer Tools",
  vergleich: "Comparison",
  anleitung: "Guide",
  einordnung: "Analysis",
  workflow: "Workflow",
};

const PRICE_LABELS: Record<string, string> = {
  Kostenlos: "Free",
  Freemium: "Freemium",
  Kostenpflichtig: "Paid",
  "Open Source": "Open Source",
  Abonnement: "Subscription",
  Nutzungsbasiert: "Usage-based",
  Einmalzahlung: "One-time purchase",
  "Individuelles Angebot": "Custom quote",
  "Je nach Plan": "Plan-based",
  Testversion: "Trial",
  "Auf Anfrage": "On request",
};

const TAG_LABELS: Record<string, string> = {
  "ki-agenten": "AI agents",
  "ki-assistenten": "AI assistants",
  "ki-orchestrierung": "AI orchestration",
  softwareentwicklung: "software development",
  produktivitaet: "productivity",
  produktivität: "productivity",
  webstrategie: "web strategy",
};

type ToolEntryLike = { slug: string; data: Record<string, any>; content: string };
type EnglishToolTranslation = {
  data: Record<string, any>;
  content: string;
};

const EN_TOOLS_DIR = fromContent("en", "tools");
const englishToolTranslationCache = new Map<string, EnglishToolTranslation | null>();

const getEnglishToolTranslation = (slug: string): EnglishToolTranslation | null => {
  if (englishToolTranslationCache.has(slug)) {
    return englishToolTranslationCache.get(slug) ?? null;
  }

  const filePath = join(EN_TOOLS_DIR, `${slug}.md`);
  if (!existsSync(filePath)) {
    englishToolTranslationCache.set(slug, null);
    return null;
  }

  const parsed = matter(readFileSync(filePath, "utf8"));
  const translation = {
    data: parsed.data as Record<string, any>,
    content: parsed.content.trim(),
  };
  englishToolTranslationCache.set(slug, translation);
  return translation;
};

export const hasEnglishToolTranslation = (slug: string) =>
  getEnglishToolTranslation(slug) !== null;

export const categoryTitleEn = (slug: string, fallback?: string) =>
  CATEGORY_EN[slug]?.title ?? translateLabel(fallback ?? slug);

export const categoryDescriptionEn = (slug: string, fallback?: string) =>
  CATEGORY_EN[slug]?.description ?? translateLabel(fallback ?? slug);

export const translateLabel = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const key = raw.toLowerCase();
  return CATEGORY_LABELS[key] ?? TAG_LABELS[key] ?? raw;
};

export const translatePriceModel = (value?: string | null) => {
  const normalized = normalizePriceModel(value);
  return normalized ? PRICE_LABELS[normalized] ?? normalized : "";
};

export const translateTags = (tags: string[] = []) =>
  tags
    .map((tag) => translateLabel(tag))
    .filter(Boolean)
    .filter((tag, index, list) => list.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index);

const cleanSentence = (value: string) =>
  stripMarkdown(value)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

const joinHumanList = (items: string[]) => {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  if (cleaned.length <= 1) return cleaned[0] ?? "";
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(", ")} and ${cleaned[cleaned.length - 1]}`;
};

const formatFocusTag = (tag: string) => {
  const normalized = tag.trim().toLowerCase();
  const special: Record<string, string> = {
    ai: "AI",
    "ai-agents": "AI agents",
    automl: "AutoML",
    api: "API",
    crm: "CRM",
    "customer-support": "customer support",
    "developer-tools": "developer tools",
    llm: "LLM",
    "machine-learning": "machine learning",
    "no-code": "no-code",
    seo: "SEO",
    "social-media": "social media",
    "text-to-speech": "text to speech",
    ux: "UX",
    ui: "UI",
  };
  return special[normalized] ?? normalized.replace(/-/g, " ");
};

const buildHumanFallbackDescription = (title: string, category: string, tags: string[], priceModel: string) => {
  const focus = tags
    .filter((tag) => tag.toLowerCase() !== "ai")
    .slice(0, 4)
    .map(formatFocusTag);
  const focusText = focus.length
    ? joinHumanList(focus)
    : category
      ? `${category.toLowerCase()} workflows`
      : "AI-assisted workflows";
  const categoryHint = category ? ` for ${category.toLowerCase()} teams` : "";
  const pricingHint = priceModel ? ` The listed pricing model is ${priceModel.toLowerCase()}.` : "";

  return `${title} helps${categoryHint} evaluate ${focusText}.${pricingHint}`;
};

export const getEnglishToolMeta = (entry: ToolEntryLike) => {
  const translation = getEnglishToolTranslation(entry.slug);
  if (translation) {
    const title = String(translation.data.title ?? entry.data.title ?? entry.slug).trim();
    const category = translation.data.category
      ? String(translation.data.category)
      : translateLabel(entry.data.category ? String(entry.data.category) : "");
    const priceModel = translation.data.price_model
      ? translatePriceModel(String(translation.data.price_model)) || String(translation.data.price_model).trim()
      : translatePriceModel(entry.data.price_model ? String(entry.data.price_model) : "");
    const tags = Array.isArray(translation.data.tags)
      ? translation.data.tags.map(String).filter(Boolean)
      : translateTags(Array.isArray(entry.data.tags) ? entry.data.tags.map(String) : []);
    const officialUrl = entry.data.official_url ? String(entry.data.official_url) : "";
    const affiliateUrl = entry.data.affiliate_url ? String(entry.data.affiliate_url) : "";
    const firstParagraph = cleanSentence(
      translation.data.description
        ? String(translation.data.description)
        : translation.content.split(/\n\s*\n/).find((paragraph) => !paragraph.trim().startsWith("#")) ?? "",
    );
    const description = firstParagraph || `${title} in the Utildesk AI tools directory.`;

    return {
      title,
      category,
      priceModel,
      tags,
      officialUrl,
      affiliateUrl,
      targetUrl: affiliateUrl || officialUrl,
      description,
      metaDescription: description.length > 158 ? `${description.slice(0, 155).trimEnd()}...` : description,
    };
  }

  const title = String(entry.data.title ?? entry.slug).trim();
  const category = translateLabel(entry.data.category ? String(entry.data.category) : "");
  const priceModel = translatePriceModel(entry.data.price_model ? String(entry.data.price_model) : "");
  const tags = translateTags(Array.isArray(entry.data.tags) ? entry.data.tags.map(String) : []);
  const officialUrl = entry.data.official_url ? String(entry.data.official_url) : "";
  const affiliateUrl = entry.data.affiliate_url ? String(entry.data.affiliate_url) : "";
  const description = buildHumanFallbackDescription(title, category, tags, priceModel);

  return {
    title,
    category,
    priceModel,
    tags,
    officialUrl,
    affiliateUrl,
    targetUrl: affiliateUrl || officialUrl,
    description,
    metaDescription: description.length > 158 ? `${description.slice(0, 155).trimEnd()}...` : description,
  };
};

export const extractAlternativeNames = (content: string, maxItems = 5) => {
  const match = String(content ?? "").match(
    /(?:^|\n)#{2,3}\s+(?:Alternativen|Alternatives?)[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s|\s*$)/i,
  );
  if (!match) return [];
  return (match[1].match(/^\s*[-*]\s+(.+)$/gm) ?? [])
    .map((line) =>
      cleanSentence(line.replace(/^\s*[-*]\s+/, "").replace(/^\*\*([^*]+)\*\*.*$/, "$1"))
        .replace(/[:：]\s*$/, ""),
    )
    .filter(Boolean)
    .slice(0, maxItems);
};

export const buildEnglishToolFeatureList = (entry: ToolEntryLike) => {
  const meta = getEnglishToolMeta(entry);
  const focusTags = meta.tags.filter((tag) => tag.toLowerCase() !== "ai").slice(0, 4);
  const focusText = focusTags.length ? joinHumanList(focusTags.map(formatFocusTag)) : meta.category || "AI work";

  return [
    `${meta.title} is useful for ${focusText}.`,
    `The key signals are category, pricing model, tags and provider link.`,
    `It is worth a closer look when those signals match your actual workflow.`,
    `Compare ${meta.title} with neighbouring tools before committing to a setup.`,
  ];
};

export const buildEnglishToolMarkdown = (entry: ToolEntryLike) => {
  const translation = getEnglishToolTranslation(entry.slug);
  if (translation?.content) {
    return translation.content;
  }
  throw new Error(`Missing English translation for tool: ${entry.slug}`);
};

export const buildEnglishToolHtml = (entry: ToolEntryLike) =>
  String(marked.parse(buildEnglishToolMarkdown(entry)));

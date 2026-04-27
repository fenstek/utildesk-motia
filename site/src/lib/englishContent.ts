import { marked } from "marked";
import { existsSync, readFileSync } from "node:fs";
import matter from "gray-matter";
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

const EN_TOOLS_DIR = new URL("../../../content/en/tools/", import.meta.url);
const englishToolTranslationCache = new Map<string, EnglishToolTranslation | null>();

const getEnglishToolTranslation = (slug: string): EnglishToolTranslation | null => {
  if (englishToolTranslationCache.has(slug)) {
    return englishToolTranslationCache.get(slug) ?? null;
  }

  const fileUrl = new URL(`${slug}.md`, EN_TOOLS_DIR);
  if (!existsSync(fileUrl)) {
    englishToolTranslationCache.set(slug, null);
    return null;
  }

  const parsed = matter(readFileSync(fileUrl, "utf8"));
  const translation = {
    data: parsed.data as Record<string, any>,
    content: parsed.content.trim(),
  };
  englishToolTranslationCache.set(slug, translation);
  return translation;
};

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

const indefiniteArticle = (value: string) => (/^[aeiou]/i.test(value) ? "an" : "a");

export const getEnglishToolMeta = (entry: ToolEntryLike) => {
  const translation = getEnglishToolTranslation(entry.slug);
  if (translation) {
    const title = String(translation.data.title ?? entry.data.title ?? entry.slug).trim();
    const category = translation.data.category
      ? String(translation.data.category)
      : translateLabel(entry.data.category ? String(entry.data.category) : "");
    const priceModel = translation.data.price_model
      ? normalizePriceModel(String(translation.data.price_model)) || String(translation.data.price_model)
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
  const focus = tags.filter((tag) => tag.toLowerCase() !== "ai").slice(0, 4);
  const focusText = focus.length ? focus.join(", ") : category || "AI-assisted work";
  const categoryPhrase = category
    ? category.toLowerCase() === "ai"
      ? "an AI tool"
      : `${indefiniteArticle(category)} ${category.toLowerCase()} tool`
    : "an AI tool";
  const description = `${title} is listed on Utildesk as ${categoryPhrase} for ${focusText}. Use this English overview to compare the tool, pricing signal and likely workflow fit before opening the provider website.`;

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
  const focusText = focusTags.length ? focusTags.join(", ") : meta.category || "AI workflow";

  return [
    `${meta.title} is grouped for ${focusText} workflows in the Utildesk English catalogue.`,
    `The entry keeps category, pricing signal, tags and provider link together for quick comparison.`,
    `Use it as a shortlist checkpoint before opening the external provider website.`,
    `Compare ${meta.title} with neighbouring tools by category, tags and practical workflow fit.`,
  ];
};

export const buildEnglishToolMarkdown = (entry: ToolEntryLike) => {
  const translation = getEnglishToolTranslation(entry.slug);
  if (translation?.content) {
    return translation.content;
  }

  const meta = getEnglishToolMeta(entry);
  const focusTags = meta.tags.filter((tag) => tag.toLowerCase() !== "ai").slice(0, 5);
  const features = buildEnglishToolFeatureList(entry);
  const alternatives = extractAlternativeNames(entry.content, 5);
  const targetUrl = meta.targetUrl;

  const lines = [
    `## What is ${meta.title}?`,
    "",
    meta.description,
    "",
    `${meta.title} is part of the Utildesk English catalogue. The goal is not to mirror every marketing claim, but to make the tool understandable in a practical buying and workflow context.`,
    "",
    "## Best fit",
    "",
    `Use ${meta.title} when you are comparing tools for ${focusTags.length ? focusTags.join(", ") : meta.category || "AI work"}. It is most useful as a quick evaluation entry: check the category, pricing signal, related tags and provider link before deciding whether it deserves a deeper trial.`,
    "",
    "## Quick signals",
    "",
    `- Category: ${meta.category || "AI tool"}`,
    `- Pricing signal: ${meta.priceModel || "Not specified"}`,
    `- Tags: ${focusTags.length ? focusTags.join(", ") : "AI, productivity, workflow"}`,
    "",
    "## Evaluation notes",
    "",
    ...features.map((feature) => `- ${feature}`),
    "",
    "## Typical use cases",
    "",
    `- Shortlist ${meta.title} while comparing tools in the ${meta.category || "AI"} category.`,
    "- Check whether the pricing model fits a personal, team or enterprise workflow.",
    "- Compare the tags against your actual work: research, writing, automation, coding, audio, video or operations.",
    "- Open the provider page only after the tool passes this quick contextual filter.",
  ];

  if (targetUrl) {
    lines.push("", "## Provider link", "", `[Open ${meta.title}](${targetUrl})`);
  }

  if (alternatives.length) {
    lines.push("", "## Related alternatives", "");
    alternatives.forEach((name) => lines.push(`- ${name}`));
  }

  return lines.join("\n");
};

export const buildEnglishToolHtml = (entry: ToolEntryLike) =>
  String(marked.parse(buildEnglishToolMarkdown(entry)));

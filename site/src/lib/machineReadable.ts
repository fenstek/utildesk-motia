import { SITE_LANGUAGE, SITE_NAME, SITE_URL, toAbsoluteUrl } from "./siteMeta";

export function stripMarkdown(text: string) {
  return String(text ?? "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getExcerptFromMarkdown(content: string) {
  const paragraphs = String(content ?? "").split(/\n\s*\n/);
  for (const paragraph of paragraphs) {
    if (paragraph.trim().startsWith("#")) continue;
    const cleaned = stripMarkdown(paragraph);
    if (cleaned) return cleaned;
  }
  return "";
}

export function getWordCountFromMarkdown(content: string) {
  const plain = stripMarkdown(content);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

export function extractFeatureList(content: string, maxItems = 8) {
  const sectionMatch = String(content ?? "").match(
    /(?:^|\n)#{2,3}\s+(Hauptfunktionen|Features?|Funktionen)\b[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s|\s*$)/i
  );

  const source = sectionMatch?.[2] ?? String(content ?? "");
  const rawItems = source.match(/^\s*[-*]\s+(.+)$/gm) ?? [];

  return rawItems
    .map((item) => item.replace(/^\s*[-*]\s+/, "").trim())
    .map((item) => stripMarkdown(item))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function mapToolCategoryToSchemaCategory(
  category: string | null,
  tags: string[]
) {
  const combined = [String(category ?? ""), ...tags].join(" ").toLowerCase();

  if (
    /\b(code|developer|devops|api|sdk|terminal|ide|programming|softwareentwicklung)\b/.test(
      combined
    )
  ) {
    return "DeveloperApplication";
  }
  if (/\bdesign|ui|ux|bild|image|video|audio|multimedia\b/.test(combined)) {
    return "DesignApplication";
  }
  if (/\bkommunikation|chat|meeting|email|support|assistenz|assistant\b/.test(combined)) {
    return "CommunicationApplication";
  }
  if (/\bautomation|workflow|agent|orchestr|zap|prozess\b/.test(combined)) {
    return "BusinessApplication";
  }
  if (/\bfinance|buchhaltung|rechnung|billing\b/.test(combined)) {
    return "FinanceApplication";
  }
  if (/\bsecurity|privacy|compliance|monitoring\b/.test(combined)) {
    return "SecurityApplication";
  }
  if (/\beducation|lernen|study|research\b/.test(combined)) {
    return "EducationalApplication";
  }

  return "UtilitiesApplication";
}

export function buildOfferFromPriceModel(priceModel: string | null) {
  const normalized = String(priceModel ?? "").trim();
  if (!normalized) return undefined;

  const freeish = new Set(["Kostenlos", "Freemium", "Open Source"]);
  if (freeish.has(normalized)) {
    return {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      category: normalized,
    };
  }

  return {
    "@type": "Offer",
    priceSpecification: {
      "@type": "PriceSpecification",
      priceCurrency: "EUR",
      valueAddedTaxIncluded: false,
      description: normalized,
    },
      availability: "https://schema.org/InStock",
      category: normalized,
  };
}

export function buildToolCatalogItem(entry: {
  slug: string;
  data: Record<string, any>;
  content: string;
}) {
  const slug = String(entry.slug);
  const title = String(entry.data.title ?? slug).trim();
  const category = entry.data.category ? String(entry.data.category) : null;
  const tags = Array.isArray(entry.data.tags) ? entry.data.tags.map(String) : [];
  const priceModel = entry.data.price_model ? String(entry.data.price_model) : null;
  const officialUrl = entry.data.official_url ? String(entry.data.official_url) : null;
  const affiliateUrl = entry.data.affiliate_url ? String(entry.data.affiliate_url) : null;
  const description =
    entry.data.description
      ? String(entry.data.description)
      : entry.data.summary
        ? String(entry.data.summary)
        : entry.data.excerpt
          ? String(entry.data.excerpt)
          : entry.data.tagline
            ? String(entry.data.tagline)
            : getExcerptFromMarkdown(entry.content);

  return {
    slug,
    title,
    url: toAbsoluteUrl(`/tools/${slug}/`),
    category,
    priceModel,
    tags,
    description,
    officialUrl,
    affiliateUrl,
    inLanguage: SITE_LANGUAGE,
  };
}

export function buildRatgeberCatalogItem(entry: {
  slug: string;
  data: Record<string, any>;
  content: string;
}) {
  const slug = String(entry.slug);
  const title = String(entry.data.title ?? slug).trim();
  const tags = Array.isArray(entry.data.tags) ? entry.data.tags.map(String) : [];
  const relatedTools = Array.isArray(entry.data.relatedTools)
    ? entry.data.relatedTools
        .map((tool: { title?: unknown; href?: unknown }) => ({
          title: String(tool?.title ?? "").trim(),
          href: String(tool?.href ?? "").trim(),
        }))
        .filter((tool) => tool.title && tool.href)
    : [];

  return {
    slug,
    title,
    url: toAbsoluteUrl(`/ratgeber/${slug}/`),
    excerpt: String(entry.data.excerpt ?? getExcerptFromMarkdown(entry.content)),
    date: entry.data.date ? String(entry.data.date) : null,
    readTime: entry.data.readTime ? Number(entry.data.readTime) : null,
    category: entry.data.category ? String(entry.data.category) : null,
    eyebrow: entry.data.eyebrow ? String(entry.data.eyebrow) : null,
    coverImage: entry.data.coverImage ? toAbsoluteUrl(String(entry.data.coverImage)) : null,
    tags,
    relatedTools: relatedTools.map((tool) => ({
      title: tool.title,
      href: tool.href.startsWith("http") ? tool.href : toAbsoluteUrl(tool.href),
    })),
    wordCount: getWordCountFromMarkdown(entry.content),
    inLanguage: SITE_LANGUAGE,
    publisher: SITE_NAME,
  };
}

export function buildMarkdownFrontmatter(data: Record<string, unknown>) {
  const lines = ["---"];

  for (const [key, value] of Object.entries(data)) {
    if (value == null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}:`);
      value.forEach((item) => {
        if (item && typeof item === "object") {
          lines.push(`  - ${JSON.stringify(item)}`);
        } else {
          lines.push(`  - ${JSON.stringify(String(item))}`);
        }
      });
      continue;
    }

    if (typeof value === "object") {
      lines.push(`${key}: ${JSON.stringify(value)}`);
      continue;
    }

    lines.push(`${key}: ${JSON.stringify(value)}`);
  }

  lines.push("---", "");
  return lines.join("\n");
}

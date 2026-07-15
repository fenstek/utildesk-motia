import { marked } from "marked";
import { classifyToolEntry, isCuratedToolEntry, stripTemplateBoilerplate } from "../src/lib/toolQuality.mjs";

export const TOOL_SITE_URL = "https://tools.utildesk.de";

const asString = (value) => value == null ? "" : String(value).trim();
const unique = (values) => [...new Set(values.filter(Boolean))];
const normalizeName = (value) => asString(value)
  .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
  .replace(/[`*_]/g, "")
  .replace(/[:\uFF1A]\s*$/g, "")
  .replace(/\s+/g, " ")
  .toLowerCase();
const normalizeNameFuzzy = (value) => normalizeName(value)
  .replace(/\([^)]*\)/g, " ")
  .replace(/\b(ai|tool|app|platform)\b/g, " ")
  .replace(/\s+/g, " ")
  .trim();
const stripMarkdown = (value) => asString(value)
  .replace(/!\[[^\]]*]\([^)]*\)/g, "")
  .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
  .replace(/<[^>]+>/g, " ")
  .replace(/[`*_>#]/g, "")
  .replace(/(^|\s)-\s+/g, "$1")
  .replace(/\s+/g, " ")
  .trim();
const firstParagraph = (markdown) => String(markdown ?? "")
  .split(/\n\s*\n/)
  .filter((part) => !part.trim().startsWith("#"))
  .map(stripMarkdown)
  .find(Boolean) ?? "";
const absoluteUrl = (value) => /^https?:\/\//i.test(asString(value))
  ? asString(value)
  : `${TOOL_SITE_URL}${asString(value).startsWith("/") ? asString(value) : `/${asString(value)}`}`;

const extractDomain = (url) => {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return String(url).replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, ""); }
};

const escapeRegExp = (value) => value.replace(/[.*+?^$|()\[\]{}]/g, "\\$&");
const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/"/g, "&quot;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");

const linkFirstMention = (input, term, url) => {
  if (!url || term.trim().length < 4) return input;
  const pattern = new RegExp(`(?<![\\w/>\"])${escapeRegExp(term)}(?![\\w/<\"])`, "gi");
  let firstDone = false;
  return input.replace(/(<(?:p|li|h[2-6])\b[^>]*>)([\s\S]*?)(<\/(?:p|li|h[2-6])>)/gi, (whole, open, inner, close) => {
    if (/<(?:a|code|pre)\b/i.test(inner)) return whole;
    if (!pattern.test(inner)) { pattern.lastIndex = 0; return whole; }
    pattern.lastIndex = 0;
    const linked = inner.replace(pattern, (match) => {
      const target = firstDone ? "" : ' target="_blank"';
      firstDone = true;
      return `<a href="${escapeHtml(url)}"${target} rel="noopener noreferrer">${match}</a>`;
    });
    return `${open}${linked}${close}`;
  });
};

const ensureProviderLink = (input, visibleUrl, targetUrl) => {
  if (!visibleUrl || !targetUrl) return input;
  const block = `<div class="inline-provider-link"><p><span class="inline-provider-link-emoji">👉</span> <strong>Zum Anbieter:</strong> <a href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(visibleUrl)}</a></p></div>`;
  const cleaned = input
    .replace(/<div[^>]*class="inline-provider-link"[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<p[^>]*>(?:(?!<\/p>).)*?Zum Anbieter:(?:(?!<\/p>).)*?<\/p>/gis, "")
    .replace(/<p[^>]*>(?:(?!<\/p>).)*?(?:Affiliate-Link:|Linkziel:)(?:(?!<\/p>).)*?<\/p>/gis, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return /<h2[^>]*>\s*FAQ\s*<\/h2>/i.test(cleaned)
    ? cleaned.replace(/<h2[^>]*>\s*FAQ\s*<\/h2>/i, `${block}\n<h2>FAQ</h2>`)
    : `${cleaned}\n${block}`;
};

const headingLabel = (html) => String(html)
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/\s+/g, " ")
  .trim();
const slugifyHeading = (label) => label.toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "") || "abschnitt";

const addHeadingIds = (html) => {
  const headings = [];
  const used = new Set();
  const transformed = html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (whole, rawAttributes, innerHtml) => {
    const label = headingLabel(innerHtml);
    if (!label) return whole;
    const existing = rawAttributes.match(/\bid=["']([^"']+)["']/i)?.[1];
    const base = existing || slugifyHeading(label);
    let id = base;
    for (let suffix = 2; used.has(id); suffix += 1) id = `${base}-${suffix}`;
    used.add(id);
    headings.push({ id, label });
    return `<h2${existing ? rawAttributes : `${rawAttributes} id="${id}"`}>${innerHtml}</h2>`;
  });
  return { html: transformed, headings };
};

const extractEditorialFigure = (html) => {
  const pattern = /<figure\b[^>]*class=["'][^"']*\btool-editorial-figure\b[^"']*["'][^>]*>[\s\S]*?<\/figure>/i;
  const figure = html.match(pattern)?.[0] ?? "";
  return { html: figure ? html.replace(pattern, "").trim() : html, figureHtml: figure };
};

const wrapFaq = (html, label) => html.replace(
  /(<h2\b[^>]*>\s*(?:FAQ|Frequently asked questions|Haufige Fragen|Häufige Fragen)[\s\S]*?<\/h2>)([\s\S]*?)(?=<h2\b|$)/i,
  `<details class="content-secondary" open><summary>${label}</summary><div class="content-secondary-body">$1$2</div></details>`,
);

const filterInactiveToolLinks = (html, tools) => {
  const active = new Set(tools.map((tool) => tool.slug));
  return String(html).replace(
    /<a\b([^>]*\bhref=["']\/(?:en\/)?tools\/([a-z0-9-]+)\/?["'][^>]*)>([\s\S]*?)<\/a>/gi,
    (whole, _attributes, slug, label) => active.has(slug) ? whole : label,
  );
};

const extractFaqPairs = (markdown, limit = 8) => {
  const section = String(markdown).match(/(?:^|\n)#{2,3}\s+(?:FAQ|Haeufige Fragen|Häufige Fragen|Frequently Asked Questions)\s*\n([\s\S]*?)(?=\n#{1,3}\s|\s*$)/i);
  if (!section) return [];
  const pairs = [];
  let question = "";
  let answer = [];
  const flush = () => {
    const text = stripMarkdown(answer.join(" "));
    if (/\?\s*$/.test(question) && text.length >= 20) pairs.push({ question: stripMarkdown(question), answer: text });
    question = "";
    answer = [];
  };
  for (const rawLine of section[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    const match = line.match(/^#{3,4}\s+(.+\?)\s*$/)
      ?? line.match(/^\*\*(?:\d+[.)]\s*)?(.+\?)\*\*\s*(.*)$/)
      ?? line.match(/^[-*]\s+\*\*(?:\d+[.)]\s*)?(.+\?)\*\*\s*(.*)$/);
    if (match) {
      flush();
      question = match[1];
      if (match[2]) answer.push(match[2]);
    } else if (question && line) answer.push(line);
  }
  flush();
  return pairs.slice(0, limit);
};

const extractFeatureList = (markdown, maxItems = 8) => {
  const section = String(markdown).match(/(?:^|\n)#{2,3}\s+(Hauptfunktionen|Features?|Funktionen)\b[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s|\s*$)/i);
  const source = section?.[2] ?? String(markdown);
  return (source.match(/^\s*[-*]\s+(.+)$/gm) ?? [])
    .map((item) => stripMarkdown(item.replace(/^\s*[-*]\s+/, "")))
    .filter(Boolean)
    .slice(0, maxItems);
};

const mapSchemaCategory = (category, tags) => {
  const combined = [category, ...tags].join(" ").toLowerCase();
  if (/\b(code|developer|devops|api|sdk|terminal|ide|programming|softwareentwicklung)\b/.test(combined)) return "DeveloperApplication";
  if (/\bdesign|ui|ux|bild|image|video|audio|multimedia\b/.test(combined)) return "DesignApplication";
  if (/\bkommunikation|chat|meeting|email|support|assistenz|assistant\b/.test(combined)) return "CommunicationApplication";
  if (/\bautomation|workflow|agent|orchestr|zap|prozess\b/.test(combined)) return "BusinessApplication";
  if (/\bfinance|buchhaltung|rechnung|billing\b/.test(combined)) return "FinanceApplication";
  if (/\bsecurity|privacy|compliance|monitoring\b/.test(combined)) return "SecurityApplication";
  if (/\beducation|lernen|study|research\b/.test(combined)) return "EducationalApplication";
  return "UtilitiesApplication";
};

const buildOffer = (priceModel, locale) => {
  const value = asString(priceModel);
  if (!value) return undefined;
  const freeish = locale === "en"
    ? ["Free", "Freemium", "Open Source"].includes(value)
    : ["Kostenlos", "Freemium", "Open Source"].includes(value);
  return freeish
    ? { "@type": "Offer", price: "0", priceCurrency: "EUR", availability: "https://schema.org/InStock", category: value }
    : {
        "@type": "Offer",
        priceSpecification: { "@type": "PriceSpecification", priceCurrency: "EUR", valueAddedTaxIncluded: false, description: value },
        availability: "https://schema.org/InStock",
        category: value,
      };
};

const publisher = () => ({
  "@type": "Organization",
  name: "Utildesk",
  url: TOOL_SITE_URL,
  logo: { "@type": "ImageObject", url: `${TOOL_SITE_URL}/logo-grid.svg` },
});

const verdict = (value, locale, fallback) => {
  const normalized = asString(value).toLowerCase();
  const kind = /(reject|not[-_\s]?recommended|nicht\s+empfohlen|ablehnen)/i.test(normalized) ? "reject"
    : /(overrated|ueberbewertet|überbewertet|oversold)/i.test(normalized) ? "overrated"
      : /(caution|caveat|reservation|vorbehalt|guardrail|prüfen|pruefen)/i.test(normalized) ? "caution"
        : /(recommend|recommended|empfehlen|empfohlen)/i.test(normalized) ? "recommend"
          : fallback;
  const en = locale === "en";
  return {
    recommend: { kind, icon: "✓", detailKicker: en ? "Recommend" : "Empfehlen", detailHeadline: en ? "Recommend — as a tool, not as autopilot." : "Empfehlen — als Werkzeug, nicht als Autopilot.", detailText: en ? "Good starting point with a clear task, human review and traceable data flows." : "Sicherer Start mit klarer Aufgabe, menschlicher Prüfung und nachvollziehbaren Datenflüssen.", trustLabel: en ? "4 / 5 · high" : "4 / 5 · hoch" },
    caution: { kind, icon: "◐", detailKicker: en ? "With caveat" : "Mit Vorbehalt", detailHeadline: en ? "With caveat — check first, then use in production." : "Mit Vorbehalt — erst prüfen, dann produktiv nutzen.", detailText: en ? "Useful in a bounded pilot, but data, permissions, review and fallback must be clear." : "Nützlich in einem begrenzten Pilot, aber Daten, Rechte, Review und Rückweg müssen klar sein.", trustLabel: en ? "3 / 5 · check" : "3 / 5 · prüfen" },
    overrated: { kind, icon: "⊘", detailKicker: en ? "Overrated" : "Überbewertet", detailHeadline: en ? "Overrated — promise is stronger than proof." : "Überbewertet — Versprechen stärker als Belege.", detailText: en ? "Only use after a narrow test with evidence, alternatives and a clear exit path." : "Nur nach engem Praxistest mit Belegen, Alternativen und klarem Ausstiegspfad einsetzen.", trustLabel: en ? "2 / 5 · weak" : "2 / 5 · schwach" },
    reject: { kind, icon: "×", detailKicker: en ? "Not recommended" : "Nicht empfehlen", detailHeadline: en ? "Not recommended — do not use as a decision basis." : "Nicht empfehlen — nicht als Entscheidungsgrundlage nutzen.", detailText: en ? "The risk, quality gap or missing evidence is too large for a recommendation." : "Risiko, Qualitätslücke oder fehlende Belege sind zu groß für eine Empfehlung.", trustLabel: en ? "1 / 5 · avoid" : "1 / 5 · meiden" },
  }[kind];
};

const parseAlternative = (item) => {
  const internal = item.match(/^\[([^\]]+)]\(\/(?:en\/)?tools\/([^/)\s]+)\/?\)\s*(?::\s*(.*))?$/);
  if (internal) return { name: internal[1], slug: internal[2] };
  const linked = item.match(/^\[([^\]]+)]\([^)]+\)\s*(?::\s*(.*))?$/);
  if (linked) return { name: linked[1], slug: "" };
  const boldInside = item.match(/^\*\*([^*]+?)\s*:\s*\*\*\s*(.+)$/);
  if (boldInside) return { name: boldInside[1], slug: "" };
  const bold = item.match(/^\s*\*\*([^*]+)\*\*\s*(?::|–|—|-)?/i);
  if (bold) return { name: bold[1], slug: "" };
  const plain = item.match(/^\s*([^:–—-][^:–—-]{1,80})\s*(?::|–|—|-)\s*(.+)?$/);
  return plain ? { name: plain[1], slug: "" } : null;
};

export function getToolContextHints(markdown) {
  const source = String(markdown);
  const slugs = [...source.matchAll(/\]\(\/(?:en\/)?tools\/([a-z0-9-]+)\/?(?:[?#][^)]*)?\)/gi)]
    .map((match) => match[1]);
  const section = source.match(/(?:^|\r?\n)#{1,3}\s+(Alternativen|Alternatives?)\b[^\r\n]*\r?\n([\s\S]*?)(?=\r?\n#{1,3}\s|\s*$)/i);
  const items = section
    ? (section[2].match(/^[-*]\s+(.+)$/gm) ?? []).map((line) => line.replace(/^[-*]\s+/, "").trim())
    : [];
  const titles = items
    .map(parseAlternative)
    .filter((item) => item && !item.slug)
    .map((item) => stripMarkdown(item.name))
    .filter(Boolean);
  return {
    slugs: [...new Set(slugs)].sort(),
    titles: [...new Set(titles)].sort((left, right) => left.localeCompare(right)),
  };
}

const buildAlternatives = (markdown, slug, tools) => {
  const section = String(markdown).match(/(?:^|\r?\n)#{1,3}\s+(Alternativen|Alternatives?)\b[^\r\n]*\r?\n([\s\S]*?)(?=\r?\n#{1,3}\s|\s*$)/i);
  const items = section ? (section[2].match(/^[-*]\s+(.+)$/gm) ?? []).map((line) => line.replace(/^[-*]\s+/, "").trim()) : [];
  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  const byTitle = new Map(tools.map((tool) => [normalizeName(tool.title), tool]));
  const byFuzzyTitle = new Map(tools.map((tool) => [normalizeNameFuzzy(tool.title), tool]));
  return items.reduce((result, item) => {
    const parsed = parseAlternative(item);
    if (!parsed) return result;
    const tool = parsed.slug
      ? bySlug.get(parsed.slug)
      : byTitle.get(normalizeName(parsed.name)) ?? byFuzzyTitle.get(normalizeNameFuzzy(parsed.name));
    if (!tool || tool.slug === slug || result.some((current) => current.slug === tool.slug)) return result;
    result.push(tool);
    return result;
  }, []);
};

const formatDate = (value, locale, style = "long") => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en" : "de-DE", {
      day: "2-digit",
      month: style === "short" ? (locale === "en" ? "short" : "2-digit") : "long",
      year: "numeric",
    }).format(new Date(String(value)));
  } catch { return ""; }
};

const primaryCategoryFor = (rawTags, categories) => categories
  .map((category) => {
    const normalized = rawTags.map((tag) => String(tag).toLowerCase());
    const matches = normalized.filter((tag) => category.matchTags.includes(tag));
    return { category, matchCount: matches.length, firstMatchPos: matches.length ? normalized.findIndex((tag) => category.matchTags.includes(tag)) : Infinity };
  })
  .filter((result) => result.matchCount > 0)
  .sort((left, right) => right.matchCount - left.matchCount || left.firstMatchPos - right.firstMatchPos)[0]?.category;

export function buildToolDetailViewModel({
  entry,
  locale = "de",
  localized = {},
  displayTools = [],
  categories = [],
  guideBacklinks = [],
  contentLastmod = {},
  searchIndexDecision,
}) {
  if (!entry?.slug || !entry?.data) throw new Error("Tool detail view model requires an entry with slug and data");
  if (!new Set(["de", "en"]).has(locale)) throw new Error(`Unsupported tool locale: ${locale}`);
  const data = entry.data;
  const slug = String(entry.slug);
  const quality = classifyToolEntry(entry);
  const isCuratedTool = isCuratedToolEntry(entry, quality);
  const markdownSource = asString(localized.markdown ?? entry.content);
  const markdown = isCuratedTool ? markdownSource : stripTemplateBoilerplate(markdownSource);
  const title = asString(localized.title ?? data.title) || slug;
  const category = asString(localized.category ?? data.category) || null;
  const priceModel = asString(localized.priceModel ?? data.price_model) || null;
  const tags = Array.isArray(localized.tags ?? data.tags) ? (localized.tags ?? data.tags).map(String) : [];
  const rawTags = Array.isArray(data.tags) ? data.tags.map(String) : [];
  const officialUrl = asString(localized.officialUrl ?? data.official_url);
  const affiliateUrl = asString(localized.affiliateUrl ?? data.affiliate_url);
  const providerUrl = asString(localized.targetUrl) || affiliateUrl || officialUrl;
  const visibleProviderUrl = officialUrl || providerUrl;
  const providerDomain = extractDomain(visibleProviderUrl || providerUrl);
  const vendorName = asString(data.vendor) || title;
  const currentDisplayTool = displayTools.find((tool) => tool.slug === slug) ?? {};
  const logoUrl = asString(currentDisplayTool.iconUrl || data.brandLogo) || null;
  const logoFallbacks = Array.isArray(currentDisplayTool.iconFallbacks) ? currentDisplayTool.iconFallbacks : [];
  const monogramLetter = (vendorName || title || slug || (locale === "en" ? "#" : "·"))
    .replace(locale === "en" ? /[^A-Za-z]/g : /[^A-Za-zÄÖÜäöü]/g, "")
    .charAt(0).toUpperCase() || (locale === "en" ? "#" : "·");

  const categoryNorm = asString(category).toLowerCase();
  const seenTags = new Set();
  const displayTags = tags.filter((tag) => {
    const normalized = asString(tag).toLowerCase();
    if (!normalized || normalized === "ai" || normalized === categoryNorm || seenTags.has(normalized)) return false;
    seenTags.add(normalized);
    return true;
  });
  const primaryCategory = primaryCategoryFor(rawTags, categories);

  const withoutAlternatives = markdown.replace(/(?:^|\n)#{1,3}\s+(Alternativen|Alternatives?)\b[^\n]*\n[\s\S]*?(?=\n#{1,3}\s|\s*$)/i, "").trim();
  let articleHtml = String(marked.parse(withoutAlternatives)).replace(/<h1[^>]*>[\s\S]*?<\/h1>\s*/i, "");
  if (locale === "de") articleHtml = ensureProviderLink(linkFirstMention(articleHtml, title, providerUrl), visibleProviderUrl, providerUrl);
  const extractedFigure = extractEditorialFigure(articleHtml);
  const navigation = addHeadingIds(extractedFigure.html);
  articleHtml = filterInactiveToolLinks(
    wrapFaq(navigation.html, locale === "en" ? "Open frequently asked questions" : "FAQ aufklappen"),
    displayTools,
  );

  const alternatives = buildAlternatives(markdown, slug, displayTools).slice(0, 3);
  const description = asString(localized.description ?? data.description ?? data.summary ?? data.excerpt ?? data.tagline) || firstParagraph(markdown) || `${title} - Informationen, Features und Anwendungsfälle`;
  const metaDescriptionLimit = locale === "en" ? 158 : 160;
  const metaDescriptionSlice = locale === "en" ? 155 : 157;
  const metaDescription = asString(localized.metaDescription)
    || (description.length > metaDescriptionLimit ? `${description.slice(0, metaDescriptionSlice).trimEnd()}...` : description);
  const mastheadOneliner = description || firstParagraph(markdown);
  const featureList = Array.isArray(localized.featureList) ? localized.featureList : extractFeatureList(markdown);
  const faqPairs = isCuratedTool ? extractFaqPairs(markdown) : [];
  const faqSchema = faqPairs.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqPairs.map((pair) => ({ "@type": "Question", name: pair.question, acceptedAnswer: { "@type": "Answer", text: pair.answer } })),
  } : null;
  const canonicalPath = `${locale === "en" ? "/en" : ""}/tools/${slug}/`;
  const canonicalUrl = `${TOOL_SITE_URL}${canonicalPath}`;
  const machinePaths = {
    json: `${locale === "en" ? "/en" : ""}/api/tools/${slug}.json`,
    markdown: `${locale === "en" ? "/en" : ""}/markdown/tools/${slug}.md`,
  };
  const checkedDateSource = data.lastReviewed ?? data.last_reviewed ?? data.lastReviewedAt ?? data.last_reviewed_at
    ?? data.editorial_reviewed_at ?? data.editorialReviewedAt
    ?? (quality.tier === "A" ? contentLastmod[`content/tools/${slug}.md`] : "");
  const generatedAtSource = contentLastmod[`content/tools/${slug}.md`] ?? data.generatedAt ?? data.generated_at ?? data.created_at ?? data.createdAt ?? data.date;
  const editorialVerdict = verdict(data.editorial_verdict, locale, isCuratedTool ? "recommend" : "caution");
  const editorialVerdictHeadline = asString(data.editorial_verdict_headline) || editorialVerdict.detailHeadline;
  const editorialVerdictText = asString(data.editorial_verdict_text) || editorialVerdict.detailText;
  const editorialTrustLabel = asString(data.editorial_trust_label) || editorialVerdict.trustLabel;
  const mentionedInCount = new Set([
    ...(Array.isArray(data.mentionedIn) ? data.mentionedIn.map(String) : []),
    ...guideBacklinks.map((guide) => guide.slug),
  ]).size;
  const offer = buildOffer(priceModel, locale);
  const schema = {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "WebApplication"],
    name: title,
    description: description.slice(0, 500),
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    operatingSystem: "Web",
    applicationCategory: mapSchemaCategory(category, tags),
    applicationSubCategory: category || undefined,
    inLanguage: locale === "en" ? "en" : "de-DE",
    keywords: tags.length ? tags.join(", ") : undefined,
    featureList: featureList.length ? featureList : undefined,
    isAccessibleForFree: (locale === "en" ? ["Free", "Freemium", "Open Source"] : ["Kostenlos", "Freemium", "Open Source"]).includes(priceModel),
    publisher: publisher(),
    image: logoUrl ? absoluteUrl(logoUrl) : undefined,
    offers: offer,
    about: tags.length ? tags.map((tag) => ({ "@type": "Thing", name: tag })) : undefined,
    ...(officialUrl && /^https?:\/\//i.test(officialUrl) ? { sameAs: officialUrl } : {}),
  };
  const breadcrumbItems = locale === "en"
    ? [{ name: "Directory", url: `${TOOL_SITE_URL}/en/` }, { name: "Tools", url: `${TOOL_SITE_URL}/en/tools/` }, { name: title, url: canonicalUrl }]
    : [{ name: "Startseite", url: `${TOOL_SITE_URL}/` }, { name: "Tools", url: `${TOOL_SITE_URL}/tools/` }, { name: title, url: canonicalUrl }];
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })),
  };

  return {
    slug,
    locale,
    data,
    quality,
    isCuratedTool,
    title,
    category,
    priceModel,
    price_model: priceModel,
    tags,
    displayTags,
    primaryCategory,
    officialUrl,
    official_url: officialUrl,
    affiliateUrl,
    affiliate_url: affiliateUrl,
    providerUrl,
    provider_url: providerUrl,
    visibleProviderUrl,
    visible_provider_url: visibleProviderUrl,
    target_provider_url: providerUrl,
    providerDomain,
    providerCtaLabel: locale === "en" ? (providerUrl ? `Open ${title}` : "Open provider") : (visibleProviderUrl || (affiliateUrl ? "Zum Anbieter" : "Zur Website")),
    vendorName,
    logoUrl,
    logoFallbacks,
    monogramLetter,
    markdown,
    articleHtml,
    articleHeadings: navigation.headings,
    editorialFigureHtml: extractedFigure.figureHtml,
    alternativesTop: alternatives,
    guideBacklinks,
    mentionedInCount,
    description,
    metaDescription,
    mastheadOneliner,
    featureList,
    faqSchema,
    searchIndexDecision,
    canonicalPath,
    canonicalUrl,
    machinePaths,
    checkedDateSource,
    checkedDate: formatDate(checkedDateSource, locale),
    lastCheckedShort: formatDate(checkedDateSource, locale, "short"),
    inIndexSinceShort: formatDate(data.created_at ?? data.createdAt ?? data.date, locale, "short"),
    generatedAt: formatDate(generatedAtSource, locale),
    editorialVerdict,
    editorialVerdictHeadline,
    editorialVerdictText,
    editorialTrustLabel,
    softwareApplicationSchema: schema,
    breadcrumbSchema,
  };
}

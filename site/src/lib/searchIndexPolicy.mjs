export const ROBOTS_INDEX_FOLLOW =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

export const ROBOTS_NOINDEX_FOLLOW =
  "noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

export const INDEXABLE_NEWEST_TOOL_LIMIT = 0;
export const MIN_EDITORIAL_BODY_WORDS = 450;
export const MIN_EDITORIAL_SECTION_MATCHES = 6;

const TRUE_VALUES = new Set(["1", "true", "yes", "index", "indexable"]);
const FALSE_VALUES = new Set(["0", "false", "no", "noindex", "hidden"]);
const EDITORIAL_SECTION_PATTERNS = [
  ["audience", /\b(?:fur wen|who is|who should|geeignet)\b/i],
  ["scenarios", /\b(?:einsatzszenarien|use cases|scenarios)\b/i],
  ["features", /\b(?:hauptfunktionen|funktionen|features|starken|strengths)\b/i],
  ["limits", /\b(?:vorteile|nachteile|grenzen|limits|pros|cons)\b/i],
  ["workflow", /\b(?:workflow|alltag|wirklich zahlt|really matters|praxis)\b/i],
  ["privacy", /\b(?:datenschutz|privacy|daten|data)\b/i],
  ["pricing", /\b(?:preise|kosten|pricing|plans)\b/i],
  ["alternatives", /\b(?:alternativen|alternatives)\b/i],
  ["verdict", /\b(?:redaktionelle|einschatzung|fazit|verdict|assessment)\b/i],
  ["faq", /\b(?:faq|haufige fragen|frequently asked)\b/i],
];
const OWNED_EDITORIAL_HEADING_PATTERN =
  /^(?:workflow-fit|workflow fit|redaktionelle einschatzung|editorial assessment|editorial verdict|was im alltag wirklich zahlt|worauf es wirklich ankommt|praxis-check)\b/i;

const FORCE_INDEX_TOOL_SLUGS = new Set([
  "adobe-firefly",
  "adobe-illustrator",
  "adobe-premiere-pro",
  "adobe-xd",
  "ahrefs-content-explorer",
  "airtable",
  "asana",
  "automation-anywhere",
  "aws-sagemaker",
  "azure-machine-learning",
  "beautiful-ai",
  "blue-prism",
  "bolt-new",
  "canva",
  "chatgpt",
  "claude",
  "clickup",
  "cohere",
  "copilot",
  "descript",
  "dialogflow",
  "elicit",
  "figma",
  "gemini",
  "github-copilot",
  "google-gemini",
  "grammarly",
  "hubspot",
  "jasper-ai",
  "kofax-rpa",
  "loom",
  "make",
  "microsoft-copilot",
  "midjourney",
  "miro",
  "notion",
  "openai-api",
  "perplexity",
  "pipedream",
  "runway",
  "salesforce-einstein",
  "semrush",
  "speechify",
  "stable-diffusion",
  "tableau",
  "tabnine",
  "uipath",
  "wispr-flow",
  "zapier",
]);

const normalizeBooleanLike = (value) => {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return null;
};

const asNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

const normalizeSearchText = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00df/g, "ss")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const countMarkdownWords = (value) =>
  normalizeSearchText(value)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_>#()[\]{}.,;:!?/\\|+=~]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

const countEditorialSectionMatches = (content) => {
  const headings = String(content ?? "").match(/^#{2,3}\s+(.+)$/gm) ?? [];
  const matched = new Set();

  for (const heading of headings) {
    const normalizedHeading = normalizeSearchText(heading.replace(/^#{2,3}\s+/, ""));
    for (const [section, pattern] of EDITORIAL_SECTION_PATTERNS) {
      if (pattern.test(normalizedHeading)) {
        matched.add(section);
      }
    }
  }

  return matched.size;
};

const hasOwnedEditorialHeading = (content) => {
  const headings = String(content ?? "").match(/^#{2,3}\s+(.+)$/gm) ?? [];
  return headings.some((heading) =>
    OWNED_EDITORIAL_HEADING_PATTERN.test(normalizeSearchText(heading.replace(/^#{2,3}\s+/, ""))),
  );
};

const hasSubstantialEditorialBody = (content) => {
  const wordCount = countMarkdownWords(content);
  if (wordCount < MIN_EDITORIAL_BODY_WORDS) return false;
  if (!hasOwnedEditorialHeading(content)) return false;
  return countEditorialSectionMatches(content) >= MIN_EDITORIAL_SECTION_MATCHES;
};

export const getToolSearchIndexDecision = (entry, options = {}) => {
  const slug = String(entry?.slug ?? entry?.data?.slug ?? "").trim();
  const data = entry?.data ?? {};
  const explicit =
    normalizeBooleanLike(data.search_index) ??
    normalizeBooleanLike(data.indexable) ??
    normalizeBooleanLike(data.index);

  if (explicit === false) {
    return {
      indexable: false,
      robots: ROBOTS_NOINDEX_FOLLOW,
      reason: "frontmatter_noindex",
    };
  }

  if (explicit === true) {
    return {
      indexable: true,
      robots: ROBOTS_INDEX_FOLLOW,
      reason: "frontmatter_index",
    };
  }

  const popularity = asNumber(data.popularity);
  const addedAtRank = asNumber(options.addedAtRank);
  const hasAffiliate = Boolean(String(data.affiliate_url || "").trim());
  const hasEditorialDescription = Boolean(String(data.description || data.summary || data.excerpt || "").trim());
  const hasEditorialBody = hasSubstantialEditorialBody(entry?.content);

  const indexable =
    FORCE_INDEX_TOOL_SLUGS.has(slug) ||
    popularity > 0 ||
    hasAffiliate ||
    hasEditorialDescription ||
    hasEditorialBody ||
    (addedAtRank > 0 && addedAtRank <= INDEXABLE_NEWEST_TOOL_LIMIT);

  const reason = FORCE_INDEX_TOOL_SLUGS.has(slug)
    ? "core_tool"
    : popularity > 0
      ? "popular_tool"
      : hasAffiliate
        ? "partner_tool"
        : hasEditorialDescription
          ? "editorial_description"
          : hasEditorialBody
            ? "editorial_body"
            : addedAtRank > 0 && addedAtRank <= INDEXABLE_NEWEST_TOOL_LIMIT
              ? "newest_tool"
              : "long_tail_tool";

  return {
    indexable,
    robots: indexable ? ROBOTS_INDEX_FOLLOW : ROBOTS_NOINDEX_FOLLOW,
    reason,
  };
};

export const createToolAddedAtRankMap = (manifest = {}) => {
  const rankMap = new Map();
  Object.entries(manifest)
    .map(([slug, value]) => [slug, asNumber(value)])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "en"))
    .forEach(([slug], index) => {
      rankMap.set(String(slug), index + 1);
    });
  return rankMap;
};

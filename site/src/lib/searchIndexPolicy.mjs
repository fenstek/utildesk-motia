export const ROBOTS_INDEX_FOLLOW =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

export const ROBOTS_NOINDEX_FOLLOW =
  "noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

export const INDEXABLE_NEWEST_TOOL_LIMIT = 0;

const TRUE_VALUES = new Set(["1", "true", "yes", "index", "indexable"]);
const FALSE_VALUES = new Set(["0", "false", "no", "noindex", "hidden"]);

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

  const indexable =
    FORCE_INDEX_TOOL_SLUGS.has(slug) ||
    popularity > 0 ||
    hasAffiliate ||
    hasEditorialDescription ||
    (addedAtRank > 0 && addedAtRank <= INDEXABLE_NEWEST_TOOL_LIMIT);

  const reason = FORCE_INDEX_TOOL_SLUGS.has(slug)
    ? "core_tool"
    : popularity > 0
      ? "popular_tool"
      : hasAffiliate
        ? "partner_tool"
        : hasEditorialDescription
          ? "editorial_description"
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

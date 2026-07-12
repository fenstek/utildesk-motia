export const FOCUS_TOOL_SLUGS = [
  "chatgpt",
  "claude",
  "gemini",
  "perplexity",
  "github-copilot",
  "openai-api",
  "cursor",
  "n8n",
  "zapier",
  "make-ehemals-integromat",
  "litmaps",
  "paperpile",
  "elicit",
  "research-rabbit",
  "adobe-enhance-speech",
  "fotojet",
  "wispr-flow",
  "openclaw",
  "openai-codex",
  "langchain",
];

const focusRank = new Map(FOCUS_TOOL_SLUGS.map((slug, index) => [slug, index]));

export function compareToolsBySearchFocus(a, b) {
  const aRank = focusRank.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
  const bRank = focusRank.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
  return aRank - bRank;
}

export function selectSearchFocusTools(tools, limit = 36) {
  return [...tools]
    .sort((a, b) => {
      const focusDiff = compareToolsBySearchFocus(a, b);
      if (focusDiff !== 0) return focusDiff;
      const popularityDiff = Number(b.popularity || 0) - Number(a.popularity || 0);
      if (popularityDiff !== 0) return popularityDiff;
      return String(a.title).localeCompare(String(b.title));
    })
    .slice(0, limit);
}

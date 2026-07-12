import type { RatgeberEntry } from "./ratgeber";

const CLUSTERS = [
  ["agent", "coding", "developer", "code", "browser", "memory", "lokal", "local", "mcp"],
  ["dokument", "document", "ocr", "automation", "workflow", "produktiv", "productiv", "email"],
  ["search", "suche", "commerce", "shopping", "visibility", "crawler", "verzeichnis", "directory", "video"],
];

const tokensFor = (entry: RatgeberEntry) =>
  new Set(
    [entry.slug, entry.data.title, entry.data.category, ...(entry.data.tags || [])]
      .join(" ").toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2),
  );

export function getRelatedGuides(current: RatgeberEntry, entries: RatgeberEntry[], limit = 4) {
  const currentTokens = tokensFor(current);
  const currentCluster = CLUSTERS.findIndex((cluster) => cluster.some((token) => currentTokens.has(token)));
  return entries
    .filter((entry) => entry.slug !== current.slug)
    .map((entry) => {
      const tokens = tokensFor(entry);
      const shared = [...currentTokens].filter((token) => tokens.has(token)).length;
      const sameCluster = currentCluster >= 0 && CLUSTERS[currentCluster].some((token) => tokens.has(token));
      const categoryMatch = current.data.category && entry.data.category === current.data.category;
      return { entry, score: shared * 3 + (sameCluster ? 5 : 0) + (categoryMatch ? 4 : 0) };
    })
    .sort((a, b) => b.score - a.score || String(b.entry.data.date || "").localeCompare(String(a.entry.data.date || "")))
    .slice(0, limit)
    .map(({ entry }) => entry);
}

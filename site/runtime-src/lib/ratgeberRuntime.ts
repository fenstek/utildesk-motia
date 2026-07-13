import type { RuntimeContentEntry } from "./runtimeContent";

const CLUSTERS = [
  ["agent", "coding", "developer", "code", "browser", "memory", "lokal", "local", "mcp"],
  ["dokument", "document", "ocr", "automation", "workflow", "produktiv", "productiv", "email"],
  ["search", "suche", "commerce", "shopping", "visibility", "crawler", "verzeichnis", "directory", "video"],
];

const metadataStrings = (entry: RuntimeContentEntry, key: string) =>
  Array.isArray(entry.metadata[key]) ? entry.metadata[key].map(String) : [];

const tokensFor = (entry: RuntimeContentEntry) =>
  new Set(
    [entry.slug, entry.title, entry.metadata.category, ...metadataStrings(entry, "tags")]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2),
  );

export function getRuntimeRelatedGuides(
  current: RuntimeContentEntry,
  entries: RuntimeContentEntry[],
  limit = 6,
) {
  const currentTokens = tokensFor(current);
  const currentCluster = CLUSTERS.findIndex((cluster) => cluster.some((token) => currentTokens.has(token)));
  return entries
    .filter((entry) => entry.slug !== current.slug)
    .map((entry) => {
      const tokens = tokensFor(entry);
      const shared = [...currentTokens].filter((token) => tokens.has(token)).length;
      const sameCluster = currentCluster >= 0 && CLUSTERS[currentCluster].some((token) => tokens.has(token));
      const categoryMatch = current.metadata.category && entry.metadata.category === current.metadata.category;
      return { entry, score: shared * 3 + (sameCluster ? 5 : 0) + (categoryMatch ? 4 : 0) };
    })
    .sort((left, right) => right.score - left.score || String(right.entry.sourcePublishedAt || "").localeCompare(String(left.entry.sourcePublishedAt || "")))
    .slice(0, limit)
    .map(({ entry }) => entry);
}

export const stringArray = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : [];

export const relatedTools = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter((item): item is { title: string; href: string } =>
          Boolean(item && typeof item === "object" && typeof (item as { title?: unknown }).title === "string" && typeof (item as { href?: unknown }).href === "string"),
        )
        .map((item) => ({ title: item.title, href: item.href }))
    : [];

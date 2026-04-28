import toolAddedAtManifest from "../data/tool-added-at.json";

const toolAddedAtBySlug = toolAddedAtManifest as Record<string, number>;

type SortableTool = {
  title: string;
  slug: string;
  addedAtMs: number;
  addedAtOrderMs: number;
};

const parseDateMs = (value: unknown) => {
  const text = value ? String(value) : "";
  if (!text) return 0;
  const ms = new Date(text).getTime();
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
};

export const getToolAddedAtInfo = (slug: string, createdAt: unknown) => {
  const manifestAddedAtMs = Number(toolAddedAtBySlug[slug] || 0);
  const createdAtMs = parseDateMs(createdAt);
  const addedAtMs = manifestAddedAtMs || createdAtMs;

  return {
    addedAtMs,
    addedAtOrderMs: addedAtMs,
  };
};

export const compareToolsByNewest = (locale: "de" | "en") => (a: SortableTool, b: SortableTool) =>
  b.addedAtMs - a.addedAtMs ||
  b.addedAtOrderMs - a.addedAtOrderMs ||
  a.title.localeCompare(b.title, locale) ||
  a.slug.localeCompare(b.slug, locale);

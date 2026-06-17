export const slugifyTag = (tag: string) =>
  String(tag ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const tagHref = (tag: string, locale: "de" | "en" = "de") => {
  const path = `/tools/tag/${slugifyTag(tag)}/`;
  return locale === "en" ? `/en${path}` : path;
};

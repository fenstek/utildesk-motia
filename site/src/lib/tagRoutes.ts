export const slugifyTag = (tag: string) =>
  String(tag ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const tagHref = (tag: string) => `/tools/tag/${slugifyTag(tag)}/`;

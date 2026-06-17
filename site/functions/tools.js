const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.pathname !== "/tools" && url.pathname !== "/tools/") {
    return context.next();
  }

  const tag = url.searchParams.get("tag");
  if (tag) {
    const slug = slugify(tag);
    if (slug) {
      return Response.redirect(`${url.origin}/tools/tag/${slug}/`, 308);
    }
  }

  const sort = url.searchParams.get("sort");
  if (sort) {
    const normalizedSort = String(sort).toLowerCase();
    if (["az", "new", "pop"].includes(normalizedSort) && url.searchParams.size === 1) {
      return Response.redirect(`${url.origin}/tools/`, 308);
    }
  }

  return context.next();
}

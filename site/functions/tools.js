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

  if (url.searchParams.size === 1 && url.searchParams.get("sort") === "az") {
    return Response.redirect(`${url.origin}/tools/`, 308);
  }

  return context.next();
}

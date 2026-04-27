const PUBLIC_SECTION_PREFIXES = [
  "/tools",
  "/category",
  "/ratgeber",
  "/en/tools",
  "/en/category",
  "/en/ratgeber",
];

const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/en",
  "/en/",
  "/datenschutz",
  "/datenschutz/",
  "/impressum",
  "/impressum/",
  "/en/privacy",
  "/en/privacy/",
  "/en/imprint",
  "/en/imprint/",
]);

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isPublicHtmlPath = (pathname) => {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  if (pathname.includes(".")) return false;
  return PUBLIC_SECTION_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

const withTrailingSlash = (pathname) => {
  if (pathname === "") return "/";
  if (pathname === "/" || pathname.endsWith("/")) return pathname;
  if (pathname.includes(".")) return pathname;
  return `${pathname}/`;
};

const isToolsIndex = (pathname) =>
  pathname === "/tools" ||
  pathname === "/tools/" ||
  pathname === "/en/tools" ||
  pathname === "/en/tools/";

export function onRequest(context) {
  const { request } = context;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return context.next();
  }

  const url = new URL(request.url);
  if (!url.search || !isPublicHtmlPath(url.pathname)) {
    return context.next();
  }

  if (isToolsIndex(url.pathname)) {
    const tag = url.searchParams.get("tag");
    const slug = slugify(tag);
    if (slug) {
      const localePrefix = url.pathname.startsWith("/en/") || url.pathname === "/en/tools" ? "/en" : "";
      return Response.redirect(`${url.origin}${localePrefix}/tools/tag/${slug}/`, 308);
    }
  }

  return Response.redirect(`${url.origin}${withTrailingSlash(url.pathname)}`, 308);
}

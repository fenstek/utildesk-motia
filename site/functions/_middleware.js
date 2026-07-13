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

// tools.utildesk.de uses an external DNS zone, so a Cloudflare Worker Route
// cannot own a path directly. Pages proxies just this migrated content cluster
// to the D1-backed renderer; every other public route stays on the static app.
const RUNTIME_ORIGIN = "https://utildesk-content-runtime.s-skorykov.workers.dev";
const isRuntimePath = (pathname) =>
  pathname === "/ratgeber" ||
  pathname.startsWith("/ratgeber/") ||
  pathname === "/en/ratgeber" ||
  pathname.startsWith("/en/ratgeber/") ||
  pathname === "/sitemap.xml" ||
  pathname === "/sitemap-focus.xml" ||
  pathname === "/sitemap-bing.xml" ||
  pathname.startsWith("/runtime-assets/");

const proxyRuntime = async (context) => {
  const url = new URL(context.request.url);
  const upstream = new URL(`${url.pathname}${url.search}`, RUNTIME_ORIGIN);

  try {
    const response = await fetch(new Request(upstream, context.request));
    // Keep a static fallback for a path which has not been imported into D1.
    if (response.status === 404 && !url.pathname.startsWith("/runtime-assets/")) return context.next();
    const headers = new Headers(response.headers);
    headers.set("X-Utildesk-Content-Runtime", "ratgeber-v1");
    return new Response(response.body, { status: response.status, headers });
  } catch {
    // An upstream outage must preserve the existing Pages version instead of
    // turning an editorial page into a hard error.
    return context.next();
  }
};

const runtimeIsEnabled = async (context) => {
  try {
    // Set this key to "off" for an instant Pages-side rollback. The missing
    // key intentionally means enabled, so first rollout needs no KV mutation.
    return (await context.env.RATGEBER_REVIEW?.get("content-runtime:ratgeber")) !== "off";
  } catch {
    return true;
  }
};

const RETIRED_ASSET_PATHS = new Set([
  "/images/ratgeber/browser-agenten-im-praxistest-wo-automation-hilft-und-wo-sie-gefahrlich-wird-cover.png",
  "/images/ratgeber/browser-agenten-im-praxistest-wo-automation-hilft-und-wo-sie-gefahrlich-wird-workflow.png",
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

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return context.next();
  }

  const url = new URL(request.url);
  if (RETIRED_ASSET_PATHS.has(url.pathname)) {
    return new Response(null, {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  if (isRuntimePath(url.pathname) && await runtimeIsEnabled(context)) {
    return proxyRuntime(context);
  }

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

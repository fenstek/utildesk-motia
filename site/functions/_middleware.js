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
const FROZEN_TOOL_FALLBACK_ORIGIN = "https://utildesk-tool-fallback.pages.dev";
const RUNTIME_RATGEBER_STYLESHEET = "/runtime-ratgeber-detail.css?v=20260720-1";
const stripDuplicatedRuntimeSecondaryImage = (html) => html.replace(
  /<figure class="ratgeber-inline-image">\s*<img\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/figure>/g,
  (figure, imageSrc, offset, fullHtml) => {
    const proseStart = fullHtml.indexOf('<div class="ratgeber-prose"');
    const proseBeforeFigure = proseStart === -1 ? "" : fullHtml.slice(proseStart, offset);
    return proseBeforeFigure.includes(`src="${imageSrc}"`) ? "" : figure;
  },
);
const GERMAN_MONTHS = {
  januar: 0, februar: 1, märz: 2, april: 3, mai: 4, juni: 5,
  juli: 6, august: 7, september: 8, oktober: 9, november: 10, dezember: 11,
};
const isRatgeberIndexPath = (pathname) =>
  pathname === "/ratgeber" ||
  pathname === "/ratgeber/" ||
  pathname === "/en/ratgeber" ||
  pathname === "/en/ratgeber/";
const runtimeCardTimestamp = (card) => {
  const label = card.match(/<span class="rg-meta">([^<]+)<\/span>/)?.[1]?.trim() ?? "";
  const german = label.match(/^(\d{1,2})\.\s+([^\s]+)\s+(\d{4})$/);
  if (german) {
    const month = GERMAN_MONTHS[german[2].toLowerCase()];
    if (month !== undefined) return Date.UTC(Number(german[3]), month, Number(german[1]));
  }
  const timestamp = Date.parse(label);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};
const rebuildRuntimeGuideCard = (card, index, isEnglish) => {
  const isFeatured = index === 0;
  const issue = String(index + 1).padStart(2, "0");
  let rebuilt = card
    .replace(/class="rg-card(?:\s+rg-card--featured)?"/, `class="rg-card${isFeatured ? " rg-card--featured" : ""}"`)
    .replace(/data-guide-index="\d+"(?:\s+hidden)?/, `data-guide-index="${index}"${index >= 10 ? " hidden" : ""}`)
    .replace(/(<div class="rg-card-issue"><span>)[^<]*(<\/span>)/, `$1${isFeatured ? (isEnglish ? "Latest decision" : "Neueste Entscheidung") : (isEnglish ? "Guide" : "Ratgeber")}$2`)
    .replace(/(<div class="rg-card-issue">[\s\S]*?<strong>)\d+(<\/strong>)/, `$1${issue}$2`);
  if (isFeatured) {
    rebuilt = rebuilt.replace('loading="lazy"', 'loading="eager"').replace('fetchpriority="auto"', 'fetchpriority="high"');
  } else {
    rebuilt = rebuilt.replace('loading="eager"', 'loading="lazy"').replace('fetchpriority="high"', 'fetchpriority="auto"');
  }
  return rebuilt;
};
const sortRuntimeRatgeberIndex = (html, isEnglish) => html.replace(
  /(<section class="rg-list">)([\s\S]*?)(<\/section>)/,
  (section, open, list, close) => {
    const cards = [...list.matchAll(/<a href="\/(?:en\/)?ratgeber\/[^"/]+\/" class="rg-card(?:\s+rg-card--featured)?"[\s\S]*?<\/a>/g)]
      .map((match, index) => ({ card: match[0], index, timestamp: runtimeCardTimestamp(match[0]) }));
    if (cards.length < 2) return section;
    const sorted = cards
      .sort((left, right) => right.timestamp - left.timestamp || left.index - right.index)
      .map(({ card }, index) => rebuildRuntimeGuideCard(card, index, isEnglish));
    return `${open}${sorted.join("")}${close}`;
  },
);
const isRatgeberRuntimePath = (pathname) =>
  pathname === "/ratgeber" ||
  pathname.startsWith("/ratgeber/") ||
  pathname === "/en/ratgeber" ||
  pathname.startsWith("/en/ratgeber/") ||
  pathname === "/sitemap.xml" ||
  pathname === "/sitemap-focus.xml" ||
  pathname === "/sitemap-bing.xml" ||
  pathname.startsWith("/runtime-assets/");

export const toolDetailSlug = (pathname) => {
  const match = pathname.match(/^\/(?:en\/)?tools\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  return match?.[1] ?? null;
};

export const toolMachineRoute = (pathname) => {
  const catalog = pathname.match(/^\/(?:en\/)?api\/tools\.json$/);
  if (catalog) return { slug: null, kind: "catalog" };
  const detail = pathname.match(/^\/(?:en\/)?api\/tools\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/);
  if (detail) return { slug: detail[1], kind: "json" };
  const markdown = pathname.match(/^\/(?:en\/)?markdown\/tools\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/);
  if (markdown) return { slug: markdown[1], kind: "markdown" };
  return null;
};

export const toolShellRoute = (pathname) => {
  if (pathname === "/" || pathname === "/en" || pathname === "/en/") return { kind: "homepage" };
  if (/^\/(?:en\/)?tools\/?$/.test(pathname)) return { kind: "index" };
  if (/^\/(?:en\/)?category\/?$/.test(pathname)) return { kind: "category-index" };
  const category = pathname.match(/^\/(?:en\/)?category\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  if (category) return { kind: "category", slug: category[1] };
  const tag = pathname.match(/^\/(?:en\/)?tools\/tag\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  if (tag) return { kind: "tag", slug: tag[1] };
  return null;
};

const isToolAssetPath = (pathname) => pathname.startsWith("/tool-assets/");

export const frozenToolFallback = async (context) => {
  const url = new URL(context.request.url);
  const frozen = new URL(`${url.pathname}${url.search}`, FROZEN_TOOL_FALLBACK_ORIGIN);
  try {
    const response = await fetch(new Request(frozen, context.request));
    if (!response.ok) return context.next();
    const headers = new Headers(response.headers);
    headers.delete("X-Utildesk-Content-Runtime");
    headers.set("X-Utildesk-Tool-Fallback", "frozen-7a4190c4");
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return context.next();
  }
};

export const proxyRuntime = async (context, cluster = "ratgeber") => {
  const url = new URL(context.request.url);
  const upstream = new URL(`${url.pathname}${url.search}`, RUNTIME_ORIGIN);

  try {
    const response = await fetch(new Request(upstream, context.request));
    const intentionalRouteState = response.headers.get("X-Utildesk-Route-State");
    // Keep a static fallback for a path which has not been imported into D1.
    if ((response.status === 404 && !intentionalRouteState && !url.pathname.startsWith("/runtime-assets/") && !isToolAssetPath(url.pathname)) || response.status >= 500) {
      return cluster === "tools" ? frozenToolFallback(context) : context.next();
    }

    // The runtime Worker and Pages are deployed independently. Keep the
    // article presentation resilient when a newer Pages design ships before
    // the Worker bundle can be redeployed.
    if (
      context.request.method === "GET" &&
      cluster === "ratgeber" &&
      response.ok &&
      response.headers.get("content-type")?.includes("text/html")
    ) {
      const html = await response.text();
      const orderedHtml = isRatgeberIndexPath(url.pathname)
        ? sortRuntimeRatgeberIndex(html, url.pathname.startsWith("/en/"))
        : html;
      const cleanedHtml = stripDuplicatedRuntimeSecondaryImage(orderedHtml);
      if (!cleanedHtml.includes(RUNTIME_RATGEBER_STYLESHEET)) {
        const headers = new Headers(response.headers);
        headers.delete("content-length");
        headers.delete("content-encoding");
        const styledHtml = cleanedHtml.replace(
          "</head>",
          `<link rel="stylesheet" href="${RUNTIME_RATGEBER_STYLESHEET}"></head>`,
        );
        const styledResponse = new Response(styledHtml, { status: response.status, headers });
        styledResponse.headers.set("X-Utildesk-Runtime-Styles", "pages-bridge-v1");
        styledResponse.headers.set("X-Utildesk-Content-Runtime", "ratgeber-v1");
        return styledResponse;
      }
      if (cleanedHtml !== html) {
        const headers = new Headers(response.headers);
        headers.delete("content-length");
        headers.delete("content-encoding");
        const orderedResponse = new Response(cleanedHtml, { status: response.status, headers });
        orderedResponse.headers.set("X-Utildesk-Content-Runtime", "ratgeber-v1");
        return orderedResponse;
      }
    }

    const headers = new Headers(response.headers);
    headers.set("X-Utildesk-Content-Runtime", cluster === "tools" ? "tools-v1" : cluster === "tool-shell" ? "tool-shell-v1" : "ratgeber-v1");
    return new Response(response.body, { status: response.status, headers });
  } catch {
    // An upstream outage must preserve the existing Pages version instead of
    // turning an editorial page into a hard error.
    return cluster === "tools" ? frozenToolFallback(context) : context.next();
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

export const toolRuntimeIsEnabled = async (context, slug) => {
  try {
    const mode = (await context.env.RATGEBER_REVIEW?.get("content-runtime:tools")) ?? "off";
    if (mode === "on") return true;
    if (mode !== "allowlist") return false;
    const raw = await context.env.RATGEBER_REVIEW?.get("content-runtime:tools:allowlist");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) && parsed.includes(slug);
  } catch {
    // Tool runtime is opt-in. A KV read/parse failure must leave the static
    // fallback in control and must never affect the Ratgeber switch.
    return false;
  }
};

export const toolShellRuntimeIsEnabled = async (context) => {
  try {
    return (await context.env.RATGEBER_REVIEW?.get("content-runtime:tool-shell")) === "on";
  } catch {
    // Shell migration is independently opt-in and fails open to Pages.
    return false;
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

const TOOLS_INDEX_QUERY_PARAMS = new Set([
  "q",
  "sort",
  "view",
  "letter",
  "verdict",
  "category",
]);

const sanitizeToolsIndexQuery = (url) => {
  const sanitized = new URLSearchParams();
  for (const [key, value] of url.searchParams.entries()) {
    if (!TOOLS_INDEX_QUERY_PARAMS.has(key)) continue;
    const normalized = String(value || "").trim().slice(0, 160);
    if (normalized) sanitized.append(key, normalized);
  }
  return sanitized;
};

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

  if (isToolAssetPath(url.pathname)) {
    return proxyRuntime(context, "tools");
  }

  if (isRatgeberRuntimePath(url.pathname) && await runtimeIsEnabled(context)) {
    return proxyRuntime(context, "ratgeber");
  }

  const runtimeToolMachine = toolMachineRoute(url.pathname);
  if (runtimeToolMachine && await toolRuntimeIsEnabled(context, runtimeToolMachine.slug ?? "")) {
    return proxyRuntime(context, "tools");
  }

  const runtimeToolSlug = toolDetailSlug(url.pathname);
  if (runtimeToolSlug) {
    return await toolRuntimeIsEnabled(context, runtimeToolSlug)
      ? proxyRuntime(context, "tools")
      : frozenToolFallback(context);
  }

  const runtimeToolShell = toolShellRoute(url.pathname);
  if (runtimeToolShell && !url.search && await toolShellRuntimeIsEnabled(context)) {
    return proxyRuntime(context, "tool-shell");
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

    const sanitized = sanitizeToolsIndexQuery(url);
    const canonicalPath = withTrailingSlash(url.pathname);
    const canonicalSearch = sanitized.toString();
    const canonicalUrl = `${url.origin}${canonicalPath}${canonicalSearch ? `?${canonicalSearch}` : ""}`;
    const currentUrl = `${url.origin}${url.pathname}${url.search}`;

    if (canonicalUrl !== currentUrl) {
      return Response.redirect(canonicalUrl, 308);
    }

    // Catalogue controls are functional client-side state. The page keeps a
    // canonical link to /tools/, while these allow search and filters to work.
    return await toolShellRuntimeIsEnabled(context)
      ? proxyRuntime(context, "tool-shell")
      : context.next();
  }

  return Response.redirect(`${url.origin}${withTrailingSlash(url.pathname)}`, 308);
}

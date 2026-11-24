import { applyToolRoutePolicy, getToolRoutePolicyHash, TOOL_REDIRECTS, TOOL_TOMBSTONES } from "../shared/toolRoutePolicy.mjs";

const AGENT_METADATA_HEADERS = new Map([
  ["/.well-known/api-catalog", {
    "Content-Type": "application/linkset+json; profile=\"https://www.rfc-editor.org/info/rfc9727\"",
    Link: '<https://tools.utildesk.de/.well-known/api-catalog>; rel="api-catalog"',
  }],
  ["/.well-known/agent-skills/index.json", {
    "Content-Type": "application/json; charset=utf-8",
  }],
  ["/.well-known/agent-skills/utildesk-research/SKILL.md", {
    "Content-Type": "text/markdown; charset=utf-8",
  }],
]);

const agentMetadataFromNext = async (context, pathname) => {
  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex");
  for (const [name, value] of Object.entries(AGENT_METADATA_HEADERS.get(pathname) ?? {})) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

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
const RUNTIME_PREVIEW_MODE = "preview";
const TOOL_HTML_CACHE_TTL_SECONDS = 30;
const TOOL_HTML_CACHE_FORMAT = "tool-html-v1";
const FROZEN_TOOL_FALLBACK_ORIGIN = "https://utildesk-tool-fallback.pages.dev";
const FROZEN_TOOL_FALLBACK_MARKER = "frozen-7a4190c4";
const FROZEN_SNAPSHOT_HEADER = "X-Utildesk-Frozen-Snapshot";
const FROZEN_SNAPSHOT_MARKER_PATTERN = /^frozen-[a-z0-9-]{1,57}$/;
const RUNTIME_RATGEBER_STYLESHEET = "/runtime-ratgeber-detail.css?v=20260805-1";
const RECOVERY_ROBOTS_INDEX_FOLLOW =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
const RECOVERY_ROBOTS_NOINDEX_FOLLOW =
  "noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
const RECOVERY_PROOF_RATGEBER_SLUGS = new Set([
  "beste-ocr-apis-rechnungen-deutschland-2026",
  "open-source-ocr-pdfs-tesseract-ocrmypdf-paddleocr",
  "pdf-daten-extrahieren-ki-tools-apis-kosten-vergleich",
  "rechnungen-automatisch-aus-e-mails-auslesen-tools-workflows",
  "make-vs-n8n-vs-zapier-rechnungsautomatisierung",
]);
const RECOVERY_PROOF_EN_RATGEBER_SLUGS = new Set([
  "beste-ocr-apis-rechnungen-deutschland-2026",
  "open-source-ocr-pdfs-tesseract-ocrmypdf-paddleocr",
  "pdf-daten-extrahieren-ki-tools-apis-kosten-vergleich",
]);
const RECOVERY_PROOF_TOOL_SLUGS = new Set([
  "cloudconvert",
  "convertio",
  "smallpdf",
  "tesseract-ocr",
]);

const isEnglishRecoveryProofGuide = (pathname) => {
  const normalized = String(pathname || "").replace(/\/$/, "") || "/";
  const match = normalized.match(/^\/en\/ratgeber\/([^/]+)$/);
  return Boolean(match && RECOVERY_PROOF_EN_RATGEBER_SLUGS.has(match[1]));
};

const recoveryRobotsForPath = (pathname) => {
  const normalized = String(pathname || "").replace(/\/$/, "") || "/";
  if (["/", "/tools", "/methodologie", "/ratgeber"].includes(normalized)) {
    return RECOVERY_ROBOTS_INDEX_FOLLOW;
  }
  const ratgeber = normalized.match(/^\/ratgeber\/([^/]+)$/);
  if (ratgeber && RECOVERY_PROOF_RATGEBER_SLUGS.has(ratgeber[1])) {
    return RECOVERY_ROBOTS_INDEX_FOLLOW;
  }
  const englishRatgeber = normalized.match(/^\/en\/ratgeber\/([^/]+)$/);
  if (englishRatgeber && RECOVERY_PROOF_EN_RATGEBER_SLUGS.has(englishRatgeber[1])) {
    return RECOVERY_ROBOTS_INDEX_FOLLOW;
  }
  const tool = normalized.match(/^\/tools\/([^/]+)$/);
  if (tool && RECOVERY_PROOF_TOOL_SLUGS.has(tool[1])) {
    return RECOVERY_ROBOTS_INDEX_FOLLOW;
  }
  return RECOVERY_ROBOTS_NOINDEX_FOLLOW;
};

export const applyRecoveryRobotsToHtml = (html, pathname) => {
  const robots = recoveryRobotsForPath(pathname);
  const meta = `<meta name="robots" content="${robots}">`;
  if (!isEnglishRecoveryProofGuide(pathname)) {
    const withRobotsMeta = /<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*>/i.test(html)
      ? html.replace(/<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*>/gi, meta)
      : html.replace(/<\/head>/i, `${meta}</head>`);
    return {
      html: withRobotsMeta,
      indexable: robots === RECOVERY_ROBOTS_INDEX_FOLLOW,
      robots,
    };
  }

  const robotsMetaPattern = /<meta\b(?=[^>]*\bname\s*=\s*(?:"robots"|'robots'|robots(?=\s|\/?\>)))[^>]*>/gi;
  let replacedRobotsMeta = false;
  const replacedHtml = html.replace(robotsMetaPattern, () => {
    if (replacedRobotsMeta) return "";
    replacedRobotsMeta = true;
    return meta;
  });
  const withRobotsMeta = replacedRobotsMeta
    ? replacedHtml
    : html.replace(/<\/head>/i, `${meta}</head>`);
  return {
    html: withRobotsMeta,
    indexable: robots === RECOVERY_ROBOTS_INDEX_FOLLOW,
    robots,
  };
};

const applyRecoveryRobotsHeader = (headers, pathname, recoveryHtml) => {
  if (isEnglishRecoveryProofGuide(pathname)) {
    headers.set("X-Robots-Tag", recoveryHtml.robots);
  } else if (recoveryHtml.indexable) {
    headers.delete("X-Robots-Tag");
  } else {
    headers.set("X-Robots-Tag", "noindex, follow");
  }
};

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
  /^\/ratgeber\/[^/]+\/?$/.test(pathname) ||
  /^\/en\/ratgeber\/[^/]+\/?$/.test(pathname) ||
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

const isRetiredCatalogSlug = (slug) =>
  typeof slug === "string" &&
  (TOOL_TOMBSTONES.has(slug) || Object.hasOwn(TOOL_REDIRECTS, slug));

export const filterToolCatalogResponse = async (response) => {
  const headers = new Headers(response.headers);
  const readyPolicyHash = response.headers.get("X-Utildesk-Catalog-Policy-Hash");
  if (
    response.headers.get("X-Utildesk-Catalog-Ready") === "v1" &&
    response.headers.get("X-Utildesk-Catalog-Policy") === "retired-filter-v1" &&
    readyPolicyHash && readyPolicyHash === await getToolRoutePolicyHash()
  ) {
    headers.set("X-Utildesk-Catalog-Policy", "retired-filter-v1");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }

  let payload;

  try {
    payload = JSON.parse(await response.clone().text());
    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload) ||
      !Array.isArray(payload.items) ||
      typeof payload.count !== "number"
    ) {
      throw new Error("unexpected catalog shape");
    }
  } catch {
    return response;
  }

  const items = payload.items.filter((item) => !isRetiredCatalogSlug(item?.slug));
  const changed = items.length !== payload.items.length || payload.count !== items.length;
  if (changed) {
    payload.items = items;
    payload.count = items.length;
    headers.delete("content-length");
    headers.delete("content-encoding");
  }
  headers.set("X-Utildesk-Catalog-Policy", "retired-filter-v1");
  return new Response(changed ? JSON.stringify(payload) : response.body, {
    status: response.status,
    headers,
  });
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

const isPreviewRuntime = (context) => context.env?.UTILDESK_RUNTIME_MODE === RUNTIME_PREVIEW_MODE;

export const configuredRuntimeOrigin = (context) => {
  if (!isPreviewRuntime(context)) return RUNTIME_ORIGIN;
  const configured = String(context.env?.UTILDESK_RUNTIME_ORIGIN ?? "").trim();
  if (!configured) return null;
  try {
    const parsed = new URL(configured);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    const isWorkerHost = parsed.hostname.endsWith(".workers.dev");
    if (
      parsed.origin !== configured.replace(/\/$/, "") ||
      parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash ||
      (!isWorkerHost && !(loopback && ["http:", "https:"].includes(parsed.protocol))) ||
      (isWorkerHost && parsed.protocol !== "https:")
    ) return null;
    if (parsed.origin === RUNTIME_ORIGIN) return null;
    return parsed.origin;
  } catch {
    return null;
  }
};

const toolRuntimeFallback = (context) => isPreviewRuntime(context) ? context.next() : frozenToolFallback(context);

const toolHtmlCacheRequestBypasses = (request) => {
  if (request.method !== "GET") return true;
  if (new URL(request.url).search) return true;
  if (request.headers.has("authorization") || request.headers.has("cookie")) return true;
  if (request.headers.has("range")) return true;
  if (["if-match", "if-none-match", "if-modified-since", "if-unmodified-since"].some((name) => request.headers.has(name))) return true;
  if (/\b(?:no-cache|no-store|max-age=0)\b/i.test(request.headers.get("cache-control") ?? "")) return true;
  if (/\bno-cache\b/i.test(request.headers.get("pragma") ?? "")) return true;
  return ["no-store", "reload", "no-cache"].includes(request.cache);
};

const cacheableToolHtmlResponse = (response) => {
  if (response.status !== 200 || !response.ok) return false;
  if (!response.headers.get("content-type")?.toLowerCase().includes("text/html")) return false;
  if (response.headers.get("X-Utildesk-Content-Runtime") !== "tools-v1") return false;
  if (response.headers.has("location") || response.headers.has("set-cookie")) return false;
  const vary = response.headers.get("vary")?.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean) ?? [];
  if (vary.some((value) => value !== "accept-encoding")) return false;
  if (/\b(?:private|no-store|no-cache)\b/i.test(response.headers.get("cache-control") ?? "")) return false;
  return true;
};

export async function proxyToolDetailWithCache(context, slug) {
  const request = context.request;
  const url = new URL(request.url);
  const cacheEnabled = context.env?.UTILDESK_TOOL_HTML_CACHE === "on";
  const cache = globalThis.caches?.default;
  if (!cacheEnabled || !cache || toolHtmlCacheRequestBypasses(request)) return proxyRuntime(context, "tools");

  const namespace = String(context.env?.UTILDESK_TOOL_HTML_CACHE_NAMESPACE || (isPreviewRuntime(context) ? "preview" : "production"))
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80);
  const cacheUrl = new URL(url);
  cacheUrl.search = "";
  cacheUrl.searchParams.set("__utildesk_pages_tool_cache", `${namespace}:${TOOL_HTML_CACHE_FORMAT}:${slug}`);
  const cacheKey = new Request(cacheUrl, request);

  try {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const headers = new Headers(hit.headers);
      const originalCacheControl = headers.get("X-Utildesk-Page-Cache-Original-CC");
      headers.delete("X-Utildesk-Page-Cache-Original-CC");
      if (originalCacheControl === "__missing__") headers.delete("Cache-Control");
      else if (originalCacheControl != null) headers.set("Cache-Control", originalCacheControl);
      headers.set("X-Utildesk-Pages-Tool-Cache", "HIT");
      return new Response(hit.body, { status: hit.status, statusText: hit.statusText, headers });
    }
  } catch {
    const response = await proxyRuntime(context, "tools");
    const headers = new Headers(response.headers);
    headers.set("X-Utildesk-Pages-Tool-Cache", "BYPASS");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }

  const response = await proxyRuntime(context, "tools");
  const headers = new Headers(response.headers);
  headers.set("X-Utildesk-Pages-Tool-Cache", "MISS");
  const result = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  if (!cacheableToolHtmlResponse(result)) return result;

  const cacheHeaders = new Headers(result.headers);
  cacheHeaders.set("X-Utildesk-Page-Cache-Original-CC", cacheHeaders.get("Cache-Control") ?? "__missing__");
  cacheHeaders.set("Cache-Control", `public, max-age=0, s-maxage=${TOOL_HTML_CACHE_TTL_SECONDS}`);
  const cacheResponse = new Response(result.clone().body, {
    status: result.status,
    statusText: result.statusText,
    headers: cacheHeaders,
  });
  try {
    await cache.put(cacheKey, cacheResponse);
  } catch {
    // Cache failures only reduce the optimization; they never replace the
    // successful upstream response or extend stale content beyond the TTL.
  }
  return result;
};

export const frozenToolFallback = async (context) => {
  const url = new URL(context.request.url);
  const frozen = new URL(`${url.pathname}${url.search}`, FROZEN_TOOL_FALLBACK_ORIGIN);
  try {
    const response = await fetch(new Request(frozen, context.request));
    if (!response.ok) return context.next();
    const headers = new Headers(response.headers);
    headers.delete("X-Utildesk-Content-Runtime");
    const snapshotMarker = response.headers.get(FROZEN_SNAPSHOT_HEADER);
    headers.set(
      "X-Utildesk-Tool-Fallback",
      snapshotMarker && FROZEN_SNAPSHOT_MARKER_PATTERN.test(snapshotMarker)
        ? snapshotMarker
        : FROZEN_TOOL_FALLBACK_MARKER,
    );
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return context.next();
  }
};

export const proxyRuntime = async (context, cluster = "ratgeber") => {
  const url = new URL(context.request.url);
  const runtimeOrigin = configuredRuntimeOrigin(context);
  if (!runtimeOrigin) return cluster === "tools" ? toolRuntimeFallback(context) : context.next();
  const upstream = new URL(`${url.pathname}${url.search}`, runtimeOrigin);

  try {
    const upstreamRequest = new Request(upstream, {
      method: context.request.method,
      headers: context.request.headers,
      redirect: cluster === "tools" && toolDetailSlug(url.pathname) ? "manual" : context.request.redirect,
    });
    const response = await fetch(upstreamRequest);
    const intentionalRouteState = response.headers.get("X-Utildesk-Route-State");
    // A runtime miss can be returned as a redirect to /404 rather than a
    // plain 404. Let a freshly deployed static article serve as the safe
    // fallback while preserving a real 404 when the static route is absent.
    if (
      cluster === "ratgeber" &&
      response.status >= 300 &&
      response.status < 400 &&
      new URL(response.headers.get("location") || "", upstream).pathname === "/404"
    ) {
      const fallback = await context.next();
      if (fallback.ok) return fallback;
    }
    // Keep a static fallback for a path which has not been imported into D1.
    if ((response.status === 404 && !intentionalRouteState && !url.pathname.startsWith("/runtime-assets/") && !isToolAssetPath(url.pathname)) || response.status >= 500) {
      return cluster === "tools" ? toolRuntimeFallback(context) : context.next();
    }

    if (
      context.request.method === "HEAD" &&
      cluster === "ratgeber" &&
      isEnglishRecoveryProofGuide(url.pathname) &&
      response.ok &&
      response.headers.get("content-type")?.includes("text/html")
    ) {
      const headers = new Headers(response.headers);
      headers.set("X-Robots-Tag", RECOVERY_ROBOTS_INDEX_FOLLOW);
      headers.set("X-Utildesk-Content-Runtime", "ratgeber-v1");
      return new Response(null, { status: response.status, statusText: response.statusText, headers });
    }

    // The runtime Worker and Pages are deployed independently. Keep the
    // article presentation resilient when a newer Pages design ships before
    // the Worker bundle can be redeployed.
    if (
      context.request.method === "GET" &&
      (cluster === "ratgeber" || cluster === "tools" || cluster === "tool-shell") &&
      response.ok &&
      response.headers.get("content-type")?.includes("text/html")
    ) {
      const html = await response.text();
      const orderedHtml = isRatgeberIndexPath(url.pathname)
        ? sortRuntimeRatgeberIndex(html, url.pathname.startsWith("/en/"))
        : html;
      const cleanedHtml = stripDuplicatedRuntimeSecondaryImage(orderedHtml);
      const recoveryHtml = applyRecoveryRobotsToHtml(cleanedHtml, url.pathname);
      const runtimeHtml = recoveryHtml.html;
      if (cluster === "ratgeber" && !runtimeHtml.includes(RUNTIME_RATGEBER_STYLESHEET)) {
        const headers = new Headers(response.headers);
        headers.delete("content-length");
        headers.delete("content-encoding");
        applyRecoveryRobotsHeader(headers, url.pathname, recoveryHtml);
        const styledHtml = runtimeHtml.replace(
          "</head>",
          `<link rel="stylesheet" href="${RUNTIME_RATGEBER_STYLESHEET}"></head>`,
        );
        const styledResponse = new Response(styledHtml, { status: response.status, statusText: response.statusText, headers });
        styledResponse.headers.set("X-Utildesk-Runtime-Styles", "pages-bridge-v1");
        styledResponse.headers.set("X-Utildesk-Content-Runtime", "ratgeber-v1");
        return styledResponse;
      }

      const headers = new Headers(response.headers);
      headers.delete("content-length");
      headers.delete("content-encoding");
      applyRecoveryRobotsHeader(headers, url.pathname, recoveryHtml);
      headers.set("X-Utildesk-Content-Runtime", cluster === "tools" ? "tools-v1" : cluster === "tool-shell" ? "tool-shell-v1" : "ratgeber-v1");
      const responseBody = [204, 205, 304].includes(response.status) ? null : runtimeHtml;
      return new Response(responseBody, { status: response.status, statusText: response.statusText, headers });
    }

    if (
      context.request.method === "GET" &&
      cluster === "tools" &&
      response.ok &&
      response.headers.get("content-type")?.includes("application/json") &&
      toolMachineRoute(url.pathname)?.kind === "catalog"
    ) {
      const catalogResponse = await filterToolCatalogResponse(response);
      const headers = new Headers(catalogResponse.headers);
      headers.set("X-Robots-Tag", "noindex");
      headers.set("X-Utildesk-Content-Runtime", "tools-v1");
      return new Response(catalogResponse.body, { status: catalogResponse.status, headers });
    }

    const headers = new Headers(response.headers);
    if (cluster === "tools" && toolMachineRoute(url.pathname)) {
      headers.set("X-Robots-Tag", "noindex");
    }
    headers.set("X-Utildesk-Content-Runtime", cluster === "tools" ? "tools-v1" : cluster === "tool-shell" ? "tool-shell-v1" : "ratgeber-v1");
    return new Response(response.body, { status: response.status, headers });
  } catch {
    // An upstream outage must preserve the existing Pages version instead of
    // turning an editorial page into a hard error.
    return cluster === "tools" ? toolRuntimeFallback(context) : context.next();
  }
};

const runtimeIsEnabled = async (context) => {
  if (isPreviewRuntime(context)) return context.env?.UTILDESK_RATGEBER_PREVIEW_ENABLED === "on";
  try {
    // Set this key to "off" for an instant Pages-side rollback. The missing
    // key intentionally means enabled, so first rollout needs no KV mutation.
    return (await context.env.RATGEBER_REVIEW?.get("content-runtime:ratgeber")) !== "off";
  } catch {
    return true;
  }
};

export const toolRuntimeIsEnabled = async (context, slug) => {
  if (isPreviewRuntime(context)) return context.env?.UTILDESK_TOOL_RUNTIME_PREVIEW_ENABLED === "on";
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
  if (isPreviewRuntime(context)) return context.env?.UTILDESK_TOOL_SHELL_PREVIEW_ENABLED === "on";
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

export const redirectPreviewHost = (url) => {
  if (url.hostname.toLowerCase() !== "utildesk-motia.pages.dev") return null;
  const target = new URL(`${url.pathname}${url.search}`, "https://tools.utildesk.de");
  return Response.redirect(target.toString(), 301);
};

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return context.next();
  }

  const url = new URL(request.url);
  const previewRedirect = redirectPreviewHost(url);
  if (previewRedirect && !isPreviewRuntime(context)) return previewRedirect;
  if (AGENT_METADATA_HEADERS.has(url.pathname)) return agentMetadataFromNext(context, url.pathname);
  const policyResponse = applyToolRoutePolicy(request);
  if (policyResponse) return policyResponse;
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
      ? proxyToolDetailWithCache(context, runtimeToolSlug)
      : toolRuntimeFallback(context);
  }

  const runtimeToolShell = toolShellRoute(url.pathname);
  if (runtimeToolShell && runtimeToolShell.kind !== "homepage" && !url.search && await toolShellRuntimeIsEnabled(context)) {
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

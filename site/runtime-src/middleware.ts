import { defineMiddleware } from "astro:middleware";
import { RENDERER_CACHE_VERSION } from "./generated/cacheVersion";
import { getRuntimeCacheIdentity } from "./lib/runtimeContent";

const EDGE_CACHE_CONTROL = "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.request.method !== "GET") return next();

  let identity;
  try {
    identity = await getRuntimeCacheIdentity(context.url.pathname);
  } catch {
    // A D1 outage must not turn a cache optimization into a page outage.
    return next();
  }
  if (!identity && !context.url.pathname.startsWith("/runtime-preview/")) return next();

  const cacheKeyUrl = new URL(context.url);
  cacheKeyUrl.searchParams.set("__utildesk_renderer", RENDERER_CACHE_VERSION);
  if (identity) cacheKeyUrl.searchParams.set("__utildesk_content", identity.version);
  const cacheKey = new Request(cacheKeyUrl, context.request);
  const cached = await caches.default.match(cacheKey);
  if (cached) {
    const response = new Response(cached.body, cached);
    response.headers.set("X-Utildesk-Cache", "HIT");
    return response;
  }

  const response = await next();
  response.headers.set("Cache-Control", EDGE_CACHE_CONTROL);
  response.headers.set("X-Utildesk-Cache", "MISS");
  response.headers.set("X-Utildesk-Renderer", RENDERER_CACHE_VERSION);
  if (identity) {
    response.headers.set("X-Utildesk-Content-Runtime", `${identity.cluster}-v2`);
    response.headers.set("X-Utildesk-Content-Version", identity.version);
    if (identity.revision != null) response.headers.set("X-Utildesk-Source-Revision", String(identity.revision));
    if (identity.sourceHash) response.headers.set("X-Utildesk-Source-Hash", identity.sourceHash);
  }
  if (response.ok) context.locals.cfContext.waitUntil(caches.default.put(cacheKey, response.clone()));
  return response;
});

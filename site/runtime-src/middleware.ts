import { defineMiddleware } from "astro:middleware";
import { RENDERER_CACHE_VERSION } from "./generated/cacheVersion";
import { getRatgeberCacheVersion } from "./lib/runtimeContent";

const EDGE_CACHE_CONTROL = "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.request.method !== "GET") return next();

  let contentVersion: string | null;
  try {
    contentVersion = await getRatgeberCacheVersion(context.url.pathname);
  } catch {
    // A D1 outage must not turn a cache optimization into a page outage.
    return next();
  }
  if (!contentVersion && !context.url.pathname.startsWith("/runtime-preview/")) return next();

  const cacheKeyUrl = new URL(context.url);
  cacheKeyUrl.searchParams.set("__utildesk_renderer", RENDERER_CACHE_VERSION);
  if (contentVersion) cacheKeyUrl.searchParams.set("__utildesk_content", contentVersion);
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
  if (response.ok) context.locals.cfContext.waitUntil(caches.default.put(cacheKey, response.clone()));
  return response;
});

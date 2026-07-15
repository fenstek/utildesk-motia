import { defineMiddleware } from "astro:middleware";
import { RENDERER_CACHE_VERSION } from "./generated/cacheVersion";
import { getRuntimeCacheIdentity } from "./lib/runtimeContent";

// Route keys include both renderer and D1 source revisions, so a long edge TTL
// cannot serve stale content after a publish. It keeps the full long-tail set
// warm without a five-minute expiry wave forcing concurrent Astro renders.
const EDGE_CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

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
  // Backpressure cold renders on their cache write. Queuing thousands of
  // cloned HTML bodies with waitUntil can exhaust an isolate before the edge
  // cache drains, which presents as intermittent Worker 1102 responses.
  if (response.ok) await caches.default.put(cacheKey, response.clone());
  return response;
});

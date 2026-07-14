import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getRuntimeToolAsset } from "../../../lib/runtimeContent";

export const prerender = false;
const IMMUTABLE = "public, max-age=31536000, immutable";
type AssetBucket = { get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer>; httpEtag?: string } | null> };

const sha256 = async (bytes: ArrayBuffer) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
  .map((value) => value.toString(16).padStart(2, "0")).join("");

export const GET: APIRoute = async ({ params }) => {
  const hash = params.hash ?? "";
  const name = params.name ?? "";
  if (!/^[a-f0-9]{64}$/.test(hash) || !/^[a-z0-9-]+\.webp$/.test(name)) return new Response("Not found", { status: 404 });
  const projection = await getRuntimeToolAsset(hash);
  if (!projection || projection.fallbackPath.split("/").pop() !== name) return new Response("Not found", { status: 404 });

  const bucket = (env as unknown as { TOOL_ASSETS?: AssetBucket }).TOOL_ASSETS;
  const object = bucket ? await bucket.get(projection.key) : null;
  if (object) {
    const bytes = await object.arrayBuffer();
    if (await sha256(bytes) !== hash) return new Response("Asset integrity failure", { status: 502 });
    return new Response(bytes, { headers: { "Content-Type": "image/webp", "Cache-Control": IMMUTABLE, ETag: object.httpEtag || `"${hash}"`, "X-Utildesk-Asset-Source": "r2" } });
  }

  const fallback = await fetch(`https://tools.utildesk.de${projection.fallbackPath}`);
  if (!fallback.ok) return new Response("Asset unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  const bytes = await fallback.arrayBuffer();
  if (await sha256(bytes) !== hash) return new Response("Asset integrity failure", { status: 502, headers: { "Cache-Control": "no-store" } });
  return new Response(bytes, { headers: { "Content-Type": "image/webp", "Cache-Control": IMMUTABLE, ETag: `"${hash}"`, "X-Utildesk-Asset-Source": "pages-fallback" } });
};

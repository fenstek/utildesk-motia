import { readAsset } from "./_lib/storage.js";

export async function onRequest({ env, request }) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  const name = url.searchParams.get("name");
  const asset = await readAsset(env, jobId, name);
  if (!asset) {
    return new Response("Asset not found", { status: 404 });
  }

  return new Response(asset.body, {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

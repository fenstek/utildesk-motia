import type { APIRoute } from "astro";
import { getRuntimeCollectionRevision, getRuntimeToolCatalogManifest, listRuntimeContentEntries, runtimeToolCatalogBucket } from "../../../lib/runtimeContent";
import { buildRuntimeToolCatalog, machineResponse, prebuiltRuntimeToolCatalogResponse, runtimeToolCatalogETag } from "../../../lib/toolMachineRuntime";
import { getToolRoutePolicyHash } from "../../../../shared/toolRoutePolicy.mjs";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  if (params.locale !== "en") return new Response("Not found", { status: 404 });
  const policyHash = await getToolRoutePolicyHash();
  const manifest = await getRuntimeToolCatalogManifest("en");
  const ready = await prebuiltRuntimeToolCatalogResponse(
    request,
    "en",
    manifest,
    runtimeToolCatalogBucket(),
    policyHash,
  );
  if (ready) return ready;

  const [entries, primaryEntries, collection, primaryCollection] = await Promise.all([
    listRuntimeContentEntries("tool", "en"),
    listRuntimeContentEntries("tool", "de"),
    getRuntimeCollectionRevision("tool", "en"),
    getRuntimeCollectionRevision("tool", "de"),
  ]);
  const payload = buildRuntimeToolCatalog(entries, "en", collection.updatedAt, primaryEntries);
  const body = JSON.stringify(payload, null, 2);
  const etag = await runtimeToolCatalogETag("en", collection.revision, primaryCollection.revision, body);
  return machineResponse(request, body, "application/json; charset=utf-8", etag);
};

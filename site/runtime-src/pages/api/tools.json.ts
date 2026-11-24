import type { APIRoute } from "astro";
import { getRuntimeCollectionRevision, getRuntimeToolCatalogManifest, listRuntimeContentEntries, runtimeToolCatalogBucket } from "../../lib/runtimeContent";
import { buildRuntimeToolCatalog, machineResponse, prebuiltRuntimeToolCatalogResponse, runtimeToolCatalogETag } from "../../lib/toolMachineRuntime";
import { getToolRoutePolicyHash } from "../../../shared/toolRoutePolicy.mjs";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const policyHash = await getToolRoutePolicyHash();
  const manifest = await getRuntimeToolCatalogManifest("de");
  const ready = await prebuiltRuntimeToolCatalogResponse(
    request,
    "de",
    manifest,
    runtimeToolCatalogBucket(),
    policyHash,
  );
  if (ready) return ready;

  const [entries, collection] = await Promise.all([
    listRuntimeContentEntries("tool", "de"),
    getRuntimeCollectionRevision("tool", "de"),
  ]);
  const payload = buildRuntimeToolCatalog(entries, "de", collection.updatedAt);
  const body = JSON.stringify(payload, null, 2);
  const etag = await runtimeToolCatalogETag("de", collection.revision, collection.revision, body);
  return machineResponse(request, body, "application/json; charset=utf-8", etag);
};

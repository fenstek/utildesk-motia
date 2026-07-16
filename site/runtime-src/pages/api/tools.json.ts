import type { APIRoute } from "astro";
import { getRuntimeCollectionRevision, listRuntimeContentEntries } from "../../lib/runtimeContent";
import { buildRuntimeToolCatalog, machineResponse } from "../../lib/toolMachineRuntime";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const [entries, collection] = await Promise.all([
    listRuntimeContentEntries("tool", "de"),
    getRuntimeCollectionRevision("tool", "de"),
  ]);
  const payload = buildRuntimeToolCatalog(entries, "de", collection.updatedAt);
  return machineResponse(request, JSON.stringify(payload, null, 2), "application/json; charset=utf-8", `W/\"tool-de-${collection.revision}\"`);
};

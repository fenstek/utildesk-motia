import type { APIRoute } from "astro";
import { getRuntimeCollectionRevision, listRuntimeContentEntries } from "../../../lib/runtimeContent";
import { buildRuntimeToolCatalog, machineResponse } from "../../../lib/toolMachineRuntime";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  if (params.locale !== "en") return new Response("Not found", { status: 404 });
  const [entries, primaryEntries, collection] = await Promise.all([
    listRuntimeContentEntries("tool", "en"),
    listRuntimeContentEntries("tool", "de"),
    getRuntimeCollectionRevision("tool", "en"),
  ]);
  const payload = buildRuntimeToolCatalog(entries, "en", collection.updatedAt, primaryEntries);
  return machineResponse(request, JSON.stringify(payload, null, 2), "application/json; charset=utf-8", `W/\"tool-en-${collection.revision}\"`);
};

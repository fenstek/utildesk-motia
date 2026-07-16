import type { APIRoute } from "astro";
import { getRuntimeContentEntry } from "../../../lib/runtimeContent";
import { buildRuntimeToolJson, machineResponse, runtimeEntryIsPublic, unavailableMachineResponse } from "../../../lib/toolMachineRuntime";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const entry = await getRuntimeContentEntry("tool", "de", params.slug ?? "");
  if (!runtimeEntryIsPublic(entry)) return unavailableMachineResponse(entry);
  const payload = buildRuntimeToolJson(entry, "de");
  return machineResponse(request, JSON.stringify(payload, null, 2), "application/json; charset=utf-8", `\"${entry.sourceHash}-${entry.revision}-json\"`, {
    "X-Utildesk-Source-Revision": String(entry.revision),
    "X-Utildesk-Source-Hash": entry.sourceHash,
  });
};

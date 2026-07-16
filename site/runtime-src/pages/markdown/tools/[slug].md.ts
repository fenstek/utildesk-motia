import type { APIRoute } from "astro";
import { getRuntimeContentEntry } from "../../../lib/runtimeContent";
import { buildRuntimeToolMarkdown, machineResponse, runtimeEntryIsPublic, unavailableMachineResponse } from "../../../lib/toolMachineRuntime";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const entry = await getRuntimeContentEntry("tool", "de", params.slug ?? "");
  if (!runtimeEntryIsPublic(entry)) return unavailableMachineResponse(entry);
  return machineResponse(request, buildRuntimeToolMarkdown(entry, "de"), "text/markdown; charset=utf-8", `\"${entry.sourceHash}-${entry.revision}-markdown\"`, {
    "X-Utildesk-Source-Revision": String(entry.revision),
    "X-Utildesk-Source-Hash": entry.sourceHash,
  });
};

import type { APIRoute } from "astro";
import { getRuntimeContentEntry } from "../../../../lib/runtimeContent";
import { buildRuntimeToolMarkdown, machineResponse, runtimeEntryIsPublic, unavailableMachineResponse } from "../../../../lib/toolMachineRuntime";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  if (params.locale !== "en") return new Response("Not found", { status: 404 });
  const [entry, primaryEntry] = await Promise.all([
    getRuntimeContentEntry("tool", "en", params.slug ?? ""),
    getRuntimeContentEntry("tool", "de", params.slug ?? ""),
  ]);
  if (!runtimeEntryIsPublic(entry)) return unavailableMachineResponse(entry);
  if (!runtimeEntryIsPublic(primaryEntry)) return unavailableMachineResponse(primaryEntry);
  return machineResponse(request, buildRuntimeToolMarkdown(entry, "en", primaryEntry), "text/markdown; charset=utf-8", `\"${entry.sourceHash}-${entry.revision}-markdown\"`, {
    "X-Utildesk-Source-Revision": String(entry.revision),
    "X-Utildesk-Source-Hash": entry.sourceHash,
  });
};

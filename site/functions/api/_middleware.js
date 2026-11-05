import { noindexFromNext } from "../_lib/machineReadableHeaders.js";
import { applyToolRoutePolicy } from "../../shared/toolRoutePolicy.mjs";

export async function onRequest(context) {
  const policyResponse = applyToolRoutePolicy(context.request);
  if (policyResponse) return policyResponse;
  const response = await noindexFromNext(context);
  if (new URL(context.request.url).pathname !== "/api/README.md") return response;

  const headers = new Headers(response.headers);
  headers.set("Content-Type", "text/markdown; charset=utf-8");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

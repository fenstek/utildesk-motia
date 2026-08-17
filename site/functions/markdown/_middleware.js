import { noindexFromNext } from "../_lib/machineReadableHeaders.js";
import { applyToolRoutePolicy } from "../../shared/toolRoutePolicy.mjs";

export async function onRequest(context) {
  const policyResponse = applyToolRoutePolicy(context.request);
  if (policyResponse) return policyResponse;
  return noindexFromNext(context);
}

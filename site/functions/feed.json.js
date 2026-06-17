import { noindexFromNext } from "./_lib/machineReadableHeaders.js";

export async function onRequest(context) {
  return noindexFromNext(context);
}

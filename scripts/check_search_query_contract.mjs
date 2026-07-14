import assert from "node:assert/strict";
import { onRequest as onMiddlewareRequest } from "../site/functions/_middleware.js";
import { onRequest as onToolsRequest } from "../site/functions/tools.js";

const run = async (handler, rawUrl) => {
  let continued = false;
  const response = await handler({
    request: new Request(rawUrl),
    env: {},
    next() {
      continued = true;
      return new Response("ok");
    },
  });
  return { continued, response };
};

const deSearch = await run(
  onMiddlewareRequest,
  "https://tools.utildesk.de/tools/?q=browser+automation",
);
assert.equal(deSearch.continued, true, "DE search query must reach the catalogue");

const enSearch = await run(
  onMiddlewareRequest,
  "https://tools.utildesk.de/en/tools/?q=browser+automation&sort=pop",
);
assert.equal(enSearch.continued, true, "EN search query must reach the catalogue");

const missingSlash = await run(
  onMiddlewareRequest,
  "https://tools.utildesk.de/tools?q=ChatGPT",
);
assert.equal(missingSlash.response.status, 308);
assert.equal(
  missingSlash.response.headers.get("location"),
  "https://tools.utildesk.de/tools/?q=ChatGPT",
  "Trailing-slash normalization must preserve q",
);

const trackingNoise = await run(
  onMiddlewareRequest,
  "https://tools.utildesk.de/tools/?utm_source=test",
);
assert.equal(trackingNoise.response.status, 308);
assert.equal(
  trackingNoise.response.headers.get("location"),
  "https://tools.utildesk.de/tools/",
  "Unknown query parameters must still be stripped",
);

const routeFunction = await run(
  onToolsRequest,
  "https://tools.utildesk.de/tools/?q=browser+automation&sort=new",
);
assert.equal(routeFunction.continued, true, "Route function must not strip catalogue state");

console.log("Search query contract passed.");

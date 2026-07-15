import assert from "node:assert/strict";
import test from "node:test";

import { onRequest as onEnglishApiRequest } from "../../functions/en/api/_middleware.js";
import { onRequest as onEnglishMarkdownRequest } from "../../functions/en/markdown/_middleware.js";

const context = () => ({
  next: async () => new Response("ok", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }),
});

for (const [label, handler] of [
  ["English API", onEnglishApiRequest],
  ["English Markdown", onEnglishMarkdownRequest],
]) {
  test(`${label} responses are fetchable and noindex`, async () => {
    const response = await handler(context());

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex");
    assert.equal(await response.text(), "ok");
  });
}

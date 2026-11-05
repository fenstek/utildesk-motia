import assert from "node:assert/strict";
import test from "node:test";

import { onRequest as onEnglishApiRequest } from "../../functions/en/api/_middleware.js";
import { onRequest as onEnglishMarkdownRequest } from "../../functions/en/markdown/_middleware.js";
import { onRequest as onAgentMetadataRequest } from "../../functions/_middleware.js";
import { onRequest as onApiRequest } from "../../functions/api/_middleware.js";

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

test("public API reference stays Markdown, fetchable, and noindex", async () => {
  const response = await onApiRequest({
    request: new Request("https://tools.utildesk.de/api/README.md"),
    next: async () => new Response("# API reference", {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=60",
      },
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex");
  assert.equal(response.headers.get("Cache-Control"), "public, max-age=60");
  assert.equal(await response.text(), "# API reference");
});

for (const [pathname, expectedType] of [
  ["/.well-known/api-catalog", 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"'],
  ["/.well-known/agent-skills/index.json", "application/json; charset=utf-8"],
  ["/.well-known/agent-skills/utildesk-research/SKILL.md", "text/markdown; charset=utf-8"],
]) {
  for (const method of ["GET", "HEAD"]) {
    test(`${method} ${pathname} stays fetchable and noindex`, async () => {
      const response = await onAgentMetadataRequest({
        request: new Request(`https://tools.utildesk.de${pathname}`, { method }),
        next: async () => new Response(method === "HEAD" ? null : "metadata", {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60",
          },
        }),
        env: {},
      });

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("X-Robots-Tag"), "noindex");
      assert.equal(response.headers.get("Content-Type"), expectedType);
      assert.equal(response.headers.get("Cache-Control"), "public, max-age=60");
      if (pathname === "/.well-known/api-catalog") {
        assert.equal(response.headers.get("Link"), '<https://tools.utildesk.de/.well-known/api-catalog>; rel="api-catalog"');
      }
      assert.equal(await response.text(), method === "HEAD" ? "" : "metadata");
    });
  }
}

for (const pathname of [
  "/.well-known/api-catalog",
  "/.well-known/agent-skills/index.json",
  "/.well-known/agent-skills/utildesk-research/SKILL.md",
]) {
  for (const method of ["GET", "HEAD"]) {
    test(`${method} ${pathname} redirects preview host to the canonical site`, async () => {
      let nextCalled = false;
      const response = await onAgentMetadataRequest({
        request: new Request(`https://utildesk-motia.pages.dev${pathname}?source=preview`, { method }),
        next: async () => {
          nextCalled = true;
          return new Response("metadata");
        },
        env: {},
      });

      assert.equal(response.status, 301);
      assert.equal(response.headers.get("Location"), `https://tools.utildesk.de${pathname}?source=preview`);
      assert.equal(response.headers.has("X-Robots-Tag"), false);
      assert.equal(nextCalled, false);
    });
  }
}

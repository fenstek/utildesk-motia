import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { frozenToolFallback, onRequest, toolDetailSlug, toolMachineRoute, toolRuntimeIsEnabled, toolShellRoute, toolShellRuntimeIsEnabled } from "../../functions/_middleware.js";
import { listRuntimeEntries } from "../runtime-content.mjs";

const originalFetch = globalThis.fetch;

const contextFor = ({ pathname = "/tools/chatgpt/", values = {}, nextBody = "static" } = {}) => {
  let nextCalls = 0;
  const context = {
    request: new Request(`https://tools.utildesk.de${pathname}`),
    env: {
      RATGEBER_REVIEW: {
        get: async (key) => Object.hasOwn(values, key) ? values[key] : null,
      },
    },
    next: async () => {
      nextCalls += 1;
      return new Response(nextBody, { status: 200, headers: { "X-Static-Fallback": "1" } });
    },
  };
  return { context, nextCalls: () => nextCalls };
};

test.after(() => {
  globalThis.fetch = originalFetch;
});

test("tool route parser accepts only canonical DE/EN detail paths", () => {
  assert.equal(toolDetailSlug("/tools/chatgpt/"), "chatgpt");
  assert.equal(toolDetailSlug("/en/tools/chatgpt/"), "chatgpt");
  assert.equal(toolDetailSlug("/tools/"), null);
  assert.equal(toolDetailSlug("/tools/tag/ai/"), null);
  assert.equal(toolDetailSlug("/api/tools/chatgpt.json"), null);
});

test("tool machine parser accepts only JSON catalogs/details and Markdown details", () => {
  assert.deepEqual(toolMachineRoute("/api/tools.json"), { slug: null, kind: "catalog" });
  assert.deepEqual(toolMachineRoute("/en/api/tools.json"), { slug: null, kind: "catalog" });
  assert.deepEqual(toolMachineRoute("/api/tools/chatgpt.json"), { slug: "chatgpt", kind: "json" });
  assert.deepEqual(toolMachineRoute("/en/markdown/tools/chatgpt.md"), { slug: "chatgpt", kind: "markdown" });
  assert.equal(toolMachineRoute("/api/ratgeber.json"), null);
  assert.equal(toolMachineRoute("/api/tools/../secret.json"), null);
});

test("tool shell parser includes only homepage, index, category and tag routes", () => {
  for (const pathname of ["/", "/en/", "/tools/", "/en/tools/", "/category/", "/category/entwickler-tools/", "/en/tools/tag/ai/"]) {
    assert.ok(toolShellRoute(pathname), pathname);
  }
  for (const pathname of ["/tools/chatgpt/", "/ratgeber/", "/api/tools.json", "/category/../secret/"]) {
    assert.equal(toolShellRoute(pathname), null, pathname);
  }
});

test("the first production cohort contains 20 unique active DE/EN slugs", async () => {
  const [allowlist, de, en] = await Promise.all([
    readFile(new URL("../../runtime/allowlists/tools-20.json", import.meta.url), "utf8").then(JSON.parse),
    listRuntimeEntries({ kind: "tool", locale: "de" }),
    listRuntimeEntries({ kind: "tool", locale: "en" }),
  ]);
  assert.equal(allowlist.length, 20);
  assert.equal(new Set(allowlist).size, 20);
  const deActive = new Set(de.map(({ slug }) => slug));
  const enActive = new Set(en.map(({ slug }) => slug));
  assert.deepEqual(allowlist.filter((slug) => !deActive.has(slug) || !enActive.has(slug)), []);
});

test("the second production cohort contains the pilot and 100 unique active DE/EN slugs", async () => {
  const [pilot, allowlist, de, en] = await Promise.all([
    readFile(new URL("../../runtime/allowlists/tools-20.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../../runtime/allowlists/tools-100.json", import.meta.url), "utf8").then(JSON.parse),
    listRuntimeEntries({ kind: "tool", locale: "de" }),
    listRuntimeEntries({ kind: "tool", locale: "en" }),
  ]);
  assert.equal(allowlist.length, 100);
  assert.equal(new Set(allowlist).size, 100);
  assert.deepEqual(pilot.filter((slug) => !allowlist.includes(slug)), []);
  const deActive = new Set(de.map(({ slug }) => slug));
  const enActive = new Set(en.map(({ slug }) => slug));
  assert.deepEqual(allowlist.filter((slug) => !deActive.has(slug) || !enActive.has(slug)), []);
});

test("tool runtime defaults off and fails closed on malformed KV", async () => {
  assert.equal(await toolRuntimeIsEnabled(contextFor().context, "chatgpt"), false);
  assert.equal(await toolRuntimeIsEnabled(contextFor({ values: {
    "content-runtime:tools": "allowlist",
    "content-runtime:tools:allowlist": "not-json",
  } }).context, "chatgpt"), false);
});

test("tool shell has an independent opt-in switch which fails closed", async () => {
  assert.equal(await toolShellRuntimeIsEnabled(contextFor().context), false);
  assert.equal(await toolShellRuntimeIsEnabled(contextFor({ values: { "content-runtime:tool-shell": "on" } }).context), true);
  const context = contextFor().context;
  context.env.RATGEBER_REVIEW.get = async () => { throw new Error("KV unavailable"); };
  assert.equal(await toolShellRuntimeIsEnabled(context), false);
});

test("tool shell proxies independently and fails open to the Pages shell", async () => {
  globalThis.fetch = async () => new Response("runtime shell", { status: 200, headers: { "Content-Type": "text/html" } });
  const enabled = contextFor({ pathname: "/category/entwickler-tools/", values: { "content-runtime:tool-shell": "on", "content-runtime:tools": "off" } });
  const response = await onRequest(enabled.context);
  assert.equal(response.headers.get("X-Utildesk-Content-Runtime"), "tool-shell-v1");
  assert.equal(await response.text(), "runtime shell");
  assert.equal(enabled.nextCalls(), 0);

  globalThis.fetch = async () => new Response("runtime failure", { status: 503 });
  const failed = contextFor({ pathname: "/tools/", values: { "content-runtime:tool-shell": "on" } });
  assert.equal(await (await onRequest(failed.context)).text(), "static");
  assert.equal(failed.nextCalls(), 1);
});

test("allowlist proxies both locales and leaves other tools static", async () => {
  const values = {
    "content-runtime:tools": "allowlist",
    "content-runtime:tools:allowlist": JSON.stringify(["chatgpt"]),
  };
  let fetchCalls = 0;
  globalThis.fetch = async (request) => {
    fetchCalls += 1;
    if (new URL(request.url).hostname === "utildesk-tool-fallback.pages.dev") {
      return new Response("frozen", { status: 200 });
    }
    return new Response(`runtime:${new URL(request.url).pathname}`, { status: 200, headers: { "Content-Type": "text/html" } });
  };

  for (const pathname of ["/tools/chatgpt/", "/en/tools/chatgpt/"]) {
    const fixture = contextFor({ pathname, values });
    const response = await onRequest(fixture.context);
    assert.equal(response.headers.get("X-Utildesk-Content-Runtime"), "tools-v1");
    assert.equal(await response.text(), `runtime:${pathname}`);
    assert.equal(fixture.nextCalls(), 0);
  }

  const excluded = contextFor({ pathname: "/tools/claude/", values });
  const response = await onRequest(excluded.context);
  assert.equal(await response.text(), "frozen");
  assert.equal(response.headers.get("X-Utildesk-Tool-Fallback"), "frozen-7a4190c4");
  assert.equal(excluded.nextCalls(), 0);
  assert.equal(fetchCalls, 3);
});

test("all-route mode proxies tool machine endpoints while off mode keeps the static mirror", async () => {
  globalThis.fetch = async (request) => new Response(`runtime:${new URL(request.url).pathname}`, {
    status: 200,
    headers: { "Content-Type": "application/json", "X-Robots-Tag": "noindex" },
  });
  for (const pathname of ["/api/tools.json", "/en/api/tools.json", "/api/tools/chatgpt.json", "/en/markdown/tools/chatgpt.md"]) {
    const response = await onRequest(contextFor({ pathname, values: { "content-runtime:tools": "on" } }).context);
    assert.equal(response.headers.get("X-Utildesk-Content-Runtime"), "tools-v1");
    assert.equal(await response.text(), `runtime:${pathname}`);
  }
  const staticResponse = await onRequest(contextFor({ pathname: "/api/tools/chatgpt.json", values: { "content-runtime:tools": "off" } }).context);
  assert.equal(await staticResponse.text(), "static");
});

test("tool upstream 404, 5xx and exception fail open to the static route", async () => {
  const values = { "content-runtime:tools": "on" };
  for (const behavior of [404, 503, "throw"]) {
    globalThis.fetch = async (request) => {
      if (new URL(request.url).hostname === "utildesk-tool-fallback.pages.dev") {
        return new Response("frozen", { status: 200 });
      }
      if (behavior === "throw") throw new Error("upstream unavailable");
      return new Response("runtime failure", { status: behavior });
    };
    const fixture = contextFor({ values });
    const response = await onRequest(fixture.context);
    assert.equal(response.headers.get("X-Utildesk-Tool-Fallback"), "frozen-7a4190c4");
    assert.equal(await response.text(), "frozen");
    assert.equal(fixture.nextCalls(), 0);
  }
});

test("an intentional D1 disabled state is not resurrected from the frozen fallback", async () => {
  globalThis.fetch = async () => new Response("disabled", {
    status: 404,
    headers: { "X-Utildesk-Route-State": "disabled", "X-Robots-Tag": "noindex" },
  });
  const fixture = contextFor({ values: { "content-runtime:tools": "on" } });
  const response = await onRequest(fixture.context);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("X-Utildesk-Route-State"), "disabled");
  assert.equal(await response.text(), "disabled");
  assert.equal(fixture.nextCalls(), 0);
});

test("frozen tool fallback is immutable and fails through only if unavailable", async () => {
  globalThis.fetch = async (request) => new Response(new URL(request.url).pathname, { status: 200 });
  const fixture = contextFor({ pathname: "/en/tools/chatgpt/" });
  const response = await frozenToolFallback(fixture.context);
  assert.equal(await response.text(), "/en/tools/chatgpt/");
  assert.equal(response.headers.get("X-Utildesk-Tool-Fallback"), "frozen-7a4190c4");
  assert.equal(fixture.nextCalls(), 0);
});

test("Pages proxy does not hide source-revision changes behind a second cache", async () => {
  const values = {
    "content-runtime:tools": "allowlist",
    "content-runtime:tools:allowlist": JSON.stringify(["chatgpt"]),
  };
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response(`runtime-${fetchCalls}`, {
      status: 200,
      headers: { "Content-Type": "text/html", "X-Utildesk-Source-Revision": String(fetchCalls) },
    });
  };

  const first = await onRequest(contextFor({ values }).context);
  assert.equal(first.headers.get("X-Utildesk-Pages-Cache"), null);
  assert.equal(await first.text(), "runtime-1");
  const second = await onRequest(contextFor({ values }).context);
  assert.equal(second.headers.get("X-Utildesk-Pages-Cache"), null);
  assert.equal(await second.text(), "runtime-2");
  assert.equal(fetchCalls, 2);
});

test("tool kill switch does not disable the existing Ratgeber runtime", async () => {
  globalThis.fetch = async () => new Response("ratgeber runtime", { status: 200, headers: { "Content-Type": "text/plain" } });
  const fixture = contextFor({
    pathname: "/ratgeber/",
    values: { "content-runtime:tools": "off" },
  });
  const response = await onRequest(fixture.context);
  assert.equal(response.headers.get("X-Utildesk-Content-Runtime"), "ratgeber-v1");
  assert.equal(await response.text(), "ratgeber runtime");
  assert.equal(fixture.nextCalls(), 0);
});

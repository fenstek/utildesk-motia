import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { onRequest, toolDetailSlug, toolRuntimeIsEnabled } from "../../functions/_middleware.js";
import { listRuntimeEntries } from "../runtime-content.mjs";

const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;

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
  if (originalCaches === undefined) delete globalThis.caches;
  else globalThis.caches = originalCaches;
});

test("tool route parser accepts only canonical DE/EN detail paths", () => {
  assert.equal(toolDetailSlug("/tools/chatgpt/"), "chatgpt");
  assert.equal(toolDetailSlug("/en/tools/chatgpt/"), "chatgpt");
  assert.equal(toolDetailSlug("/tools/"), null);
  assert.equal(toolDetailSlug("/tools/tag/ai/"), null);
  assert.equal(toolDetailSlug("/api/tools/chatgpt.json"), null);
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

test("allowlist proxies both locales and leaves other tools static", async () => {
  const values = {
    "content-runtime:tools": "allowlist",
    "content-runtime:tools:allowlist": JSON.stringify(["chatgpt"]),
  };
  let fetchCalls = 0;
  globalThis.fetch = async (request) => {
    fetchCalls += 1;
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
  assert.equal(await response.text(), "static");
  assert.equal(excluded.nextCalls(), 1);
  assert.equal(fetchCalls, 2);
});

test("tool upstream 404, 5xx and exception fail open to the static route", async () => {
  const values = { "content-runtime:tools": "on" };
  for (const behavior of [404, 503, "throw"]) {
    globalThis.fetch = async () => {
      if (behavior === "throw") throw new Error("upstream unavailable");
      return new Response("runtime failure", { status: behavior });
    };
    const fixture = contextFor({ values });
    const response = await onRequest(fixture.context);
    assert.equal(response.headers.get("X-Static-Fallback"), "1");
    assert.equal(await response.text(), "static");
    assert.equal(fixture.nextCalls(), 1);
  }
});

test("tool runtime caches successful HTML at the Pages edge", async () => {
  const values = {
    "content-runtime:tools": "allowlist",
    "content-runtime:tools:allowlist": JSON.stringify(["chatgpt"]),
  };
  const stored = new Map();
  globalThis.caches = {
    default: {
      match: async (request) => stored.get(request.url)?.clone(),
      put: async (request, response) => { stored.set(request.url, response.clone()); },
    },
  };
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response("runtime", { status: 200, headers: { "Content-Type": "text/html" } });
  };

  const first = await onRequest(contextFor({ values }).context);
  assert.equal(first.headers.get("X-Utildesk-Pages-Cache"), "MISS");
  assert.equal(await first.text(), "runtime");
  const second = await onRequest(contextFor({ values }).context);
  assert.equal(second.headers.get("X-Utildesk-Pages-Cache"), "HIT");
  assert.equal(await second.text(), "runtime");
  assert.equal(fetchCalls, 1);
});

test("HEAD requests never populate the GET tool cache", async () => {
  const values = {
    "content-runtime:tools": "allowlist",
    "content-runtime:tools:allowlist": JSON.stringify(["chatgpt"]),
  };
  let puts = 0;
  globalThis.caches = {
    default: {
      match: async () => null,
      put: async () => { puts += 1; },
    },
  };
  globalThis.fetch = async () => new Response(null, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
  const fixture = contextFor({ values });
  fixture.context.request = new Request("https://tools.utildesk.de/tools/chatgpt/", { method: "HEAD" });
  const response = await onRequest(fixture.context);
  assert.equal(response.status, 200);
  assert.equal(puts, 0);
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

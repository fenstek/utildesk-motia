import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configuredRuntimeOrigin, filterToolCatalogResponse, frozenToolFallback, onRequest, toolDetailSlug, toolMachineRoute, toolRuntimeIsEnabled, toolShellRoute, toolShellRuntimeIsEnabled } from "../../functions/_middleware.js";
import { listRuntimeEntries } from "../runtime-content.mjs";
import { RECOVERY_PROOF_EN_RATGEBER_SLUGS, ROBOTS_INDEX_FOLLOW } from "../../src/lib/searchIndexPolicy.mjs";
import { getToolRoutePolicyHash } from "../../shared/toolRoutePolicy.mjs";

const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
const robotMetaPattern = /<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*>/gi;

const contextFor = ({ pathname = "/tools/chatgpt/", method = "GET", values = {}, nextBody = "static", requestHeaders = {} } = {}) => {
  let nextCalls = 0;
  const context = {
    request: new Request(`https://tools.utildesk.de${pathname}`, { method, headers: requestHeaders }),
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

function installMemoryCache(now = () => Date.now()) {
  const records = new Map();
  globalThis.caches = {
    default: {
      async match(request) {
        const key = new URL(request.url).toString();
        const record = records.get(key);
        if (!record || record.expiresAt <= now()) {
          records.delete(key);
          return undefined;
        }
        return record.response.clone();
      },
      async put(request, response) {
        const key = new URL(request.url).toString();
        const ttl = Number(response.headers.get("Cache-Control")?.match(/s-maxage=(\d+)/)?.[1] ?? 0);
        if (!ttl) return;
        records.set(key, { response: response.clone(), expiresAt: now() + ttl * 1_000 });
      },
    },
  };
  return records;
}

function cacheEnabledContext({ pathname = "/tools/chatgpt/", method = "GET", requestHeaders = {}, values = { "content-runtime:tools": "on" }, mode = "production", origin } = {}) {
  const fixture = contextFor({ pathname, method, requestHeaders, values });
  Object.assign(fixture.context.env, {
    UTILDESK_TOOL_HTML_CACHE: "on",
    UTILDESK_TOOL_HTML_CACHE_NAMESPACE: mode === "preview" ? "qa-preview" : "production",
    ...(mode === "preview" ? {
      UTILDESK_RUNTIME_MODE: "preview",
      UTILDESK_TOOL_RUNTIME_PREVIEW_ENABLED: "on",
      ...(origin ? { UTILDESK_RUNTIME_ORIGIN: origin } : {}),
    } : {}),
  });
  return fixture;
}

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

test("indexable German tool HTML with matching robots metadata returns its consumed runtime body", async () => {
  const sourceHtml = `<!doctype html><html lang="de"><head><meta name="robots" content="${ROBOTS_INDEX_FOLLOW}"></head><body><main>Convertio runtime HTML remains intact.</main></body></html>`;
  const sourceHash = "78a1a276ca6df6211f2c537bbab1d096e4979cfb875cbc2db14263b4c830ee45";
  let frozenFallbackCalls = 0;
  globalThis.fetch = async (request) => {
    if (new URL(request.url).hostname === "utildesk-tool-fallback.pages.dev") {
      frozenFallbackCalls += 1;
      return new Response("frozen fallback", { status: 200 });
    }
    return new Response(sourceHtml, {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": String(sourceHtml.length),
        "Content-Encoding": "gzip",
        "X-Robots-Tag": "index,follow",
        "X-Utildesk-Content-Runtime": "tool-v2",
        "X-Utildesk-Source-Hash": sourceHash,
        "X-Utildesk-Source-Revision": "4",
      },
    });
  };

  const fixture = contextFor({
    pathname: "/tools/convertio/",
    values: {
      "content-runtime:tools": "allowlist",
      "content-runtime:tools:allowlist": JSON.stringify(["convertio"]),
    },
  });
  const response = await onRequest(fixture.context);

  assert.equal(response.status, 200);
  assert.equal(response.statusText, "OK");
  assert.equal(await response.text(), sourceHtml);
  assert.equal(response.headers.get("X-Utildesk-Content-Runtime"), "tools-v1");
  assert.equal(response.headers.get("X-Utildesk-Source-Hash"), sourceHash);
  assert.equal(response.headers.get("X-Utildesk-Source-Revision"), "4");
  assert.equal(response.headers.get("X-Robots-Tag"), null);
  assert.equal(response.headers.get("content-length"), null);
  assert.equal(response.headers.get("content-encoding"), null);
  assert.equal(frozenFallbackCalls, 0);
  assert.equal(fixture.nextCalls(), 0);
});

test("all-route mode proxies tool machine endpoints while off mode keeps the static mirror", async () => {
  globalThis.fetch = async (request) => new Response(`runtime:${new URL(request.url).pathname}`, {
    status: 200,
    headers: { "Content-Type": "application/json", "X-Robots-Tag": "noindex" },
  });
  for (const pathname of ["/api/tools.json", "/en/api/tools.json", "/api/tools/chatgpt.json", "/en/markdown/tools/chatgpt.md"]) {
    const response = await onRequest(contextFor({ pathname, values: { "content-runtime:tools": "on" } }).context);
    assert.equal(response.headers.get("X-Utildesk-Content-Runtime"), "tools-v1");
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex");
    assert.equal(await response.text(), `runtime:${pathname}`);
  }
  const staticResponse = await onRequest(contextFor({ pathname: "/api/tools/chatgpt.json", values: { "content-runtime:tools": "off" } }).context);
  assert.equal(await staticResponse.text(), "static");
});

test("Pages proxy opens only the three English OCR guides and overrides upstream noindex", async () => {
  const sourceHtml = '<!doctype html><html lang="en"><head><meta name="robots" content="noindex"><meta name="description" content="preserve this description"><link rel="canonical" href="https://tools.utildesk.de/en/ratgeber/ocr-proof/"><link rel="alternate" hreflang="de" href="https://tools.utildesk.de/ratgeber/ocr-proof/"><meta name=\'robots\' content="noindex,nofollow"></head><body><main>preserve this OCR article content</main></body></html>';
  const expectedRobotsMeta = `<meta name="robots" content="${ROBOTS_INDEX_FOLLOW}">`;

  for (const slug of RECOVERY_PROOF_EN_RATGEBER_SLUGS) {
    for (const pathname of [`/en/ratgeber/${slug}`, `/en/ratgeber/${slug}/`]) {
      globalThis.fetch = async (request) => {
        assert.equal(new URL(request.url).pathname, pathname);
        return new Response(sourceHtml, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Robots-Tag": "noindex",
          },
        });
      };
      const fixture = contextFor({ pathname });
      const response = await onRequest(fixture.context);
      const html = await response.text();

      assert.equal(response.status, 200, pathname);
      assert.equal(response.headers.get("X-Robots-Tag"), ROBOTS_INDEX_FOLLOW, pathname);
      assert.equal(response.headers.get("X-Utildesk-Content-Runtime"), "ratgeber-v1", pathname);
      assert.deepEqual([...html.matchAll(robotMetaPattern)].map(([meta]) => meta), [expectedRobotsMeta], pathname);
      assert.match(html, /canonical" href="https:\/\/tools\.utildesk\.de\/en\/ratgeber\/ocr-proof\//, pathname);
      assert.match(html, /rel="alternate" hreflang="de" href="https:\/\/tools\.utildesk\.de\/ratgeber\/ocr-proof\//, pathname);
      assert.match(html, /name="description" content="preserve this description"/, pathname);
      assert.match(html, /<main>preserve this OCR article content<\/main>/, pathname);
      assert.equal(fixture.nextCalls(), 0, pathname);
    }
  }
});

test("Pages proxy fixes selected EN noindex while keeping legacy DE header behavior", async () => {
  const stylesheet = '<link rel="stylesheet" href="/runtime-ratgeber-detail.css?v=20260805-1">';
  const alreadyIndexableHtml = `<html><head><meta name="robots" content="${ROBOTS_INDEX_FOLLOW}">${stylesheet}</head><body><main>OCR article</main></body></html>`;
  globalThis.fetch = async () => new Response(alreadyIndexableHtml, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
  const english = await onRequest(contextFor({
    pathname: "/en/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026/",
  }).context);
  const englishHtml = await english.text();
  assert.equal(english.headers.get("X-Robots-Tag"), ROBOTS_INDEX_FOLLOW);
  assert.equal([...englishHtml.matchAll(robotMetaPattern)].length, 1);

  globalThis.fetch = async () => new Response(`<html><head><meta name=robots content="index,follow">${stylesheet}</head><body><main>DE proof article</main></body></html>`, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "vendorbot: noindex" },
  });
  const german = await onRequest(contextFor({
    pathname: "/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026/",
  }).context);
  const germanHtml = await german.text();
  assert.equal(german.headers.get("X-Robots-Tag"), null);
  assert.match(germanHtml, /<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">/);
});

test("Pages HEAD fixes noindex only for the three selected EN HTML routes", async () => {
  for (const slug of RECOVERY_PROOF_EN_RATGEBER_SLUGS) {
    for (const pathname of [`/en/ratgeber/${slug}`, `/en/ratgeber/${slug}/`]) {
      globalThis.fetch = async (request) => {
        assert.equal(request.method, "HEAD");
        return new Response(null, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Robots-Tag": "noindex",
          },
        });
      };
      const fixture = contextFor({ pathname, method: "HEAD" });
      const response = await onRequest(fixture.context);
      assert.equal(response.status, 200, pathname);
      assert.equal(response.headers.get("X-Robots-Tag"), ROBOTS_INDEX_FOLLOW, pathname);
      assert.equal(response.headers.get("X-Utildesk-Content-Runtime"), "ratgeber-v1", pathname);
      assert.equal(await response.text(), "", pathname);
      assert.equal(fixture.nextCalls(), 0, pathname);
    }
  }

  for (const [pathname, robots] of [
    ["/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026/", "vendorbot: noindex"],
    ["/en/ratgeber/another-guide/", "noindex"],
  ]) {
    globalThis.fetch = async (request) => {
      assert.equal(request.method, "HEAD");
      return new Response(null, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": robots },
      });
    };
    const response = await onRequest(contextFor({ pathname, method: "HEAD" }).context);
    assert.equal(response.headers.get("X-Robots-Tag"), robots, pathname);
    assert.equal(await response.text(), "", pathname);
  }
});

test("Pages proxy keeps unrelated EN and non-proof DE guides noindex", async () => {
  const sourceHtml = '<html><head><meta name="robots" content="index,follow"></head><body><main>guide content</main></body></html>';
  for (const pathname of [
    "/en/ratgeber/another-guide/",
    "/en/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026-extra/",
    "/ratgeber/not-in-the-proof-cluster/",
  ]) {
    globalThis.fetch = async () => new Response(sourceHtml, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "index,follow" },
    });
    const response = await onRequest(contextFor({ pathname }).context);
    const html = await response.text();
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, follow", pathname);
    assert.equal([...html.matchAll(robotMetaPattern)].length, 1, pathname);
    assert.match(html, /<meta name="robots" content="noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">/, pathname);
    assert.match(html, /<main>guide content<\/main>/, pathname);
  }
});

test("catalog policy removes tombstones and redirects while preserving canonical order and fields", async () => {
  const source = {
    count: 4,
    generatedAt: "fixture",
    items: [
      { slug: "canonical-first", title: "First" },
      { slug: "xamarin", title: "Retired tombstone" },
      { slug: "appinventor", title: "Retired redirect" },
      { slug: "canonical-last", title: "Last" },
    ],
  };
  const response = await filterToolCatalogResponse(new Response(JSON.stringify(source), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": "999",
      "Content-Encoding": "gzip",
    },
  }));
  const body = await response.json();
  assert.deepEqual(body, {
    count: 2,
    generatedAt: "fixture",
    items: [
      { slug: "canonical-first", title: "First" },
      { slug: "canonical-last", title: "Last" },
    ],
  });
  assert.equal(response.headers.get("X-Utildesk-Catalog-Policy"), "retired-filter-v1");
  assert.equal(response.headers.get("content-length"), null);
  assert.equal(response.headers.get("content-encoding"), null);
});

test("catalog policy is fail-open for malformed JSON and unexpected shapes", async () => {
  for (const body of ["not-json", JSON.stringify({ count: 1, items: "not-an-array" })]) {
    const sourceResponse = new Response(body, {
      status: 200,
      headers: { "Content-Type": "application/json", "Content-Length": "8", "Content-Encoding": "gzip" },
    });
    const response = await filterToolCatalogResponse(sourceResponse);
    assert.strictEqual(response, sourceResponse);
    assert.equal(await sourceResponse.text(), body);
    assert.equal(sourceResponse.headers.get("content-length"), "8");
    assert.equal(sourceResponse.headers.get("content-encoding"), "gzip");
    assert.equal(sourceResponse.headers.get("X-Utildesk-Catalog-Policy"), null);
  }
});

test("catalog policy keeps an unchanged catalog body stream and headers", async () => {
  const body = JSON.stringify({
    count: 2,
    generatedAt: "fixture",
    items: [{ slug: "canonical-first" }, { slug: "canonical-last" }],
  });
  const sourceResponse = new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": String(body.length),
      "Content-Encoding": "gzip",
    },
  });
  const response = await filterToolCatalogResponse(sourceResponse);
  assert.deepEqual(await response.json(), {
    count: 2,
    generatedAt: "fixture",
    items: [{ slug: "canonical-first" }, { slug: "canonical-last" }],
  });
  assert.equal(response.headers.get("X-Utildesk-Catalog-Policy"), "retired-filter-v1");
  assert.equal(response.headers.get("content-length"), String(body.length));
  assert.equal(response.headers.get("content-encoding"), "gzip");
});

test("catalog policy is scoped away from tool detail JSON", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ slug: "xamarin", title: "detail" }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Content-Length": "42", "Content-Encoding": "gzip" },
  });
  const response = await onRequest(contextFor({
    pathname: "/api/tools/chatgpt.json",
    values: { "content-runtime:tools": "on" },
  }).context);
  assert.deepEqual(await response.json(), { slug: "xamarin", title: "detail" });
  assert.equal(response.headers.get("X-Utildesk-Catalog-Policy"), null);
  assert.equal(response.headers.get("content-length"), "42");
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

test("intentional D1 disabled and tombstone states are not resurrected from the frozen fallback", async () => {
  for (const { state, status } of [{ state: "disabled", status: 404 }, { state: "tombstone", status: 410 }]) {
    let fetchCalls = 0;
    globalThis.fetch = async () => {
      fetchCalls += 1;
      return new Response(state, {
        status,
        headers: { "X-Utildesk-Route-State": state, "X-Robots-Tag": "noindex" },
      });
    };
    const fixture = contextFor({ values: { "content-runtime:tools": "on" } });
    const response = await onRequest(fixture.context);
    assert.equal(response.status, status);
    assert.equal(response.headers.get("X-Utildesk-Route-State"), state);
    assert.equal(await response.text(), state);
    assert.equal(fetchCalls, 1);
    assert.equal(fixture.nextCalls(), 0);
  }
});

test("valid frozen snapshot marker comes from the fallback response and preserves its other headers", async () => {
  globalThis.fetch = async (request) => {
    assert.equal(new URL(request.url).origin, "https://utildesk-tool-fallback.pages.dev");
    return new Response("frozen-current", {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Utildesk-Frozen-Snapshot": "frozen-pages-2026-11-06",
        "X-Utildesk-Content-Runtime": "should-be-removed-as-before",
        "X-Fallback-Proof": "preserved",
      },
    });
  };
  const fixture = contextFor({
    pathname: "/en/tools/chatgpt/",
    requestHeaders: { "X-Utildesk-Frozen-Snapshot": "frozen-user-supplied" },
  });
  const response = await frozenToolFallback(fixture.context);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "frozen-current");
  assert.equal(response.headers.get("X-Utildesk-Tool-Fallback"), "frozen-pages-2026-11-06");
  assert.equal(response.headers.get("X-Utildesk-Frozen-Snapshot"), "frozen-pages-2026-11-06");
  assert.equal(response.headers.get("X-Fallback-Proof"), "preserved");
  assert.equal(response.headers.get("Content-Type"), "text/html; charset=utf-8");
  assert.equal(response.headers.get("X-Utildesk-Content-Runtime"), null);
  assert.equal(fixture.nextCalls(), 0);
});

test("missing or malformed frozen snapshot markers keep the legacy fallback marker", async () => {
  const cases = [
    { name: "missing", marker: null },
    { name: "empty suffix", marker: "frozen-" },
    { name: "invalid character", marker: "frozen-bad_value" },
    { name: "uppercase", marker: "Frozen-valid" },
    { name: "too long", marker: `frozen-${"a".repeat(58)}` },
  ];

  for (const { name, marker } of cases) {
    globalThis.fetch = async () => new Response(name, {
      status: 200,
      headers: marker === null ? {} : { "X-Utildesk-Frozen-Snapshot": marker },
    });
    const fixture = contextFor({
      requestHeaders: { "X-Utildesk-Frozen-Snapshot": "frozen-user-supplied" },
    });
    const response = await frozenToolFallback(fixture.context);
    assert.equal(response.headers.get("X-Utildesk-Tool-Fallback"), "frozen-7a4190c4", name);
    assert.equal(await response.text(), name);
    assert.equal(fixture.nextCalls(), 0);
  }
});

test("frozen tool fallback still uses the static route when the fallback origin errors", async () => {
  for (const behavior of ["non-ok", "throw"]) {
    globalThis.fetch = async () => {
      if (behavior === "throw") throw new Error("fallback unavailable");
      return new Response("fallback unavailable", { status: 503 });
    };
    const fixture = contextFor({ nextBody: "static after fallback error" });
    const response = await frozenToolFallback(fixture.context);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "static after fallback error");
    assert.equal(response.headers.get("X-Static-Fallback"), "1");
    assert.equal(fixture.nextCalls(), 1);
  }
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
    pathname: "/ratgeber/example/",
    values: { "content-runtime:tools": "off" },
  });
  const response = await onRequest(fixture.context);
  assert.equal(response.headers.get("X-Utildesk-Content-Runtime"), "ratgeber-v1");
  assert.equal(await response.text(), "ratgeber runtime");
  assert.equal(fixture.nextCalls(), 0);
});

test("Pages cache stores only final public tool HTML and skips the Worker on repeat hits", async () => {
  installMemoryCache();
  let upstreamCalls = 0;
  globalThis.fetch = async (request) => {
    upstreamCalls += 1;
    assert.equal(new URL(request.url).origin, "https://utildesk-content-runtime.s-skorykov.workers.dev");
    return new Response("<html><head></head><body>runtime card</body></html>", {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
        "X-Utildesk-Content-Runtime": "tools-v1",
        "X-Utildesk-Source-Revision": "7",
      },
    });
  };

  const miss = await onRequest(cacheEnabledContext().context);
  assert.equal(miss.headers.get("X-Utildesk-Pages-Tool-Cache"), "MISS");
  assert.equal(miss.headers.get("Cache-Control"), "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800");
  assert.match(await miss.text(), /<meta name="robots"/);
  const hit = await onRequest(cacheEnabledContext().context);
  assert.equal(hit.headers.get("X-Utildesk-Pages-Tool-Cache"), "HIT");
  assert.equal(hit.headers.get("Cache-Control"), "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800");
  assert.match(await hit.text(), /runtime card/);
  assert.equal(upstreamCalls, 1);
});

test("Pages cache expires after 30 seconds and never stores dynamic redirects or tombstones", async () => {
  let now = 0;
  installMemoryCache(() => now);
  let state = "active-one";
  let upstreamCalls = 0;
  globalThis.fetch = async () => {
    upstreamCalls += 1;
    if (state === "redirect") return new Response(null, { status: 301, headers: { Location: "/tools/ren-py/" } });
    if (state === "tombstone") return new Response("retired", { status: 410, headers: { "X-Utildesk-Route-State": "tombstone" } });
    return new Response(`<html><head></head><body>${state}</body></html>`, {
      headers: { "Content-Type": "text/html", "X-Utildesk-Content-Runtime": "tools-v1", "Cache-Control": "public, s-maxage=600" },
    });
  };

  const first = await onRequest(cacheEnabledContext().context);
  assert.equal(await first.text().then((text) => text.includes("active-one")), true);
  state = "redirect";
  const withinGrace = await onRequest(cacheEnabledContext().context);
  assert.equal(withinGrace.headers.get("X-Utildesk-Pages-Tool-Cache"), "HIT");
  assert.equal(withinGrace.status, 200);

  now = 30_001;
  const redirected = await onRequest(cacheEnabledContext().context);
  assert.equal(redirected.status, 301);
  assert.equal(redirected.headers.get("Location"), "/tools/ren-py/");
  assert.equal(redirected.headers.get("X-Utildesk-Pages-Tool-Cache"), "MISS");
  assert.equal(upstreamCalls, 2);

  state = "tombstone";
  const tombstone = await onRequest(cacheEnabledContext().context);
  assert.equal(tombstone.status, 410);
  assert.equal(upstreamCalls, 3);

  state = "restored-after-rollback";
  const restored = await onRequest(cacheEnabledContext().context);
  assert.equal(restored.status, 200);
  assert.match(await restored.text(), /restored-after-rollback/);
  assert.equal(restored.headers.get("X-Utildesk-Pages-Tool-Cache"), "MISS");
  const restoredHit = await onRequest(cacheEnabledContext().context);
  assert.equal(restoredHit.headers.get("X-Utildesk-Pages-Tool-Cache"), "HIT");
  assert.equal(upstreamCalls, 4);
});

test("static route redirects and tombstones run before the Pages HTML cache", async () => {
  installMemoryCache();
  let upstreamCalls = 0;
  globalThis.fetch = async () => {
    upstreamCalls += 1;
    return new Response("unexpected upstream", { headers: { "Content-Type": "text/html" } });
  };
  const redirect = await onRequest(cacheEnabledContext({ pathname: "/tools/sendinblue/" }).context);
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get("Location"), "https://tools.utildesk.de/tools/brevo/");
  const tombstone = await onRequest(cacheEnabledContext({ pathname: "/tools/xamarin/" }).context);
  assert.equal(tombstone.status, 410);
  assert.equal(tombstone.headers.get("X-Utildesk-Route-State"), "tombstone");
  assert.equal(upstreamCalls, 0);
});

test("query, conditional, HEAD, cookie and authorization variants bypass the Pages cache unchanged", async () => {
  installMemoryCache();
  const seen = [];
  globalThis.fetch = async (request) => {
    seen.push({ url: request.url, method: request.method, cookie: request.headers.get("cookie"), authorization: request.headers.get("authorization") });
    return new Response("<html><head></head><body>fresh</body></html>", {
      headers: { "Content-Type": "text/html", "X-Utildesk-Content-Runtime": "tools-v1", "Cache-Control": "public, s-maxage=600" },
    });
  };

  for (const request of [
    cacheEnabledContext({ pathname: "/tools/chatgpt/?utm_source=mail" }).context,
    cacheEnabledContext({ pathname: "/tools/chatgpt/?utm_medium=other" }).context,
    cacheEnabledContext({ requestHeaders: { "Cache-Control": "no-cache" } }).context,
    cacheEnabledContext({ requestHeaders: { "If-None-Match": "W/\"old\"" } }).context,
    cacheEnabledContext({ method: "HEAD" }).context,
    cacheEnabledContext({ requestHeaders: { Cookie: "session=private" } }).context,
    cacheEnabledContext({ requestHeaders: { Authorization: "Bearer private" } }).context,
  ]) {
    const response = await onRequest(request);
    await response.text();
  }
  assert.equal(seen.length, 7);
  assert.equal(new URL(seen[0].url).search, "?utm_source=mail");
  assert.equal(new URL(seen[1].url).search, "?utm_medium=other");
  assert.equal(seen[4].method, "HEAD");
  assert.equal(seen[5].cookie, "session=private");
  assert.equal(seen[6].authorization, "Bearer private");
});

test("a no-cache request sees content-only Worker updates immediately without changing query variants", async () => {
  installMemoryCache();
  let version = "before";
  let upstreamCalls = 0;
  globalThis.fetch = async () => {
    upstreamCalls += 1;
    return new Response(`<html><head></head><body>${version}</body></html>`, {
      headers: { "Content-Type": "text/html", "X-Utildesk-Content-Runtime": "tools-v1", "Cache-Control": "public, s-maxage=600" },
    });
  };
  const first = await onRequest(cacheEnabledContext().context);
  assert.match(await first.text(), /before/);
  version = "published-DE-EN-update";
  const gated = await onRequest(cacheEnabledContext({ requestHeaders: { "Cache-Control": "no-cache" } }).context);
  assert.match(await gated.text(), /published-DE-EN-update/);
  const nextPublicHit = await onRequest(cacheEnabledContext().context);
  assert.match(await nextPublicHit.text(), /before/);
  assert.equal(nextPublicHit.headers.get("X-Utildesk-Pages-Tool-Cache"), "HIT");
  assert.equal(upstreamCalls, 2);
});

test("the alternative tool JSON API keeps its separate body and noindex behavior", async () => {
  let upstreamCalls = 0;
  globalThis.fetch = async (request) => {
    upstreamCalls += 1;
    assert.equal(new URL(request.url).pathname, "/api/tools/chatgpt.json");
    return new Response(JSON.stringify({ slug: "chatgpt", data: { title: "ChatGPT" } }), {
      headers: { "Content-Type": "application/json", ETag: '"source-revision-json"' },
    });
  };
  const response = await onRequest(cacheEnabledContext({ pathname: "/api/tools/chatgpt.json" }).context);
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex");
  assert.equal(response.headers.get("ETag"), '"source-revision-json"');
  assert.deepEqual(JSON.parse(await response.text()), { slug: "chatgpt", data: { title: "ChatGPT" } });
  assert.equal(upstreamCalls, 1);
});

test("HTML cache stores only responses without Vary or with Accept-Encoding alone", async () => {
  for (const vary of ["Origin", "Accept-Language", "Accept-Encoding, Origin"]) {
    installMemoryCache();
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response("<html><head></head><body>variant</body></html>", {
        headers: { "Content-Type": "text/html", "X-Utildesk-Content-Runtime": "tools-v1", Vary: vary },
      });
    };
    await (await onRequest(cacheEnabledContext().context)).text();
    await (await onRequest(cacheEnabledContext().context)).text();
    assert.equal(calls, 2, `${vary} must bypass storage`);
  }

  installMemoryCache();
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response("<html><head></head><body>encoded</body></html>", {
      headers: { "Content-Type": "text/html", "X-Utildesk-Content-Runtime": "tools-v1", Vary: " Accept-Encoding " },
    });
  };
  await (await onRequest(cacheEnabledContext().context)).text();
  await (await onRequest(cacheEnabledContext().context)).text();
  assert.equal(calls, 1);
});

test("errors, Set-Cookie and private HTML are never cached", async () => {
  for (const headers of [
    { "Content-Type": "text/html", "X-Utildesk-Content-Runtime": "tools-v1", "Set-Cookie": "session=private" },
    { "Content-Type": "text/html", "X-Utildesk-Content-Runtime": "tools-v1", "Cache-Control": "private, no-store" },
  ]) {
    installMemoryCache();
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response("<html><head></head><body>private</body></html>", { headers });
    };
    await (await onRequest(cacheEnabledContext().context)).text();
    await (await onRequest(cacheEnabledContext().context)).text();
    assert.equal(calls, 2);
  }

  installMemoryCache();
  let contentWorkerCalls = 0;
  let fallbackCalls = 0;
  globalThis.fetch = async (request) => {
    if (new URL(request.url).hostname === "utildesk-content-runtime.s-skorykov.workers.dev") {
      contentWorkerCalls += 1;
      return new Response("upstream error", { status: 503 });
    }
    fallbackCalls += 1;
    throw new Error("fallback unavailable");
  };
  await (await onRequest(cacheEnabledContext().context)).text();
  await (await onRequest(cacheEnabledContext().context)).text();
  assert.equal(contentWorkerCalls, 2);
  assert.equal(fallbackCalls, 2);
});

test("preview origin is explicit, isolated, and never uses production KV or fallback", async () => {
  installMemoryCache();
  let kvReads = 0;
  const missing = cacheEnabledContext({ mode: "preview" });
  missing.context.env.RATGEBER_REVIEW.get = async () => { kvReads += 1; throw new Error("production KV must not be read"); };
  const savedFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("no origin must mean no network request"); };
  const staticFallback = await onRequest(missing.context);
  assert.equal(staticFallback.headers.get("X-Static-Fallback"), "1");
  assert.equal(missing.nextCalls(), 1);
  assert.equal(kvReads, 0);
  assert.equal(configuredRuntimeOrigin(missing.context), null);
  assert.equal(configuredRuntimeOrigin(cacheEnabledContext({
    mode: "preview",
    origin: "https://utildesk-content-runtime.s-skorykov.workers.dev",
  }).context), null, "preview must reject the production Worker origin explicitly");

  globalThis.fetch = async (request) => {
    assert.equal(new URL(request.url).origin, "https://utildesk-hybrid-preview.example.workers.dev");
    return new Response("preview-only", { headers: { "Content-Type": "text/html", "X-Utildesk-Content-Runtime": "tools-v1" } });
  };
  const configured = cacheEnabledContext({ mode: "preview", origin: "https://utildesk-hybrid-preview.example.workers.dev" });
  configured.context.env.RATGEBER_REVIEW.get = async () => { kvReads += 1; throw new Error("production KV must not be read"); };
  const previewResponse = await onRequest(configured.context);
  assert.equal(await previewResponse.text(), "preview-only");
  assert.equal(kvReads, 0);
  assert.equal(configuredRuntimeOrigin(configured.context), "https://utildesk-hybrid-preview.example.workers.dev");
  globalThis.fetch = savedFetch;
});

test("static video routes do not require runtime environment bindings", async () => {
  const fixture = contextFor({ pathname: "/videos/tool-walkthrough/" });
  Object.defineProperty(fixture.context, "env", {
    configurable: true,
    get() { throw new Error("static routes must not read runtime-only bindings"); },
  });
  const response = await onRequest(fixture.context);
  assert.equal(response.status, 200);
  assert.equal(fixture.nextCalls(), 1);
});

test("catalog-ready marker avoids the Pages full JSON parse only for the matching retire policy", async () => {
  const policyHash = await getToolRoutePolicyHash();
  const ready = await filterToolCatalogResponse(new Response(JSON.stringify({ version: 1, count: 1, items: [{ slug: "chatgpt" }] }), {
    headers: {
      "Content-Type": "application/json",
      "Content-Length": "99",
      "X-Utildesk-Catalog-Ready": "v1",
      "X-Utildesk-Catalog-Policy": "retired-filter-v1",
      "X-Utildesk-Catalog-Policy-Hash": policyHash,
    },
  }));
  assert.equal(ready.headers.get("Content-Length"), "99");
  assert.equal(ready.headers.get("X-Utildesk-Catalog-Policy"), "retired-filter-v1");
  assert.deepEqual(JSON.parse(await ready.text()).items.map((item) => item.slug), ["chatgpt"]);

  const legacy = await filterToolCatalogResponse(new Response(JSON.stringify({ version: 1, count: 2, items: [{ slug: "chatgpt" }, { slug: "xamarin" }] }), {
    headers: {
      "Content-Type": "application/json",
      "X-Utildesk-Catalog-Ready": "v1",
      "X-Utildesk-Catalog-Policy": "retired-filter-v1",
      "X-Utildesk-Catalog-Policy-Hash": "stale-policy",
    },
  }));
  assert.deepEqual(JSON.parse(await legacy.text()).items.map((item) => item.slug), ["chatgpt"]);
});

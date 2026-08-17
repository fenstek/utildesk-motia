import assert from "node:assert/strict";
import test from "node:test";

import {
  TOOL_REDIRECTS,
  TOOL_TOMBSTONES,
  applyToolRoutePolicy,
  getToolRouteAction,
} from "../../shared/toolRoutePolicy.mjs";

const REPRESENTATIONS = [
  { kind: "html", path: (prefix, slug, trailing = true) => `${prefix}/tools/${slug}${trailing ? "/" : ""}` },
  { kind: "json", path: (prefix, slug) => `${prefix}/api/tools/${slug}.json` },
  { kind: "markdown", path: (prefix, slug) => `${prefix}/markdown/tools/${slug}.md` },
];

const locales = [
  { name: "de", prefix: "" },
  { name: "en", prefix: "/en" },
];

test("the complete route manifests have exactly 15 redirects and 110 tombstones", () => {
  assert.equal(Object.keys(TOOL_REDIRECTS).length, 15);
  assert.equal(TOOL_TOMBSTONES.size, 110);
  assert.equal(new Set(Object.keys(TOOL_REDIRECTS)).size, 15);
  assert.equal(new Set(TOOL_TOMBSTONES).size, 110);
  for (const slug of TOOL_TOMBSTONES) {
    assert.equal(Object.hasOwn(TOOL_REDIRECTS, slug), false, slug);
  }
});

test("all 15 same-locale merge mappings remain 301 with query strings", async () => {
  for (const [slug, targetSlug] of Object.entries(TOOL_REDIRECTS)) {
    for (const { prefix } of locales) {
      for (const representation of REPRESENTATIONS) {
        const path = representation.path(prefix, slug);
        const action = getToolRouteAction(path);
        assert.equal(action?.type, "redirect", path);
        assert.equal(action?.status, 301, path);
        assert.equal(action?.targetSlug, targetSlug, path);
        assert.equal(action?.locale, prefix ? "en" : "de", path);
        const response = applyToolRoutePolicy(new Request(`https://example.test${path}?utm_source=test`));
        assert.equal(response?.status, 301, path);
        assert.equal(response?.headers.get("location"), `https://example.test${action.target}?utm_source=test`, path);
      }
    }
  }
});

test("all 110 tombstones cover DE/EN, HTML slash variants, JSON and Markdown", async () => {
  for (const slug of TOOL_TOMBSTONES) {
    for (const { prefix } of locales) {
      for (const representation of REPRESENTATIONS) {
        const paths = representation.kind === "html"
          ? [representation.path(prefix, slug, false), representation.path(prefix, slug, true)]
          : [representation.path(prefix, slug)];
        for (const path of paths) {
          const action = getToolRouteAction(path);
          assert.equal(action?.type, "tombstone", path);
          assert.equal(action?.status, 410, path);
          const response = applyToolRoutePolicy(new Request(`https://example.test${path}`));
          assert.equal(response?.status, 410, path);
          assert.equal(response?.headers.get("X-Robots-Tag"), "noindex, nofollow", path);
        }
      }
    }
  }
});

test("normal active slugs are outside both manifests", () => {
  for (const { prefix } of locales) {
    for (const representation of REPRESENTATIONS) {
      const path = representation.path(prefix, "chatgpt");
      assert.equal(getToolRouteAction(path), null, path);
      assert.equal(applyToolRoutePolicy(new Request(`https://example.test${path}`)), null, path);
    }
  }
});

test("shared ecosystem products remain outside the redirect policy", () => {
  for (const slug of ["tensorflow", "keras", "apache-hadoop", "hadoop-mapreduce"]) {
    assert.equal(getToolRouteAction(`/tools/${slug}/`), null);
  }
});

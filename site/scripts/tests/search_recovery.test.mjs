import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  getToolSearchIndexDecision,
  getRecoveryPageRobots,
  RECOVERY_PROOF_RATGEBER_SLUGS,
  RECOVERY_PROOF_TOOL_SLUGS,
  ROBOTS_INDEX_FOLLOW,
  ROBOTS_NOINDEX_FOLLOW,
} from "../../src/lib/searchIndexPolicy.mjs";
import { redirectPreviewHost } from "../../functions/_middleware.js";

test("recovery policy has explicit proof and global noindex samples", () => {
  assert.equal(getToolSearchIndexDecision({ slug: "cloudconvert", data: {} }).robots, ROBOTS_INDEX_FOLLOW);
  assert.equal(getToolSearchIndexDecision({ slug: "chatgpt", data: {} }).robots, ROBOTS_NOINDEX_FOLLOW);
  assert.equal(getToolSearchIndexDecision({ slug: "chatgpt", data: { search_index: true } }).robots, ROBOTS_NOINDEX_FOLLOW);
  assert.equal(getRecoveryPageRobots("/en/tools/"), ROBOTS_NOINDEX_FOLLOW);
  assert.equal(getRecoveryPageRobots("/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026/"), ROBOTS_INDEX_FOLLOW);
  assert.equal(RECOVERY_PROOF_RATGEBER_SLUGS.size, 5);
  assert.equal(RECOVERY_PROOF_TOOL_SLUGS.size, 4);
});

test("Pages preview host redirect preserves path and query only", () => {
  const response = redirectPreviewHost(new URL("https://utildesk-motia.pages.dev/en/tools/foo/?q=ocr&sort=new"));
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://tools.utildesk.de/en/tools/foo/?q=ocr&sort=new");
  assert.equal(redirectPreviewHost(new URL("https://tools.utildesk.de/tools/foo/?q=ocr")), null);
});

test("recovery sitemaps are exact when a build is present", async (t) => {
  const files = ["sitemap.xml", "sitemap-focus.xml", "sitemap-bing.xml"].map((name) => new URL(`../../dist/${name}`, import.meta.url));
  if (!existsSync(files[0])) {
    t.skip("run after npm run build");
    return;
  }
  const xmls = await Promise.all(files.map((file) => readFile(file, "utf8")));
  assert.deepEqual(xmls[1], xmls[0]);
  assert.deepEqual(xmls[2], xmls[0]);
  const urls = [...xmls[0].matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(urls.length, 13);
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.every((url) => url.startsWith("https://tools.utildesk.de/") && !url.includes("/en/")));
  const proofTools = new Set(["cloudconvert", "convertio", "smallpdf", "tesseract-ocr"]);
  assert.ok(!urls.some((url) => {
    const slug = url.match(/\/tools\/([^/]+)\/$/)?.[1];
    return slug && !proofTools.has(slug);
  }));
});

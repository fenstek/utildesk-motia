import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  getToolSearchIndexDecision,
  getRecoveryPageRobots,
  RECOVERY_PROOF_EN_RATGEBER_SLUGS,
  RECOVERY_PROOF_RATGEBER_SLUGS,
  RECOVERY_PROOF_TOOL_SLUGS,
  ROBOTS_INDEX_FOLLOW,
  ROBOTS_NOINDEX_FOLLOW,
} from "../../src/lib/searchIndexPolicy.mjs";
import { applyRecoveryRobotsToHtml, redirectPreviewHost } from "../../functions/_middleware.js";

test("recovery policy opens only the three English OCR proof guides", () => {
  assert.equal(getToolSearchIndexDecision({ slug: "cloudconvert", data: {} }).robots, ROBOTS_INDEX_FOLLOW);
  for (const slug of RECOVERY_PROOF_TOOL_SLUGS) {
    assert.equal(getToolSearchIndexDecision({ slug, data: {} }).robots, ROBOTS_INDEX_FOLLOW, slug);
  }
  assert.equal(getToolSearchIndexDecision({ slug: "chatgpt", data: {} }).robots, ROBOTS_NOINDEX_FOLLOW);
  assert.equal(getToolSearchIndexDecision({ slug: "chatgpt", data: { search_index: true } }).robots, ROBOTS_NOINDEX_FOLLOW);
  assert.equal(getToolSearchIndexDecision({ slug: "an-english-tool", data: { search_index: true } }).robots, ROBOTS_NOINDEX_FOLLOW);
  assert.equal(getRecoveryPageRobots("/en/tools/"), ROBOTS_NOINDEX_FOLLOW);
  assert.equal(getRecoveryPageRobots("/en/tools/chatgpt/"), ROBOTS_NOINDEX_FOLLOW);

  const expectedEnglishProof = [
    "beste-ocr-apis-rechnungen-deutschland-2026",
    "open-source-ocr-pdfs-tesseract-ocrmypdf-paddleocr",
    "pdf-daten-extrahieren-ki-tools-apis-kosten-vergleich",
  ];
  assert.deepEqual([...RECOVERY_PROOF_EN_RATGEBER_SLUGS].sort(), [...expectedEnglishProof].sort());
  assert.equal(RECOVERY_PROOF_EN_RATGEBER_SLUGS.size, 3);
  for (const slug of expectedEnglishProof) {
    for (const pathname of [`/en/ratgeber/${slug}`, `/en/ratgeber/${slug}/`]) {
      assert.equal(getRecoveryPageRobots(pathname), ROBOTS_INDEX_FOLLOW, pathname);
    }
  }

  for (const slug of RECOVERY_PROOF_RATGEBER_SLUGS) {
    for (const pathname of [`/ratgeber/${slug}`, `/ratgeber/${slug}/`]) {
      assert.equal(getRecoveryPageRobots(pathname), ROBOTS_INDEX_FOLLOW, pathname);
    }
  }
  for (const pathname of [
    "/en/ratgeber",
    "/en/ratgeber/",
    "/en/ratgeber/another-guide/",
    "/en/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026-extra/",
    "/en/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026/extra/",
    "/en/ratgeber/example.html",
    "/ratgeber/not-in-the-proof-cluster/",
  ]) {
    assert.equal(getRecoveryPageRobots(pathname), ROBOTS_NOINDEX_FOLLOW, pathname);
  }
  assert.equal(RECOVERY_PROOF_RATGEBER_SLUGS.size, 5);
  assert.equal(RECOVERY_PROOF_TOOL_SLUGS.size, 4);
});

test("Pages preview host redirect preserves path and query only", () => {
  const response = redirectPreviewHost(new URL("https://utildesk-motia.pages.dev/en/tools/foo/?q=ocr&sort=new"));
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://tools.utildesk.de/en/tools/foo/?q=ocr&sort=new");
  assert.equal(redirectPreviewHost(new URL("https://tools.utildesk.de/tools/foo/?q=ocr")), null);
});

test("runtime recovery robots keep one agreed meta and preserve canonical, hreflang, and content", () => {
  const source = '<head><meta name="robots" content="noindex"><link rel="canonical" href="https://tools.utildesk.de/en/ratgeber/proof/"><link rel="alternate" hreflang="de" href="https://tools.utildesk.de/ratgeber/proof/"><meta name="description" content="keep"><meta name=\'robots\' content="noindex,nofollow"></head><body><main>keep this OCR content</main></body>';
  const expectedRobotsMeta = `<meta name="robots" content="${ROBOTS_INDEX_FOLLOW}">`;
  const robotMetaPattern = /<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*>/gi;
  for (const slug of RECOVERY_PROOF_EN_RATGEBER_SLUGS) {
    for (const pathname of [`/en/ratgeber/${slug}`, `/en/ratgeber/${slug}/`]) {
      const proof = applyRecoveryRobotsToHtml(source, pathname);
      assert.equal(proof.indexable, true, pathname);
      assert.equal(proof.robots, ROBOTS_INDEX_FOLLOW, pathname);
      assert.deepEqual([...proof.html.matchAll(robotMetaPattern)].map(([meta]) => meta), [expectedRobotsMeta]);
      assert.match(proof.html, /canonical" href="https:\/\/tools\.utildesk\.de\/en\/ratgeber\/proof\//);
      assert.match(proof.html, /rel="alternate" hreflang="de" href="https:\/\/tools\.utildesk\.de\/ratgeber\/proof\//);
      assert.match(proof.html, /name="description" content="keep"/);
      assert.match(proof.html, /<main>keep this OCR content<\/main>/);
    }
  }

  const unquotedTarget = applyRecoveryRobotsToHtml(
    "<head><meta name=robots content=noindex><meta name=\"robots\" content=\"noindex\"></head>",
    "/en/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026/",
  );
  assert.equal(unquotedTarget.html, `<head>${expectedRobotsMeta}</head>`);

  const nonProofDe = applyRecoveryRobotsToHtml("<head><meta name='robots' content='index,follow'></head><main>DE</main>", "/ratgeber/ki-video-2026-nach-sora-gemini-omni-flow-runway-und-adobe-firefly/");
  assert.equal(nonProofDe.indexable, false);
  assert.match(nonProofDe.html, /content="noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/);

  const nonProofEn = applyRecoveryRobotsToHtml("<head></head><main>EN</main>", "/en/ratgeber/example/");
  assert.equal(nonProofEn.indexable, false);
  assert.match(nonProofEn.html, /<meta name="robots" content="noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><\/head>/);
});

test("non-target routes retain the original replace-all and quoted-name behavior", () => {
  const deProofPath = "/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026/";
  const expectedIndexMeta = `<meta name="robots" content="${ROBOTS_INDEX_FOLLOW}">`;
  const quotedDuplicates = applyRecoveryRobotsToHtml(
    '<head><meta name="robots" content="first"><meta name="robots" content="second"></head>',
    deProofPath,
  );
  assert.equal(quotedDuplicates.html, `<head>${expectedIndexMeta}${expectedIndexMeta}</head>`);

  const unquoted = applyRecoveryRobotsToHtml(
    "<head><meta name=robots content=index></head>",
    deProofPath,
  );
  assert.equal(unquoted.html, `<head><meta name=robots content=index>${expectedIndexMeta}</head>`);
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

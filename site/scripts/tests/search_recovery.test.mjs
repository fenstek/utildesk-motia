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
import {
  RECOVERY_ALLOWED_DE_PATHS,
} from "../../shared/recoveryManifest.mjs";
import {
  applyRecoveryRobotsToHtml,
  applyRecoveryResponseHeaders,
  redirectPreviewHost,
} from "../../functions/_middleware.js";

const RECOVERY_BASELINE_URLS = [
  "https://tools.utildesk.de/",
  "https://tools.utildesk.de/tools/",
  "https://tools.utildesk.de/methodologie/",
  "https://tools.utildesk.de/ratgeber/",
  "https://tools.utildesk.de/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026/",
  "https://tools.utildesk.de/ratgeber/coding-agenten-2026-codex-claude-code-und-gemini-cli-im-entwickler-workflow/",
  "https://tools.utildesk.de/ratgeber/make-vs-n8n-vs-zapier-rechnungsautomatisierung/",
  "https://tools.utildesk.de/ratgeber/multi-model-coding-workflows-codex-gemini-claude-code-review/",
  "https://tools.utildesk.de/ratgeber/open-source-ocr-pdfs-tesseract-ocrmypdf-paddleocr/",
  "https://tools.utildesk.de/ratgeber/pdf-daten-extrahieren-ki-tools-apis-kosten-vergleich/",
  "https://tools.utildesk.de/ratgeber/rechnungen-automatisch-aus-e-mails-auslesen-tools-workflows/",
  "https://tools.utildesk.de/ratgeber/vibe-coding-nach-dem-hype-wie-teams-ai-code-pruefen-testen-und-reviewen/",
  "https://tools.utildesk.de/tools/cloudconvert/",
  "https://tools.utildesk.de/tools/convertio/",
  "https://tools.utildesk.de/tools/smallpdf/",
  "https://tools.utildesk.de/tools/tesseract-ocr/",
  "https://tools.utildesk.de/tools/openai-codex/",
  "https://tools.utildesk.de/tools/claude/",
  "https://tools.utildesk.de/tools/cursor/",
  "https://tools.utildesk.de/tools/github-copilot/",
];

const OUTSIDER_SLUGS = ["opencode", "qodo", "mem0", "openclaw"];

test("recovery policy has explicit proof and global noindex samples", () => {
  assert.equal(getToolSearchIndexDecision({ slug: "cloudconvert", data: {} }).robots, ROBOTS_INDEX_FOLLOW);
  assert.equal(getToolSearchIndexDecision({ slug: "chatgpt", data: {} }).robots, ROBOTS_NOINDEX_FOLLOW);
  assert.equal(getToolSearchIndexDecision({ slug: "chatgpt", data: { search_index: true } }).robots, ROBOTS_NOINDEX_FOLLOW);
  assert.equal(getRecoveryPageRobots("/en/tools/"), ROBOTS_NOINDEX_FOLLOW);
  assert.equal(getRecoveryPageRobots("/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026/"), ROBOTS_INDEX_FOLLOW);
  assert.equal(RECOVERY_PROOF_RATGEBER_SLUGS.size, 8);
  assert.equal(RECOVERY_PROOF_TOOL_SLUGS.size, 8);
  assert.equal(RECOVERY_ALLOWED_DE_PATHS.size, 20);
  for (const slug of OUTSIDER_SLUGS) {
    assert.equal(RECOVERY_PROOF_TOOL_SLUGS.has(slug), false, slug);
    assert.equal(RECOVERY_PROOF_RATGEBER_SLUGS.has(slug), false, slug);
  }
});

test("Pages preview host redirect preserves path and query only", () => {
  const response = redirectPreviewHost(new URL("https://utildesk-motia.pages.dev/en/tools/foo/?q=ocr&sort=new"));
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://tools.utildesk.de/en/tools/foo/?q=ocr&sort=new");
  assert.equal(redirectPreviewHost(new URL("https://tools.utildesk.de/tools/foo/?q=ocr")), null);
});

test("runtime recovery robots preserve canonical and non-robots HTML", () => {
  const source = '<head><link rel="canonical" href="https://tools.utildesk.de/ratgeber/proof/"><meta name="description" content="keep"><meta name="robots" content="index,follow"></head><body>keep</body>';
  const proof = applyRecoveryRobotsToHtml(source, "/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026/");
  assert.equal(proof.indexable, true);
  assert.match(proof.html, /<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">/);
  assert.match(proof.html, /canonical" href="https:\/\/tools\.utildesk\.de\/ratgeber\/proof\//);
  assert.match(proof.html, /<body>keep<\/body>/);

  const nonProofDe = applyRecoveryRobotsToHtml("<head><meta name='robots' content='index,follow'></head><main>DE</main>", "/ratgeber/ki-video-2026-nach-sora-gemini-omni-flow-runway-und-adobe-firefly/");
  assert.equal(nonProofDe.indexable, false);
  assert.match(nonProofDe.html, /content="noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/);

  const nonProofEn = applyRecoveryRobotsToHtml("<head></head><main>EN</main>", "/en/ratgeber/example/");
  assert.equal(nonProofEn.indexable, false);
  assert.match(nonProofEn.html, /<meta name="robots" content="noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><\/head>/);
});

test("selected recovery pages stay indexable through edge response handling", () => {
  const selectedPaths = [
    "/",
    "/tools/",
    "/methodologie/",
    "/ratgeber/",
    "/tools/openai-codex/",
    "/tools/claude/",
    "/tools/cursor/",
    "/tools/github-copilot/",
    "/ratgeber/coding-agenten-2026-codex-claude-code-und-gemini-cli-im-entwickler-workflow/",
    "/ratgeber/vibe-coding-nach-dem-hype-wie-teams-ai-code-pruefen-testen-und-reviewen/",
    "/ratgeber/multi-model-coding-workflows-codex-gemini-claude-code-review/",
  ];

  for (const pathname of selectedPaths) {
    const html = applyRecoveryRobotsToHtml("<head></head><main>page</main>", pathname);
    assert.equal(html.indexable, true, pathname);
    assert.match(html.html, /<meta name="robots" content="index,follow,/);
    assert.doesNotMatch(html.html, /noindex/);

    const headers = new Headers({ "X-Robots-Tag": "noindex, follow" });
    applyRecoveryResponseHeaders(headers, true);
    assert.equal(headers.has("X-Robots-Tag"), false, pathname);
  }
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
  assert.deepEqual(urls, RECOVERY_BASELINE_URLS);
  assert.equal(new Set(urls).size, RECOVERY_BASELINE_URLS.length);
  assert.ok(urls.every((url) => url.startsWith("https://tools.utildesk.de/") && !url.includes("/en/")));
  const proofTools = new Set([
    "cloudconvert", "convertio", "smallpdf", "tesseract-ocr",
    "openai-codex", "claude", "cursor", "github-copilot",
  ]);
  assert.ok(!urls.some((url) => {
    const slug = url.match(/\/tools\/([^/]+)\/$/)?.[1];
    return slug && !proofTools.has(slug);
  }));
});

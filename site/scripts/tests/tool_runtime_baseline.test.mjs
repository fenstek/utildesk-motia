import assert from "node:assert/strict";
import test from "node:test";
import { inspectToolHtml } from "../capture_tool_runtime_baseline.mjs";

test("inspectToolHtml captures the route and machine-readable SEO contract", () => {
  const html = `<!doctype html><html><head>
    <title>Example &amp; Test</title>
    <meta name="description" content="A useful page">
    <meta name="robots" content="index,follow">
    <meta name="googlebot" content="noindex,follow">
    <link rel="canonical" href="https://tools.utildesk.de/tools/example/">
    <link rel="alternate" hreflang="de" href="https://tools.utildesk.de/tools/example/">
    <link rel="alternate" hreflang="en" href="https://tools.utildesk.de/en/tools/example/">
    <link rel="alternate" hreflang="x-default" href="https://tools.utildesk.de/tools/example/">
    <link rel="alternate" type="application/json" href="/api/tools/example.json">
    <link rel="alternate" type="text/markdown" href="/markdown/tools/example.md">
    <script type="application/ld+json">{"@graph":[{"@type":"SoftwareApplication"},{"@type":"FAQPage"}]}</script>
  </head><body><h1>Example</h1><h2>Details</h2>
    <figure class="tool-editorial-figure"><img src="/images/tools/example.webp"></figure>
    <a class="akte-alt-card" href="/tools/other/">Other</a>
    <a class="akte-alt-card" href="/ratgeber/example-guide/">Guide</a>
  </body></html>`;

  const result = inspectToolHtml(html);
  assert.equal(result.title, "Example & Test");
  assert.equal(result.canonical, "https://tools.utildesk.de/tools/example/");
  assert.deepEqual(result.hreflang, {
    de: "https://tools.utildesk.de/tools/example/",
    en: "https://tools.utildesk.de/en/tools/example/",
    "x-default": "https://tools.utildesk.de/tools/example/",
  });
  assert.equal(result.robots, "index,follow");
  assert.equal(result.googlebot, "noindex,follow");
  assert.deepEqual(result.machineAlternates, [
    { type: "application/json", href: "/api/tools/example.json" },
    { type: "text/markdown", href: "/markdown/tools/example.md" },
  ]);
  assert.deepEqual(result.jsonLd, [{ valid: true, types: ["FAQPage", "SoftwareApplication"] }]);
  assert.deepEqual(result.headingCounts, { h1: 1, h2: 1, h3: 0 });
  assert.equal(result.featureCounts.editorialFigures, 1);
  assert.equal(result.featureCounts.alternatives, 1);
  assert.equal(result.featureCounts.guideBacklinks, 1);
  assert.equal(result.featureCounts.faqNodes, 1);
});

test("inspectToolHtml records invalid structured data without throwing", () => {
  const result = inspectToolHtml('<script type="application/ld+json">{broken}</script>');
  assert.equal(result.jsonLd.length, 1);
  assert.equal(result.jsonLd[0].valid, false);
});

import assert from "node:assert/strict";
import test from "node:test";
import { compareToolRuntimeManifests } from "../check_tool_runtime_parity.mjs";

const record = {
  slug: "example",
  locale: "de",
  status: 200,
  viewport: { overflowX: false },
  html: {
    title: "Example",
    description: "Description",
    canonical: "https://tools.utildesk.de/tools/example/",
    hreflang: { de: "de", en: "en", "x-default": "de" },
    robots: "index,follow",
    googlebot: null,
    machineAlternates: [],
    jsonLd: [],
    headingCounts: { h1: 1, h2: 2, h3: 0 },
    featureCounts: { editorialFigures: 0, alternatives: 0, guideBacklinks: 0, faqNodes: 0 },
    internalToolHrefs: [],
    guideHrefs: [],
  },
};
const manifest = { records: [record], activeSetParity: true, viewport: { width: 390 } };

test("parity accepts identical canonical contracts", () => {
  assert.deepEqual(compareToolRuntimeManifests(manifest, structuredClone(manifest)), { ok: true, compared: 1, errors: [] });
});

test("preview parity permits only the explicit noindex override", () => {
  const candidate = structuredClone(manifest);
  candidate.records[0].html.robots = "noindex,nofollow,noarchive";
  candidate.records[0].html.googlebot = "noindex,nofollow,noarchive";
  assert.equal(compareToolRuntimeManifests(manifest, candidate, { preview: true }).ok, true);
});

test("parity rejects canonical, link and overflow drift", () => {
  const candidate = structuredClone(manifest);
  candidate.records[0].html.canonical = "https://example.invalid/";
  candidate.records[0].html.internalToolHrefs.push("/tools/missing/");
  candidate.records[0].viewport.overflowX = true;
  const result = compareToolRuntimeManifests(manifest, candidate);
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.includes("canonical")), true);
  assert.equal(result.errors.some((error) => error.includes("internalToolHrefs")), true);
  assert.equal(result.errors.some((error) => error.includes("overflow")), true);
});

test("parity permits only explicitly audited broken-link removals", () => {
  const baseline = structuredClone(manifest);
  baseline.records[0].html.internalToolHrefs.push("/tools/inactive/");
  const candidate = structuredClone(manifest);
  assert.equal(compareToolRuntimeManifests(baseline, candidate).ok, false);
  assert.equal(compareToolRuntimeManifests(baseline, candidate, { allowedRemovedUrls: new Set(["/tools/inactive/"]) }).ok, true);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import { buildToolDetailViewModel } from "../../shared/toolDetailViewModel.mjs";
import { translateLabel, translatePriceModelLabel } from "../../shared/toolLabelTranslations.mjs";

const cases = [
  { slug: "wordreference", category: "Produktivität", priceModel: "Freemium", expectedCategory: "Productivity", expectedPriceModel: "Freemium" },
  { slug: "textblob", category: "Produktivität", priceModel: "Open Source", expectedCategory: "Productivity", expectedPriceModel: "Open Source" },
  { slug: "amazon-bedrock-agentcore-browser", category: "AI Infrastructure", priceModel: "Nutzungsbasiert", expectedCategory: "AI Infrastructure", expectedPriceModel: "Usage-based" },
  { slug: "h2o-ai", category: "AI Infrastructure", priceModel: "Je nach Plan", expectedCategory: "AI Infrastructure", expectedPriceModel: "Plan-based" },
];

const runtimeEntry = ({ slug = "example", category, priceModel }) => ({
  kind: "tool",
  locale: "en",
  slug,
  title: slug,
  excerpt: "A short tool description.",
  metadata: { title: slug, category, price_model: priceModel, tags: ["ai"] },
  markdown: `# ${slug}\n\nA short tool description.\n\n## Features\n\n- A bounded task`,
  sourceHash: "test-source",
  revision: 1,
  sourcePublishedAt: null,
  sourceUpdatedAt: null,
  isActive: true,
  routeState: "active",
  canonicalPath: `/en/tools/${slug}/`,
  redirectTargetPath: null,
  robotsPolicy: "index,follow",
  googlebotPolicy: null,
  editorialReviewed: true,
  illustrationPath: null,
  assetKey: null,
  assetHash: null,
  sourceCommit: null,
  deletedAt: null,
  category,
  priceModel,
  popularity: 0,
});

const detailView = (entry, locale, category, priceModel) => buildToolDetailViewModel({
  entry: {
    slug: entry.slug,
    data: { title: entry.title, category, price_model: priceModel, tags: ["ai"], editorial_reviewed: true },
    content: entry.markdown,
  },
  locale,
  localized: { title: entry.title, category, priceModel, tags: ["ai"], markdown: entry.markdown },
});

let vite;
let getEnglishToolMeta;
let buildRuntimeDisplayTool;
let buildRuntimeToolJson;
let runtimeDisplayTools;

before(async () => {
  vite = await createServer({
    root: fileURLToPath(new URL("../..", import.meta.url)),
    configFile: false,
    server: { middlewareMode: true },
    appType: "custom",
  });
  ({ getEnglishToolMeta } = await vite.ssrLoadModule("/src/lib/englishContent.ts"));
  ({ buildRuntimeDisplayTool, buildRuntimeToolJson } = await vite.ssrLoadModule("/runtime-src/lib/toolMachineRuntime.ts"));
  ({ runtimeDisplayTools } = await vite.ssrLoadModule("/runtime-src/lib/toolRuntime.ts"));
});

after(async () => {
  await vite?.close();
});

test("static English tool metadata localizes the four reviewed cards", () => {
  for (const item of cases) {
    const meta = getEnglishToolMeta({
      slug: item.slug,
      data: { title: item.slug, category: item.category, price_model: item.priceModel, tags: [] },
      content: "",
    });
    assert.equal(meta.category, item.expectedCategory, item.slug);
    assert.equal(meta.categoryFilterValue, item.category, `${item.slug} keeps the canonical static filter value`);
    assert.equal(meta.priceModel, item.expectedPriceModel, item.slug);

    const view = detailView({ slug: item.slug, title: item.slug, markdown: "# Tool\n\nA short description.\n\n## Features\n\n- A bounded task" }, "en", meta.category, meta.priceModel);
    assert.equal(view.softwareApplicationSchema.applicationSubCategory, item.expectedCategory, `${item.slug} JSON-LD category`);
    assert.equal(view.softwareApplicationSchema.offers?.priceSpecification?.description ?? view.softwareApplicationSchema.offers?.category, item.expectedPriceModel, `${item.slug} JSON-LD price`);
  }
});

test("D1 runtime English cards and machine JSON localize stored German values", () => {
  for (const item of cases) {
    const entry = runtimeEntry(item);
    const display = buildRuntimeDisplayTool(entry, "en");
    assert.equal(display.category, item.expectedCategory, `${item.slug} visible category`);
    assert.equal(display.categoryFilterValue, item.category, `${item.slug} keeps the canonical runtime filter value`);
    assert.equal(display.priceModel, item.expectedPriceModel, `${item.slug} visible price`);

    const payload = buildRuntimeToolJson(entry, "en");
    assert.equal(payload.data.category, item.expectedCategory, `${item.slug} machine category`);
    assert.equal(payload.data.categoryFilterValue, item.category, `${item.slug} machine filter value`);
    assert.equal(payload.data.priceModel, item.expectedPriceModel, `${item.slug} machine price`);

    const view = detailView(entry, "en", entry.category, entry.priceModel);
    assert.equal(view.category, item.expectedCategory, `${item.slug} visible detail category`);
    assert.equal(view.priceModel, item.expectedPriceModel, `${item.slug} visible detail price`);
    assert.equal(view.softwareApplicationSchema.applicationSubCategory, item.expectedCategory, `${item.slug} JSON-LD category`);
    assert.equal(view.softwareApplicationSchema.offers?.priceSpecification?.description ?? view.softwareApplicationSchema.offers?.category, item.expectedPriceModel, `${item.slug} JSON-LD price`);

    const related = runtimeDisplayTools([{
      slug: item.slug,
      title: item.slug,
      excerpt: "Alternative",
      metadata: { category: item.category, price_model: item.priceModel },
      category: item.category,
      priceModel: item.priceModel,
    }], "en")[0];
    assert.equal(related.category, item.expectedCategory, `${item.slug} related-card category`);
    assert.equal(related.priceModel, item.expectedPriceModel, `${item.slug} related-card price`);
  }
});

test("German detail values stay German and unknown labels remain intact", () => {
  const germanEntry = runtimeEntry({ slug: "de-example", category: "Produktivität", priceModel: "Nutzungsbasiert" });
  const germanDisplay = buildRuntimeDisplayTool(germanEntry, "de");
  assert.equal(germanDisplay.category, "Produktivität");
  assert.equal(germanDisplay.categoryFilterValue, "Produktivität");
  assert.equal(germanDisplay.priceModel, "Nutzungsbasiert");
  const germanView = detailView(germanEntry, "de", "Produktivität", "Nutzungsbasiert");
  assert.equal(germanView.category, "Produktivität");
  assert.equal(germanView.priceModel, "Nutzungsbasiert");
  assert.equal(germanView.softwareApplicationSchema.applicationSubCategory, "Produktivität");
  assert.equal(germanView.softwareApplicationSchema.offers.priceSpecification.description, "Nutzungsbasiert");

  assert.equal(translateLabel("  Unbekannte Kategorie  "), "Unbekannte Kategorie");
  assert.equal(translatePriceModelLabel("  Mystery Meter v9  "), "Mystery Meter v9");
  const unknownEntry = runtimeEntry({ slug: "unknown", category: "Vendor Segment X", priceModel: "Mystery Meter v9" });
  const unknownDisplay = buildRuntimeDisplayTool(unknownEntry, "en");
  assert.equal(unknownDisplay.category, "Vendor Segment X");
  assert.equal(unknownDisplay.categoryFilterValue, "Vendor Segment X");
  assert.equal(unknownDisplay.priceModel, "Mystery Meter v9");
  const unknownView = detailView(unknownEntry, "en", unknownEntry.category, unknownEntry.priceModel);
  assert.equal(unknownView.category, "Vendor Segment X");
  assert.equal(unknownView.priceModel, "Mystery Meter v9");
  assert.equal(unknownView.softwareApplicationSchema.applicationSubCategory, "Vendor Segment X");
  assert.equal(unknownView.softwareApplicationSchema.offers.priceSpecification.description, "Mystery Meter v9");
});

test("Worker runtime localization stays independent of filesystem-backed English content", () => {
  const source = readFileSync(new URL("../../runtime-src/lib/toolMachineRuntime.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /englishContent|node:fs/);
});

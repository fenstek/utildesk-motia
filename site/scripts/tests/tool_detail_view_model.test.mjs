import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import matter from "gray-matter";
import test from "node:test";
import { buildToolDetailViewModel, getToolContextHints } from "../../shared/toolDetailViewModel.mjs";
import { buildEntryUpsertStatement } from "../runtime-content.mjs";

const entry = {
  slug: "example",
  data: {
    title: "Example",
    description: "Example supports a bounded test workflow.",
    category: "Automation",
    price_model: "Freemium",
    tags: ["ai", "workflow", "automation"],
    official_url: "https://example.com/product",
    lastReviewed: "2026-07-01",
    editorial_reviewed: true,
  },
  content: `# Example

Example supports a bounded test workflow.

Compare [Inactive](/tools/inactive/) before rollout.

## Features

- Runs a controlled workflow

## Alternatives

- [Other](/tools/other/): another option

## FAQ

### Is Example suitable for production?

Only after a bounded pilot with review and fallback.`,
};

const displayTools = [
  { slug: "example", title: "Example", iconUrl: "/images/logos/example.svg", iconFallbacks: [] },
  { slug: "other", title: "Other", category: "Automation", priceModel: "Paid", excerpt: "Alternative", iconUrl: null, iconFallbacks: [] },
];

const readToolCard = (locale, slug) => {
  const prefix = locale === "en" ? "en/" : "";
  const path = new URL(`../../../content/${prefix}tools/${slug}.md`, import.meta.url);
  const parsed = matter(readFileSync(path, "utf8"));
  return { slug, data: parsed.data, content: parsed.content };
};

const englishLocalized = (entry) => ({
  toolFacts: entry.data.tool_facts,
  editorialVerdictHeadline: entry.data.editorial_verdict_headline,
  editorialVerdictText: entry.data.editorial_verdict_text,
  editorialTrustLabel: entry.data.editorial_trust_label,
});

const d1MetadataRoundTrip = (entry, locale) => {
  const statement = buildEntryUpsertStatement({
    contentKey: `tool:${locale}:${entry.slug}`,
    kind: "tool",
    locale,
    slug: entry.slug,
    title: entry.data.title ?? entry.slug,
    excerpt: "",
    metadata: entry.data,
    markdown: entry.content,
    sourceHash: "test-source",
    sourcePublishedAt: null,
    sourceUpdatedAt: null,
    isActive: 1,
    routeState: "active",
    canonicalPath: `${locale === "en" ? "/en" : ""}/tools/${entry.slug}/`,
    robotsPolicy: "index,follow",
    googlebotPolicy: null,
    editorialReviewed: 1,
    illustrationPath: null,
    assetKey: null,
    assetHash: null,
    sourceCommit: null,
    deletedAt: null,
    category: entry.data.category ?? null,
    priceModel: entry.data.price_model ?? null,
    popularity: 0,
  });
  const columns = statement.sql.match(/INSERT INTO content_entries \(([^)]+)\)/)?.[1].split(", ") ?? [];
  const metadataIndex = columns.indexOf("metadata_json");
  assert.notEqual(metadataIndex, -1, "D1 upsert includes metadata_json");
  return JSON.parse(statement.params[metadataIndex]);
};

test("getToolContextHints limits runtime context to linked slugs and named alternatives", () => {
  assert.deepEqual(getToolContextHints(entry.content), {
    slugs: ["inactive", "other"],
    titles: [],
  });
  assert.deepEqual(getToolContextHints("## Alternatives\n\n- **Named Tool**: useful option"), {
    slugs: [],
    titles: ["Named Tool"],
  });
  assert.deepEqual(getToolContextHints("## Alternatives\n\n- `Notion AI`: useful option"), {
    slugs: [],
    titles: ["Notion AI"],
  });
});

test("buildToolDetailViewModel produces the shared DE delivery contract", () => {
  const view = buildToolDetailViewModel({
    entry,
    locale: "de",
    displayTools,
    categories: [{ slug: "automatisierung", title: "Automatisierung", matchTags: ["automation", "workflow"] }],
    guideBacklinks: [{ slug: "guide", title: "Guide" }],
    searchIndexDecision: { robots: "index,follow", googlebotRobots: null },
  });

  assert.equal(view.canonicalUrl, "https://tools.utildesk.de/tools/example/");
  assert.deepEqual(view.machinePaths, { json: "/api/tools/example.json", markdown: "/markdown/tools/example.md" });
  assert.equal(view.alternativesTop[0].slug, "other");
  assert.equal(view.articleHeadings.some((heading) => heading.label === "Features"), true);
  assert.match(view.articleHtml, /inline-provider-link/);
  assert.equal(view.articleHtml.includes('/tools/inactive/'), false);
  assert.match(view.articleHtml, /Compare Inactive before rollout/);
  assert.equal(view.articleHtml.includes("<h1"), false);
  assert.equal(view.editorialFigureHtml, "");
  assert.equal(view.editorialVerdict.kind, "unrated");
  assert.equal(view.editorialVerdict.detailKicker, "Noch nicht bewertet");
  assert.equal(view.editorialVerdictHeadline, "Noch keine redaktionelle Empfehlung ausgesprochen.");
  assert.equal(view.faqSchema["@type"], "FAQPage");
  assert.equal(view.softwareApplicationSchema.url, view.canonicalUrl);
  assert.equal(view.breadcrumbSchema.itemListElement.length, 3);
  assert.equal(view.mentionedInCount, 1);
});

test("explicit verdicts render while orphaned verdict copy cannot override the neutral state", () => {
  const explicit = buildToolDetailViewModel({
    entry: {
      ...entry,
      data: {
        ...entry.data,
        editorial_verdict: "recommend",
        editorial_verdict_headline: "Empfehlen - nach einem begrenzten Praxistest.",
      },
    },
    locale: "de",
    displayTools,
  });
  assert.equal(explicit.editorialVerdict.kind, "recommend");
  assert.equal(explicit.editorialVerdictHeadline, "Empfehlen - nach einem begrenzten Praxistest.");

  const orphanedCopy = buildToolDetailViewModel({
    entry: {
      ...entry,
      data: {
        ...entry.data,
        editorial_verdict_headline: "Empfehlen - this must not be shown.",
        editorial_verdict_text: "Recommended.",
      },
    },
    locale: "en",
    displayTools,
  });
  assert.equal(orphanedCopy.editorialVerdict.kind, "unrated");
  assert.equal(orphanedCopy.editorialVerdictHeadline, "No editorial recommendation has been issued yet.");
  assert.equal(orphanedCopy.editorialVerdictText.includes("explicitly reviewed recommendation"), true);

  const untranslatedEnglishCopy = buildToolDetailViewModel({
    entry: {
      ...entry,
      data: {
        ...entry.data,
        editorial_verdict: "recommend",
        editorial_verdict_headline: "Empfehlung für einen begrenzten Einsatz.",
        editorial_verdict_text: "Dieser deutsche Text darf nicht auf der EN-Seite erscheinen.",
        editorial_trust_label: "Quellen geprüft · 06.11.2026",
      },
    },
    locale: "en",
    displayTools,
  });
  assert.equal(untranslatedEnglishCopy.editorialVerdict.kind, "recommend");
  assert.equal(untranslatedEnglishCopy.editorialVerdictHeadline, "Recommend — as a tool, not as autopilot.");
  assert.equal(untranslatedEnglishCopy.editorialVerdictText, "Good starting point with a clear task, human review and traceable data flows.");
  assert.equal(untranslatedEnglishCopy.editorialTrustLabel, "4 / 5 · high");
});

test("schema application type metadata avoids unconfirmed web claims on frozen and D1 routes", () => {
  const assertSoftwareOnly = (view, label) => {
    assert.deepEqual(view.softwareApplicationSchema["@type"], ["SoftwareApplication"], label);
    assert.equal(Object.hasOwn(view.softwareApplicationSchema, "operatingSystem"), false, `${label}: no operatingSystem claim`);
  };
  const assertExistingWebSchema = (view, label) => {
    assert.deepEqual(view.softwareApplicationSchema["@type"], ["SoftwareApplication", "WebApplication"], label);
    assert.equal(view.softwareApplicationSchema.operatingSystem, "Web", `${label}: previous operatingSystem claim`);
  };

  for (const slug of ["textblob", "h2o-ai"]) {
    const germanEntry = readToolCard("de", slug);
    const englishEntry = readToolCard("en", slug);
    assert.equal(germanEntry.data.schema_application_type, "SoftwareApplication", `${slug} DE metadata`);
    assert.equal(englishEntry.data.schema_application_type, "SoftwareApplication", `${slug} EN metadata`);

    const frozenGermanView = buildToolDetailViewModel({ entry: germanEntry, locale: "de", displayTools: [] });
    assertSoftwareOnly(frozenGermanView, `${slug} DE frozen`);

    // The frozen EN route renders its localized copy over the DE content entry.
    const frozenEnglishView = buildToolDetailViewModel({
      entry: germanEntry,
      locale: "en",
      localized: englishLocalized(englishEntry),
      displayTools: [],
    });
    assertSoftwareOnly(frozenEnglishView, `${slug} EN frozen`);

    const runtimeGermanEntry = { ...germanEntry, data: d1MetadataRoundTrip(germanEntry, "de") };
    const runtimeEnglishEntry = { ...englishEntry, data: d1MetadataRoundTrip(englishEntry, "en") };
    assert.equal(runtimeGermanEntry.data.schema_application_type, "SoftwareApplication", `${slug} DE D1 metadata`);
    assert.equal(runtimeEnglishEntry.data.schema_application_type, "SoftwareApplication", `${slug} EN D1 metadata`);
    assertSoftwareOnly(
      buildToolDetailViewModel({ entry: runtimeGermanEntry, locale: "de", displayTools: [] }),
      `${slug} DE D1 runtime`,
    );
    assertSoftwareOnly(
      buildToolDetailViewModel({
        entry: runtimeEnglishEntry,
        locale: "en",
        localized: englishLocalized(englishEntry),
        displayTools: [],
      }),
      `${slug} EN D1 runtime`,
    );
  }

  const wordReferenceDe = readToolCard("de", "wordreference");
  const wordReferenceEn = readToolCard("en", "wordreference");
  assert.equal(Object.hasOwn(wordReferenceDe.data, "schema_application_type"), false);
  assert.equal(Object.hasOwn(wordReferenceEn.data, "schema_application_type"), false);
  assertExistingWebSchema(
    buildToolDetailViewModel({ entry: wordReferenceDe, locale: "de", displayTools: [] }),
    "WordReference DE",
  );
  assertExistingWebSchema(
    buildToolDetailViewModel({
      entry: wordReferenceDe,
      locale: "en",
      localized: englishLocalized(wordReferenceEn),
      displayTools: [],
    }),
    "WordReference EN frozen",
  );
  assertExistingWebSchema(buildToolDetailViewModel({ entry, locale: "de", displayTools: [] }), "ordinary card");
});

test("tool facts use localized metadata on frozen and runtime DE/EN routes", () => {
  const expectedFacts = {
    textblob: {
      de: { hosting: "Lokal / eigene Infrastruktur", openSource: "Ja (MIT)", selfHostable: "Lokal ausführbar" },
      en: { hosting: "Local / own infrastructure", openSource: "Yes (MIT)", selfHostable: "Runs locally" },
    },
    "h2o-ai": {
      de: { hosting: "Cloud / eigener Betrieb", openSource: "Teilweise (H2O-3)", selfHostable: "Teilweise (H2O-3)" },
      en: { hosting: "Cloud / self-managed", openSource: "Partly (H2O-3)", selfHostable: "Partly (H2O-3)" },
    },
    "amazon-bedrock-agentcore-browser": {
      de: { hosting: "AWS Cloud", openSource: "prüfen", selfHostable: "prüfen" },
      en: { hosting: "AWS Cloud", openSource: "check", selfHostable: "check" },
    },
  };

  for (const slug of Object.keys(expectedFacts)) {
    const germanEntry = readToolCard("de", slug);
    const englishEntry = readToolCard("en", slug);
    const germanView = buildToolDetailViewModel({
      entry: germanEntry,
      locale: "de",
      localized: { toolFacts: germanEntry.data.tool_facts },
      displayTools: [],
    });
    assert.deepEqual(germanView.toolFacts, expectedFacts[slug].de, `${slug} DE frozen route`);

    const englishCopy = englishLocalized(englishEntry);
    const frozenEnglishView = buildToolDetailViewModel({
      entry: germanEntry,
      locale: "en",
      localized: englishCopy,
      displayTools: [],
    });
    assert.deepEqual(frozenEnglishView.toolFacts, expectedFacts[slug].en, `${slug} EN frozen route`);
    assert.equal(frozenEnglishView.editorialVerdict.kind, englishEntry.data.editorial_verdict);
    assert.equal(frozenEnglishView.editorialVerdictHeadline, englishEntry.data.editorial_verdict_headline);
    assert.equal(frozenEnglishView.editorialVerdictText, englishEntry.data.editorial_verdict_text);
    assert.equal(frozenEnglishView.editorialTrustLabel, englishEntry.data.editorial_trust_label);
    assert.doesNotMatch(
      `${frozenEnglishView.editorialVerdictHeadline} ${frozenEnglishView.editorialVerdictText} ${frozenEnglishView.editorialTrustLabel}`,
      /Empfehlung|Vorbehalt|Quellen geprüft/i,
    );

    const runtimeEnglishView = buildToolDetailViewModel({
      entry: englishEntry,
      locale: "en",
      localized: englishCopy,
      displayTools: [],
    });
    assert.deepEqual(runtimeEnglishView.toolFacts, expectedFacts[slug].en, `${slug} EN runtime route`);
    assert.equal(runtimeEnglishView.editorialVerdict.kind, englishEntry.data.editorial_verdict);
    assert.equal(runtimeEnglishView.editorialVerdictHeadline, englishEntry.data.editorial_verdict_headline);
    assert.equal(runtimeEnglishView.editorialTrustLabel, englishEntry.data.editorial_trust_label);
  }

  const wordReferenceDe = readToolCard("de", "wordreference");
  const wordReferenceEn = readToolCard("en", "wordreference");
  assert.deepEqual(
    buildToolDetailViewModel({ entry: wordReferenceDe, locale: "de", displayTools: [] }).toolFacts,
    { hosting: "Web · Anbieter", openSource: "prüfen", selfHostable: "prüfen" },
  );
  assert.deepEqual(
    buildToolDetailViewModel({ entry: wordReferenceDe, locale: "en", localized: englishLocalized(wordReferenceEn), displayTools: [] }).toolFacts,
    { hosting: "Web / provider", openSource: "check", selfHostable: "check" },
  );

  const otherDe = readToolCard("de", "otter-ai");
  const otherEn = readToolCard("en", "otter-ai");
  assert.deepEqual(
    buildToolDetailViewModel({ entry: otherDe, locale: "de", displayTools: [] }).toolFacts,
    { hosting: "prüfen", openSource: "prüfen", selfHostable: "prüfen" },
  );
  const otherEnglishView = buildToolDetailViewModel({
    entry: otherEn,
    locale: "en",
    localized: englishLocalized(otherEn),
    displayTools: [],
  });
  assert.deepEqual(otherEnglishView.toolFacts, { hosting: "check", openSource: "check", selfHostable: "check" });
  assert.equal(otherEnglishView.editorialVerdict.kind, "caution");
  assert.equal(otherEnglishView.editorialVerdictHeadline, "With caveat — check first, then use in production.");
  assert.equal(otherEnglishView.editorialTrustLabel, "3 / 5 · check");

  const priceModelConfirmsOpenSource = buildToolDetailViewModel({
    entry: { ...entry, data: { ...entry.data, price_model: "Open Source" } },
    locale: "de",
    displayTools: [],
  });
  assert.equal(priceModelConfirmsOpenSource.toolFacts.openSource, "Ja");
  const englishPriceModelConfirmsOpenSource = buildToolDetailViewModel({
    entry: { ...entry, data: { ...entry.data, price_model: "Open Source" } },
    locale: "en",
    localized: { priceModel: "Open Source" },
    displayTools: [],
  });
  assert.equal(englishPriceModelConfirmsOpenSource.toolFacts.openSource, "Yes");
});

test("buildToolDetailViewModel produces localized EN routes and filters inactive alternatives", () => {
  const view = buildToolDetailViewModel({
    entry,
    locale: "en",
    localized: {
      title: "Example EN",
      description: "English description.",
      metaDescription: "English meta description.",
      category: "Automation",
      priceModel: "Free",
      tags: ["workflow"],
      markdown: entry.content.replace("Example supports", "Example EN supports"),
      featureList: ["English feature"],
    },
    displayTools: [displayTools[0]],
    guideBacklinks: [],
    searchIndexDecision: { robots: "index,follow", googlebotRobots: "noindex,follow" },
  });

  assert.equal(view.canonicalUrl, "https://tools.utildesk.de/en/tools/example/");
  assert.deepEqual(view.machinePaths, { json: "/en/api/tools/example.json", markdown: "/en/markdown/tools/example.md" });
  assert.equal(view.alternativesTop.length, 0);
  assert.equal(view.metaDescription, "English meta description.");
  assert.equal(view.softwareApplicationSchema.inLanguage, "en");
  assert.deepEqual(view.softwareApplicationSchema.featureList, ["English feature"]);
  assert.equal(view.articleHtml.includes("inline-provider-link"), false);
});

test("English runtime fallback keeps the established 158-character meta limit", () => {
  const description = "A".repeat(200);
  const view = buildToolDetailViewModel({
    entry,
    locale: "en",
    localized: { description },
    displayTools: [],
  });
  assert.equal(view.metaDescription, `${"A".repeat(155)}...`);
  assert.equal(view.metaDescription.length, 158);
});

test("non-curated entries never emit FAQ or SoftwareApplication eligibility by accident", () => {
  const automatic = {
    slug: "automatic",
    data: { title: "Automatic", description: "Short automatic entry.", tier: "D" },
    content: "# Automatic\n\nShort automatic entry.",
  };
  const view = buildToolDetailViewModel({ entry: automatic, locale: "de", displayTools: [] });
  assert.equal(view.isCuratedTool, false);
  assert.equal(view.faqSchema, null);
});

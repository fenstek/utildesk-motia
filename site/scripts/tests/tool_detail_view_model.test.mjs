import assert from "node:assert/strict";
import test from "node:test";
import { buildToolDetailViewModel } from "../../shared/toolDetailViewModel.mjs";

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
  assert.equal(view.faqSchema["@type"], "FAQPage");
  assert.equal(view.softwareApplicationSchema.url, view.canonicalUrl);
  assert.equal(view.breadcrumbSchema.itemListElement.length, 3);
  assert.equal(view.mentionedInCount, 1);
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

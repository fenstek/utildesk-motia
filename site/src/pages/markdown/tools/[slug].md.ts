import { buildMarkdownFrontmatter, buildToolCatalogItem, extractFeatureList } from "../../../lib/machineReadable";
import { listActiveToolEntries } from "../../../lib/toolEntries.mjs";
import { classifyToolEntry, isCuratedTier, stripTemplateBoilerplate } from "../../../lib/toolQuality.mjs";

export const prerender = true;

export async function getStaticPaths() {
  const entries = await listActiveToolEntries();
  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

export async function GET({ props }: { props: { entry: any } }) {
  const entry = props.entry;
  const summary = buildToolCatalogItem(entry);
  const quality = classifyToolEntry(entry);
  const contentMarkdown = isCuratedTier(quality.tier)
    ? String(entry.content ?? "").trim()
    : [
        "> Dieser Eintrag wurde automatisch aus öffentlichen Anbieterinformationen erstellt und nicht redaktionell geprüft.",
        "> Für eine kuratierte Einordnung siehe unsere Ratgeber: https://tools.utildesk.de/ratgeber/",
        "",
        stripTemplateBoilerplate(entry.content),
      ].join("\n");
  const featureList = extractFeatureList(contentMarkdown);

  const markdown = [
    buildMarkdownFrontmatter({
      title: summary.title,
      slug: summary.slug,
      url: summary.url,
      category: summary.category,
      priceModel: summary.priceModel,
      officialUrl: summary.officialUrl,
      affiliateUrl: summary.affiliateUrl,
      tier: quality.tier,
      editorialStatus: isCuratedTier(quality.tier) ? "curated" : "automatic",
      tags: summary.tags,
      description: summary.description,
      featureList,
    }),
    contentMarkdown,
    "",
  ].join("\n");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

import { buildMarkdownFrontmatter, buildToolCatalogItem, extractFeatureList } from "../../../lib/machineReadable";
import { listActiveToolEntries } from "../../../lib/toolEntries.mjs";

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
  const featureList = extractFeatureList(entry.content);

  const markdown = [
    buildMarkdownFrontmatter({
      title: summary.title,
      slug: summary.slug,
      url: summary.url,
      category: summary.category,
      priceModel: summary.priceModel,
      officialUrl: summary.officialUrl,
      affiliateUrl: summary.affiliateUrl,
      tags: summary.tags,
      description: summary.description,
      featureList,
    }),
    String(entry.content ?? "").trim(),
    "",
  ].join("\n");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

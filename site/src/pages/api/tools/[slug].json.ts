import { listActiveToolEntries } from "../../../lib/toolEntries.mjs";
import {
  buildToolCatalogItem,
  extractFeatureList,
  getWordCountFromMarkdown,
} from "../../../lib/machineReadable";
import { toAbsoluteUrl } from "../../../lib/siteMeta";
import { classifyToolEntry, isCuratedTier, stripTemplateBoilerplate } from "../../../lib/toolQuality.mjs";

export const prerender = true;

export async function getStaticPaths() {
  const entries = await listActiveToolEntries();
  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

export async function GET({ props }: { props: { entry: Awaited<ReturnType<typeof listActiveToolEntries>>[number] } }) {
  const { entry } = props;
  const item = buildToolCatalogItem(entry);
  const quality = classifyToolEntry(entry);
  const contentMarkdown = isCuratedTier(quality.tier)
    ? entry.content
    : stripTemplateBoilerplate(entry.content);

  const payload = {
    version: 1,
    type: "tool",
    canonicalUrl: item.url,
    markdownUrl: toAbsoluteUrl(`/markdown/tools/${entry.slug}.md`),
    data: {
      ...item,
      tier: quality.tier,
      editorialStatus: isCuratedTier(quality.tier) ? "curated" : "automatic",
      featureList: extractFeatureList(contentMarkdown),
      wordCount: getWordCountFromMarkdown(contentMarkdown),
      contentMarkdown,
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

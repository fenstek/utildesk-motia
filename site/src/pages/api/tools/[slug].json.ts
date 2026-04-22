import { listActiveToolEntries } from "../../../lib/toolEntries.mjs";
import {
  buildToolCatalogItem,
  extractFeatureList,
  getWordCountFromMarkdown,
} from "../../../lib/machineReadable";
import { toAbsoluteUrl } from "../../../lib/siteMeta";

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

  const payload = {
    version: 1,
    type: "tool",
    canonicalUrl: item.url,
    markdownUrl: toAbsoluteUrl(`/markdown/tools/${entry.slug}.md`),
    data: {
      ...item,
      featureList: extractFeatureList(entry.content),
      wordCount: getWordCountFromMarkdown(entry.content),
      contentMarkdown: entry.content,
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

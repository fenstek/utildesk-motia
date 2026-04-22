import { listRatgeberEntries } from "../../../lib/ratgeber";
import {
  buildRatgeberCatalogItem,
  getWordCountFromMarkdown,
} from "../../../lib/machineReadable";
import { toAbsoluteUrl } from "../../../lib/siteMeta";

export const prerender = true;

export async function getStaticPaths() {
  const entries = await listRatgeberEntries();
  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

export async function GET({ props }: { props: { entry: Awaited<ReturnType<typeof listRatgeberEntries>>[number] } }) {
  const { entry } = props;
  const item = buildRatgeberCatalogItem(entry);

  const payload = {
    version: 1,
    type: "ratgeber",
    canonicalUrl: item.url,
    markdownUrl: toAbsoluteUrl(`/markdown/ratgeber/${entry.slug}.md`),
    data: {
      ...item,
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

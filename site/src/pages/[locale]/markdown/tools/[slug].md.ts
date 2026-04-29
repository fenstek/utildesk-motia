import { buildMarkdownFrontmatter } from "../../../../lib/machineReadable";
import {
  buildEnglishToolMarkdown,
  getEnglishToolMeta,
  hasEnglishToolTranslation,
} from "../../../../lib/englishContent";
import { listActiveToolEntries } from "../../../../lib/toolEntries.mjs";

export const prerender = true;

export async function getStaticPaths() {
  const entries = await listActiveToolEntries();
  return entries.filter((entry) => hasEnglishToolTranslation(entry.slug)).map((entry) => ({
    params: { locale: "en", slug: entry.slug },
    props: { entry },
  }));
}

export async function GET({ props }: { props: { entry: Awaited<ReturnType<typeof listActiveToolEntries>>[number] } }) {
  const { entry } = props;
  const meta = getEnglishToolMeta(entry);
  const body = [
    buildMarkdownFrontmatter({
      slug: entry.slug,
      title: meta.title,
      language: "en",
      canonicalUrl: `https://tools.utildesk.de/en/tools/${entry.slug}/`,
      category: meta.category,
      priceModel: meta.priceModel,
      tags: meta.tags,
      officialUrl: meta.officialUrl || undefined,
      affiliateUrl: meta.affiliateUrl || undefined,
    }),
    buildEnglishToolMarkdown(entry),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

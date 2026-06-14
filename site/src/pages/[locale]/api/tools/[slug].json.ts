import {
  buildEnglishToolMarkdown,
  getEnglishToolMeta,
  hasEnglishToolTranslation,
} from "../../../../lib/englishContent";
import { getWordCountFromMarkdown } from "../../../../lib/machineReadable";
import { listActiveToolEntries } from "../../../../lib/toolEntries.mjs";
import { SITE_URL } from "../../../../lib/siteMeta";
import { classifyToolEntry, isCuratedToolEntry, stripTemplateBoilerplate } from "../../../../lib/toolQuality.mjs";

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
  const quality = classifyToolEntry(entry);
  const isCurated = isCuratedToolEntry(entry, quality);
  const markdown = isCurated
    ? buildEnglishToolMarkdown(entry)
    : stripTemplateBoilerplate(buildEnglishToolMarkdown(entry));

  return new Response(JSON.stringify({
    version: 1,
    type: "tool",
    canonicalUrl: `${SITE_URL}/en/tools/${entry.slug}/`,
    markdownUrl: `${SITE_URL}/en/markdown/tools/${entry.slug}.md`,
    language: "en",
    data: {
      slug: entry.slug,
      title: meta.title,
      category: meta.category,
      priceModel: meta.priceModel,
      tags: meta.tags,
      description: meta.description,
      officialUrl: meta.officialUrl || null,
      affiliateUrl: meta.affiliateUrl || null,
      tier: quality.tier,
      editorialStatus: isCurated ? "curated" : "automatic",
      wordCount: getWordCountFromMarkdown(markdown),
      contentMarkdown: markdown,
    },
  }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

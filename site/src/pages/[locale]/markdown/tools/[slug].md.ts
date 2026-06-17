import { buildMarkdownFrontmatter } from "../../../../lib/machineReadable";
import {
  buildEnglishToolMarkdown,
  getEnglishToolMeta,
  hasEnglishToolTranslation,
} from "../../../../lib/englishContent";
import { listActiveToolEntries } from "../../../../lib/toolEntries.mjs";
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
  const contentMarkdown = isCurated
    ? buildEnglishToolMarkdown(entry)
    : [
        "> This entry was generated automatically from public provider information and has not been editorially reviewed.",
        "> For curated context, see our guides: https://tools.utildesk.de/en/ratgeber/",
        "",
        stripTemplateBoilerplate(buildEnglishToolMarkdown(entry)),
      ].join("\n");
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
      tier: quality.tier,
      editorialStatus: isCurated ? "curated" : "automatic",
    }),
    contentMarkdown,
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

import { buildMarkdownFrontmatter, buildRatgeberCatalogItem } from "../../../lib/machineReadable";
import { listRatgeberEntries } from "../../../lib/ratgeber";

export const prerender = true;

export async function getStaticPaths() {
  const entries = await listRatgeberEntries();
  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

export async function GET({ props }: { props: { entry: any } }) {
  const entry = props.entry;
  const summary = buildRatgeberCatalogItem(entry);

  const markdown = [
    buildMarkdownFrontmatter({
      title: summary.title,
      slug: summary.slug,
      url: summary.url,
      date: summary.date,
      readTime: summary.readTime,
      category: summary.category,
      eyebrow: summary.eyebrow,
      coverImage: summary.coverImage,
      tags: summary.tags,
      relatedTools: summary.relatedTools,
      excerpt: summary.excerpt,
      wordCount: summary.wordCount,
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

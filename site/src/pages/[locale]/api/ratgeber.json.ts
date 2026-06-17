import { listRatgeberEntries } from "../../../lib/ratgeber";
import { getWordCountFromMarkdown } from "../../../lib/machineReadable";
import { SITE_NAME, SITE_URL } from "../../../lib/siteMeta";

export const prerender = true;

export function getStaticPaths() {
  return [{ params: { locale: "en" } }];
}

export async function GET() {
  const entries = await listRatgeberEntries("en");
  const items = entries.map((entry) => ({
    slug: entry.slug,
    title: entry.data.title,
    url: `${SITE_URL}/en/ratgeber/${entry.slug}/`,
    excerpt: entry.data.excerpt,
    date: entry.data.date ?? null,
    readTime: entry.data.readTime ?? null,
    category: entry.data.category ?? null,
    eyebrow: entry.data.eyebrow ?? null,
    tags: entry.data.tags ?? [],
    coverImage: entry.data.coverImage ? `${SITE_URL}${entry.data.coverImage}` : null,
    wordCount: getWordCountFromMarkdown(entry.content),
    inLanguage: "en",
  }));

  return new Response(JSON.stringify({
    version: 1,
    site: SITE_NAME,
    siteUrl: `${SITE_URL}/en/`,
    language: "en",
    generatedAt: new Date().toISOString(),
    count: items.length,
    items,
  }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

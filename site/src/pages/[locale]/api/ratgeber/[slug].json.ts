import { getWordCountFromMarkdown } from "../../../../lib/machineReadable";
import { listRatgeberEntries } from "../../../../lib/ratgeber";
import { SITE_URL } from "../../../../lib/siteMeta";

export const prerender = true;

export async function getStaticPaths() {
  const entries = await listRatgeberEntries("en");
  return entries.map((entry) => ({
    params: { locale: "en", slug: entry.slug },
    props: { entry },
  }));
}

export async function GET({ props }: { props: { entry: Awaited<ReturnType<typeof listRatgeberEntries>>[number] } }) {
  const { entry } = props;
  return new Response(JSON.stringify({
    version: 1,
    type: "ratgeber",
    canonicalUrl: `${SITE_URL}/en/ratgeber/${entry.slug}/`,
    markdownUrl: `${SITE_URL}/en/markdown/ratgeber/${entry.slug}.md`,
    language: "en",
    data: {
      slug: entry.slug,
      ...entry.data,
      wordCount: getWordCountFromMarkdown(entry.content),
      contentMarkdown: entry.content,
    },
  }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

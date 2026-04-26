import { buildMarkdownFrontmatter } from "../../../../lib/machineReadable";
import { listRatgeberEntries } from "../../../../lib/ratgeber";

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
  const body = [
    buildMarkdownFrontmatter({
      ...entry.data,
      language: "en",
      canonicalUrl: `https://tools.utildesk.de/en/ratgeber/${entry.slug}/`,
    }),
    entry.content,
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

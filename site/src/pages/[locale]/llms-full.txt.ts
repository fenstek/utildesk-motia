import { buildEnglishToolMarkdown, getEnglishToolMeta } from "../../lib/englishContent";
import { listRatgeberEntries } from "../../lib/ratgeber";
import { listActiveToolEntries } from "../../lib/toolEntries.mjs";

export const prerender = true;

export function getStaticPaths() {
  return [{ params: { locale: "en" } }];
}

export async function GET() {
  const tools = await listActiveToolEntries();
  const guides = await listRatgeberEntries("en");
  const lines = [
    "# Utildesk English Full Manifest",
    "",
    "This manifest exposes the English layer of Utildesk for AI agents: tools, workflow context and practical guides.",
    "",
    "## Guides",
    ...guides.flatMap((guide) => [
      `### ${guide.data.title}`,
      `URL: https://tools.utildesk.de/en/ratgeber/${guide.slug}/`,
      guide.data.excerpt ? `Summary: ${guide.data.excerpt}` : "",
      guide.content,
      "",
    ]),
    "## Tools",
    ...tools.flatMap((entry) => {
      const meta = getEnglishToolMeta(entry);
      return [
        `### ${meta.title}`,
        `URL: https://tools.utildesk.de/en/tools/${entry.slug}/`,
        buildEnglishToolMarkdown(entry),
        "",
      ];
    }),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

import { getEnglishToolMeta } from "../../lib/englishContent";
import { listRatgeberEntries } from "../../lib/ratgeber";
import { listActiveToolEntries } from "../../lib/toolEntries.mjs";

export const prerender = true;

export function getStaticPaths() {
  return [{ params: { locale: "en" } }];
}

export async function GET() {
  const tools = (await listActiveToolEntries()).map((entry) => ({ slug: entry.slug, ...getEnglishToolMeta(entry) }));
  const guides = await listRatgeberEntries("en");
  const lines = [
    "# Utildesk English",
    "",
    "Curated AI tools, workflow context and practical guides. The German site is the source catalogue; English pages are localized for international readers and AI agents.",
    "",
    "## Core URLs",
    "- Home: https://tools.utildesk.de/en/",
    "- Tools: https://tools.utildesk.de/en/tools/",
    "- Guides: https://tools.utildesk.de/en/ratgeber/",
    "- Tools API: https://tools.utildesk.de/en/api/tools.json",
    "- Guides API: https://tools.utildesk.de/en/api/ratgeber.json",
    "",
    "## Guides",
    ...guides.map((guide) => `- [${guide.data.title}](https://tools.utildesk.de/en/ratgeber/${guide.slug}/)`),
    "",
    "## Featured Tools",
    ...tools.slice(0, 80).map((tool) => `- [${tool.title}](https://tools.utildesk.de/en/tools/${tool.slug}/): ${tool.description}`),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

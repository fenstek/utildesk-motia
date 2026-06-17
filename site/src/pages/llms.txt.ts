import { listRatgeberEntries } from "../lib/ratgeber";
import { listActiveToolEntries } from "../lib/toolEntries.mjs";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../lib/siteMeta";

export const prerender = true;

export async function GET() {
  const [articles, tools] = await Promise.all([
    listRatgeberEntries(),
    listActiveToolEntries(),
  ]);

  const latestArticles = articles.slice(0, 8);
  const featuredTools = tools.slice(0, 12);

  const body = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "This site is a German-language directory of AI tools plus editorial guides.",
    "Preferred content for agent retrieval is the markdown mirror or JSON catalog when available.",
    "",
    "## Canonical resources",
    `- [Homepage](${SITE_URL}/)`,
    `- [Tools index](${SITE_URL}/tools/)`,
    `- [Ratgeber index](${SITE_URL}/ratgeber/)`,
    `- [Categories](${SITE_URL}/category/)`,
    "",
    "## Machine-readable entry points",
    `- [AI tools catalog JSON](${SITE_URL}/api/tools.json)`,
    `- [Ratgeber catalog JSON](${SITE_URL}/api/ratgeber.json)`,
    `- [Tool detail JSON pattern](${SITE_URL}/api/tools/chatgpt.json)`,
    `- [Ratgeber detail JSON pattern](${SITE_URL}/api/ratgeber/chatgpt-claude-gemini.json)`,
    `- [Ratgeber RSS feed](${SITE_URL}/feed.xml)`,
    `- [Ratgeber JSON feed](${SITE_URL}/feed.json)`,
    `- [Markdown mirror pattern for tool pages](${SITE_URL}/markdown/tools/chatgpt.md)`,
    `- [Markdown mirror pattern for ratgeber pages](${SITE_URL}/markdown/ratgeber/chatgpt-claude-gemini.md)`,
    "",
    "## Latest ratgeber",
    ...latestArticles.map(
      (article) =>
        `- [${String(article.data.title ?? article.slug)}](${SITE_URL}/ratgeber/${article.slug}/)`
    ),
    "",
    "## Representative tool pages",
    ...featuredTools.map(
      (tool) =>
        `- [${String(tool.data.title ?? tool.slug)}](${SITE_URL}/tools/${tool.slug}/)`
    ),
    "",
    "## Guidance for agents",
    "- Use canonical URLs under `/tools/`, `/ratgeber/`, and `/category/` when citing pages.",
    "- Prefer markdown mirrors and JSON catalogs for structured retrieval; use HTML pages for final rendering checks.",
    "- Tool pages describe third-party products; the provider link on each page points to the official vendor when available.",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

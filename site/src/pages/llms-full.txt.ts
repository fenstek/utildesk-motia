import { listRatgeberEntries } from "../lib/ratgeber";
import { listActiveToolEntries } from "../lib/toolEntries.mjs";
import { buildRatgeberCatalogItem, buildToolCatalogItem } from "../lib/machineReadable";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../lib/siteMeta";

export const prerender = true;

export async function GET() {
  const [articleEntries, toolEntries] = await Promise.all([
    listRatgeberEntries(),
    listActiveToolEntries(),
  ]);

  const articles = articleEntries.slice(0, 20).map(buildRatgeberCatalogItem);
  const tools = toolEntries
    .slice()
    .sort((a, b) =>
      String(a.data.title ?? a.slug).localeCompare(String(b.data.title ?? b.slug), "de")
    )
    .slice(0, 80)
    .map(buildToolCatalogItem);

  const body = [
    `# ${SITE_NAME} full agent context`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `Canonical site: ${SITE_URL}/`,
    `Tools catalog JSON: ${SITE_URL}/api/tools.json`,
    `Ratgeber catalog JSON: ${SITE_URL}/api/ratgeber.json`,
    `Tool detail JSON pattern: ${SITE_URL}/api/tools/chatgpt.json`,
    `Ratgeber detail JSON pattern: ${SITE_URL}/api/ratgeber/chatgpt-claude-gemini.json`,
    `Ratgeber RSS: ${SITE_URL}/feed.xml`,
    `Ratgeber JSON feed: ${SITE_URL}/feed.json`,
    "",
    "## Site sections",
    `- Tools directory: ${SITE_URL}/tools/`,
    `- Ratgeber articles: ${SITE_URL}/ratgeber/`,
    `- Category pages: ${SITE_URL}/category/`,
    "",
    "## Recent ratgeber articles",
    ...articles.map((article) =>
      [
        `### ${article.title}`,
        `- URL: ${article.url}`,
        article.date ? `- Date: ${article.date}` : null,
        article.category ? `- Category: ${article.category}` : null,
        article.readTime ? `- Read time: ${article.readTime} minutes` : null,
        article.tags.length ? `- Tags: ${article.tags.join(", ")}` : null,
        `- Excerpt: ${article.excerpt}`,
        article.relatedTools.length
          ? `- Related tools: ${article.relatedTools.map((tool) => tool.title).join(", ")}`
          : null,
        `- JSON detail: ${SITE_URL}/api/ratgeber/${article.slug}.json`,
        `- Markdown mirror: ${SITE_URL}/markdown/ratgeber/${article.slug}.md`,
        "",
      ]
        .filter(Boolean)
        .join("\n")
    ),
    "## Tool directory sample",
    ...tools.map((tool) =>
      [
        `### ${tool.title}`,
        `- URL: ${tool.url}`,
        tool.category ? `- Category: ${tool.category}` : null,
        tool.priceModel ? `- Price model: ${tool.priceModel}` : null,
        tool.tags.length ? `- Tags: ${tool.tags.join(", ")}` : null,
        tool.officialUrl ? `- Official URL: ${tool.officialUrl}` : null,
        `- Description: ${tool.description}`,
        `- JSON detail: ${SITE_URL}/api/tools/${tool.slug}.json`,
        `- Markdown mirror: ${SITE_URL}/markdown/tools/${tool.slug}.md`,
        "",
      ]
        .filter(Boolean)
        .join("\n")
    ),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

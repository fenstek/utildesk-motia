import { stripMarkdown } from "../../lib/machineReadable";
import { listRatgeberEntries } from "../../lib/ratgeber";

export const prerender = true;

export function getStaticPaths() {
  return [{ params: { locale: "en" } }];
}

export async function GET() {
  const articles = await listRatgeberEntries("en");
  const payload = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Utildesk English Guides",
    home_page_url: "https://tools.utildesk.de/en/",
    feed_url: "https://tools.utildesk.de/en/feed.json",
    language: "en",
    items: articles.map((article) => {
      const url = `https://tools.utildesk.de/en/ratgeber/${article.slug}/`;
      return {
        id: url,
        url,
        title: article.data.title,
        summary: article.data.excerpt ?? stripMarkdown(article.content).slice(0, 220),
        date_published: article.data.date ? new Date(article.data.date).toISOString() : undefined,
        tags: article.data.tags ?? [],
      };
    }),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

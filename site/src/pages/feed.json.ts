import { marked } from "marked";
import { listRatgeberEntries } from "../lib/ratgeber";
import {
  SITE_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_NAME,
  SITE_URL,
} from "../lib/siteMeta";

export const prerender = true;

export async function GET() {
  const articles = await listRatgeberEntries();
  const items = articles.slice(0, 50).map((article) => ({
    id: `${SITE_URL}/ratgeber/${article.slug}/`,
    url: `${SITE_URL}/ratgeber/${article.slug}/`,
    title: String(article.data.title ?? article.slug),
    summary: String(article.data.excerpt ?? ""),
    date_published: article.data.date
      ? new Date(String(article.data.date)).toISOString()
      : undefined,
    tags: Array.isArray(article.data.tags) ? article.data.tags.map(String) : [],
    content_html: String(marked.parse(article.content)),
    image: article.data.coverImage ? `${SITE_URL}${article.data.coverImage}` : undefined,
  }));

  const payload = {
    version: "https://jsonfeed.org/version/1.1",
    title: `${SITE_NAME} Ratgeber`,
    home_page_url: `${SITE_URL}/ratgeber/`,
    feed_url: `${SITE_URL}/feed.json`,
    description: SITE_DESCRIPTION,
    language: SITE_LANGUAGE,
    items,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

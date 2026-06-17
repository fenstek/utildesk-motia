import { stripMarkdown } from "../../lib/machineReadable";
import { listRatgeberEntries } from "../../lib/ratgeber";

export const prerender = true;

export function getStaticPaths() {
  return [{ params: { locale: "en" } }];
}

const escapeXml = (value: string) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function GET() {
  const articles = await listRatgeberEntries("en");
  const items = articles
    .map((article) => {
      const url = `https://tools.utildesk.de/en/ratgeber/${article.slug}/`;
      const description = escapeXml(String(article.data.excerpt ?? stripMarkdown(article.content).slice(0, 220)));
      const pubDate = article.data.date ? new Date(article.data.date).toUTCString() : new Date().toUTCString();
      return `<item><title>${escapeXml(String(article.data.title))}</title><link>${url}</link><guid>${url}</guid><pubDate>${pubDate}</pubDate><description>${description}</description></item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Utildesk English Guides</title><link>https://tools.utildesk.de/en/ratgeber/</link><description>Practical AI guides and workflow briefings in English.</description>${items}</channel></rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

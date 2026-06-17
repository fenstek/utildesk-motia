import { marked } from "marked";
import { listRatgeberEntries } from "../lib/ratgeber";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, toAbsoluteUrl } from "../lib/siteMeta";

export const prerender = true;

function escapeXml(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toCdata(value: string) {
  return String(value ?? "").replace(/\]\]>/g, "]]]]><![CDATA[>");
}

export async function GET() {
  const articles = await listRatgeberEntries();
  const items = articles.slice(0, 50);

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    "<channel>",
    `<title>${escapeXml(`${SITE_NAME} Ratgeber`)}</title>`,
    `<link>${SITE_URL}/ratgeber/</link>`,
    `<description>${escapeXml(SITE_DESCRIPTION)}</description>`,
    `<language>de-de</language>`,
    `<atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />`,
    ...items.map((article) => {
      const url = `${SITE_URL}/ratgeber/${article.slug}/`;
      const html = String(marked.parse(article.content));
      const description = String(article.data.excerpt ?? article.data.title ?? article.slug);
      const pubDate = article.data.date
        ? new Date(String(article.data.date)).toUTCString()
        : new Date().toUTCString();

      return [
        "<item>",
        `<title>${escapeXml(String(article.data.title ?? article.slug))}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<description>${escapeXml(description)}</description>`,
        `<pubDate>${pubDate}</pubDate>`,
        `<content:encoded><![CDATA[${toCdata(html)}]]></content:encoded>`,
        "</item>",
      ].join("");
    }),
    "</channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

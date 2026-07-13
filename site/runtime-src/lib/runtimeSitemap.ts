import { SITE_URL } from "../../src/lib/siteMeta";
import { listRuntimeContentEntries } from "./runtimeContent";
import { STATIC_SITEMAP_ENTRIES } from "../generated/staticSitemapEntries";

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n';
const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (character) => ({
  "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;",
})[character] ?? character);

const entriesFromStaticXml = (xml: string) => {
  const entries = new Map<string, string>();
  for (const match of xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
    const entry = `<url>${match[1]}</url>`;
    const location = match[1].match(/<loc>([\s\S]*?)<\/loc>/i)?.[1]?.trim();
    if (location) entries.set(location, entry);
  }
  return entries;
};

const datePart = (value: string | null) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf()) ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
};

export async function createRuntimeSitemap() {
  const staticEntries = entriesFromStaticXml(STATIC_SITEMAP_ENTRIES.join("\n"));
  const [german, english] = await Promise.all([
    listRuntimeContentEntries("ratgeber", "de"),
    listRuntimeContentEntries("ratgeber", "en"),
  ]);

  for (const entry of [...german, ...english]) {
    const localePrefix = entry.locale === "en" ? "/en" : "";
    const location = `${SITE_URL}${localePrefix}/ratgeber/${entry.slug}/`;
    staticEntries.set(location, `<url><loc>${escapeXml(location)}</loc><lastmod>${datePart(entry.sourceUpdatedAt || entry.sourcePublishedAt)}</lastmod></url>`);
  }

  const xml = `${XML_HEADER}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticEntries.values()].join("\n")}\n</urlset>\n`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
      "X-Utildesk-Content-Runtime": "sitemap-v1",
    },
  });
}

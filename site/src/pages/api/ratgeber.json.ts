import { listRatgeberEntries } from "../../lib/ratgeber";
import { buildRatgeberCatalogItem } from "../../lib/machineReadable";
import { SITE_NAME, SITE_URL } from "../../lib/siteMeta";

export const prerender = true;

export async function GET() {
  const entries = await listRatgeberEntries();
  const items = entries.map((entry) => buildRatgeberCatalogItem(entry));

  const payload = {
    version: 1,
    site: SITE_NAME,
    siteUrl: SITE_URL,
    generatedAt: new Date().toISOString(),
    count: items.length,
    items,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

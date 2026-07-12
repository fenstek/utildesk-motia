import { listDisplayTools } from "../../../lib/toolDisplay";
import { SITE_NAME, SITE_URL } from "../../../lib/siteMeta";

export const prerender = true;

export function getStaticPaths() {
  return [{ params: { locale: "en" } }];
}

export async function GET() {
  const items = await listDisplayTools("en");

  return new Response(JSON.stringify({
    version: 1,
    site: SITE_NAME,
    siteUrl: `${SITE_URL}/en/`,
    language: "en",
    generatedAt: new Date().toISOString(),
    count: items.length,
    items,
  }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

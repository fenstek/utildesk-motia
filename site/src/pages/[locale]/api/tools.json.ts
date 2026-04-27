import { getEnglishToolMeta } from "../../../lib/englishContent";
import { listActiveToolEntries } from "../../../lib/toolEntries.mjs";
import { SITE_NAME, SITE_URL } from "../../../lib/siteMeta";

export const prerender = true;

export function getStaticPaths() {
  return [{ params: { locale: "en" } }];
}

export async function GET() {
  const entries = await listActiveToolEntries();
  const items = entries.map((entry) => {
    const meta = getEnglishToolMeta(entry);
    return {
      slug: entry.slug,
      title: meta.title,
      url: `${SITE_URL}/en/tools/${entry.slug}/`,
      category: meta.category,
      priceModel: meta.priceModel,
      tags: meta.tags,
      description: meta.description,
      officialUrl: meta.officialUrl || null,
      affiliateUrl: meta.affiliateUrl || null,
      inLanguage: "en",
    };
  });

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

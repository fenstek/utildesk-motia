# Search Console And Bing Health

Last checked: 2026-05-07

## Live Production Contract

- `https://tools.utildesk.de/robots.txt` returns `200` and allows normal crawling.
- `https://tools.utildesk.de/sitemap.xml` returns `200` with `322` unique
  canonical URLs on host `tools.utildesk.de`. This is the conservative
  Google-facing sitemap.
- `https://tools.utildesk.de/sitemap-bing.xml` returns `200` with `2092`
  unique canonical URLs on host `tools.utildesk.de`. This is the broader
  Bing-facing sitemap.
- Live sitemap validation returned:
  - `0` duplicate URLs
  - `0` URLs on a non-canonical host
  - `0` URLs without trailing slash
  - Google sitemap split: `141` German tools, `141` English tools, `7`
    German Ratgeber pages, `7` English Ratgeber pages, `8` German category
    URLs, `8` English category URLs, and `10` static/index URLs.
  - Bing sitemap split: `1026` German tools, `1026` English tools, `7`
    German Ratgeber pages, `7` English Ratgeber pages, `8` German category
    URLs, `8` English category URLs, and `10` static/index URLs.
- Ratgeber live subset is not blocked: `/ratgeber/` and article URLs return
  `200`, are self-canonical, and are indexable.
- Machine-readable mirrors remain fetchable but intentionally send
  `X-Robots-Tag: noindex`: `/api/*`, `/markdown/*`, `/feed.*`,
  `/llms.txt`, and `/llms-full.txt`.
- `www.tools.utildesk.de` currently does not resolve in DNS. This is not a
  block for the canonical host, but add a DNS alias plus redirect if a `www`
  variant should be supported.

## Google Search Console

- Service-account access on host `utildesk` is confirmed for:
  - `sc-domain:tools.utildesk.de`
  - `sc-domain:utildesk.de`
- Most recent GSC API refresh in this document was on 2026-05-03. The GSC
  sitemap entry was healthy before that refresh:
  - `lastSubmitted`: `2026-05-02T00:00:28.119Z`
  - `lastDownloaded`: `2026-05-02T00:00:28.608Z`
  - `warnings`: `0`
  - `errors`: `0`
- `sitemaps.submit` was run again for
  `https://tools.utildesk.de/sitemap.xml` during the 2026-05-03 check and
  returned `204`.
- URL Inspection sample showed no robots/canonical/fetch blockers:
  - already crawled core pages: `INDEXING_ALLOWED`, robots `ALLOWED`, fetch
    `SUCCESSFUL`, self-canonical
  - representative English and Ratgeber pages: `URL is unknown to Google`,
    which is discovery/recrawl lag rather than a live block
- Sample states from URL Inspection:
  - `/`, `/tools/`, `/category/produktivitaet/`, `/tools/adept/`, and
    `/tools/chatgpt/`: `Crawled - currently not indexed`
  - `/en/`, `/en/tools/`, `/ratgeber/`, Ratgeber articles, and English tool
    samples: `URL is unknown to Google`

## Bing Webmaster

- Bing API access is confirmed through `secrets/bing-webmaster.env`.
- Bing should use the broad feed
  `https://tools.utildesk.de/sitemap-bing.xml`, not the conservative Google
  sitemap. The two sitemaps are intentionally different.
- Live Bing feed validation on 2026-05-07:
  - `Status = fetchable`
  - `UrlCount = 2092`
  - `0` duplicate URLs
  - `0` non-canonical hosts
- The older 2026-05-03 Bing API refresh was run before the current dual-sitemap
  contract and reported `UrlCount = 276`; do not treat that number as the
  current Bing crawl surface.
- A batch of `12` key canonical URLs was submitted:
  - `/`
  - `/tools/`
  - `/en/tools/`
  - `/category/produktivitaet/`
  - `/en/category/produktivitaet/`
  - `/ratgeber/`
  - `/en/ratgeber/`
  - `/ratgeber/chatgpt-claude-gemini/`
  - `/en/ratgeber/chatgpt-claude-gemini/`
  - `/tools/adept/`
  - `/en/tools/adept/`
  - `/en/`
- Submission quota after the batch: `DailyQuota = 88`, `MonthlyQuota = 2988`.
- Last-30-day crawl summary showed:
  - latest `InIndex = 488`
  - `0` days blocked by robots
  - `0` days with `5xx`
- Last-7-day crawl summary showed average `4xx = 2.0`, average crawl errors
  `2.43`, max `4xx = 5`, max crawl errors `6`, and still `0` robots blocks /
  `0` `5xx`.

## Current Conclusion

There is no current production crawl block for the main site or Ratgeber. The
current Google sitemap is clean at `322` indexable canonical URLs, while Bing
has a broader clean feed at `2092` URLs. Keep this split: Google should not be
forced to crawl the full long-tail tool inventory too aggressively, while Bing
can keep receiving the wider catalog. The remaining indexing issue is
search-engine lag and quality/discovery evaluation, especially in Google.

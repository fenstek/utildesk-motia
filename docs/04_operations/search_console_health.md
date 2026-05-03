# Search Console And Bing Health

Last checked: 2026-04-30

## Live Production Contract

- `https://tools.utildesk.de/robots.txt` returns `200` and allows normal crawling.
- `https://tools.utildesk.de/sitemap.xml` returns `200` with `2002` unique
  canonical URLs on host `tools.utildesk.de`.
- Full live sitemap crawl returned:
  - `0` non-200 URLs
  - `0` redirects
  - `0` real `noindex` HTML pages
  - `0` missing canonical tags
  - `0` canonical mismatches
- Ratgeber live subset is not blocked: `/ratgeber/` and article URLs return
  `200`, are self-canonical, and are indexable.
- Machine-readable mirrors remain fetchable but intentionally send
  `X-Robots-Tag: noindex`: `/api/*`, `/markdown/*`, `/feed.*`,
  `/llms.txt`, and `/llms-full.txt`.

## Google Search Console

- Service-account access on host `utildesk` is confirmed for:
  - `sc-domain:tools.utildesk.de`
  - `sc-domain:utildesk.de`
- GSC sitemap entry before refresh was stale:
  - `lastDownloaded`: `2026-04-27T12:50:54.211Z`
  - `submitted`: `1916`
  - live sitemap: `2002`
- `sitemaps.submit` was run for `https://tools.utildesk.de/sitemap.xml` on
  `2026-04-30T03:16:06Z`.
- Immediately after submission, GSC reported the sitemap as `isPending=true`.
  The API did not expose row-level error details; live XML validation and Bing
  fetch both succeeded.
- URL Inspection sample showed no robots/canonical/fetch blockers:
  - already crawled core pages: `INDEXING_ALLOWED`, robots `ALLOWED`, fetch
    `SUCCESSFUL`, self-canonical
  - newer `/ratgeber/` and `/en/` pages: `URL is unknown to Google`, which is
    discovery/recrawl lag rather than a live block

## Bing Webmaster

- Bing API access is confirmed through `secrets/bing-webmaster.env`.
- Before refresh, Bing sitemap feed was stale at `UrlCount = 1976`.
- `submit-feed` refreshed the feed to:
  - `Status = Success`
  - `UrlCount = 2002`
  - `FileSize = 284428`
- A batch of key canonical URLs was submitted:
  - `/`
  - `/tools/`
  - `/ratgeber/`
  - `/en/`
  - `/en/tools/`
  - `/en/ratgeber/`
- `GetCrawlIssues` returned `[]`.
- Last-30-day crawl summary showed:
  - latest `InIndex = 437`
  - `0` days blocked by robots
  - `0` days with `5xx`

## Current Conclusion

There is no current production crawl block for the main site or Ratgeber. The
remaining indexing issue is search-engine lag and quality/discovery evaluation:
Google has crawled some core pages but still marks them as `Crawled - currently
not indexed`, while newer Ratgeber and English pages are not yet known to
Google. The safe operational fix was to refresh sitemap submissions and submit
key URLs to Bing; no source-code change was required in this pass.

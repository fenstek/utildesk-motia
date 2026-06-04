# Search Console And Bing Health

Last checked: 2026-06-03

## Live Production Contract

- `https://tools.utildesk.de/robots.txt` returns `200` and allows normal crawling.
- `https://tools.utildesk.de/sitemap.xml` should be the compact
  Google-facing sitemap: Ratgeber depth, core hubs/methodology, and the
  strongest curated tool cards.
- `https://tools.utildesk.de/sitemap-focus.xml` is the explicit compact Bing
  submission feed.
- `https://tools.utildesk.de/sitemap-bing.xml` must no longer be used as a
  broad long-tail feed during search recovery; generated output should mirror
  the compact focus surface.
- 2026-06-03 pre-fix live validation:
  - `sitemap.xml` returned `652` URLs.
  - `sitemap-focus.xml` returned `102` URLs.
  - `sitemap-bing.xml` returned `2454` URLs and was too broad for the new recovery strategy.
  - Key HTML pages returned `200`, self-canonical, and `index,follow`.
  - Machine endpoints returned `X-Robots-Tag: noindex` as expected.
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
- Most recent GSC API refresh in this document was on 2026-06-03. The GSC
  sitemap entry was technically healthy but not producing indexation:
  - `sitemap.xml` last submitted/downloaded: `2026-05-24T09:06Z`
  - `sitemap.xml` submitted: `572`
  - `sitemap-focus.xml` last submitted/downloaded: `2026-05-21T07:44Z`
  - `sitemap-focus.xml` submitted: `96`
  - `warnings`: `0`
  - `errors`: `0`
- Search performance for 2026-05-05 through 2026-06-02 was only `1` click and
  `8` impressions, so the issue is not a live crawl block; it is discovery,
  quality selection, and sitemap focus.
- 2026-06-03 compact sitemap resubmission:
  - `https://tools.utildesk.de/sitemap-focus.xml` submitted successfully.
  - API readback: `lastSubmitted = 2026-06-03T21:10:12Z`, `warnings = 0`, `errors = 0`.
  - `lastDownloaded` still showed `2026-05-21T07:44:33Z` immediately after submission; wait for Google recrawl before judging impact.
- 2026-06-04 production compact sitemap deploy:
  - live `https://tools.utildesk.de/sitemap.xml` returns `102` URLs;
  - live `https://tools.utildesk.de/sitemap-bing.xml` returns `102` URLs;
  - live `https://tools.utildesk.de/sitemap-focus.xml` returns `102` URLs;
  - `https://tools.utildesk.de/sitemap.xml` was submitted to GSC and returned `lastSubmitted = 2026-06-04T11:03:42Z`, `warnings = 0`, `errors = 0`.
  - GSC may keep showing the old submitted count for `sitemap.xml` until Google redownloads the file.
- URL Inspection sample showed no robots/canonical/fetch blockers:
  - already crawled core pages: `INDEXING_ALLOWED`, robots `ALLOWED`, fetch
    `SUCCESSFUL`, self-canonical
  - representative English and Ratgeber pages: `URL is unknown to Google`,
    which is discovery/recrawl lag rather than a live block
- 2026-06-03 sample states from URL Inspection:
  - `/`, `/tools/`, and `/tools/chatgpt/`: `Crawled - currently not indexed`.
  - `/ratgeber/`, `/tools/cline/`, `/tools/hermes-agent/`, and the coding-agent Ratgeber sample: `URL is unknown to Google`.

## Bing Webmaster

- Bing API access is confirmed through `secrets/bing-webmaster.env`.
- Bing should use the compact focus feed
  `https://tools.utildesk.de/sitemap-focus.xml`, not a broad long-tail feed.
- 2026-06-03 Bing feed state before cleanup:
  - `sitemap-focus.xml`: `Status = Success`, `UrlCount = 102`.
  - `sitemap.xml`: `Status = Success`, `UrlCount = 652`.
  - `sitemap-bing.xml`: `Status = Success`, `UrlCount = 2410`, now considered too broad.
- 2026-06-03 Bing cleanup:
  - removed registered `sitemap-bing.xml`;
  - removed registered `sitemap.xml`;
  - resubmitted only `https://tools.utildesk.de/sitemap-focus.xml`;
  - immediate readback showed one feed, `UrlCount = 102`, `Status = Pending`.
- 2026-06-03 IndexNow:
  - submitted all `102` live focus sitemap URLs;
  - `https://api.indexnow.org/indexnow` returned HTTP `200`;
  - `https://www.bing.com/indexnow` returned HTTP `200`.
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
- 2026-06-03 submission quota: `DailyQuota = 100`, `MonthlyQuota = 2800`.
- 2026-06-03 last-30-day crawl summary showed:
  - latest `InIndex = 1616`
  - average crawled pages per day: `89.07`
  - `0` days blocked by robots
  - `0` days with `5xx`

## Current Conclusion

There is no current production crawl block for the main site or Ratgeber. The
current recovery strategy is depth over breadth: keep submitted sitemaps focused
on Ratgeber and strong tool pages, avoid broad long-tail sitemap submission, and
use direct URL submission/IndexNow only for important canonical HTML pages.

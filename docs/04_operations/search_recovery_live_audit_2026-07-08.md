# Utildesk Search Recovery Live Audit - 2026-07-08

## Executive Summary

The compact search surface is technically clean on production.

The current Google/Bing problem is not caused by live `noindex`, broken canonicals,
blocked robots, 4xx/5xx responses, or sitemap fetch errors on the compact focus set.
The observed problem is search-engine reprocessing and trust/discovery lag:

- Google can download the compact sitemap but still reports `indexed=0` for the
  submitted sitemap contents.
- Previously crawled core pages are mostly `Crawled - currently not indexed`.
- Newer Ratgeber pages are still `URL is unknown to Google`.
- Bing is crawling normally and now has one compact feed registered.

Do not change the domain and do not broaden the sitemap as a reaction.

## Live Production Checks

Generated from the live audit at `2026-07-08T17:12:51Z`.

- `robots.txt`: HTTP 200.
- Robots sitemap line: `https://tools.utildesk.de/sitemap.xml`.
- `robots.txt` advertises only the Google sitemap: yes.
- `https://tools.utildesk.de/sitemap.xml`: 116 URLs.
- `https://tools.utildesk.de/sitemap-focus.xml`: 116 URLs.
- `https://tools.utildesk.de/sitemap-bing.xml`: 116 URLs.
- Unique audited focus URLs: 116.
- URLs with live issues: 0.
- URLs with warnings only: 0.

The audit checked status, content type, HTML robots, `X-Robots-Tag`, canonical,
title presence, hreflang count, and basic HTML size for the focus set.

Detailed local reports:

- `reports/focus-sitemap-live-audit-2026-07-08T17-12-51-525Z.md`
- `reports/focus-sitemap-live-audit-2026-07-08T17-12-51-525Z.json`

## Source-Of-Truth Verification

Repository source matches the intended compact search contract:

- `site/scripts/generate_sitemap.mjs` writes compact `sitemap.xml`,
  `sitemap-bing.xml`, and `sitemap-focus.xml` from the same focus URL set.
- `site/src/lib/searchIndexPolicy.mjs` keeps the project split between global
  `robots` and optional Googlebot-specific staging.
- `site/src/layouts/BaseLayout.astro` emits both:
  - `<meta name="robots" content={robots} />`
  - `<meta name="googlebot" content={googlebotRobots} />` when set.
- `site/public/robots.txt` advertises only `https://tools.utildesk.de/sitemap.xml`.

This confirms that broad long-tail suppression must not be implemented as global
`noindex` merely because Google staging excludes those pages.

## Google Search Console Findings

API property:

- `sc-domain:tools.utildesk.de`
- permission: `siteOwner`

Sitemap readback after resubmission:

- sitemap: `https://tools.utildesk.de/sitemap.xml`
- `lastSubmitted`: `2026-07-08T17:19:48.567Z`
- `lastDownloaded`: `2026-07-08T17:19:49.954Z`
- warnings: `0`
- errors: `0`
- submitted web URLs: `116`
- indexed web URLs: `0`

Representative URL Inspection sample:

- `https://tools.utildesk.de/`
  - `Crawled - currently not indexed`
  - robots allowed, indexing allowed, fetch successful
  - Google canonical and user canonical match
  - last crawl: `2026-04-10T12:43:26Z`
- `https://tools.utildesk.de/tools/`
  - `Crawled - currently not indexed`
  - robots allowed, indexing allowed, fetch successful
  - last crawl: `2026-03-24T03:54:16Z`
- `https://tools.utildesk.de/tools/chatgpt/`
  - `Crawled - currently not indexed`
  - last crawl: `2026-04-12T14:10:46Z`
- `https://tools.utildesk.de/tools/claude/`
  - `Crawled - currently not indexed`
  - last crawl: `2026-04-12T09:35:44Z`
- `https://tools.utildesk.de/tools/perplexity/`
  - `Crawled - currently not indexed`
  - last crawl: `2026-03-24T05:19:04Z`
- `https://tools.utildesk.de/tools/openai-api/`
  - `Crawled - currently not indexed`
  - last crawl: `2026-05-10T00:36:13Z`
- `https://tools.utildesk.de/ratgeber/`
  - `URL is unknown to Google`
- `https://tools.utildesk.de/en/ratgeber/`
  - `URL is unknown to Google`
- Sample newer Ratgeber articles:
  - `URL is unknown to Google`

Local GSC reports:

- `reports/gsc-url-inspection-2026-07-08.json`
- `reports/gsc-sitemap-list-2026-07-08.json`

## Bing Findings

Bing Webmaster API:

- API smoke check: OK.
- URL submission quota: daily `100`, monthly `2400`.
- 30-day crawl summary:
  - latest date: `2026-07-07T07:00:00+00:00`
  - latest indexed count: `360`
  - average crawled pages: `82.27`
  - average 2xx: `2837.77`
  - average 4xx: `1.47`
  - average crawl errors: `1.83`
  - days with robots blocks: `0`
  - days with 5xx: `0`

Feed cleanup and resubmission:

- A fresh explicit submit of `https://tools.utildesk.de/sitemap-focus.xml` succeeded.
- A stray `https://tools.utildesk.de/sitemap-bing.xml` feed entry showed old broad
  metadata (`UrlCount=2408`) while live production already returned only 116 URLs.
- The stray feed entry was removed via Bing `RemoveFeed`.
- Final Bing readback contains one feed:
  - URL: `https://tools.utildesk.de/sitemap-focus.xml`
  - status: `Success`
  - URL count: `116`
  - fresh last crawl/submission at the July 8 run.

## Freshness Signals Sent

Completed on 2026-07-08:

- Google Search Console sitemap submit:
  - `https://tools.utildesk.de/sitemap.xml`
  - accepted by API.
- Bing Webmaster feed submit:
  - `https://tools.utildesk.de/sitemap-focus.xml`
  - final readback `Success`, 116 URLs.
- IndexNow:
  - 116 focus URLs from the live `sitemap-focus.xml`
  - submitted to `https://api.indexnow.org/indexnow`
  - submitted to `https://www.bing.com/indexnow`
  - both endpoints returned HTTP 200.

## Interpretation

Google is not currently saying that the focus URLs are blocked or canonicalized away.
It is saying that the old known core pages were crawled but not selected for indexing,
and that many newer Ratgeber pages have not entered Google's known URL set yet.

That means the next recovery step is not another sitemap expansion. The next step is
to make the compact URLs look more important and better connected:

- tighter internal link loops between Ratgeber articles and the strongest tool cards;
- fewer weak discovery paths;
- external references to the best Ratgeber assets rather than to the generic directory;
- follow-up GSC inspection after Google has re-downloaded the resubmitted sitemap.

## Next 48-72 Hours

1. Re-check GSC sitemap readback.
   - Expected: `lastDownloaded` remains fresh.
   - Desired: at least some URLs move from unknown/crawled-not-indexed toward indexing
     or acquire fresher crawl timestamps.

2. Re-run URL Inspection for:
   - homepage;
   - `/ratgeber/`;
   - two newest Ratgeber articles;
   - `chatgpt`, `claude`, `openai-api`.

3. Re-check Bing feeds.
   - Expected: exactly one feed, `sitemap-focus.xml`, `UrlCount=116`, `Status=Success`.

4. Start one content/discovery cluster patch.
   - Pick one Ratgeber cluster.
   - Add a visible "mentioned in Ratgeber" backlink block to the relevant strong tool cards.
   - Link the article back to 5-8 high-quality tool cards.
   - Keep all URLs inside the compact focus strategy.

5. Do not change:
   - domain;
   - broad sitemap policy;
   - global long-tail robots policy;
   - `robots.txt` sitemap advertisement.

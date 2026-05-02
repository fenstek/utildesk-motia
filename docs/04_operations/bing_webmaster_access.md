# Bing Webmaster Access For `tools.utildesk.de`

## Goal

Prepare a safe local Bing Webmaster Tools access path similar to the existing GSC operational flow, without storing the real API key in git.

## Secret Location

Local only, git-ignored:

- `secrets/bing-webmaster.env`

Expected keys:

```env
BING_WEBMASTER_API_KEY=
BING_WEBMASTER_SITE_URL=https://tools.utildesk.de
BING_WEBMASTER_API_BASE=https://ssl.bing.com/webmaster/api.svc/json
BING_WEBMASTER_SMOKE_FEED_URL=https://tools.utildesk.de/sitemap.xml
```

## Safe Workflow

1. Open Bing Webmaster Tools for `tools.utildesk.de`.
2. Generate or rotate the API key in `Settings -> API Access`.
3. Paste the key only into `secrets/bing-webmaster.env`.
4. Never paste the raw key into chat, docs, or tracked repo files.

## Local Helper

Use:

```powershell
python scripts/bing_webmaster_api.py smoke
```

This runs a safe read-only validation against `GetUrlSubmissionQuota` for the configured site.

Useful follow-up commands:

```powershell
python scripts/bing_webmaster_api.py sites
python scripts/bing_webmaster_api.py quota
python scripts/bing_webmaster_api.py feeds
python scripts/bing_webmaster_api.py crawl-summary --days 30
python scripts/bing_webmaster_api.py submit-feed
python scripts/bing_webmaster_api.py submit-batch --url https://tools.utildesk.de/ --url https://tools.utildesk.de/ratgeber/
python scripts/bing_webmaster_api.py submit-url --url https://tools.utildesk.de/ratgeber/
python scripts/bing_webmaster_api.py call --method GetUserSites
```

## What This Enables

- validate that the key works
- validate that `tools.utildesk.de` is available to the key owner
- list verified sites and active sitemap/feed registrations
- summarize recent crawl health from Bing's own crawl stats
- inspect submission quota
- resubmit sitemap/feed
- submit important URLs directly, one by one or in a batch

## Current Audit Notes

- Bing access is confirmed for `https://tools.utildesk.de`.
- 2026-04-30 re-check:
  - live `https://tools.utildesk.de/sitemap.xml` contains `2002` canonical URLs;
  - Bing initially still showed a stale `UrlCount = 1976`;
  - `submit-feed` was run again and Bing refreshed the feed to `Status = Success`, `UrlCount = 2002`;
  - `GetCrawlIssues` returned an empty list;
  - last-30-day crawl summary showed `0` days blocked by robots and `0` days with `5xx`;
  - Bing's latest `InIndex` count was `437`.
- The live site should keep machine-readable non-HTML endpoints fetchable but out of the normal search index via `X-Robots-Tag: noindex`:
  - `/api/*`
  - `/markdown/*`
  - `/feed.xml`
  - `/feed.json`
  - `/llms.txt`
  - `/llms-full.txt`
- On Cloudflare Pages, treat `site/functions/` as the reliable live enforcement layer for those headers; keep `_headers` only as the static declaration/fallback.

## Important Limitation

Bing currently does **not** expose a public URL Inspection API equivalent to Google Search Console URL Inspection API.

That means:

- read/write operational work can be automated via Bing Webmaster API;
- detailed per-URL inspection still may require the Bing Webmaster Tools UI.

## Official References

- Microsoft Learn: Bing Webmaster API access
- Microsoft Learn: Bing Webmaster API protocols
- Microsoft Learn: `SubmitUrl`
- Microsoft Learn: `SubmitFeed`
- Microsoft Learn: `GetUrlSubmissionQuota`

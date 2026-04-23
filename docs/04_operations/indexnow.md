# IndexNow For `tools.utildesk.de`

## Purpose

Accelerate discovery of newly added, updated, redirected, or deleted canonical HTML pages through the IndexNow protocol.

This is separate from the Bing Webmaster API:

- Bing Webmaster API is still used for quota, feed, and crawl-health operations.
- IndexNow is used for immediate URL-change notifications and is shared with participating search engines.

## Key File

IndexNow uses a public verification key file, not a private secret.

Current root key file:

- `/c8e698e7-44e8-41e1-86d5-594ba2697475.txt`

The file contents must exactly match the filename stem.

## Helper

Use:

```powershell
python scripts/indexnow_submit.py smoke
python scripts/indexnow_submit.py submit-batch --url https://tools.utildesk.de/ --url https://tools.utildesk.de/ratgeber/ --wait-live
python scripts/indexnow_submit.py submit-git-range --rev-range HEAD~1..HEAD --wait-live
```

By default the helper now submits to two endpoints:

- the global IndexNow endpoint `https://api.indexnow.org/indexnow`
- the direct Bing endpoint `https://www.bing.com/indexnow`

This keeps protocol-wide sharing, while also giving Bing a direct signal for
its own telemetry path.

## Current Automation

- `scripts/cron_publish_push.sh` now runs a non-blocking post-deploy IndexNow step by default for the latest published tools commit.
- It submits only canonical HTML URLs derived from the latest git range.
- It waits until the key file and changed URLs are live before notifying the protocol endpoint.
- The post-deploy hook is now called from the actual synced-publish path, not only from the tail of the script.

Important:

- this automation is intentionally scoped to the `tools` cron flow;
- `ratgeber` remains a separate manual release path.

## Manual Ratgeber Release

After pushing a `ratgeber` release from a clean checkout, run:

```powershell
python scripts/indexnow_submit.py submit-git-range --rev-range HEAD~1..HEAD --wait-live
```

This will derive:

- changed `/ratgeber/<slug>/` URLs
- `/ratgeber/`
- `/`

## Safety Rules

- Submit canonical HTML pages, not `/api/*`, `/markdown/*`, feeds, or `llms` endpoints.
- Prefer meaningful content changes over cosmetic resubmissions.
- If a page was redirected or removed, it is still valid to notify its canonical URL through IndexNow.

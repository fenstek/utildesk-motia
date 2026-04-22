# Handoff

## 2026-04-22 SEO Handoff

- Deep SEO audit outcome:
  - the big live technical problem was sitemap pollution, not robots/noindex blocking;
  - 6 alias tool URLs in sitemap redirected with `308` to canonical tool pages;
  - `/tools/tag/` was an invalid sitemap URL and returned `404`.
- Implemented fix:
  - disabled the 6 alias tool markdown files;
  - updated the old internal ChatGPT alias link in `grok.md`;
  - updated `site/scripts/generate_sitemap.mjs` to exclude the reserved `tag` namespace;
  - fixed `scripts/sync_autobot_to_master_ff.sh` so it works even when no local `autobot` branch exists.
- Verified post-deploy:
  - live sitemap now has `855` URLs;
  - full live sitemap audit reports `0` bad URLs;
  - alias URLs still redirect correctly;
  - `ratgeber` index and live articles are canonical and indexable.
- Production branch state is healthy again:
  - `origin/master` and `origin/autobot` are synced to `a8504ce5f6112921c62f3878045ef5d582f049a4`;
  - `/opt/utildesk-motia` on `utildesk` was pulled forward to the same commit.
- Residual note:
  - Search Console URL Inspection still reflects stale historical crawl states for some old alias URLs and the newest article; this needs recrawl time, not another live-site fix right now.

## What Changed

- Добавлен безопасный import approved `ratgeber` packages: `scripts/import_ratgeber_package.py`
- Зафиксирован ops-guardrail: `tools` cron и `ratgeber` publish должны жить раздельно
- Добавлен runbook: `docs/04_operations/ratgeber_publish.md`
- Импортирована и подготовлена к production release статья `wie-agentische-developer-workflows-gerade-produktionsreif-werden-einordnung-prax`
- Fixed production `ratgeber` rendering regression:
  - the top cover image now opens in the shared lightbox just like inline article images;
  - the hero cover no longer gets compressed inside a forced wide aspect-ratio box.

## Release Note

Если понадобится следующая article release:

1. взять approved package с `opcl`
2. открыть чистый checkout от свежего `origin/master`
3. выполнить `python scripts/import_ratgeber_package.py --package-dir ...`
4. проверить diff только по `content/ratgeber` и `content/images/ratgeber`
5. коммитить и публиковать отдельно от `tools`

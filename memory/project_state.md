# Project State

## Summary

По состоянию на 2026-04-21 `utildesk-motia` — это production-репозиторий каталога AI-инструментов и связанных `ratgeber`-статей.

Основной live-flow проекта разделён на два независимых контура:

- `tools` publish: Google Sheet -> `content/tools/*.md` -> `autobot/master` -> Cloudflare Pages
- `ratgeber` publish: отдельный article pipeline на `opcl` -> `publish_ready/ratgeber/*` -> ручной import в чистый checkout от `origin/master`

## Important Operational Boundary

`tools` и `ratgeber` нельзя публиковать из одного и того же грязного checkout.

Причина:

- `scripts/cron_publish_push.sh` намеренно allowlist-ит только `content/tools/*.md`
- любые посторонние изменения в том же checkout должны ломать cron-run, а не коммититься вместе с инструментами

Это поведение считать правильным guardrail, а не багом.

## Ratgeber State

- На `opcl` article pipeline работает отдельно в `/opt/openclaw/workspace/agent-newsman`
- import в этот репозиторий разрешён только для package со статусом `approved_for_publish`
- для этого в репозитории есть `scripts/import_ratgeber_package.py`
- безопасный publish-flow описан в `docs/04_operations/ratgeber_publish.md`

## Latest Published Change

Текущим change-set добавлена статья:

- `content/ratgeber/wie-agentische-developer-workflows-gerade-produktionsreif-werden-einordnung-prax.md`

И связанные иллюстрации:

- `content/images/ratgeber/wie-agentische-developer-workflows-gerade-produktionsreif-werden-einordnung-prax-cover.svg`
- `content/images/ratgeber/wie-agentische-developer-workflows-gerade-produktionsreif-werden-einordnung-prax-workflow.svg`

## Current Master Baseline

## 2026-04-22 SEO And Production State

- GSC access for `tools.utildesk.de` is verified via the service account on host `utildesk`.
- Major technical indexing noise came from sitemap pollution:
  - 6 alias tool URLs were still present in sitemap while returning live `308` redirects to canonical tool pages;
  - `/tools/tag/` was emitted into sitemap even though it is a route namespace and returned `404`.
- Production fix shipped:
  - alias tool pages disabled: `deepart-io`, `google-cloud-vision-api`, `google-data-studio`, `openai-chatgpt`, `right-inbox`, `swagger-ui`;
  - old internal alias link in `content/tools/grok.md` updated to `/tools/chatgpt/`;
  - `site/scripts/generate_sitemap.mjs` hardened to skip reserved tool namespace `tag`.
- Post-deploy live verification:
  - `https://tools.utildesk.de/sitemap.xml` now contains `855` URLs instead of `862`;
  - full live sitemap audit now reports `855 x 200 OK`, `0` redirects inside sitemap, `0` canonical mismatches, `0` 404s.
- Production branch health after the fix:
  - `origin/master = origin/autobot = a8504ce5f6112921c62f3878045ef5d582f049a4`;
  - `/opt/utildesk-motia` on host `utildesk` was fast-forwarded to the same commit on branch `autobot`.
- `Ratgeber` live state is technically healthy:
  - `/ratgeber/` and all 3 live articles return `200`, self-canonical, and no `noindex`;
  - the newest article is present in live sitemap.
- Residual GSC note:
  - URL Inspection still shows stale historical states for some alias URLs and the newest `ratgeber` article;
  - this is recrawl lag, not a current live-site blocking issue.

- remote production head на момент публикации: `origin/master = 2130ee6`
- локальная старая рабочая копия пользователя не является надёжным baseline для публикации
- для manual content-release использовать отдельный чистый worktree от актуального `origin/master`

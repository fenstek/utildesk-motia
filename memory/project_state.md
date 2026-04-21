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

- remote production head на момент публикации: `origin/master = 2130ee6`
- локальная старая рабочая копия пользователя не является надёжным baseline для публикации
- для manual content-release использовать отдельный чистый worktree от актуального `origin/master`

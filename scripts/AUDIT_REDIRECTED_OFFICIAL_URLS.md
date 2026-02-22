# AUDIT_REDIRECTED_OFFICIAL_URLS.md

Аудит `official_url` для строк со статусами `DONE`, `NEW`, `IN_PROGRESS`.
Скрипт резолвит редиректы и ищет кейсы, где URL уводит на deny-хосты
(включая `dot-tech.org` / `www.dot-tech.org`).

## Purpose

- Выявить `official_url`, которые выглядят валидно, но через redirect-chain
  приводят на сквот/парковку или другой запрещённый домен.
- При `--apply=1` автоматически переводить такие строки в `NEEDS_REVIEW` с note,
  содержащим финальный URL.

## Usage

```bash
# Dry-run (по умолчанию): только JSON отчёт
node scripts/audit_redirected_official_urls.mjs --json

# Проверка только нужных slug
node scripts/audit_redirected_official_urls.mjs --json --only=ai21-labs,magisto,animoto,telescope

# Применить изменения в Sheet (status -> NEEDS_REVIEW + notes)
node scripts/audit_redirected_official_urls.mjs --apply=1 --json

# Ограничить выборку
node scripts/audit_redirected_official_urls.mjs --json --limit=200
```

## Apply mode (`--apply=1`)

Для каждого flagged row:
- `status` устанавливается в `NEEDS_REVIEW`
- В `notes` добавляется:
  `redirect_audit:<reason>; final_url=<resolved_final_url>; prev_status=<old_status>`

Причины:
- `redirected_to_dot_tech`
- `redirected_to_denied_host`

## JSON output

- `total_checked`
- `redirected_to_dot_tech_count`
- `redirected_to_dot_tech_samples` (`slug`, `row`, `official_url`, `finalUrl`)
- `redirected_to_denied_host_count`
- `redirected_to_denied_host_samples` (`slug`, `row`, `official_url`, `finalUrl`)
- `moved_to_needs_review`

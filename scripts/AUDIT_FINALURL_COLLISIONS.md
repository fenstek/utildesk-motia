# AUDIT_FINALURL_COLLISIONS.md

Аудит коллизий финальных URL после редиректов для строк со статусами:
- `DONE`
- `NEW`
- `IN_PROGRESS`

Скрипт нужен для кейсов, когда разные `official_url` в итоге ведут на один и тот же контентный/сквот-домен.

## Script

`scripts/audit_finalurl_collisions.mjs`

## What it does

1. Берёт строки `DONE + NEW + IN_PROGRESS` с non-missing `official_url`.
2. Для каждой строки резолвит финальный URL через `resolveFinalUrl()`.
3. Нормализует `finalUrl` и группирует строки по `normalized_final_url`.
4. Если размер группы `>= 2`, помечает как коллизию:
   - `reason=finalurl_collision`
   - включает список `slug`/`row`/`official_url`/`finalUrl`.

## Apply mode

По умолчанию dry-run.  
В `--apply=1`:
- переводит все строки из collision-group в `NEEDS_REVIEW`
- кроме строк, у которых `official_url` в allowlist

Сейчас allowlist пустой, значит переводятся все collision rows.

## Usage

```bash
# dry-run (default)
node scripts/audit_finalurl_collisions.mjs --json

# apply
node scripts/audit_finalurl_collisions.mjs --apply=1 --json

# only specific slugs
node scripts/audit_finalurl_collisions.mjs --json --only=ai21-labs,magisto,animoto

# limit checked rows
node scripts/audit_finalurl_collisions.mjs --json --limit=200
```

## JSON report fields

- `collisions_count`
- `top_collisions` (max 10 groups)
- `moved_to_needs_review`
- `total_checked`
- `mode`, `ts`

`top_collisions` group shape:
- `reason` (`finalurl_collision`)
- `normalized_final_url`
- `size`
- `rows`: `{ row, slug, status, official_url, finalUrl }[]`

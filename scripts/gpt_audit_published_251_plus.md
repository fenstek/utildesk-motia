# gpt_audit_published_251_plus.mjs

GPT-assisted semantic audit for Sheet rows exported by
[`export_published_251_plus.mjs`](./export_published_251_plus.md).

Скрипт:
- читает `/tmp/published_251_plus.json`
- загружает HTML `official_url`
- извлекает `<title>`, `og:title`, `h1`, `meta description`, `canonical`,
  финальный URL и домен
- отправляет эти данные в GPT
- по строгим правилам обновляет только публичные поля в Google Sheet

## Usage

```bash
source .env
node scripts/gpt_audit_published_251_plus.mjs
```

Ограничить объём:

```bash
source .env
node scripts/gpt_audit_published_251_plus.mjs --limit 10
```

## Update Rules

- `url_verdict == FIX` и `confidence >= 0.85`:
  обновляет `official_url`
- `url_verdict == FAIL`:
  переводит строку в `NEEDS_REVIEW`
- `tags_verdict == FIX` и `confidence >= 0.85`:
  обновляет `tags`
- `tags_verdict == FAIL`:
  переводит строку в `NEEDS_REVIEW`

Все изменения в `notes` помечаются префиксом:

```text
AUTO-GPT-AUDIT-251
```

## Output

Скрипт пишет артефакты:

```text
/tmp/gpt_audit_251_plus_report.json
/tmp/gpt_audit_251_plus_changed_slugs.json
```

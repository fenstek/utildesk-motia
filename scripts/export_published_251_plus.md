# export_published_251_plus.mjs

Export all sheet rows начиная с 251-й строки, ограничивая выборку только
публикуемыми статусами: `DONE`, `PUBLISHED`, `LIVE`.

## Usage

```bash
source .env
node scripts/export_published_251_plus.mjs
```

## Output

Скрипт пишет JSON в:

```text
/tmp/published_251_plus.json
```

Структура:

```json
{
  "exported_at": "2026-03-02T23:00:00.000Z",
  "count": 112,
  "rows": [
    {
      "row_number": 251,
      "slug": "example-tool",
      "title": "Example Tool",
      "description": "...",
      "category": "ai",
      "tags": "assistant, automation",
      "official_url": "https://example.com/",
      "status": "DONE",
      "notes": ""
    }
  ]
}
```

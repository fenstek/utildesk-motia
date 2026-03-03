# sheet_fix_by_slug.mjs

Точечное обновление одной строки в Google Sheet по точному совпадению `slug`.

Обновляет только указанные поля:
- `status`
- `official_url` (опционально)
- `tags` (опционально)
- `notes` (опционально, добавляет хвост к существующим заметкам)

## Требования

ENV:
- `SPREADSHEET_ID`
- `SHEET_NAME` (опционально, по умолчанию `Tabellenblatt1`)
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

## Использование

```bash
node scripts/sheet_fix_by_slug.mjs <slug> <new_status> [new_official_url] [note] [new_tags] [target_row_number]
```

Если `official_url` менять не нужно, передайте `-`.
Если `tags` менять не нужно, передайте `-`.
Если есть дубли `slug`, передайте `target_row_number`, чтобы обновить точную строку.

## Примеры

```bash
node scripts/sheet_fix_by_slug.mjs hugging-face REBUILD https://huggingface.co/ "FIX official_url domain" -
node scripts/sheet_fix_by_slug.mjs spacy REBUILD https://spacy.io/ "FIX official_url domain" "developer-tools, coding, api"
node scripts/sheet_fix_by_slug.mjs boomerang BLACKLIST - "Not a software tool (HBO Max channel)" -
node scripts/sheet_fix_by_slug.mjs ghostwriter DISABLED - "AUTO_DUPLICATE_ROW" - 346
```

## Вывод

Скрипт печатает JSON:
- `rowNumber`
- `slug`
- какие поля реально изменены

Если `slug` не найден, завершает работу с кодом `2`.

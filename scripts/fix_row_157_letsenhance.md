# fix_row_157_letsenhance.mjs

## Purpose

Точечное исправление официального URL для инструмента **Let's Enhance** в строке 157 Google Sheets.

## Problem

Row 157 содержал неправильный `official_url`:
- ❌ **Было**: `https://let.ai/`
- ✅ **Стало**: `https://letsenhance.io/`

## What it does

Скрипт обновляет только одну ячейку в row 157:
- **Column**: `official_url`
- **Row**: 157 (Let's Enhance)
- **New value**: `https://letsenhance.io/`

Другие колонки (status, notes, и т.д.) **НЕ изменяются**.

## Usage

### Prerequisites

Требуемые environment variables:
- `SPREADSHEET_ID` — ID Google Sheets
- `SHEET_NAME` — название листа (обычно "Tabellenblatt1")
- `GOOGLE_CLIENT_EMAIL` — email service account
- `GOOGLE_PRIVATE_KEY` — private key service account

### Run the script

```bash
node scripts/fix_row_157_letsenhance.mjs
```

### Expected output

```
Current row 157 state:
{
  topic: "Let's Enhance",
  official_url: "https://let.ai/",
  status: "NEW"
}

Applying update to official_url column...
✅ Update applied!

Updated row 157:
{
  topic: "Let's Enhance",
  official_url: "https://letsenhance.io/",
  status: "NEW"
}
```

## Related files

- **Markdown**: `content/tools/let-s-enhance.md` (также исправлен)
- **Sheet row**: 157 (Let's Enhance)

## Date

Created: 2026-02-16

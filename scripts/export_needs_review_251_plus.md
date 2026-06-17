# export_needs_review_251_plus.mjs

Read-only exporter for rows after a chosen sheet row, filtered by status.

## Usage

```bash
node scripts/export_needs_review_251_plus.mjs \
  --out /tmp/needs_review_251_plus.json \
  --startRow 251
```

Export both `NEEDS_REVIEW` and `NEW` rows:

```bash
node scripts/export_needs_review_251_plus.mjs \
  --out /tmp/review_and_new_251_plus.json \
  --startRow 251 \
  --statuses NEEDS_REVIEW,NEW
```

## Output fields

Each exported row contains:

- `row_number`
- `slug`
- `title`
- `description`
- `category`
- `tags`
- `official_url`
- `status`
- `notes`

The file also includes `exported_at`, `start_row`, `statuses`, and `count`.

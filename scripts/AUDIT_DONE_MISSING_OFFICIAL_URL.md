# audit_done_missing_official_url.mjs

## Purpose

Finds rows in Google Sheet (Tabellenblatt1) where **status = DONE** but
`official_url` is missing (empty, NaN, null, or whitespace).

A DONE row without an official URL is a publication-quality violation:
the tool page exists on-site but has no validated product link.

This script can:
1. **Report** (dry-run) all offending rows.
2. **Repair** (`--fix=1`) each row by running a resolution pipeline, updating
   the Sheet and the markdown frontmatter.

---

## What counts as "missing" official_url?

A value is treated as missing if it is:
- empty string (`""`)
- whitespace-only
- literally `NaN`, `null`, or `undefined`
- quoted empty (`""` or `''`)

Rows with a valid `https://…` URL are **not** touched.

---

## Usage examples

```bash
# Dry-run: report only (safe, read-only)
node scripts/audit_done_missing_official_url.mjs

# Apply fixes (write to Sheet + update MD files)
node scripts/audit_done_missing_official_url.mjs --fix=1

# Fix a single slug only
node scripts/audit_done_missing_official_url.mjs --fix=1 --only=inkscape

# Enable GPT for URL disambiguation (pick among DDG candidates)
USE_GPT_URL=1 node scripts/audit_done_missing_official_url.mjs --fix=1

# Enable GPT for empty-tag enrichment
USE_GPT_TAG_ENRICH=1 node scripts/audit_done_missing_official_url.mjs --fix=1

# Both GPT modes + single slug
USE_GPT_URL=1 USE_GPT_TAG_ENRICH=1 \
  node scripts/audit_done_missing_official_url.mjs --fix=1 --only=coreldraw
```

---

## Resolution pipeline (--fix=1)

For each offending row the script runs this waterfall:

```
1. Wikidata P856
   └─ if wikidata_id column present OR "qid=Qxxx" in notes field
      └─ fetch https://www.wikidata.org/wiki/Special:EntityData/<QID>.json
         └─ read P856 (official website) claim
         └─ validate URL (not suspicious, not denylist)

2. DDG resolver
   └─ resolveOfficialUrlByDDG() from resolve_official_url_ddg_v1.mjs
      └─ 4 DuckDuckGo queries → top-10 links → scored by slug token match
      └─ internal validation (deny-host list, suspicious patterns)

3. GPT chooser (only if USE_GPT_URL=1)
   └─ chooseOfficialUrlGpt() from scripts/lib/official_url_chooser_gpt.mjs
      └─ receives DDG candidates as allowlist
      └─ GPT MUST return a URL from the allowlist or empty
```

### After URL is resolved

If **URL found and valid**:
- Write `official_url` to Sheet column
- Append `audit:url_fixed:<source>:<host>` to `notes`
- Update `content/tools/<slug>.md` frontmatter: `official_url` field

Then check tags:
- If tags are empty / only `["ai"]` → try GPT tag enrichment (`USE_GPT_TAG_ENRICH=1`)
  - Enrichment success → write tags to MD; keep status **DONE**
  - Enrichment fails or disabled → append `tags_empty:needs_review` to notes;
    set status → **NEEDS_REVIEW**

If **URL not found** (all 3 steps fail):
- Set status → **NEEDS_REVIEW**
- Append `audit:missing_url:blocked (<reason>)` to notes
- **MD file is NOT touched**

### Guarantee after --fix=1

> No DONE row is left with an empty official_url.
> Either the URL is filled in, or the row is moved to NEEDS_REVIEW.

---

## Report format (stdout JSON)

```json
{
  "ok": true,
  "mode": "fix",
  "ts": "2026-02-22T00:00:00Z",
  "scanned": 6,
  "fixed_url": 4,
  "fixed_tags": 2,
  "moved_to_needs_review": 2,
  "detail": [
    {
      "row": 224,
      "slug": "adobe-illustrator",
      "action": "FIXED",
      "url": "https://www.adobe.com/products/illustrator.html",
      "source": "ddg",
      "confidence": 0.8,
      "status": "DONE",
      "tags_before": "[]",
      "tags_after": "design,image",
      "md_updated": true,
      "candidates": ["https://adobe.com/…"]
    },
    {
      "row": 226,
      "slug": "inkscape",
      "action": "NEEDS_REVIEW",
      "reason": "resolved_but_suspicious",
      "candidates": ["…"]
    }
  ]
}
```

In dry-run mode, `"mode": "dry-run"` and no writes occur.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `SPREADSHEET_ID` | (hardcoded) | Google Sheet ID |
| `SHEET_NAME` | `Tabellenblatt1` | Tab name |
| `CONTENT_DIR` | `/opt/utildesk-motia/content/tools` | MD files directory |
| `USE_GPT_URL` | `0` | Enable GPT URL chooser |
| `USE_GPT_TAG_ENRICH` | `0` | Enable GPT tag enrichment |
| `OPENAI_API_KEY` | — | Required when USE_GPT_URL or USE_GPT_TAG_ENRICH is set |
| `GPT_URL_MODEL` | `gpt-4o-mini` | Model for URL selection |
| `GPT_TAG_MODEL` | `gpt-4o-mini` | Model for tag enrichment |

---

## Safety guarantees

- **Dry-run by default**: without `--fix=1` the script performs no writes.
- **Cron-safe**: this script does not start, stop, or affect the cron job.
- **No MD touch when URL unknown**: if URL resolution fails, the markdown file
  is left untouched; only the Sheet status changes to `NEEDS_REVIEW`.
- **Allowlist-constrained GPT**: GPT URL chooser can only return a URL from
  the candidates list collected by DDG — never a hallucinated URL.
- **Denylist enforced**: all resolved URLs are validated against the same
  suspicious-URL rules used by the publication pipeline.

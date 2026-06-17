# enrich_tags_and_validate_category.mjs

## Purpose

Prevents tools from being published without proper category matching by:
1. Enriching generic tags (e.g., only `["ai"]`) with specific tags via GPT
2. Validating that enriched tags match at least one category
3. Marking tools as NEEDS_REVIEW if enrichment fails or no category matches

## How it works

### Flow

1. **Check if tags are generic**
   - Generic = empty OR only contains "ai"
   - If not generic → skip enrichment

2. **Enrich tags via GPT** (if enabled and tags are generic)
   - Calls OpenAI API with tool description
   - GPT returns 1-4 specific tags from allowlist
   - Merges with existing tags (max 5 total, preserves "ai")

3. **Validate category match**
   - Uses same logic as website (CATEGORIES.matchTags)
   - Finds first matching category

4. **Determine status**
   - If enrichment failed → `needs_review: true`, `notes: "TAG_ENRICH_FAILED"`
   - If no category match → `needs_review: true`, `notes: "NO_CATEGORY_MATCH_AFTER_TAG_ENRICH"`
   - Otherwise → `needs_review: false`

## Usage

### Standalone

```bash
node scripts/enrich_tags_and_validate_category.mjs \
  --title "Airtable" \
  --tags "ai" \
  --description "Spreadsheet database tool" \
  --official_url "https://airtable.com"
```

### In Pipeline

Called from autogen scripts before setting tool status:

```javascript
import { spawnSync } from 'node:child_process';

const result = spawnSync('node', [
  'scripts/enrich_tags_and_validate_category.mjs',
  '--title', toolTitle,
  '--tags', JSON.stringify(tags),
  '--description', description,
  '--official_url', officialUrl
], { encoding: 'utf-8' });

const output = JSON.parse(result.stdout);
const finalTags = output.tags;
const needsReview = output.needs_review;
const notes = output.notes;
```

## Output

```json
{
  "ok": true,
  "tags": ["ai", "spreadsheet", "productivity", "data"],
  "category": {
    "slug": "produktivitaet",
    "title": "Produktivität"
  },
  "enriched": true,
  "needs_review": false,
  "notes": "",
  "debug": {
    "original_tags": ["ai"],
    "had_generic_tags": true,
    "enrich_reason": "added_3_tags",
    "added_tags": ["spreadsheet", "productivity", "data"]
  }
}
```

## Environment Variables

### Required for GPT enrichment

- `USE_GPT_TAG_ENRICH=1` - Enable GPT tag enrichment (default: disabled)
- `OPENAI_API_KEY` - OpenAI API key

### Optional

- `GPT_TAG_MODEL` - Model to use (default: "gpt-4o-mini")
- `GPT_TAG_TIMEOUT_MS` - Timeout in ms (default: 15000)

## Tag Allowlist

Only tags from this list will be added:

```
chatbot, assistant, writing, content, marketing, seo, social-media,
design, image, video, audio, transcription,
productivity, automation, workflow, no-code,
data, analytics, spreadsheet, crm,
coding, developer-tools, api,
translation, education, customer-support, meeting
```

## Generic Tags

Tags considered "too generic" (trigger enrichment):

```
ai
```

## Examples

### Example 1: Generic tags → enriched → category found

**Input:**
```bash
--title "Clipchamp" --tags "ai" --description "Video editing tool"
```

**Output:**
```json
{
  "ok": true,
  "tags": ["ai", "video", "content"],
  "category": { "slug": "audio-video", "title": "Audio & Video" },
  "enriched": true,
  "needs_review": false
}
```

### Example 2: Enrichment disabled → no category → needs review

**Input:**
```bash
--title "Unknown" --tags "ai"
# (with USE_GPT_TAG_ENRICH=0)
```

**Output:**
```json
{
  "ok": true,
  "tags": ["ai"],
  "category": null,
  "enriched": false,
  "needs_review": true,
  "notes": "NO_CATEGORY_MATCH"
}
```

### Example 3: Specific tags already → no enrichment needed

**Input:**
```bash
--title "Adobe Express" --tags "design,image"
```

**Output:**
```json
{
  "ok": true,
  "tags": ["design", "image"],
  "category": { "slug": "design-kreativ", "title": "Design & Kreativität" },
  "enriched": false,
  "needs_review": false
}
```

## Integration Points

### In autogen pipeline

Add BEFORE setting status to NEW/DONE:

```javascript
// Before (old):
const status = suspicious ? 'NEEDS_REVIEW' : 'NEW';

// After (new):
let status = suspicious ? 'NEEDS_REVIEW' : 'NEW';
let finalTags = tags;
let notes = suspicious ? 'SUSPICIOUS_URL' : '';

// Check tags and category
const enrichResult = spawnSync('node', [
  'scripts/enrich_tags_and_validate_category.mjs',
  '--title', title,
  '--tags', JSON.stringify(tags),
  '--description', description,
  '--official_url', official_url
], { encoding: 'utf-8' });

if (enrichResult.status === 0) {
  const output = JSON.parse(enrichResult.stdout);
  finalTags = output.tags;

  if (output.needs_review) {
    status = 'NEEDS_REVIEW';
    notes = output.notes;
  }
}

// Use finalTags and status when writing to sheet
```

## Date

Created: 2026-02-16

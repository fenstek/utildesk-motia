# Integration Example: Tag Enrichment in Autogen Pipeline

## Overview

This example shows how to integrate tag enrichment and category validation into the autogen pipeline (e.g., `sheet_ai_autogen_9_strict_v2.mjs`).

## Integration Point

Add BEFORE setting tool status to NEW/DONE (around line 756 in sheet_ai_autogen_9_strict_v2.mjs).

## Code Example

```javascript
// ============================================================================
// BEFORE (Original code around line 756):
// ============================================================================

const status = suspicious ? 'NEEDS_REVIEW' : 'NEW';

const row = [
  topic,               // A topic
  slug,                // B slug
  category,            // C category
  tagsStr,             // D tags
  priceModel,          // E price_model
  affiliateUrl,        // F affiliate_url
  status,              // G status
  // ...
];

// ============================================================================
// AFTER (With tag enrichment):
// ============================================================================

import { spawnSync } from 'node:child_process';

let status = suspicious ? 'NEEDS_REVIEW' : 'NEW';
let finalTags = tags; // tags is array
let finalTagsStr = tagsStr; // comma-separated string
let enrichNotes = suspicious ? 'SUSPICIOUS_URL' : '';

// Only enrich if not already marked for review
if (status !== 'NEEDS_REVIEW') {
  try {
    const enrichResult = spawnSync('node', [
      'scripts/enrich_tags_and_validate_category.mjs',
      '--title', topic, // or title if you have it
      '--tags', JSON.stringify(tags),
      '--description', description || shortHint || '',
      '--official_url', official_url || ''
    ], {
      encoding: 'utf-8',
      timeout: 20000 // 20s timeout
    });

    if (enrichResult.status === 0 && enrichResult.stdout) {
      const output = JSON.parse(enrichResult.stdout);

      // Update tags if enriched
      if (output.ok && output.tags && output.tags.length > 0) {
        finalTags = output.tags;
        finalTagsStr = output.tags.join(', ');
      }

      // Mark for review if needed
      if (output.needs_review) {
        status = 'NEEDS_REVIEW';
        enrichNotes = output.notes || 'TAG_VALIDATION_FAILED';
      }

      // Optional: log enrichment activity
      if (output.enriched) {
        console.log(`[TAG_ENRICH] ${slug}: ${JSON.stringify(output.debug.added_tags)}`);
      }
    } else {
      // Enrichment script failed - mark for review
      console.warn(`[TAG_ENRICH] Failed for ${slug}: ${enrichResult.stderr}`);
      status = 'NEEDS_REVIEW';
      enrichNotes = 'TAG_ENRICH_SCRIPT_ERROR';
    }
  } catch (err) {
    // Don't fail entire pipeline, just mark for review
    console.warn(`[TAG_ENRICH] Exception for ${slug}: ${err.message}`);
    status = 'NEEDS_REVIEW';
    enrichNotes = 'TAG_ENRICH_EXCEPTION';
  }
}

// Merge notes if needed
const existingNotes = notes || '';
const finalNotes = existingNotes
  ? `${existingNotes}; ${enrichNotes}`
  : enrichNotes;

const row = [
  topic,               // A topic
  slug,                // B slug
  category,            // C category
  finalTagsStr,        // D tags (enriched)
  priceModel,          // E price_model
  affiliateUrl,        // F affiliate_url
  status,              // G status (may be NEEDS_REVIEW)
  finalNotes,          // H notes (includes enrich notes)
  // ...
];
```

## Testing

### Enable for testing

```bash
export USE_GPT_TAG_ENRICH=1
export OPENAI_API_KEY=sk-...
```

### Test single tool

```bash
node scripts/enrich_tags_and_validate_category.mjs \
  --title "Clipchamp" \
  --tags "ai" \
  --description "Video editing tool for content creators"
```

Expected output:
```json
{
  "ok": true,
  "tags": ["ai", "video", "content"],
  "category": { "slug": "audio-video", "title": "Audio & Video" },
  "enriched": true,
  "needs_review": false
}
```

### Test in pipeline

```bash
# Dry run with tag enrichment enabled
AUTOGEN_LIMIT=5 USE_GPT_TAG_ENRICH=1 node scripts/sheet_ai_autogen_9_strict_v2.mjs 5 --dry-run
```

## Expected Behavior

### Case 1: Generic tags → GPT enrichment → category found

**Input**: `tags: ["ai"]`
**GPT adds**: `["video", "content"]`
**Final tags**: `["ai", "video", "content"]`
**Category**: "Audio & Video"
**Status**: NEW

### Case 2: Generic tags → GPT enrichment fails

**Input**: `tags: ["ai"]`
**GPT**: timeout or invalid response
**Final tags**: `["ai"]` (unchanged)
**Category**: null
**Status**: NEEDS_REVIEW
**Notes**: "TAG_ENRICH_FAILED: gpt_timeout"

### Case 3: Generic tags → no category match after enrichment

**Input**: `tags: ["ai"]`
**GPT adds**: `["unknown"]` (not in allowlist, filtered out)
**Final tags**: `["ai"]`
**Category**: null
**Status**: NEEDS_REVIEW
**Notes**: "NO_CATEGORY_MATCH_AFTER_TAG_ENRICH"

### Case 4: Specific tags already → skip enrichment

**Input**: `tags: ["design", "image"]`
**Enrichment**: skipped (not generic)
**Category**: "Design & Kreativität"
**Status**: NEW

## Monitoring

Add logging to track enrichment activity:

```javascript
if (output.enriched) {
  console.log(`[TAG_ENRICH] ${slug}: ${output.debug.original_tags.join(',')} → ${output.tags.join(',')} (category: ${output.category?.title || 'none'})`);
}

if (output.needs_review) {
  console.warn(`[NEEDS_REVIEW] ${slug}: ${output.notes}`);
}
```

## Production Rollout

1. **Phase 1**: Deploy code, keep `USE_GPT_TAG_ENRICH=0` (disabled)
   - Enrichment script exists but not called
   - No behavior change

2. **Phase 2**: Test with `AUTOGEN_LIMIT=20 USE_GPT_TAG_ENRICH=1`
   - Process 20 tools with enrichment enabled
   - Review NEEDS_REVIEW cases
   - Validate category matching

3. **Phase 3**: Enable in cron `USE_GPT_TAG_ENRICH=1`
   - Full production rollout
   - Monitor OpenAI API usage
   - Track NEEDS_REVIEW rate

## Costs

- GPT call: ~150 tokens per enrichment
- Model: gpt-4o-mini (~$0.0001 per enrichment)
- Only called for tools with generic tags (estimated 10-20% of new tools)

## Date

Created: 2026-02-16

#!/usr/bin/env node
/**
 * Enrich tags if generic and validate category match
 *
 * Usage:
 *   node scripts/enrich_tags_and_validate_category.mjs --title "Tool" --tags "ai" [--description "..."]
 *
 * Output: JSON { ok: true, tags: [...], category: {...}, enriched: true/false, needs_review: true/false, notes: "..." }
 */

import 'dotenv/config';
import { enrichTagsIfGeneric, hasGenericTags } from './lib/tag_enricher_gpt.mjs';
import { findPrimaryCategory } from './lib/category_matcher.mjs';

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : '';
}

function parseTagsArg(value) {
  const str = String(value || '').trim();
  if (!str) return [];

  // Try JSON array first
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      // Fall through to comma-separated
    }
  }

  // Comma-separated
  return str.split(',').map(t => t.trim()).filter(Boolean);
}

async function main() {
  const title = getArg('title');
  const tagsInput = getArg('tags');
  const description = getArg('description') || getArg('short_hint') || '';
  const officialUrl = getArg('official_url') || getArg('url') || '';

  if (!title) {
    console.error('Missing required --title argument');
    process.exit(1);
  }

  const currentTags = parseTagsArg(tagsInput);

  // Step 1: Check if enrichment is needed
  const needsEnrichment = hasGenericTags(currentTags);

  let enrichResult = {
    ok: true,
    tags: currentTags,
    reason: 'tags_already_specific',
    enriched: false
  };

  // Step 2: Enrich tags if needed
  if (needsEnrichment) {
    enrichResult = await enrichTagsIfGeneric({
      title,
      short_hint: description,
      description,
      tags: currentTags,
      official_url: officialUrl
    });
  }

  const finalTags = enrichResult.ok ? enrichResult.tags : currentTags;

  // Step 3: Check category match
  const category = findPrimaryCategory(finalTags);

  // Step 4: Determine if needs review
  let needsReview = false;
  let notes = '';

  if (!enrichResult.ok && needsEnrichment) {
    // Tag enrichment failed
    needsReview = true;
    notes = `TAG_ENRICH_FAILED: ${enrichResult.reason}`;
  } else if (!category) {
    // No category match even after enrichment
    needsReview = true;
    const enrichedSuffix = enrichResult.enriched ? '_AFTER_TAG_ENRICH' : '';
    notes = `NO_CATEGORY_MATCH${enrichedSuffix}`;
  }

  // Step 5: Output result
  const result = {
    ok: true,
    tags: finalTags,
    category: category || null,
    enriched: enrichResult.enriched || false,
    needs_review: needsReview,
    notes,
    debug: {
      original_tags: currentTags,
      had_generic_tags: needsEnrichment,
      enrich_reason: enrichResult.reason,
      added_tags: enrichResult.added_tags || []
    }
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch(e => {
  console.error(JSON.stringify({
    ok: false,
    error: e.message || String(e),
    tags: [],
    category: null,
    needs_review: true,
    notes: 'SCRIPT_ERROR'
  }, null, 2));
  process.exit(1);
});

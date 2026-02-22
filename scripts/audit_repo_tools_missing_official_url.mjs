#!/usr/bin/env node
/**
 * audit_repo_tools_missing_official_url.mjs
 *
 * Scans all content/tools/*.md files and finds those missing a valid
 * official_url in their frontmatter. In --apply=1 mode, fills the value
 * from the Google Sheet (column K, official_url).
 *
 * Files whose name starts with "_" (e.g. _TEMPLATE.md) are skipped.
 *
 * Usage:
 *   # dry-run — report only, no writes
 *   node scripts/audit_repo_tools_missing_official_url.mjs
 *
 *   # apply: patch MD frontmatter from Sheet
 *   node scripts/audit_repo_tools_missing_official_url.mjs --apply=1
 *
 *   # apply + fix empty tags from Sheet
 *   node scripts/audit_repo_tools_missing_official_url.mjs --apply=1 --fix-tags=1
 *
 * "Missing official_url" means the field is absent OR its value is:
 *   empty | "nan" | "null" | "undefined" | "none" | "-" | "n/a" | "#n/a"
 * (handled by isMissingUrl() from scripts/lib/url_policy.mjs)
 *
 * Source of truth: Google Sheet (Tabellenblatt1), column K = official_url.
 * This script DOES NOT change Sheet status — only patches MD files.
 */

import 'dotenv/config';
import fs   from 'node:fs';
import path from 'node:path';
import { google }       from 'googleapis';
import { pathToFileURL } from 'node:url';
import { validateOfficialUrl, isMissingUrl } from './lib/url_policy.mjs';

// ─── Config ──────────────────────────────────────────────────────────────────

const SPREADSHEET_ID      = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME          = process.env.SHEET_NAME     || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY  = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const SA_JSON_PATH        = '/opt/utildesk-motia/secrets/google-service-account.json';
const CONTENT_DIR         = path.resolve(process.cwd(), 'content/tools');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function die(msg) { console.error(`\n[ERROR] ${msg}\n`); process.exit(1); }
function nowIso() { return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'); }

// ─── Safe frontmatter parser ──────────────────────────────────────────────────
//
// Handles the YAML subset used by this project:
//   - Scalar values: unquoted, single-quoted, double-quoted
//   - Flow sequence for tags: tags: [ai, chatbot]
//   - Block sequence for tags:
//       tags:
//         - ai
//         - chatbot
//   - Empty values: '', "", bare colon
//
// Returns: { hasFrontmatter, fields: Map<key,string|string[]>, raw }

function parseFrontmatter(content) {
  // Match opening --- ... closing ---
  const m = content.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!m) return { hasFrontmatter: false, fields: new Map(), raw: '' };

  const raw = m[1];
  const fields = new Map();
  const lines  = raw.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip blank lines and comments
    if (!line.trim() || line.trimStart().startsWith('#')) { i++; continue; }

    // Key: value line
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)?$/);
    if (!kv) { i++; continue; }

    const key = kv[1];
    const rest = (kv[2] || '').trim();

    // Block sequence: key with no value on same line, next lines start with "  -"
    if (rest === '' || rest === '|' || rest === '>') {
      const items = [];
      i++;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        const itemVal = lines[i].replace(/^\s+-\s+/, '').trim();
        items.push(unquoteScalar(itemVal));
        i++;
      }
      if (items.length > 0) {
        fields.set(key, items);
      } else {
        fields.set(key, ''); // bare key with no value and no list
      }
      continue;
    }

    // Flow sequence: key: [a, b, c]
    if (rest.startsWith('[')) {
      const inner = rest.replace(/^\[/, '').replace(/\].*$/, '');
      const items = inner.split(',').map(s => s.trim()).filter(Boolean).map(unquoteScalar);
      fields.set(key, items);
      i++;
      continue;
    }

    // Scalar value
    fields.set(key, unquoteScalar(rest));
    i++;
  }

  return { hasFrontmatter: true, fields, raw };
}

/** Strip surrounding quotes from a YAML scalar. */
function unquoteScalar(s) {
  const v = String(s || '').trim();
  if ((v.startsWith("'") && v.endsWith("'")) ||
      (v.startsWith('"') && v.endsWith('"'))) {
    return v.slice(1, -1).replace(/''/g, "'");
  }
  return v;
}

/**
 * Get the raw official_url value from a parsed frontmatter map.
 * Also checks legacy key names (website, url) as fallback.
 */
function getOfficialUrlRaw(fields) {
  for (const key of ['official_url', 'website', 'url']) {
    if (fields.has(key)) {
      const v = fields.get(key);
      return Array.isArray(v) ? v[0] || '' : String(v || '');
    }
  }
  return null; // field absent entirely
}

/**
 * Get tags as string[] from parsed frontmatter.
 */
function getTagsRaw(fields) {
  if (!fields.has('tags')) return null; // absent
  const v = fields.get('tags');
  if (Array.isArray(v)) return v;
  const s = String(v || '').trim();
  if (!s) return [];
  // try flow sequence inline: ai, chatbot
  return s.split(',').map(t => t.trim()).filter(Boolean);
}

// ─── Frontmatter patcher ──────────────────────────────────────────────────────
//
// Upserts a scalar key in the frontmatter block.
// Preserves the rest of the file exactly.

function patchFrontmatterKey(content, key, value) {
  const safeVal = String(value || '').replace(/'/g, "''");
  const newLine  = `${key}: '${safeVal}'`;

  const m = content.match(/^(---[ \t]*\r?\n)([\s\S]*?)(\r?\n---[ \t]*(?:\r?\n|$))/);
  if (!m) return content;

  const open  = m[1];
  const body  = m[2];
  const close = m[3];

  const keyRe = new RegExp(`^(${key}\\s*:.*)$`, 'm');
  let newBody;
  if (keyRe.test(body)) {
    newBody = body.replace(keyRe, newLine);
  } else {
    // Append before closing ---
    newBody = body.trimEnd() + '\n' + newLine;
  }

  return open + newBody + close + content.slice(m[0].length);
}

/**
 * Patch the tags field in frontmatter.
 * Writes as block sequence (YAML list).
 */
function patchFrontmatterTags(content, tags) {
  const m = content.match(/^(---[ \t]*\r?\n)([\s\S]*?)(\r?\n---[ \t]*(?:\r?\n|$))/);
  if (!m) return content;

  const open  = m[1];
  const body  = m[2];
  const close = m[3];

  // Build the replacement: block sequence
  const tagLines = tags.length
    ? `tags:\n${tags.map(t => `  - ${t}`).join('\n')}`
    : `tags: []`;

  // Replace existing tags block or append
  // Handle both "tags: [...]" and "tags:\n  - ..." forms
  const tagsBlockRe = /^tags:(?:[^\n]*(?:\n[ \t]+-[^\n]*)*)$/m;
  let newBody;
  if (tagsBlockRe.test(body)) {
    newBody = body.replace(tagsBlockRe, tagLines);
  } else {
    newBody = body.trimEnd() + '\n' + tagLines;
  }

  return open + newBody + close + content.slice(m[0].length);
}

// ─── Google Sheets client ────────────────────────────────────────────────────

async function sheetsClient() {
  if (GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY) {
    const auth = new google.auth.JWT({
      email: GOOGLE_CLIENT_EMAIL,
      key:   GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: SA_JSON_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

/** Load slug → { official_url, tags } map from Sheet. */
async function loadSheetMap() {
  const sheets = await sheetsClient();
  const range  = `${SHEET_NAME}!A1:P`;
  const res    = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
  const values = res.data.values || [];
  if (values.length < 2) die('Sheet has no data rows');

  const header = (values[0] || []).map(h => String(h || '').trim());
  const idx    = Object.fromEntries(header.map((h, i) => [h, i]));

  const required = ['slug', 'official_url'];
  const miss = required.filter(k => !(k in idx));
  if (miss.length) die(`Missing Sheet columns: ${miss.join(', ')}`);

  const map = new Map(); // slug → { official_url, tags }
  for (let i = 1; i < values.length; i++) {
    const row  = values[i] || [];
    const slug = String(row[idx.slug] || '').trim().toLowerCase();
    if (!slug) continue;
    map.set(slug, {
      official_url: String(row[idx.official_url] || '').trim(),
      tags: 'tags' in idx ? String(row[idx.tags] || '').trim() : '',
    });
  }
  return map;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const argv    = process.argv.slice(2);
  const apply   = argv.some(a => a === '--apply=1' || a === '--apply');
  const fixTags = apply && argv.some(a => a === '--fix-tags=1' || a === '--fix-tags');

  console.error(`[repo_audit] mode=${apply ? 'APPLY' : 'DRY-RUN'} fix-tags=${fixTags} ts=${nowIso()}`);

  // ── 1. Scan all MD files ─────────────────────────────────────────────────
  if (!fs.existsSync(CONTENT_DIR)) die(`content dir not found: ${CONTENT_DIR}`);

  const allFiles = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('_')) // skip _TEMPLATE.md etc.
    .map(f => ({ file: f, slug: f.replace(/\.md$/, ''), fullPath: path.join(CONTENT_DIR, f) }));

  console.error(`[repo_audit] scanned ${allFiles.length} md files (skipped ${
    fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md') && f.startsWith('_')).length
  } _ files)`);

  // ── 2. Parse frontmatter and identify missing official_url ───────────────
  const report = [];

  for (const { file, slug, fullPath } of allFiles) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const { hasFrontmatter, fields } = parseFrontmatter(content);

    const rawVal      = getOfficialUrlRaw(fields);     // null if field absent
    const rawStr      = rawVal === null ? '' : rawVal;
    const isMissing   = rawVal === null || isMissingUrl(rawVal);
    const tagsRaw     = getTagsRaw(fields);

    report.push({
      slug, file, fullPath,
      hasFrontmatter,
      official_url_raw: rawStr,
      official_url_field_absent: rawVal === null,
      is_missing: isMissing,
      tags_raw: tagsRaw,
    });
  }

  const missingRows = report.filter(r => r.is_missing);

  // ── 3. Print scan report ─────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(76)}`);
  console.log(`Repo audit: ${report.length} md files scanned  |  ${missingRows.length} missing official_url`);
  console.log(`${'─'.repeat(76)}`);

  if (missingRows.length) {
    console.log(`\n${'slug'.padEnd(34)} ${'file'.padEnd(38)} ${'official_url_raw (current)'}`);
    console.log(`${'─'.repeat(76)}`);
    for (const r of missingRows) {
      const rawDisplay = r.official_url_field_absent ? '(field absent)' : `"${r.official_url_raw}"`;
      console.log(`${r.slug.padEnd(34)} ${r.file.padEnd(38)} ${rawDisplay}`);
    }
  }

  if (!missingRows.length) {
    console.log(JSON.stringify({
      ok: true, mode: apply ? 'apply' : 'dry-run', ts: nowIso(),
      scanned_files: report.length,
      missing_official_url_count: 0,
      fixed_from_sheet_count: 0,
      still_missing_in_sheet_count: 0,
      note: 'All MD files have official_url — nothing to do.',
    }, null, 2));
    return;
  }

  // ── 4. Apply mode: load Sheet, patch files ──────────────────────────────
  const counters = {
    fixed_from_sheet:       0,
    still_missing_in_sheet: 0,
    tags_fixed:             0,
    tags_invalid:           0,
  };
  const fixResults = [];

  if (apply) {
    console.error(`\n[repo_audit] Loading Sheet data...`);
    const sheetMap = await loadSheetMap();
    console.error(`[repo_audit] Sheet rows loaded: ${sheetMap.size}`);

    for (const row of missingRows) {
      const sheetRow = sheetMap.get(row.slug);
      const sheetUrl = sheetRow?.official_url || '';

      if (!isMissingUrl(sheetUrl)) {
        // Validate before writing
        const validation = validateOfficialUrl(sheetUrl, { slug: row.slug });
        if (validation.ok) {
          let content = fs.readFileSync(row.fullPath, 'utf8');
          content = patchFrontmatterKey(content, 'official_url', sheetUrl);
          fs.writeFileSync(row.fullPath, content, 'utf8');
          counters.fixed_from_sheet++;
          fixResults.push({ slug: row.slug, outcome: 'fixed', official_url: sheetUrl, source: 'sheet' });
          console.error(`  ✓ fixed: ${row.slug} → ${sheetUrl}`);
        } else {
          // Sheet URL failed validation
          counters.still_missing_in_sheet++;
          fixResults.push({ slug: row.slug, outcome: 'still_missing', reason: `sheet_url_invalid:${validation.reason}`, sheet_url: sheetUrl });
          console.error(`  ✗ blocked: ${row.slug} sheet_url="${sheetUrl}" reason=${validation.reason}`);
        }
      } else {
        counters.still_missing_in_sheet++;
        fixResults.push({ slug: row.slug, outcome: 'still_missing', reason: 'not_in_sheet_or_empty' });
        console.error(`  ✗ still missing: ${row.slug} (not in sheet or empty)`);
      }

      // -- fix-tags (optional) --
      if (fixTags) {
        const content = fs.readFileSync(row.fullPath, 'utf8'); // re-read after possible patch
        const { fields } = parseFrontmatter(content);
        const currentTags = getTagsRaw(fields);

        if (!currentTags || currentTags.length === 0) {
          // Try to restore from Sheet
          const rawSheetTags = sheetRow?.tags || '';
          const sheetTags = rawSheetTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
          if (sheetTags.length > 0) {
            const deduped = [...new Set(sheetTags)];
            const patched = patchFrontmatterTags(content, deduped);
            fs.writeFileSync(row.fullPath, patched, 'utf8');
            counters.tags_fixed++;
            fixResults[fixResults.length - 1].tags_fixed = deduped.join(',');
            console.error(`  ✓ tags fixed: ${row.slug} → [${deduped.join(', ')}]`);
          } else {
            // Cannot determine tags — report only
            fixResults[fixResults.length - 1].tags_missing_in_sheet = true;
            console.error(`  ⚠ tags missing in sheet too: ${row.slug}`);
          }
        } else {
          // Normalize existing tags
          const normalized = [...new Set(currentTags.map(t => t.trim().toLowerCase()).filter(Boolean))];
          const specific = normalized.filter(t => t !== 'ai' && t !== 'produktivität');
          if (specific.length === 0) {
            // Only generic tags — flag but don't change
            counters.tags_invalid++;
            fixResults[fixResults.length - 1].tags_invalid_needs_review = true;
            console.error(`  ⚠ tags_invalid: ${row.slug} has only generic tags: [${normalized.join(', ')}]`);
          } else if (JSON.stringify(normalized) !== JSON.stringify(currentTags)) {
            // Normalize and rewrite
            const patched = patchFrontmatterTags(content, normalized);
            fs.writeFileSync(row.fullPath, patched, 'utf8');
            counters.tags_fixed++;
            fixResults[fixResults.length - 1].tags_normalized = normalized.join(',');
            console.error(`  ✓ tags normalized: ${row.slug}`);
          }
        }
      }
    }
  } else {
    // dry-run: just classify what would happen (needs Sheet data)
    console.log(`\n[DRY-RUN] Run with --apply=1 to patch MD files from Sheet.`);
  }

  // ── 5. JSON summary ──────────────────────────────────────────────────────
  const summary = {
    ok: true,
    mode: apply ? 'apply' : 'dry-run',
    ts: nowIso(),
    scanned_files: report.length,
    missing_official_url_count: missingRows.length,
    fixed_from_sheet_count:       apply ? counters.fixed_from_sheet : 0,
    still_missing_in_sheet_count: apply ? counters.still_missing_in_sheet : 0,
    ...(fixTags ? {
      tags_fixed_count:   counters.tags_fixed,
      tags_invalid_count: counters.tags_invalid,
    } : {}),
    ...(apply ? { fix_results: fixResults } : {
      missing_slugs: missingRows.map(r => ({
        slug: r.slug,
        file: r.file,
        has_frontmatter: r.hasFrontmatter,
        current_official_url_raw: r.official_url_field_absent ? null : r.official_url_raw,
      })),
    }),
    hint: apply ? undefined : 'Run with --apply=1 to patch MD files from Sheet.',
  };
  console.log('\n' + JSON.stringify(summary, null, 2));
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const isDirectRun = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  try { return import.meta.url === pathToFileURL(entry).href; }
  catch { return false; }
})();

if (isDirectRun) {
  main().catch(e => { console.error(e?.stack || String(e)); process.exit(1); });
}

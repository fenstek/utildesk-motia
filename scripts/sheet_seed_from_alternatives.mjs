#!/usr/bin/env node
/**
 * SEED pipeline: add NEW rows to Sheet from alternatives audit missing matches.
 *
 * Default: dry-run (no writes).
 *
 * Usage:
 *   node scripts/sheet_seed_from_alternatives.mjs [--dry-run] [--apply] [--limit N] [--json]
 *   node scripts/sheet_seed_from_alternatives.mjs --apply --limit 20
 */

import 'dotenv/config';
import process from 'node:process';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const AUDIT_JSON_PATH = process.env.AUDIT_ALTERNATIVES_JSON || '/tmp/audit_alternatives_render_v2.json';
const TOOLS_DIR = join(process.cwd(), 'content', 'tools');

const args = process.argv.slice(2);

function getFlagValue(name, fallback = '') {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  return String(args[i + 1] || fallback);
}

const limit = Math.max(1, Number(getFlagValue('--limit', '20')) || 20);
const jsonOutput = args.includes('--json');
const applyMode = args.includes('--apply');
const dryRun = !applyMode || args.includes('--dry-run');

function die(msg) {
  console.error(`\n[ERROR] ${msg}\n`);
  process.exit(1);
}

if (!SPREADSHEET_ID) die('SPREADSHEET_ID env var is missing');

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, '') // remove (parentheses)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function normalizeUrl(raw) {
  const src = String(raw || '').trim();
  if (!src) return '';
  let normalized = src;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  try {
    const u = new URL(normalized);
    if (!/^https?:$/.test(u.protocol)) return '';
    return u.toString();
  } catch {
    return '';
  }
}

function hostFromUrl(u) {
  try {
    return new URL(u).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function sheetsClient(readonly = true) {
  const ce = process.env.GOOGLE_CLIENT_EMAIL || '';
  const pk = String(process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!ce || !pk) die('Missing GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY env vars');

  const auth = new google.auth.JWT({
    email: ce,
    key: pk,
    scopes: readonly
      ? ['https://www.googleapis.com/auth/spreadsheets.readonly']
      : ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

async function readExistingSheet() {
  const sheets = await sheetsClient(true);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:P`,
  });

  const values = res.data.values || [];
  if (values.length < 2) return { existingTopic: new Set(), existingSlug: new Set(), existingHost: new Set() };

  const header = values[0].map((h) => String(h).trim().toLowerCase());
  const rows = values.slice(1);
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  const existingTopic = new Set();
  const existingSlug = new Set();
  const existingHost = new Set();

  for (const row of rows) {
    const topic = String(row[idx.topic] || '').trim().toLowerCase();
    const slug = String(row[idx.slug] || '').trim().toLowerCase();
    const officialUrl = idx.official_url !== undefined ? String(row[idx.official_url] || '').trim() : '';
    const host = hostFromUrl(officialUrl);

    if (topic) existingTopic.add(topic);
    if (slug) existingSlug.add(slug);
    if (host) existingHost.add(host);
  }

  return { existingTopic, existingSlug, existingHost };
}

function categoryFallback(name) {
  const n = String(name || '').toLowerCase();
  if (/(copilot|cursor|codeium|tabnine|replit|code|github|gitlab)/i.test(n)) return 'Developer';
  if (/(midjourney|dall|stable diffusion|firefly|canva|leonardo|figma|sketch|adobe|illustrator|photoshop|design)/i.test(n)) return 'Design';
  if (/(runway|pika|luma|synthesia|heygen|opus|video|premiere)/i.test(n)) return 'Video';
  if (/(elevenlabs|otter|krisp|suno|udio|whisper|audio|music|sound)/i.test(n)) return 'Audio';
  if (/(deepl|grammarly|jasper|copy\.ai|writesonic|quillbot|notion|text|write|document)/i.test(n)) return 'Produktivität';
  return 'AI';
}

async function main() {
  // Read audit JSON
  let auditData;
  try {
    const raw = await readFile(AUDIT_JSON_PATH, 'utf8');
    auditData = JSON.parse(raw);
  } catch (e) {
    die(`Failed to read audit JSON from ${AUDIT_JSON_PATH}: ${e.message}`);
  }

  if (!auditData?.items || !Array.isArray(auditData.items)) {
    die('Invalid audit JSON structure: missing items array');
  }

  // Extract all missing alternatives
  const candidates = [];
  for (const item of auditData.items) {
    if (!item.missingMatches || !Array.isArray(item.missingMatches)) continue;
    for (const miss of item.missingMatches) {
      if (miss.reason === 'title_not_found' && miss.detail) {
        candidates.push({
          topic: String(miss.detail).trim(),
          source_page: item.pageSlug,
          raw: miss.raw || '',
        });
      }
    }
  }

  const summary = {
    total_candidates: candidates.length,
    dedup_skipped: 0,
    already_in_sheet: 0,
    already_has_file: 0,
    to_add: 0,
    written: 0,
    errors: [],
  };

  if (!candidates.length) {
    if (jsonOutput) {
      console.log(JSON.stringify({ summary, rows: [] }, null, 2));
    } else {
      console.log('No missing alternatives found.');
    }
    return;
  }

  // Read existing Sheet
  const { existingTopic, existingSlug, existingHost } = await readExistingSheet();

  // Dedup and validate
  const seen = new Set();
  const toAdd = [];

  for (const cand of candidates) {
    const topic = cand.topic;
    const slug = slugify(topic);
    const topicKey = topic.toLowerCase();

    // Dedup by slug
    if (seen.has(slug)) {
      summary.dedup_skipped++;
      continue;
    }
    seen.add(slug);

    // Check if already in Sheet
    if (existingTopic.has(topicKey) || existingSlug.has(slug)) {
      summary.already_in_sheet++;
      continue;
    }

    // Check if file exists
    const filePath = join(TOOLS_DIR, `${slug}.md`);
    if (await fileExists(filePath)) {
      summary.already_has_file++;
      continue;
    }

    toAdd.push({
      topic,
      slug,
      category: categoryFallback(topic),
      source_page: cand.source_page,
      raw: cand.raw,
    });

    if (toAdd.length >= limit) break;
  }

  summary.to_add = toAdd.length;

  if (!toAdd.length) {
    if (jsonOutput) {
      console.log(JSON.stringify({ summary, rows: [] }, null, 2));
    } else {
      console.log(JSON.stringify(summary, null, 2));
    }
    return;
  }

  // Prepare rows (16 columns A-P)
  const rows = toAdd.map((item) => [
    item.topic,              // A - topic
    item.slug,               // B - slug
    item.category,           // C - category
    '',                      // D - tags
    '',                      // E - price_model
    '',                      // F - affiliate_url
    'NEW',                   // G - status
    'ALT_SEED',              // H - notes
    '',                      // I - title
    '',                      // J - short_hint
    '',                      // K - official_url
    '',                      // L - brand_assets_url
    '',                      // M - wikidata_id
    '',                      // N - wikipedia_de
    '',                      // O - wikipedia_en
    '',                      // P - wikidata_sitelinks
  ]);

  if (dryRun) {
    if (jsonOutput) {
      console.log(JSON.stringify({ summary, dry_run: true, rows: toAdd }, null, 2));
    } else {
      console.log(JSON.stringify({ ...summary, dry_run: true }, null, 2));
      console.log('\nSample rows to add:');
      for (let i = 0; i < Math.min(5, toAdd.length); i++) {
        console.log(`  ${i + 1}. ${toAdd[i].topic} (${toAdd[i].slug}) - ${toAdd[i].category}`);
      }
    }
    return;
  }

  // Apply: write to Sheet
  const payload = JSON.stringify({ rows });
  const out = spawnSync('node', ['scripts/sheet_write_rows_strict_AP_v2.mjs'], {
    input: payload,
    encoding: 'utf8',
    cwd: process.cwd(),
  });

  if (out.status !== 0) {
    summary.errors.push(out.stderr || out.stdout || 'writer failed');
    if (jsonOutput) {
      console.log(JSON.stringify({ summary, rows: [] }, null, 2));
    } else {
      console.error(JSON.stringify(summary, null, 2));
    }
    process.exit(1);
  }

  const writerResult = JSON.parse(out.stdout || '{}');
  summary.written = writerResult.written || 0;

  if (jsonOutput) {
    console.log(JSON.stringify({ summary, writer: writerResult }, null, 2));
  } else {
    console.log(JSON.stringify({ summary, writer: writerResult }, null, 2));
  }
}

main().catch((e) => {
  console.error('ERROR:', e?.message || String(e));
  process.exit(1);
});

#!/usr/bin/env node
/**
 * audit_publish_preflight.mjs
 *
 * Pre-flight check for rows that are about to be published (status = NEW).
 * Validates that every NEW row has:
 *   1) official_url — non-empty, valid https, passes suspicious-URL guard
 *   2) tags — at least one specific tag (not just "ai")
 *
 * Rows that fail any check are moved to NEEDS_REVIEW with a clear note.
 * Rows that pass remain NEW and are safe to publish.
 *
 * Usage:
 *   # dry-run: report only (no writes)
 *   node scripts/audit_publish_preflight.mjs
 *
 *   # apply: move invalid rows to NEEDS_REVIEW
 *   node scripts/audit_publish_preflight.mjs --apply
 *
 *   # check only specific slugs
 *   node scripts/audit_publish_preflight.mjs --apply --only=chatgpt,claude
 *
 *   # limit to first N NEW rows
 *   node scripts/audit_publish_preflight.mjs --apply --limit=20
 */

import 'dotenv/config';
import { google } from 'googleapis';
import { pathToFileURL } from 'node:url';

// ─── Config ─────────────────────────────────────────────────────────────────

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME     = process.env.SHEET_NAME     || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY  = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const SA_JSON_PATH = '/opt/utildesk-motia/secrets/google-service-account.json';

// ─── URL validation (mirrors autogen guard) ───────────────────────────────────

const DENY_HOST = new Set([
  'wikipedia.org','wikidata.org','wikimedia.org',
  'facebook.com','instagram.com','linkedin.com','tiktok.com','youtube.com','youtu.be',
  'twitter.com','x.com','imdb.com',
  'tripadvisor.com','booking.com','expedia.com',
  'apps.apple.com','play.google.com',
  'duckduckgo.com','google.com','bing.com',
]);
const DENY_SUBSTR = [
  'culture','mairie','stadt','gemeinde','municip','municipal','kommune','council','gov','gouv','regierung',
  'comune','townof','cityof','ville','township',
  'visit','tourism','tourist','stadtinfo','city',
  '/search?','/search/','?q=','&q=','utm_',
];

/**
 * Returns true if the URL is invalid/suspicious and should be blocked.
 */
function isSuspiciousUrl(u) {
  const raw = String(u || '').trim();
  if (!raw) return true;

  // Must start with https
  if (!/^https:\/\//i.test(raw)) return true;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    const pathLower = url.pathname.toLowerCase();
    const hp = host + pathLower + url.search.toLowerCase();

    for (const d of DENY_HOST) {
      if (host === d || host.endsWith('.' + d)) return true;
    }
    if (pathLower.includes('/wiki/')) return true;
    for (const sub of DENY_SUBSTR) {
      if (hp.includes(sub)) return true;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Returns true if the URL value counts as "missing":
 * empty, NaN, null, undefined, quoted empty, etc.
 */
function isMissingUrl(v) {
  const s = String(v || '').trim().toLowerCase();
  return !s || ['nan', 'null', 'undefined', 'none', '""', "''"].includes(s);
}

/**
 * Returns true if tags are considered invalid:
 * empty, only "ai", or only generic category values.
 */
function hasInvalidTags(rawTags) {
  if (!rawTags) return true;
  const tags = String(rawTags).split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
  if (tags.length === 0) return true;
  // Need at least one specific tag beyond the catch-all "ai"
  const specific = tags.filter(t => t !== 'ai' && t !== 'produktivität');
  return specific.length === 0;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function die(msg) { console.error(`\n[ERROR] ${msg}\n`); process.exit(1); }

function colLetter(idx) {
  let n = idx + 1, s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function nowIso() { return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'); }

// ─── Google Sheets client ────────────────────────────────────────────────────

async function sheetsClient() {
  if (GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY) {
    const auth = new google.auth.JWT({
      email: GOOGLE_CLIENT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const argv  = process.argv.slice(2);
  const apply = argv.includes('--apply');

  const onlyRaw = (argv.find(a => a.startsWith('--only=')) || '').replace('--only=', '').trim();
  const onlySlugs = onlyRaw ? new Set(onlyRaw.split(',').map(s => s.trim().toLowerCase())) : null;

  const limitArg = (argv.find(a => a.startsWith('--limit=')) || '').replace('--limit=', '').trim();
  const limit = limitArg ? Math.max(1, Math.min(500, Number(limitArg) || 0)) : 0;

  console.error(`[preflight] mode=${apply ? 'APPLY' : 'DRY-RUN'} ts=${nowIso()}`);

  const sheets = await sheetsClient();
  const range  = `${SHEET_NAME}!A1:P`;
  const res    = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
  const values = res.data.values || [];
  if (values.length < 2) die('Sheet has no data rows');

  const header = (values[0] || []).map(h => String(h || '').trim());
  const idx    = Object.fromEntries(header.map((h, i) => [h, i]));

  const required = ['topic', 'slug', 'status', 'notes', 'official_url'];
  const missingCols = required.filter(k => !(k in idx));
  if (missingCols.length) die(`Missing columns: ${missingCols.join(', ')}`);

  const hasTags   = 'tags' in idx;
  const colStatus = colLetter(idx.status);
  const colNotes  = colLetter(idx.notes);

  // ── Scan NEW rows ────────────────────────────────────────────────────────
  const toCheck = [];

  for (let i = 1; i < values.length; i++) {
    const row    = values[i] || [];
    const topic  = String(row[idx.topic]        || '').trim();
    const slug   = String(row[idx.slug]         || '').trim();
    const status = String(row[idx.status]       || '').trim().toUpperCase();
    const offUrl = String(row[idx.official_url] || '').trim();
    const notes  = String(row[idx.notes]        || '').trim();
    const tags   = hasTags ? String(row[idx.tags] || '').trim() : '';

    if (!topic) continue;
    if (status !== 'NEW') continue;

    if (onlySlugs && !onlySlugs.has(slug.toLowerCase())) continue;
    if (limit && toCheck.length >= limit) break;

    toCheck.push({ rowNumber: i + 1, topic, slug, offUrl, notes, tags });
  }

  // ── Validate each NEW row ────────────────────────────────────────────────
  const blocked  = [];
  const clean    = [];

  for (const row of toCheck) {
    const issues = [];

    // Gate 1: official_url
    if (isMissingUrl(row.offUrl)) {
      issues.push('missing official_url');
    } else if (isSuspiciousUrl(row.offUrl)) {
      issues.push(`suspicious official_url: ${row.offUrl}`);
    }

    // Gate 2: tags
    if (hasInvalidTags(row.tags)) {
      issues.push('missing/invalid tags');
    }

    if (issues.length) {
      blocked.push({ ...row, issues });
    } else {
      clean.push(row);
    }
  }

  // ── Report ────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(72)}`);
  console.log(`Preflight: ${toCheck.length} NEW rows checked`);
  console.log(`  PASS: ${clean.length}  |  BLOCKED: ${blocked.length}`);
  console.log(`${'─'.repeat(72)}`);

  if (blocked.length) {
    console.log(`\nBLOCKED rows (will be moved to NEEDS_REVIEW if --apply):`);
    console.log(`${'#'.padEnd(4)} ${'row'.padEnd(5)} ${'slug'.padEnd(30)} issue`);
    console.log(`${'─'.repeat(72)}`);
    blocked.forEach((r, i) => {
      console.log(`${String(i + 1).padEnd(4)} ${String(r.rowNumber).padEnd(5)} ${r.slug.padEnd(30)} ${r.issues.join('; ')}`);
    });
  }

  // ── Apply: move blocked rows to NEEDS_REVIEW ─────────────────────────────
  const batchUpdates = [];
  let applied = 0;

  if (apply && blocked.length) {
    for (const r of blocked) {
      const noteFragment = `preflight:blocked: ${r.issues.join('; ')}`;
      const newNote = `${r.notes} | ${noteFragment}`.trim().slice(0, 50000);
      batchUpdates.push(
        { range: `${SHEET_NAME}!${colStatus}${r.rowNumber}`, values: [['NEEDS_REVIEW']] },
        { range: `${SHEET_NAME}!${colNotes}${r.rowNumber}`,  values: [[newNote]] },
      );
      applied++;
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: batchUpdates },
    });
    console.log(`\n[preflight] Applied: ${applied} rows → NEEDS_REVIEW`);
  }

  // ── JSON summary ──────────────────────────────────────────────────────────
  const summary = {
    ok: true,
    mode: apply ? 'apply' : 'dry-run',
    ts: nowIso(),
    new_rows_checked: toCheck.length,
    passed: clean.length,
    blocked: blocked.length,
    applied_needs_review: apply ? applied : 0,
    blocked_detail: blocked.map(r => ({
      row: r.rowNumber, slug: r.slug, topic: r.topic,
      official_url: r.offUrl, tags: r.tags,
      issues: r.issues,
    })),
    hint: apply ? undefined : 'Run with --apply to move blocked rows to NEEDS_REVIEW.',
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

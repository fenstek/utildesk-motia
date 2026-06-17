#!/usr/bin/env node
/**
 * audit_done_missing_official_url.mjs
 *
 * Finds DONE rows in the Google Sheet that are missing official_url,
 * then attempts to repair them via:
 *   1) Wikidata P856 (official website claim) — if wikidata_id present
 *   2) DDG HTML search (resolveOfficialUrlByDDG)
 *   3) GPT URL chooser (optional, requires USE_GPT_URL=1)
 *
 * On success: updates Sheet column official_url + updates MD frontmatter
 * On failure: sets status → NEEDS_REVIEW with a note
 *
 * Usage:
 *   # dry-run (default) — shows what would change
 *   node scripts/audit_done_missing_official_url.mjs
 *
 *   # apply changes
 *   node scripts/audit_done_missing_official_url.mjs --apply=1
 *
 *   # limit to specific slugs
 *   node scripts/audit_done_missing_official_url.mjs --apply=1 --only=uipath,claude
 *
 *   # limit to first N DONE rows
 *   node scripts/audit_done_missing_official_url.mjs --apply=1 --limit=20
 *
 *   # print up to 10 sample DONE rows for sanity check (no writes)
 *   node scripts/audit_done_missing_official_url.mjs --debug=1
 *
 * Proof-of-target block is always printed before any processing so you can
 * confirm the script is hitting the correct spreadsheet and sheet.
 *
 * Empty official_url predicate: null | undefined | "" | "nan" | "null" |
 *   "undefined" | "none" | '""' | "''" | "-" | "n/a" | "#n/a" (case-insensitive)
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';
import { pathToFileURL } from 'node:url';
import { resolveOfficialUrlByDDG } from './resolve_official_url_ddg_v1.mjs';
import { validateOfficialUrl, isMissingUrl } from './lib/url_policy.mjs';

// ─── Config ──────────────────────────────────────────────────────────────────

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME     = process.env.SHEET_NAME     || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY  = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const SA_JSON_PATH = '/opt/utildesk-motia/secrets/google-service-account.json';
const CONTENT_DIR  = path.resolve(process.cwd(), 'content/tools');
const WIKIDATA_FETCH_TIMEOUT = Number(process.env.WIKIDATA_FETCH_TIMEOUT_MS || 8000);

// ─── Optional GPT chooser ────────────────────────────────────────────────────

let chooseOfficialUrlGpt  = async () => ({ ok: false, reason: 'gpt_disabled', confidence: 0 });
let isGptUrlEnabled = () => false;
try {
  const m = await import('./lib/official_url_chooser_gpt.mjs');
  if (typeof m?.chooseOfficialUrlGpt === 'function') chooseOfficialUrlGpt = m.chooseOfficialUrlGpt;
  if (typeof m?.isGptUrlEnabled === 'function')      isGptUrlEnabled = m.isGptUrlEnabled;
} catch {}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function die(msg) { console.error(`\n[ERROR] ${msg}\n`); process.exit(1); }

function slugify(s) {
  return String(s || '')
    .toLowerCase().trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

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

// ─── Wikidata P856 resolver ──────────────────────────────────────────────────

async function resolveWikidataP856(qid) {
  if (!qid || !/^Q\d+$/.test(String(qid).trim())) return null;
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  try {
    const ac = new AbortController();
    const tid = setTimeout(() => ac.abort(), WIKIDATA_FETCH_TIMEOUT);
    const r = await fetch(url, { signal: ac.signal });
    clearTimeout(tid);
    if (!r.ok) return null;
    const data = await r.json();
    const entity = data?.entities?.[qid];
    const p856 = entity?.claims?.P856;
    if (!Array.isArray(p856) || !p856.length) return null;
    const preferred = p856.find(c => c.rank === 'preferred') || p856[0];
    const rawUrl = preferred?.mainsnak?.datavalue?.value;
    return rawUrl ? String(rawUrl).trim() : null;
  } catch {
    return null;
  }
}

// ─── MD frontmatter patcher ───────────────────────────────────────────────────

/**
 * Upserts a key in YAML frontmatter (delimited by ---).
 * If the key already exists, replaces the value.
 * If not, appends it before the closing ---.
 */
function patchFrontmatter(content, key, value) {
  // Escape value for YAML single-quoted string
  const safeVal = String(value || '').replace(/'/g, "''");
  const newLine = `${key}: '${safeVal}'`;

  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return content; // no frontmatter — don't touch

  const fm = fmMatch[1];
  const keyRe = new RegExp(`^(${key}\\s*:.*)$`, 'm');
  let newFm;
  if (keyRe.test(fm)) {
    newFm = fm.replace(keyRe, newLine);
  } else {
    newFm = fm.trimEnd() + '\n' + newLine;
  }

  return content.replace(fmMatch[0], `---\n${newFm}\n---`);
}

function updateMdFile(slug, officialUrl) {
  const mdPath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(mdPath)) return { ok: false, reason: 'md_not_found' };
  try {
    const before = fs.readFileSync(mdPath, 'utf8');
    const after = patchFrontmatter(before, 'official_url', officialUrl);
    if (before === after) return { ok: true, changed: false };
    fs.writeFileSync(mdPath, after, 'utf8');
    return { ok: true, changed: true };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
  }
}

// ─── URL normalization ────────────────────────────────────────────────────────

const DOCS_PREFIXES = ['/docs', '/documentation', '/developers', '/api'];

function normalizeDocsUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(String(url).trim());
    const p = u.pathname.toLowerCase();
    if (DOCS_PREFIXES.some(pfx => p.startsWith(pfx))) return u.origin + '/';
    return url;
  } catch {
    return url;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const argv   = process.argv.slice(2);
  const apply  = argv.some(a => a === '--apply=1' || a === '--apply');
  const debug  = argv.some(a => a === '--debug=1' || a === '--debug');

  const onlyRaw = (argv.find(a => a.startsWith('--only=')) || '').replace('--only=', '').trim();
  const onlySlugs = onlyRaw ? new Set(onlyRaw.split(',').map(s => s.trim().toLowerCase())) : null;

  const limitArg = (argv.find(a => a.startsWith('--limit=')) || '').replace('--limit=', '').trim();
  const limit = limitArg ? Math.max(1, Math.min(500, Number(limitArg) || 0)) : 0;

  console.error(`[audit_done] mode=${apply ? 'APPLY' : 'DRY-RUN'} ts=${nowIso()}`);
  console.error(`[audit_done] gpt_enabled=${isGptUrlEnabled()}`);

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

  const colStatus   = colLetter(idx.status);
  const colNotes    = colLetter(idx.notes);
  const colOfficial = colLetter(idx.official_url);
  const colWikidata = 'wikidata_id' in idx ? colLetter(idx.wikidata_id) : null;

  // ── Proof-of-target (always printed) ─────────────────────────────────────
  // First 3 data rows shown as raw to confirm the script is targeting the right sheet.
  const first3 = values.slice(1, 4).map((row, i) => ({
    row_index: i + 2, // 1-based sheet row (row 1 = header)
    slug:         String(row[idx.slug]         ?? ''),
    status:       String(row[idx.status]       ?? ''),
    official_url: String(row[idx.official_url] ?? ''),
  }));
  console.log(JSON.stringify({
    proof_of_target: {
      spreadsheet_id: SPREADSHEET_ID,
      sheet_name:     SHEET_NAME,
      rows_count:     values.length - 1, // data rows, excluding header
      first_3_rows:   first3,
    },
  }, null, 2));

  // ── Debug: sample DONE rows ────────────────────────────────────────────────
  if (debug) {
    const doneSample = [];
    for (let i = 1; i < values.length && doneSample.length < 10; i++) {
      const row    = values[i] || [];
      const status = String(row[idx.status] ?? '').trim().toUpperCase();
      if (status !== 'DONE') continue;
      doneSample.push({
        row_index:    i + 1,
        slug:         String(row[idx.slug]         ?? ''),
        official_url: String(row[idx.official_url] ?? ''),
      });
    }
    console.log(JSON.stringify({ debug_done_sample: doneSample }, null, 2));
  }

  // ── Collect DONE rows with missing official_url ──────────────────────────
  const toRepair = [];

  for (let i = 1; i < values.length; i++) {
    const row     = values[i] || [];
    const topic   = String(row[idx.topic]        || '').trim();
    const slug    = String(row[idx.slug]         || '').trim();
    const status  = String(row[idx.status]       || '').trim().toUpperCase();
    const offUrl  = String(row[idx.official_url] || '').trim();
    const notes   = String(row[idx.notes]        || '').trim();
    const qid     = 'wikidata_id' in idx ? String(row[idx.wikidata_id] || '').trim() : '';

    if (!topic) continue;
    if (status !== 'DONE') continue;
    if (!isMissingUrl(offUrl)) continue; // already has a valid non-empty URL

    if (onlySlugs && !onlySlugs.has(slug.toLowerCase())) continue;
    if (limit && toRepair.length >= limit) break;

    toRepair.push({ rowNumber: i + 1, topic, slug, offUrl, notes, qid });
  }

  console.error(`[audit_done] DONE rows missing official_url: ${toRepair.length}`);

  if (!toRepair.length) {
    console.log(JSON.stringify({
      ok: true, mode: apply ? 'apply' : 'dry-run', ts: nowIso(),
      done_missing_url: 0, repaired: 0, needs_review: 0,
      note: 'All DONE rows have official_url — nothing to do.',
    }, null, 2));
    return; // proof_of_target already printed above
  }

  // ── Repair loop ───────────────────────────────────────────────────────────
  const results  = [];
  const batchUpd = [];

  for (const item of toRepair) {
    const { rowNumber, topic, slug, notes, qid } = item;
    const token = (slugify(slug || topic).split('-')[0] || '').toLowerCase();
    console.error(`\n[audit_done] row=${rowNumber} slug=${slug} topic="${topic}" qid=${qid || '—'}`);

    let resolved = '';
    let source   = '';

    // ── Step 1: Wikidata P856 ────────────────────────────────────────────
    if (qid) {
      console.error(`  [wikidata] fetching P856 for ${qid}...`);
      const p856 = await resolveWikidataP856(qid);
      if (p856) {
        const normalized = normalizeDocsUrl(p856);
        const validation = validateOfficialUrl(normalized, { slug, title: topic });
        if (validation.ok) {
          resolved = normalized;
          source = 'wikidata_p856';
          console.error(`  [wikidata] P856 accepted: ${resolved}`);
        } else {
          console.error(`  [wikidata] P856 blocked (${validation.reason}): ${p856}`);
        }
      } else {
        console.error(`  [wikidata] no P856 claim`);
      }
    }

    // ── Step 2: DDG ──────────────────────────────────────────────────────
    if (!resolved) {
      console.error(`  [ddg] querying for "${topic} official site"...`);
      const ddgResult = await resolveOfficialUrlByDDG(`${topic} official site`, token);
      if (ddgResult.ok) {
        const normalized = normalizeDocsUrl(ddgResult.official_url);
        const validation = validateOfficialUrl(normalized, { slug, title: topic });
        if (validation.ok) {
          resolved = normalized;
          source = 'ddg';
          console.error(`  [ddg] accepted: ${resolved} (flags: ${validation.flags.join(',') || 'none'})`);
        } else {
          console.error(`  [ddg] blocked (${validation.reason}): ${ddgResult.official_url}`);
        }
      } else {
        console.error(`  [ddg] ${ddgResult.reason}: no usable result`);
      }

      // ── Step 3: GPT chooser (from DDG candidates) ────────────────────
      if (!resolved && isGptUrlEnabled()) {
        const candidates = (ddgResult.candidates || []).map((u, i) => ({ url: u, rank: i + 1 }));
        if (candidates.length) {
          console.error(`  [gpt] asking GPT with ${candidates.length} DDG candidates...`);
          const gptResult = await chooseOfficialUrlGpt({ topic, token, candidates });
          if (gptResult.ok && gptResult.official_url) {
            const normalized = normalizeDocsUrl(gptResult.official_url);
            const validation = validateOfficialUrl(normalized, { slug, title: topic });
            if (validation.ok) {
              resolved = normalized;
              source = `gpt(conf=${gptResult.confidence?.toFixed(2)})`;
              console.error(`  [gpt] accepted: ${resolved}`);
            } else {
              console.error(`  [gpt] blocked (${validation.reason}): ${gptResult.official_url}`);
            }
          } else {
            console.error(`  [gpt] no result: ${gptResult.reason || 'unknown'}`);
          }
        }
      }
    }

    // ── Outcome ──────────────────────────────────────────────────────────
    if (resolved) {
      // Success: update official_url in sheet, keep DONE, patch MD
      results.push({
        row: rowNumber, slug, topic, qid,
        outcome: 'repaired', source, official_url: resolved,
      });

      batchUpd.push(
        { range: `${SHEET_NAME}!${colOfficial}${rowNumber}`, values: [[resolved]] },
        { range: `${SHEET_NAME}!${colNotes}${rowNumber}`, values: [[`${notes} | audit:fixed:${source}:${resolved}`.trim().slice(0, 50000)]] },
      );

      if (apply) {
        const mdResult = updateMdFile(slug, resolved);
        console.error(`  [md] patch ${slug}.md: ok=${mdResult.ok} changed=${mdResult.changed} ${mdResult.reason || ''}`);
      } else {
        console.error(`  [md] would patch ${slug}.md → official_url: '${resolved}'`);
      }
    } else {
      // Failure: move to NEEDS_REVIEW
      results.push({
        row: rowNumber, slug, topic, qid,
        outcome: 'needs_review', reason: 'no_valid_url_found',
      });

      batchUpd.push(
        { range: `${SHEET_NAME}!${colStatus}${rowNumber}`, values: [['NEEDS_REVIEW']] },
        { range: `${SHEET_NAME}!${colNotes}${rowNumber}`, values: [[`${notes} | audit:done_missing_url:no_url_found`.trim().slice(0, 50000)]] },
      );
      console.error(`  → NEEDS_REVIEW`);
    }
  }

  // ── Report ────────────────────────────────────────────────────────────────
  const repaired      = results.filter(r => r.outcome === 'repaired').length;
  const needsReview   = results.filter(r => r.outcome === 'needs_review').length;

  console.log(`\n${'─'.repeat(72)}`);
  console.log(`audit_done_missing_official_url: ${toRepair.length} DONE rows scanned`);
  console.log(`  REPAIRED: ${repaired}  |  NEEDS_REVIEW: ${needsReview}`);
  console.log(`${'─'.repeat(72)}`);

  if (results.length) {
    console.log(`\n${'#'.padEnd(4)} ${'row'.padEnd(5)} ${'slug'.padEnd(30)} ${'outcome'.padEnd(14)} detail`);
    console.log(`${'─'.repeat(72)}`);
    results.forEach((r, i) => {
      const detail = r.outcome === 'repaired'
        ? `${r.source} → ${r.official_url}`
        : r.reason;
      console.log(`${String(i + 1).padEnd(4)} ${String(r.row).padEnd(5)} ${r.slug.padEnd(30)} ${r.outcome.padEnd(14)} ${detail}`);
    });
  }

  // ── Apply batch updates ───────────────────────────────────────────────────
  if (apply && batchUpd.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: batchUpd },
    });
    console.log(`\n[audit_done] Applied: ${batchUpd.length} cell updates`);
  } else if (!apply && batchUpd.length) {
    console.log(`\n[DRY-RUN] Would apply ${batchUpd.length} cell updates. Run with --apply=1 to commit.`);
  }

  // ── JSON summary ──────────────────────────────────────────────────────────
  const summary = {
    ok: true,
    mode: apply ? 'apply' : 'dry-run',
    ts: nowIso(),
    done_missing_url: toRepair.length,
    repaired,
    needs_review: needsReview,
    applied_updates: apply ? batchUpd.length : 0,
    results: results.map(r => ({
      row: r.row, slug: r.slug, topic: r.topic, qid: r.qid,
      outcome: r.outcome,
      ...(r.source ? { source: r.source } : {}),
      ...(r.official_url ? { official_url: r.official_url } : {}),
      ...(r.reason ? { reason: r.reason } : {}),
    })),
    hint: apply ? undefined : 'Run with --apply=1 to apply changes.',
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

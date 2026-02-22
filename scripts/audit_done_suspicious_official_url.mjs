#!/usr/bin/env node
/**
 * audit_done_suspicious_official_url.mjs  (v1.0)
 *
 * Defense-in-depth post-publish audit for DONE rows.
 * Flags rows whose official_url looks suspicious AFTER they have already
 * been published — catching cases that slipped through pre-publish gates.
 *
 * Checks applied (in order):
 *   1. validateOfficialUrl()   — full policy check (v2.5):
 *        redirector_query, denied_host, too_generic_root,
 *        suspicious_url_pattern, wrong_entity_domain
 *   2. suspicious_tld_org_net  — host is <slug>.org or <slug>.net while
 *        the slug does NOT belong to a known open-source project (.org allowed)
 *   3. hostname_mismatch       — elevated from advisory to audit flag when
 *        ok=true but flags includes 'hostname_mismatch'
 *
 * Usage:
 *   # dry-run — report only, no writes (default)
 *   node scripts/audit_done_suspicious_official_url.mjs
 *
 *   # apply — move flagged rows to NEEDS_REVIEW in Google Sheet
 *   node scripts/audit_done_suspicious_official_url.mjs --apply=1
 *
 *   # limit to first N DONE rows
 *   node scripts/audit_done_suspicious_official_url.mjs --limit=50
 *
 *   # check specific slugs only
 *   node scripts/audit_done_suspicious_official_url.mjs --only=ghostwriter,tableau
 *
 *   # machine-readable JSON output only (suppresses table)
 *   node scripts/audit_done_suspicious_official_url.mjs --json
 */

import 'dotenv/config';
import { google } from 'googleapis';
import { pathToFileURL } from 'node:url';

import {
  validateOfficialUrl,
  isMissingUrl,
  DENY_HOSTS,
} from './lib/url_policy.mjs';

// ─── Config ──────────────────────────────────────────────────────────────────

const SPREADSHEET_ID     = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME         = process.env.SHEET_NAME     || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY  = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const SA_JSON_PATH        = '/opt/utildesk-motia/secrets/google-service-account.json';

// ─── Open-source / nonprofit domains allowed to use .org/.net TLD ────────────
// These are legitimate OSS projects where .org is the canonical domain.

const ORG_TLD_ALLOWLIST = new Set([
  // Open-source / nonprofit — canonical .org domains
  'gimp.org', 'inkscape.org', 'blender.org', 'libreoffice.org',
  'mozilla.org', 'firefox.org', 'python.org', 'numpy.org', 'scipy.org',
  'jupyter.org', 'postgresql.org', 'mysql.org', 'drupal.org', 'wordpress.org',
  'mediawiki.org', 'openstreetmap.org', 'fsf.org', 'gnu.org',
  'pytorch.org', 'tensorflow.org', 'apache.org', 'eclipse.org',
  'kde.org', 'gnome.org', 'videolan.org',
  // Computer vision / ML / docs tools with legitimate .org
  'opencv.org', 'sphinx-doc.org', 'pencil2d.org', 'audacity.org',
  // Products/services established on .net
  'novelai.net',
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function die(msg) { console.error(`\n[ERROR] ${msg}\n`); process.exit(1); }

function nowIso() { return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'); }

function colLetter(idx) {
  let n = idx + 1, s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function appendNote(prev, fragment) {
  const base = String(prev || '').trim();
  const part = String(fragment || '').trim();
  if (!part) return base;
  if (!base) return part;
  if (base.includes(part)) return base;
  return `${base} | ${part}`.slice(0, 50000);
}

function normalizeHost(url) {
  try {
    return new URL(String(url || '').trim()).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

// ─── Additional audit heuristics (beyond validateOfficialUrl) ────────────────

/**
 * Check 2: suspicious TLD (.org / .net) when slug matches the domain base.
 *
 * Rationale: commercial AI tools are almost never at .org or .net.
 * If host is exactly <slug_token>.org (or .net) and not in ORG_TLD_ALLOWLIST,
 * the URL is likely a parked / impersonation domain.
 *
 * e.g. slug=tableau, host=tableau.org → suspicious
 *      slug=inkscape, host=inkscape.org → allowlisted, NOT flagged
 */
function checkSuspiciousTldOrgNet(host, slug) {
  const tld = host.endsWith('.org') ? '.org' : host.endsWith('.net') ? '.net' : null;
  if (!tld) return null;
  if (ORG_TLD_ALLOWLIST.has(host)) return null;

  // Extract the slug's primary token (first hyphen-segment, lowercased)
  const slugBase = slug.replace(/-/g, '').toLowerCase();
  const hostBase = host.slice(0, host.length - tld.length).replace(/[^a-z0-9]/g, '').toLowerCase();

  if (hostBase && slugBase && (hostBase === slugBase || hostBase.includes(slugBase) || slugBase.includes(hostBase))) {
    return `suspicious_tld_org_net:${host}`;
  }
  return null;
}

/**
 * Check 3: escalate the advisory hostname_mismatch flag from validateOfficialUrl
 * to an audit finding when the mismatch is present in a DONE row.
 *
 * Only applied when validateOfficialUrl returned ok=true with 'hostname_mismatch' flag.
 */
function checkHostnameMismatch(flags) {
  if (flags.includes('hostname_mismatch')) return 'hostname_mismatch';
  return null;
}

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
  const argv    = process.argv.slice(2);
  const apply   = argv.includes('--apply=1') || argv.includes('--apply');
  const jsonOut = argv.includes('--json');

  const onlyRaw    = (argv.find(a => a.startsWith('--only=')) || '').replace('--only=', '').trim();
  const onlySlugs  = onlyRaw ? new Set(onlyRaw.split(',').map(s => s.trim().toLowerCase())) : null;

  const limitArg = (argv.find(a => a.startsWith('--limit=')) || '').replace('--limit=', '').trim();
  const limit    = limitArg ? Math.max(1, Math.min(5000, Number(limitArg) || 0)) : 0;

  if (!jsonOut) {
    console.error(`[done-url-audit] mode=${apply ? 'APPLY' : 'DRY-RUN'} ts=${nowIso()}`);
  }

  const sheets = await sheetsClient();
  const range  = `${SHEET_NAME}!A1:P`;
  const res    = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
  const values = res.data.values || [];
  if (values.length < 2) die('Sheet has no data rows');

  const header = (values[0] || []).map(h => String(h || '').trim());
  const idx    = Object.fromEntries(header.map((h, i) => [h, i]));

  const required = ['topic', 'slug', 'status', 'notes', 'official_url'];
  const missing  = required.filter(k => !(k in idx));
  if (missing.length) die(`Missing columns: ${missing.join(', ')}`);

  const hasTags   = 'tags'  in idx;
  const hasTitle  = 'title' in idx;
  const colStatus = colLetter(idx.status);
  const colNotes  = colLetter(idx.notes);

  // ── Collect DONE rows ────────────────────────────────────────────────────
  const toCheck = [];

  for (let i = 1; i < values.length; i++) {
    const row    = values[i] || [];
    const topic  = String(row[idx.topic]        || '').trim();
    const slug   = String(row[idx.slug]         || '').trim();
    const status = String(row[idx.status]       || '').trim().toUpperCase();
    const offUrl = String(row[idx.official_url] || '').trim();
    const notes  = String(row[idx.notes]        || '').trim();
    const tags   = hasTags  ? String(row[idx.tags]  || '').trim() : '';
    const title  = hasTitle ? String(row[idx.title] || '').trim() : topic;

    if (!topic) continue;
    if (status !== 'DONE') continue;

    if (onlySlugs && !onlySlugs.has(slug.toLowerCase())) continue;
    if (limit && toCheck.length >= limit) break;

    toCheck.push({ rowNumber: i + 1, topic, slug, title, offUrl, notes, tags });
  }

  // ── Check each DONE row ──────────────────────────────────────────────────
  const flagged = [];
  const clean   = [];

  for (const row of toCheck) {
    const reasons = [];

    // Check 1: validateOfficialUrl (full policy v2.5)
    const vResult = validateOfficialUrl(row.offUrl, { slug: row.slug, title: row.title });

    if (!vResult.ok) {
      // Hard block from url_policy — definitely suspicious
      reasons.push(vResult.reason || 'policy_violation');
    } else {
      // Check 2: suspicious .org / .net TLD (advisory, DONE-specific)
      const host = normalizeHost(row.offUrl);
      const tldCheck = checkSuspiciousTldOrgNet(host, row.slug);
      if (tldCheck) reasons.push(tldCheck);

      // Check 3: escalate hostname_mismatch advisory → audit finding
      const mmCheck = checkHostnameMismatch(vResult.flags);
      if (mmCheck) reasons.push(mmCheck);
    }

    if (reasons.length) {
      flagged.push({ ...row, reasons });
    } else {
      clean.push(row);
    }
  }

  // ── Build reasons breakdown ──────────────────────────────────────────────
  const reasons_breakdown = {};
  const samples = {};
  for (const r of flagged) {
    for (const reason of r.reasons) {
      const key = reason.split(':')[0]; // normalize "denied_host:foo" → "denied_host"
      reasons_breakdown[key] = (reasons_breakdown[key] || 0) + 1;
      if (!samples[key]) samples[key] = [];
      if (samples[key].length < 3) samples[key].push(r.slug);
    }
  }

  // ── Human-readable report ────────────────────────────────────────────────
  if (!jsonOut) {
    console.log(`\n${'─'.repeat(72)}`);
    console.log(`Done-URL Audit: ${toCheck.length} DONE rows checked`);
    console.log(`  CLEAN: ${clean.length}  |  FLAGGED: ${flagged.length}`);
    console.log(`${'─'.repeat(72)}`);

    if (flagged.length) {
      console.log('\nFLAGGED rows:');
      console.log(
        `${'#'.padEnd(4)} ${'row'.padEnd(5)} ${'slug'.padEnd(35)} reasons`
      );
      console.log(`${'─'.repeat(72)}`);
      flagged.forEach((r, i) => {
        console.log(
          `${String(i + 1).padEnd(4)} ${String(r.rowNumber).padEnd(5)} ${r.slug.padEnd(35)} ${r.reasons.join('; ')}`
        );
      });
    }

    if (Object.keys(reasons_breakdown).length) {
      console.log('\nReasons breakdown:');
      for (const [k, v] of Object.entries(reasons_breakdown)) {
        console.log(`  ${k}: ${v}  (e.g. ${(samples[k] || []).join(', ')})`);
      }
    }
  }

  // ── Apply: move flagged rows to NEEDS_REVIEW ─────────────────────────────
  let applied = 0;
  const batchData = [];

  if (apply && flagged.length) {
    for (const r of flagged) {
      const noteFragment = `post_publish_qc:${r.reasons.join('|')}; prev_status=DONE`;
      const newNote = appendNote(r.notes, noteFragment);
      batchData.push(
        { range: `${SHEET_NAME}!${colStatus}${r.rowNumber}`, values: [['NEEDS_REVIEW']] },
        { range: `${SHEET_NAME}!${colNotes}${r.rowNumber}`,  values: [[newNote]] },
      );
      applied++;
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: batchData },
    });

    if (!jsonOut) {
      console.log(`\n[done-url-audit] Applied: ${applied} rows → NEEDS_REVIEW`);
    }
  }

  // ── JSON summary ─────────────────────────────────────────────────────────
  const summary = {
    ok: true,
    mode: apply ? 'apply' : 'dry-run',
    ts: nowIso(),
    total_done_checked: toCheck.length,
    clean_count: clean.length,
    flagged_count: flagged.length,
    applied_needs_review: apply ? applied : 0,
    reasons_breakdown,
    samples,
    flagged_rows: flagged.map(r => ({
      row:          r.rowNumber,
      slug:         r.slug,
      official_url: r.offUrl,
      reasons:      r.reasons,
    })),
    hint: apply
      ? undefined
      : 'Run with --apply=1 to move flagged rows to NEEDS_REVIEW.',
  };

  if (jsonOut) {
    console.log(JSON.stringify(summary));
  } else {
    console.log('\n' + JSON.stringify(summary, null, 2));
  }
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

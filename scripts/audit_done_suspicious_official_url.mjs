#!/usr/bin/env node
/**
 * audit_done_suspicious_official_url.mjs  (v1.1)
 *
 * Defense-in-depth post-publish audit for DONE rows.
 * Flags rows whose official_url looks suspicious AFTER they have already
 * been published — catching cases that slipped through pre-publish gates.
 *
 * v1.1 changes vs v1.0:
 *   - hostname_mismatch demoted to soft_flag (never triggers NEEDS_REVIEW)
 *   - not_https: auto-upgrade attempt via resolveFinalUrl(); if final URL
 *     is https → http_upgradeable bucket (URL updated, status stays DONE)
 *   - denied_host for google.com subdomains fixed in url_policy.mjs (v2.5)
 *
 * Four mutually exclusive result buckets:
 *   flagged        → hard policy violation → NEEDS_REVIEW on --apply=1
 *   httpUpgradeable → not_https but resolves to https → URL fixed on --apply=1
 *   softFlagged    → hostname_mismatch only (informational, no action taken)
 *   clean          → no issues
 *
 * Checks applied (in order):
 *   1. validateOfficialUrl()   — full policy check (v2.5):
 *        redirector_query, denied_host, too_generic_root,
 *        suspicious_url_pattern, wrong_entity_domain
 *        not_https → intercepted: try HTTP upgrade first
 *   2. suspicious_tld_org_net  — host is <slug>.org or <slug>.net while
 *        the slug does NOT belong to a known open-source project
 *   3. hostname_mismatch       — soft_flag only (informational)
 *
 * Usage:
 *   # dry-run — report only, no writes (default)
 *   node scripts/audit_done_suspicious_official_url.mjs
 *
 *   # apply — move flagged rows to NEEDS_REVIEW; fix http→https URLs in sheet
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
} from './lib/url_policy.mjs';

import { resolveFinalUrl } from './lib/http_verify_url.mjs';

// ─── Config ──────────────────────────────────────────────────────────────────

const SPREADSHEET_ID      = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME          = process.env.SHEET_NAME     || 'Tabellenblatt1';
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

// ─── HTTP → HTTPS upgrade helper ─────────────────────────────────────────────

/**
 * Attempts to resolve an http:// URL and check whether the final destination
 * is an https:// URL (i.e. the site simply redirects to https).
 *
 * @param {string} url - An http:// URL
 * @returns {Promise<{upgradeable: boolean, httpsUrl: string}>}
 */
async function tryHttpUpgrade(url) {
  try {
    const result = await resolveFinalUrl(url, { timeoutMs: 5000, maxRedirects: 6 });
    if (result.ok && result.finalUrl && result.finalUrl.startsWith('https://')) {
      return { upgradeable: true, httpsUrl: result.finalUrl };
    }
  } catch {
    // network error — treat as non-upgradeable
  }
  return { upgradeable: false, httpsUrl: '' };
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

  const slugBase = slug.replace(/-/g, '').toLowerCase();
  const hostBase = host.slice(0, host.length - tld.length).replace(/[^a-z0-9]/g, '').toLowerCase();

  if (hostBase && slugBase && (hostBase === slugBase || hostBase.includes(slugBase) || slugBase.includes(hostBase))) {
    return `suspicious_tld_org_net:${host}`;
  }
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

  const onlyRaw   = (argv.find(a => a.startsWith('--only=')) || '').replace('--only=', '').trim();
  const onlySlugs = onlyRaw ? new Set(onlyRaw.split(',').map(s => s.trim().toLowerCase())) : null;

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

  const hasTags      = 'tags'  in idx;
  const hasTitle     = 'title' in idx;
  const colStatus    = colLetter(idx.status);
  const colNotes     = colLetter(idx.notes);
  const colOfficialUrl = colLetter(idx.official_url);

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
  // Four mutually exclusive buckets:
  //   flagged         → hard policy violation → NEEDS_REVIEW
  //   httpUpgradeable → http:// that resolves to https:// → fix URL
  //   softFlagged     → hostname_mismatch only (informational)
  //   clean           → no issues

  const flagged         = [];
  const httpUpgradeable = [];
  const softFlagged     = [];
  const clean           = [];

  for (const row of toCheck) {
    const reasons     = [];   // hard-block reasons → flagged bucket
    const softReasons = [];   // advisory reasons → softFlagged bucket

    // Check 1: validateOfficialUrl (full policy v2.5)
    const vResult = validateOfficialUrl(row.offUrl, { slug: row.slug, title: row.title });

    if (!vResult.ok) {
      if (vResult.reason === 'not_https') {
        // Attempt HTTP→HTTPS upgrade before flagging
        const upgrade = await tryHttpUpgrade(row.offUrl);
        if (upgrade.upgradeable) {
          httpUpgradeable.push({ ...row, httpsUrl: upgrade.httpsUrl });
          continue;
        }
        // Could not upgrade — treat as hard block
        reasons.push('not_https');
      } else {
        // Hard block from url_policy
        reasons.push(vResult.reason || 'policy_violation');
      }
    } else {
      // Check 2: suspicious .org / .net TLD (advisory, DONE-specific)
      const host = normalizeHost(row.offUrl);
      const tldCheck = checkSuspiciousTldOrgNet(host, row.slug);
      if (tldCheck) reasons.push(tldCheck);

      // Check 3: hostname_mismatch → soft_flag only (never NEEDS_REVIEW)
      if (vResult.flags.includes('hostname_mismatch')) {
        softReasons.push('hostname_mismatch');
      }
    }

    if (reasons.length) {
      flagged.push({ ...row, reasons });
    } else if (softReasons.length) {
      softFlagged.push({ ...row, softReasons });
    } else {
      clean.push(row);
    }
  }

  // ── Build reasons breakdown ──────────────────────────────────────────────
  const reasons_breakdown = {};
  const samples = {};
  for (const r of flagged) {
    for (const reason of r.reasons) {
      const key = reason.split(':')[0];
      reasons_breakdown[key] = (reasons_breakdown[key] || 0) + 1;
      if (!samples[key]) samples[key] = [];
      if (samples[key].length < 3) samples[key].push(r.slug);
    }
  }

  // ── Human-readable report ────────────────────────────────────────────────
  if (!jsonOut) {
    console.log(`\n${'─'.repeat(72)}`);
    console.log(`Done-URL Audit: ${toCheck.length} DONE rows checked`);
    console.log(`  CLEAN: ${clean.length}  |  FLAGGED: ${flagged.length}  |  HTTP_UPGRADE: ${httpUpgradeable.length}  |  SOFT: ${softFlagged.length}`);
    console.log(`${'─'.repeat(72)}`);

    if (flagged.length) {
      console.log('\nFLAGGED rows (→ NEEDS_REVIEW):');
      console.log(`${'#'.padEnd(4)} ${'row'.padEnd(5)} ${'slug'.padEnd(35)} reasons`);
      console.log(`${'─'.repeat(72)}`);
      flagged.forEach((r, i) => {
        console.log(
          `${String(i + 1).padEnd(4)} ${String(r.rowNumber).padEnd(5)} ${r.slug.padEnd(35)} ${r.reasons.join('; ')}`
        );
      });
    }

    if (httpUpgradeable.length) {
      console.log('\nHTTP_UPGRADEABLE rows (http → https redirect):');
      console.log(`${'#'.padEnd(4)} ${'row'.padEnd(5)} ${'slug'.padEnd(35)} https_url`);
      console.log(`${'─'.repeat(72)}`);
      httpUpgradeable.forEach((r, i) => {
        console.log(
          `${String(i + 1).padEnd(4)} ${String(r.rowNumber).padEnd(5)} ${r.slug.padEnd(35)} ${r.httpsUrl}`
        );
      });
    }

    if (softFlagged.length) {
      console.log(`\nSOFT_FLAGGED rows (informational, no action): ${softFlagged.length}`);
      console.log(`  (hostname_mismatch only — these are advisory and do not trigger NEEDS_REVIEW)`);
    }

    if (Object.keys(reasons_breakdown).length) {
      console.log('\nReasons breakdown:');
      for (const [k, v] of Object.entries(reasons_breakdown)) {
        console.log(`  ${k}: ${v}  (e.g. ${(samples[k] || []).join(', ')})`);
      }
    }
  }

  // ── Apply: move flagged rows to NEEDS_REVIEW; fix http→https URLs ─────────
  let appliedNeedsReview = 0;
  let appliedHttpUpgrade = 0;
  const batchData = [];

  if (apply) {
    // Flagged → NEEDS_REVIEW
    for (const r of flagged) {
      const noteFragment = `post_publish_qc:${r.reasons.join('|')}; prev_status=DONE`;
      const newNote = appendNote(r.notes, noteFragment);
      batchData.push(
        { range: `${SHEET_NAME}!${colStatus}${r.rowNumber}`,  values: [['NEEDS_REVIEW']] },
        { range: `${SHEET_NAME}!${colNotes}${r.rowNumber}`,   values: [[newNote]] },
      );
      appliedNeedsReview++;
    }

    // HTTP upgradeable → update official_url only (status stays DONE)
    for (const r of httpUpgradeable) {
      batchData.push(
        { range: `${SHEET_NAME}!${colOfficialUrl}${r.rowNumber}`, values: [[r.httpsUrl]] },
      );
      appliedHttpUpgrade++;
    }

    if (batchData.length) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { valueInputOption: 'RAW', data: batchData },
      });
    }

    if (!jsonOut) {
      if (appliedNeedsReview) console.log(`\n[done-url-audit] Applied: ${appliedNeedsReview} rows → NEEDS_REVIEW`);
      if (appliedHttpUpgrade) console.log(`[done-url-audit] Applied: ${appliedHttpUpgrade} rows → official_url upgraded to https`);
    }
  }

  // ── JSON summary ─────────────────────────────────────────────────────────
  const summary = {
    ok: true,
    mode: apply ? 'apply' : 'dry-run',
    ts: nowIso(),
    total_done_checked:   toCheck.length,
    clean_count:          clean.length,
    flagged_count:        flagged.length,
    http_upgradeable_count: httpUpgradeable.length,
    soft_flags_count:     softFlagged.length,
    applied_needs_review: apply ? appliedNeedsReview : 0,
    applied_http_upgrade: apply ? appliedHttpUpgrade : 0,
    reasons_breakdown,
    samples,
    flagged_rows: flagged.map(r => ({
      row:          r.rowNumber,
      slug:         r.slug,
      official_url: r.offUrl,
      reasons:      r.reasons,
    })),
    http_upgraded_rows: httpUpgradeable.map(r => ({
      row:          r.rowNumber,
      slug:         r.slug,
      old_url:      r.offUrl,
      new_url:      r.httpsUrl,
    })),
    soft_flagged_rows: softFlagged.map(r => ({
      row:          r.rowNumber,
      slug:         r.slug,
      official_url: r.offUrl,
      soft_reasons: r.softReasons,
    })),
    hint: apply
      ? undefined
      : 'Run with --apply=1 to move flagged rows to NEEDS_REVIEW and fix http→https URLs.',
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

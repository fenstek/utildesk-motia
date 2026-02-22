#!/usr/bin/env node
import 'dotenv/config';
import { google } from 'googleapis';
import { pathToFileURL } from 'node:url';

import { resolveFinalUrl } from './lib/http_verify_url.mjs';
import { validateOfficialUrl, isMissingUrl } from './lib/url_policy.mjs';
import { classifyFinalUrl } from './lib/url_suspicion.mjs';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const SA_JSON_PATH = '/opt/utildesk-motia/secrets/google-service-account.json';
const STUCK_IN_PROGRESS_HOURS = Number(process.env.QC_STUCK_IN_PROGRESS_HOURS || 48);

const TRACKED_REASONS = [
  'self_reference',
  'invalid_url',
  'head_check_failed',
  'redirected_to_denied_final_host',
  'redirected_to_parking_or_domain_sale',
  'final_url_matches_denied_pattern',
  'final_host_parking_provider',
  'final_url_suspicious_content_hub',
  'duplicate_of',
  'stuck_in_progress',
  'missing_specific_tags',
];

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function colLetter(idx) {
  let n = idx + 1;
  let out = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function parseArgs(argv) {
  return {
    apply: argv.includes('--apply=1') || argv.includes('--apply'),
    json: argv.includes('--json'),
  };
}

function appendNote(prev, fragment) {
  const base = String(prev || '').trim();
  const part = String(fragment || '').trim();
  if (!part) return base;
  if (!base) return part;
  if (base.includes(part)) return base;
  return `${base} | ${part}`.slice(0, 50000);
}

function normalizeTitleKey(title) {
  return String(title || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function normalizeUrlKey(url) {
  try {
    const u = new URL(String(url || '').trim());
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const path = u.pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    return `${host}${path.toLowerCase()}`;
  } catch {
    return '';
  }
}

function parseTags(raw) {
  return String(raw || '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function hasSpecificTags(raw) {
  const tags = parseTags(raw);
  if (!tags.length) return false;
  const specific = tags.filter((t) => t !== 'ai' && t !== 'produktivität' && t !== 'productivity');
  return specific.length > 0;
}

function parseTimestampMaybe(value) {
  if (!value) return null;
  const t = Date.parse(String(value).trim());
  if (!Number.isFinite(t)) return null;
  return new Date(t);
}

function extractTimestampFromNotes(notes) {
  const n = String(notes || '');
  const iso = n.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/);
  if (iso) return parseTimestampMaybe(iso[0]);
  const simple = n.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2})?/);
  if (simple) return parseTimestampMaybe(simple[0].replace(' ', 'T') + 'Z');
  return null;
}

function inProgressAgeHours(row, idx) {
  const candidates = [
    'in_progress_at',
    'started_at',
    'updated_at',
    'last_updated',
    'created_at',
    'timestamp',
  ];
  for (const key of candidates) {
    if (!(key in idx)) continue;
    const dt = parseTimestampMaybe(row[idx[key]]);
    if (dt) return (Date.now() - dt.getTime()) / (1000 * 60 * 60);
  }
  const notes = 'notes' in idx ? row[idx.notes] : '';
  const fromNotes = extractTimestampFromNotes(notes);
  if (fromNotes) return (Date.now() - fromNotes.getTime()) / (1000 * 60 * 60);
  return null;
}

function isSelfReference(url) {
  try {
    const u = new URL(String(url || '').trim());
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const path = String(u.pathname || '').toLowerCase();
    if (host === 'tools.utildesk.de' || host.endsWith('.tools.utildesk.de')) return true;
    if (path.includes('/tools/')) return true;
    return false;
  } catch {
    return false;
  }
}

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

function pickReasonTag(reason) {
  for (const key of TRACKED_REASONS) {
    if (reason === key || reason.startsWith(`${key}:`)) return key;
  }
  return reason;
}

function pushSample(samples, reason, row) {
  if (!samples[reason]) samples[reason] = [];
  if (samples[reason].length >= 5) return;
  samples[reason].push({ row: row.rowNumber, slug: row.slug });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sheets = await sheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) {
    console.log(JSON.stringify({ ok: true, note: 'No data rows', checked: 0 }, null, args.json ? 0 : 2));
    return;
  }

  const header = (values[0] || []).map((h) => String(h || '').trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const required = ['status', 'slug', 'topic', 'official_url', 'notes'];
  const missing = required.filter((k) => !(k in idx));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}`);

  const col = {
    status: colLetter(idx.status),
    notes: colLetter(idx.notes),
    official_url: colLetter(idx.official_url),
  };

  const rows = [];
  for (let i = 1; i < values.length; i += 1) {
    const row = values[i] || [];
    const status = String(row[idx.status] || '').trim().toUpperCase();
    if (status !== 'NEW' && status !== 'IN_PROGRESS') continue;

    rows.push({
      rowNumber: i + 1,
      status,
      slug: String(row[idx.slug] || '').trim(),
      topic: String(row[idx.topic] || '').trim(),
      title: String(row[idx.title] || row[idx.topic] || '').trim(),
      official_url: String(row[idx.official_url] || '').trim(),
      notes: String(row[idx.notes] || '').trim(),
      tags: 'tags' in idx ? String(row[idx.tags] || '').trim() : '',
      canonical_slug: 'canonical_slug' in idx ? String(row[idx.canonical_slug] || '').trim() : '',
      internal_tool: 'internal_tool' in idx ? String(row[idx.internal_tool] || '').trim() : '',
      raw: row,
    });
  }

  rows.sort((a, b) => a.rowNumber - b.rowNumber);

  const counters = {
    total_checked_new: rows.filter((r) => r.status === 'NEW').length,
    total_checked_in_progress: rows.filter((r) => r.status === 'IN_PROGRESS').length,
    passed: 0,
    moved_to_needs_review: 0,
    duplicates_found: 0,
    fixed_final_url_count: 0,
  };

  const reasonsBreakdown = {};
  const samplesByReason = {};
  const reasonRows = {
    self_reference: [],
    duplicate_of: [],
    invalid_url: [],
    head_check_failed: [],
    redirected_to_denied_final_host: [],
    redirected_to_parking_or_domain_sale: [],
    final_url_matches_denied_pattern: [],
    final_host_parking_provider: [],
    final_url_suspicious_content_hub: [],
  };

  const evals = [];

  for (const row of rows) {
    const reasons = [];
    const details = [];
    let finalUrl = row.official_url;
    let urlPassed = true;

    const internalTool = /^(1|true|yes|on)$/i.test(String(row.internal_tool || '').trim());

    if (isMissingUrl(finalUrl)) {
      reasons.push('invalid_url:missing_url');
      urlPassed = false;
    }

    if (!internalTool && isSelfReference(finalUrl)) {
      reasons.push('self_reference');
      urlPassed = false;
    }

    if (!isMissingUrl(finalUrl)) {
      const v = validateOfficialUrl(finalUrl, { slug: row.slug, title: row.title || row.topic });
      if (!v.ok) {
        reasons.push(`invalid_url:${v.reason || 'policy_fail'}`);
        urlPassed = false;
      }
    }

    let verified = null;
    if (urlPassed) {
      verified = await resolveFinalUrl(finalUrl, { timeoutMs: 4000, maxRedirects: 5 });
      if (!verified.ok || !verified.finalUrl) {
        reasons.push('head_check_failed');
        urlPassed = false;
      } else {
        finalUrl = String(verified.finalUrl || '').trim();
        const suspicion = classifyFinalUrl({
          originalUrl: row.official_url,
          finalUrl,
          slug: row.slug,
          title: row.title || row.topic,
        });

        if (!internalTool && isSelfReference(finalUrl)) {
          reasons.push('self_reference');
          urlPassed = false;
        }

        if (suspicion.verdict !== 'allow' && suspicion.reasons.length) {
          reasons.push(...suspicion.reasons);
          urlPassed = false;
        }

        const v2 = validateOfficialUrl(finalUrl, { slug: row.slug, title: row.title || row.topic });
        if (!v2.ok) {
          reasons.push(`invalid_url:${v2.reason || 'final_url_policy_fail'}`);
          urlPassed = false;
        }
      }
    }

    const tagsOk = hasSpecificTags(row.tags);
    const inProgressAge = row.status === 'IN_PROGRESS' ? inProgressAgeHours(row.raw, idx) : null;
    const stuckInProgress = row.status === 'IN_PROGRESS' && (inProgressAge === null || inProgressAge >= STUCK_IN_PROGRESS_HOURS);

    if (row.status === 'IN_PROGRESS' && !tagsOk) {
      reasons.push(stuckInProgress ? 'stuck_in_progress' : 'missing_specific_tags');
    }

    evals.push({
      ...row,
      finalUrl,
      urlPassed,
      tagsOk,
      stuckInProgress,
      inProgressAge,
      reasons,
      details,
    });
  }

  const seenUrlKey = new Map();
  const seenCanonicalSlug = new Map();
  const seenTitleKey = new Map();

  for (const item of evals) {
    const alreadyFailed = item.reasons.length > 0;
    if (alreadyFailed) continue;

    const urlKey = normalizeUrlKey(item.finalUrl);
    const canonicalSlugKey = String(item.canonical_slug || '').toLowerCase().trim();
    const titleKey = normalizeTitleKey(item.title || item.topic);

    let duplicateOf = '';

    if (urlKey && seenUrlKey.has(urlKey)) {
      duplicateOf = seenUrlKey.get(urlKey).slug;
    } else if (canonicalSlugKey && seenCanonicalSlug.has(canonicalSlugKey)) {
      duplicateOf = seenCanonicalSlug.get(canonicalSlugKey).slug;
    } else if (titleKey && titleKey.length >= 8 && seenTitleKey.has(titleKey)) {
      duplicateOf = seenTitleKey.get(titleKey).slug;
    }

    if (duplicateOf && duplicateOf !== item.slug) {
      item.reasons.push(`duplicate_of:${duplicateOf}`);
      counters.duplicates_found += 1;
      continue;
    }

    if (urlKey) seenUrlKey.set(urlKey, item);
    if (canonicalSlugKey) seenCanonicalSlug.set(canonicalSlugKey, item);
    if (titleKey && titleKey.length >= 8) seenTitleKey.set(titleKey, item);
  }

  const updates = [];
  const movedRows = [];

  for (const item of evals) {
    const reasonTags = Array.from(new Set(item.reasons.map(pickReasonTag)));
    const failed = reasonTags.length > 0;

    let nextStatus = item.status;
    if (failed) {
      nextStatus = 'NEEDS_REVIEW';
    } else if (item.status === 'IN_PROGRESS' && item.tagsOk && item.urlPassed) {
      nextStatus = 'NEW';
    }

    if (!failed) counters.passed += 1;

    for (const reason of reasonTags) {
      reasonsBreakdown[reason] = (reasonsBreakdown[reason] || 0) + 1;
      pushSample(samplesByReason, reason, item);
      if (reason in reasonRows) reasonRows[reason].push(item.rowNumber);
    }

    if (failed) {
      const note = `qc_blocked:${item.reasons.join(',')}; prev_status=${item.status}`;
      const newNotes = appendNote(item.notes, note);

      movedRows.push({
        row: item.rowNumber,
        slug: item.slug,
        prev_status: item.status,
        next_status: 'NEEDS_REVIEW',
        reasons: item.reasons,
      });

      counters.moved_to_needs_review += 1;

      if (args.apply) {
        updates.push(
          { range: `${SHEET_NAME}!${col.status}${item.rowNumber}`, values: [['NEEDS_REVIEW']] },
          { range: `${SHEET_NAME}!${col.notes}${item.rowNumber}`, values: [[newNotes]] },
        );
      }
    } else {
      if (item.finalUrl && item.finalUrl !== item.official_url) {
        counters.fixed_final_url_count += 1;
        if (args.apply) {
          updates.push({ range: `${SHEET_NAME}!${col.official_url}${item.rowNumber}`, values: [[item.finalUrl]] });
        }
      }

      if (item.status === 'IN_PROGRESS') {
        const newNotes = appendNote(item.notes, 'qc_passed:promote_in_progress_to_new');
        if (args.apply) {
          updates.push(
            { range: `${SHEET_NAME}!${col.status}${item.rowNumber}`, values: [['NEW']] },
            { range: `${SHEET_NAME}!${col.notes}${item.rowNumber}`, values: [[newNotes]] },
          );
        }
      }
    }
  }

  if (args.apply && updates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates,
      },
    });
  }

  const out = {
    ok: true,
    mode: args.apply ? 'apply' : 'dry-run',
    ts: nowIso(),
    ...counters,
    reasons_breakdown: reasonsBreakdown,
    samples: samplesByReason,
    reason_rows: {
      self_reference: reasonRows.self_reference,
      duplicate_of: reasonRows.duplicate_of,
      invalid_url: reasonRows.invalid_url,
      head_check_failed: reasonRows.head_check_failed,
      redirected_to_denied_final_host: reasonRows.redirected_to_denied_final_host,
      redirected_to_parking_or_domain_sale: reasonRows.redirected_to_parking_or_domain_sale,
      final_url_matches_denied_pattern: reasonRows.final_url_matches_denied_pattern,
      final_host_parking_provider: reasonRows.final_host_parking_provider,
      final_url_suspicious_content_hub: reasonRows.final_url_suspicious_content_hub,
    },
    moved_rows_top20: movedRows.slice(0, 20),
    moved_rows_count: movedRows.length,
  };

  if (args.json) {
    console.log(JSON.stringify(out));
  } else {
    console.log(JSON.stringify(out, null, 2));
  }
}

const isDirectRun = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return import.meta.url === pathToFileURL(entry).href;
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  main().catch((e) => {
    console.error(e?.stack || String(e));
    process.exit(1);
  });
}

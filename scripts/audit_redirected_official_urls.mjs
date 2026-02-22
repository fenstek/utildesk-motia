#!/usr/bin/env node
import 'dotenv/config';
import { google } from 'googleapis';
import { pathToFileURL } from 'node:url';

import { resolveFinalUrl } from './lib/http_verify_url.mjs';
import { DENY_HOSTS, isMissingUrl } from './lib/url_policy.mjs';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const SA_JSON_PATH = '/opt/utildesk-motia/secrets/google-service-account.json';

const TARGET_STATUSES = new Set(['DONE', 'NEW', 'IN_PROGRESS']);
const DOT_TECH_HOSTS = new Set(['dot-tech.org', 'www.dot-tech.org']);

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
  const onlyRaw = (argv.find((a) => a.startsWith('--only=')) || '').replace('--only=', '').trim();
  const limitRaw = (argv.find((a) => a.startsWith('--limit=')) || '').replace('--limit=', '').trim();
  return {
    apply: argv.includes('--apply=1') || argv.includes('--apply'),
    json: argv.includes('--json'),
    onlySlugs: onlyRaw ? new Set(onlyRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)) : null,
    limit: limitRaw ? Math.max(1, Math.min(5000, Number(limitRaw) || 0)) : 0,
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

function normalizeHost(host) {
  return String(host || '').trim().toLowerCase().replace(/\.+$/, '');
}

function hostFromUrl(url) {
  try {
    return normalizeHost(new URL(String(url || '').trim()).hostname);
  } catch {
    return '';
  }
}

function isDeniedHost(host) {
  const h = normalizeHost(host);
  if (!h) return false;
  for (const deny of DENY_HOSTS) {
    const d = normalizeHost(deny);
    if (!d) continue;
    if (h === d || h.endsWith(`.${d}`)) return true;
  }
  return false;
}

function pushSample(arr, row, limit = 10) {
  if (arr.length >= limit) return;
  arr.push({
    slug: row.slug,
    row: row.rowNumber,
    official_url: row.official_url,
    finalUrl: row.finalUrl,
  });
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sheets = await sheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) {
    const out = {
      ok: true,
      mode: args.apply ? 'apply' : 'dry-run',
      ts: nowIso(),
      total_checked: 0,
      redirected_to_dot_tech_count: 0,
      redirected_to_dot_tech_samples: [],
      redirected_to_denied_host_count: 0,
      redirected_to_denied_host_samples: [],
      moved_to_needs_review: 0,
      note: 'No data rows',
    };
    console.log(JSON.stringify(out, null, args.json ? 0 : 2));
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
  };

  const rows = [];
  for (let i = 1; i < values.length; i += 1) {
    const row = values[i] || [];
    const status = String(row[idx.status] || '').trim().toUpperCase();
    if (!TARGET_STATUSES.has(status)) continue;

    const slug = String(row[idx.slug] || '').trim();
    const topic = String(row[idx.topic] || '').trim();
    const official_url = String(row[idx.official_url] || '').trim();
    const notes = String(row[idx.notes] || '').trim();

    if (!topic || !slug) continue;
    if (isMissingUrl(official_url)) continue;
    if (args.onlySlugs && !args.onlySlugs.has(slug.toLowerCase())) continue;
    if (args.limit && rows.length >= args.limit) break;

    rows.push({
      rowNumber: i + 1,
      status,
      slug,
      official_url,
      notes,
    });
  }

  const redirectedToDotTech = [];
  const redirectedToDenied = [];
  const flaggedRows = [];

  for (const row of rows) {
    const resolved = await resolveFinalUrl(row.official_url, { timeoutMs: 5000, maxRedirects: 6 });
    if (!resolved.ok || !resolved.finalUrl) continue;

    const sourceHost = hostFromUrl(row.official_url);
    const finalUrl = String(resolved.finalUrl || '').trim();
    const finalHost = hostFromUrl(finalUrl);
    if (!finalHost) continue;

    const item = { ...row, finalUrl, finalHost, sourceHost };

    if (DOT_TECH_HOSTS.has(finalHost)) {
      item.reason = 'redirected_to_dot_tech';
      flaggedRows.push(item);
      pushSample(redirectedToDotTech, item);
      continue;
    }

    if (finalHost !== sourceHost && isDeniedHost(finalHost)) {
      item.reason = 'redirected_to_denied_host';
      flaggedRows.push(item);
      pushSample(redirectedToDenied, item);
    }
  }

  const updates = [];
  if (args.apply) {
    for (const row of flaggedRows) {
      const note = appendNote(
        row.notes,
        `redirect_audit:${row.reason}; final_url=${row.finalUrl}; prev_status=${row.status}`,
      );
      updates.push(
        { range: `${SHEET_NAME}!${col.status}${row.rowNumber}`, values: [['NEEDS_REVIEW']] },
        { range: `${SHEET_NAME}!${col.notes}${row.rowNumber}`, values: [[note]] },
      );
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
    total_checked: rows.length,
    redirected_to_dot_tech_count: flaggedRows.filter((x) => x.reason === 'redirected_to_dot_tech').length,
    redirected_to_dot_tech_samples: redirectedToDotTech,
    redirected_to_denied_host_count: flaggedRows.filter((x) => x.reason === 'redirected_to_denied_host').length,
    redirected_to_denied_host_samples: redirectedToDenied,
    moved_to_needs_review: args.apply ? flaggedRows.length : 0,
  };

  console.log(JSON.stringify(out, null, args.json ? 0 : 2));
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
  main().catch((err) => {
    console.error(err?.stack || String(err));
    process.exit(1);
  });
}

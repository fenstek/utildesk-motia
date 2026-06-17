#!/usr/bin/env node
import 'dotenv/config';
import { google } from 'googleapis';
import { pathToFileURL } from 'node:url';

import { resolveFinalUrl } from './lib/http_verify_url.mjs';
import { isMissingUrl } from './lib/url_policy.mjs';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const SA_JSON_PATH = '/opt/utildesk-motia/secrets/google-service-account.json';

const TARGET_STATUSES = new Set(['DONE', 'NEW', 'IN_PROGRESS']);

// Intentionally empty for now (requested behavior: all colliding rows are moved).
const OFFICIAL_URL_ALLOWLIST = new Set([]);

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
  const limitArg = (argv.find((a) => a.startsWith('--limit=')) || '').replace('--limit=', '').trim();
  const onlyRaw = (argv.find((a) => a.startsWith('--only=')) || '').replace('--only=', '').trim();
  return {
    apply: argv.includes('--apply=1') || argv.includes('--apply'),
    json: argv.includes('--json'),
    limit: limitArg ? Math.max(1, Math.min(10000, Number(limitArg) || 0)) : 0,
    onlySlugs: onlyRaw ? new Set(onlyRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)) : null,
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

function normalizeOfficialUrlForAllowlist(url) {
  try {
    const u = new URL(String(url || '').trim());
    const host = u.hostname.toLowerCase().replace(/\.+$/, '');
    const path = u.pathname.replace(/\/+/g, '/');
    const cleanPath = path === '/' ? '/' : path.replace(/\/$/, '');
    return `${u.protocol}//${host}${cleanPath}`.toLowerCase();
  } catch {
    return '';
  }
}

function normalizeFinalUrl(url) {
  try {
    const u = new URL(String(url || '').trim());
    const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/\.+$/, '');
    const path = u.pathname.replace(/\/+/g, '/');
    const cleanPath = path === '/' ? '/' : path.replace(/\/$/, '');
    const params = new URLSearchParams(u.search || '');
    const kept = [];
    for (const [k, v] of params.entries()) {
      const key = k.toLowerCase();
      if (key.startsWith('utm_') || key === 'gclid' || key === 'fbclid') continue;
      kept.push([k, v]);
    }
    kept.sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])));
    const q = kept.length
      ? `?${kept.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`
      : '';
    return `${u.protocol}//${host}${cleanPath}${q}`.toLowerCase();
  } catch {
    return '';
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sheets = await sheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) {
    console.log(JSON.stringify({
      ok: true,
      mode: args.apply ? 'apply' : 'dry-run',
      ts: nowIso(),
      total_checked: 0,
      collisions_count: 0,
      top_collisions: [],
      moved_to_needs_review: 0,
      note: 'No data rows',
    }, null, args.json ? 0 : 2));
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
    if (!slug) continue;
    if (args.onlySlugs && !args.onlySlugs.has(slug.toLowerCase())) continue;

    const official_url = String(row[idx.official_url] || '').trim();
    if (isMissingUrl(official_url)) continue;
    if (args.limit && rows.length >= args.limit) break;

    rows.push({
      rowNumber: i + 1,
      slug,
      status,
      official_url,
      notes: String(row[idx.notes] || '').trim(),
    });
  }

  const byFinal = new Map();
  for (const row of rows) {
    const verified = await resolveFinalUrl(row.official_url, { timeoutMs: 5000, maxRedirects: 6 });
    if (!verified.ok || !verified.finalUrl) continue;

    const normalized = normalizeFinalUrl(verified.finalUrl);
    if (!normalized) continue;

    if (!byFinal.has(normalized)) byFinal.set(normalized, []);
    byFinal.get(normalized).push({
      row: row.rowNumber,
      slug: row.slug,
      status: row.status,
      official_url: row.official_url,
      finalUrl: String(verified.finalUrl || '').trim(),
      normalized_final_url: normalized,
      notes: row.notes,
    });
  }

  const collisions = Array.from(byFinal.entries())
    .filter(([, group]) => group.length >= 2)
    .map(([normalizedFinalUrl, group]) => ({
      reason: 'finalurl_collision',
      normalized_final_url: normalizedFinalUrl,
      size: group.length,
      rows: group.sort((a, b) => a.row - b.row).map((x) => ({
        row: x.row,
        slug: x.slug,
        status: x.status,
        official_url: x.official_url,
        finalUrl: x.finalUrl,
      })),
    }))
    .sort((a, b) => b.size - a.size || a.normalized_final_url.localeCompare(b.normalized_final_url));

  const updates = [];
  let moved = 0;
  if (args.apply) {
    for (const c of collisions) {
      for (const item of c.rows) {
        const allowKey = normalizeOfficialUrlForAllowlist(item.official_url);
        if (OFFICIAL_URL_ALLOWLIST.has(allowKey)) continue;
        moved += 1;
        const note = appendNote(
          item.notes,
          `collision_audit:finalurl_collision; normalized_final_url=${c.normalized_final_url}; final_url=${item.finalUrl}; prev_status=${item.status}`,
        );
        updates.push(
          { range: `${SHEET_NAME}!${col.status}${item.row}`, values: [['NEEDS_REVIEW']] },
          { range: `${SHEET_NAME}!${col.notes}${item.row}`, values: [[note]] },
        );
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
    total_checked: rows.length,
    collisions_count: collisions.length,
    top_collisions: collisions.slice(0, 10),
    moved_to_needs_review: args.apply ? moved : 0,
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

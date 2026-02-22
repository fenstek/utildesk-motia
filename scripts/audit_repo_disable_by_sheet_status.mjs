#!/usr/bin/env node
/**
 * Disable published tool markdown files based on Sheet status.
 *
 * Rule:
 *   if content/tools/<slug>.md exists (non-underscore file)
 *   and Sheet status for slug is NEEDS_REVIEW / ERROR / BLACKLIST
 *   then file should be disabled as content/tools/_<slug>.md
 *
 * Dry-run by default.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';
import { pathToFileURL } from 'node:url';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const SA_JSON_PATH = '/opt/utildesk-motia/secrets/google-service-account.json';
const CONTENT_DIR = path.resolve(process.cwd(), 'content/tools');

const DISABLE_STATUSES = new Set(['NEEDS_REVIEW', 'ERROR', 'BLACKLIST']);

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function parseArgs(argv) {
  return {
    apply: argv.includes('--apply=1') || argv.includes('--apply'),
    json: argv.includes('--json'),
  };
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

async function loadSheetStatusMap() {
  const sheets = await sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) return new Map();

  const header = (values[0] || []).map((h) => String(h || '').trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  if (!('slug' in idx) || !('status' in idx)) {
    throw new Error('Missing required Sheet columns: slug/status');
  }

  const map = new Map();
  for (let i = 1; i < values.length; i += 1) {
    const row = values[i] || [];
    const slug = String(row[idx.slug] || '').trim().toLowerCase();
    if (!slug) continue;
    const status = String(row[idx.status] || '').trim().toUpperCase();
    map.set(slug, { status, row_index: i + 1 });
  }
  return map;
}

function scanRepoToolFiles() {
  if (!fs.existsSync(CONTENT_DIR)) throw new Error(`content dir not found: ${CONTENT_DIR}`);
  const entries = fs.readdirSync(CONTENT_DIR);
  return entries
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((file) => ({
      file,
      slug: file.replace(/\.md$/, '').toLowerCase(),
      fullPath: path.join(CONTENT_DIR, file),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.apply ? 'apply' : 'dry-run';

  const sheetMap = await loadSheetStatusMap();
  const files = scanRepoToolFiles();

  let matchedInSheet = 0;
  const planned = [];
  let disabledCount = 0;

  for (const file of files) {
    const sheet = sheetMap.get(file.slug);
    if (!sheet) continue;
    matchedInSheet += 1;
    if (!DISABLE_STATUSES.has(sheet.status)) continue;

    const targetPath = path.join(CONTENT_DIR, `_${file.slug}.md`);
    const plan = {
      slug: file.slug,
      row_index: sheet.row_index,
      status: sheet.status,
      from: path.relative(process.cwd(), file.fullPath),
      to: path.relative(process.cwd(), targetPath),
      action: 'planned_rename',
    };
    planned.push(plan);

    if (args.apply) {
      if (!fs.existsSync(file.fullPath)) continue;
      if (fs.existsSync(targetPath)) {
        // Target already exists; skip destructive overwrite.
        continue;
      }
      fs.renameSync(file.fullPath, targetPath);
      disabledCount += 1;
    }
  }

  const out = {
    ok: true,
    mode,
    ts: nowIso(),
    scanned_files: files.length,
    matched_in_sheet: matchedInSheet,
    planned_disable_count: planned.length,
    disabled_count: args.apply ? disabledCount : 0,
    samples: planned.slice(0, 20),
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
  main().catch((err) => {
    console.error(err?.stack || String(err));
    process.exit(1);
  });
}

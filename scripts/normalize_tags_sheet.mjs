#!/usr/bin/env node

import 'dotenv/config';
import { google } from 'googleapis';
import { enrichTagsIfGeneric, hasGenericTags, normalizeTagSet } from './lib/tag_enricher_gpt.mjs';
import { normalizeTags } from './lib/tag_policy.mjs';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const SA_JSON_PATH = '/opt/utildesk-motia/secrets/google-service-account.json';

function die(msg) {
  console.error(`\n[ERROR] ${msg}\n`);
  process.exit(1);
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
    apply: argv.includes('--apply') || argv.includes('--apply=1'),
    json: argv.includes('--json'),
    gpt: argv.includes('--gpt') || argv.includes('--gpt=1'),
    limit: Math.max(0, Number((argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || 0) || 0),
  };
}

async function sheetsClient() {
  if (!SPREADSHEET_ID) die('Missing SPREADSHEET_ID');
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

function splitTags(raw) {
  return String(raw || '')
    .split(/[;,]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

async function maybeRefineWithGpt(row, tags, enabled) {
  if (!enabled) return { tags, usedGpt: false };
  if (tags.length === 0) return { tags, usedGpt: false };

  const refined = await enrichTagsIfGeneric({
    title: row.topic || row.title || '',
    short_hint: row.category || '',
    description: row.notes || '',
    tags,
    official_url: row.official_url || '',
  });

  if (!refined.ok || !Array.isArray(refined.tags) || refined.tags.length === 0) {
    return { tags, usedGpt: false };
  }

  return {
    tags: normalizeTagSet(refined.tags),
    usedGpt: true,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sheets = await sheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) die('Sheet has no data rows');

  const header = (values[0] || []).map((h) => String(h || '').trim().toLowerCase());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  for (const required of ['slug', 'topic', 'tags']) {
    if (!(required in idx)) die(`Missing column: ${required}`);
  }

  const tagsLetter = colLetter(idx.tags);
  const notesLetter = 'notes' in idx ? colLetter(idx.notes) : null;
  const updates = [];
  const changes = [];
  let touched = 0;

  for (let i = 1; i < values.length; i += 1) {
    if (args.limit && touched >= args.limit) break;

    const row = values[i] || [];
    const rowNumber = i + 1;
    const slug = String(row[idx.slug] || '').trim();
    const topic = String(row[idx.topic] || '').trim();
    const category = 'category' in idx ? String(row[idx.category] || '').trim() : '';
    const notes = 'notes' in idx ? String(row[idx.notes] || '').trim() : '';
    const officialUrl = 'official_url' in idx ? String(row[idx.official_url] || '').trim() : '';
    const rawTags = String(row[idx.tags] || '').trim();
    if (!slug || !rawTags) continue;

    const parsed = splitTags(rawTags);
    const normalized = normalizeTags(parsed, { maxTags: 5, preserveUnknown: true });
    let nextTags = normalized.tags;
    let note = '';

    if (args.gpt && (normalized.unresolved.length > 0 || hasGenericTags(nextTags))) {
      const gptResult = await maybeRefineWithGpt(
        { slug, topic, category, notes, official_url: officialUrl },
        nextTags,
        true
      );
      nextTags = gptResult.tags;
      if (gptResult.usedGpt) note = 'tags_refined:gpt';
    }

    const currentCsv = parsed.join(',');
    const nextCsv = nextTags.join(',');
    if (currentCsv === nextCsv) continue;

    touched += 1;
    changes.push({ row: rowNumber, slug, before: currentCsv, after: nextCsv, unresolved: normalized.unresolved });
    updates.push({ range: `${SHEET_NAME}!${tagsLetter}${rowNumber}`, values: [[nextCsv]] });

    if (note && notesLetter) {
      updates.push({
        range: `${SHEET_NAME}!${notesLetter}${rowNumber}`,
        values: [[notes ? `${notes} | ${note}` : note]],
      });
    }
  }

  const result = {
    ok: true,
    apply: args.apply,
    gpt: args.gpt,
    changed: changes.length,
    sample: changes.slice(0, 20),
  };

  if (!args.apply) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: updates },
    });
  }

  console.log(JSON.stringify({ ...result, applied_updates: updates.length }, null, 2));
}

main().catch((err) => {
  console.error(`ERROR: ${err?.stack || err?.message || String(err)}`);
  process.exit(1);
});

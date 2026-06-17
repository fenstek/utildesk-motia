#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';
import { enrichTagsIfGeneric, hasGenericTags } from './lib/tag_enricher_gpt.mjs';
import { normalizeTags } from './lib/tag_policy.mjs';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const CONTENT_DIR = process.env.CONTENT_DIR || 'content/tools';

function die(msg){ console.error(`\n[ERROR] ${msg}\n`); process.exit(1); }

function parseArgs(argv) {
  return {
    apply: argv.includes('--apply') || argv.includes('--apply=1'),
    json: argv.includes('--json') || argv.includes('--json=1'),
    gpt: argv.includes('--gpt') || argv.includes('--gpt=1'),
    limit: Math.max(0, Number((argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || 0) || 0),
  };
}

async function sheetsClient(){
  if(!SPREADSHEET_ID) die('Missing SPREADSHEET_ID');
  if(!GOOGLE_CLIENT_EMAIL) die('Missing GOOGLE_CLIENT_EMAIL');
  if(!GOOGLE_PRIVATE_KEY) die('Missing GOOGLE_PRIVATE_KEY');
  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version:'v4', auth });
}

function parseFrontmatter(md){
  if(!md.startsWith('---\n')) return null;
  const end = md.indexOf('\n---\n', 4);
  if(end === -1) return null;
  const fm = md.slice(4, end);          // inside frontmatter
  const body = md.slice(end + 5);       // after "\n---\n"
  return { fm, body, endIndex: end };
}

function parseTagsFromFrontmatter(fm) {
  const lines = String(fm || '').split('\n');
  const idx = lines.findIndex((l) => /^\s*tags\s*:/.test(l));
  if (idx < 0) return [];

  const line = lines[idx];
  const inline = line.match(/^\s*tags\s*:\s*(.*)\s*$/);
  const rawInline = String(inline?.[1] || '').trim();
  if (rawInline && rawInline !== '[]' && rawInline !== '""' && rawInline !== "''") {
    if (/^\[.*\]$/.test(rawInline)) {
      const inner = rawInline.replace(/^\[/, '').replace(/\]$/, '');
      return inner
        .split(',')
        .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    }
    return rawInline
      .split(/[;,]/)
      .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  const out = [];
  for (let i = idx + 1; i < lines.length; i += 1) {
    const next = lines[i];
    if (/^\s*[A-Za-z0-9_-]+\s*:/.test(next)) break;
    const m = next.match(/^\s*-\s*(.+?)\s*$/);
    if (m?.[1]) out.push(m[1].replace(/^['"]|['"]$/g, ''));
  }
  return out;
}

function injectOrReplaceTags(fm, tagsArr){
  // Remove existing tags block (single-line or multi-line) then insert normalized one.
  const lines = fm.split('\n');

  // find tags key line
  let start = lines.findIndex(l => /^\s*tags\s*:/.test(l));
  if(start >= 0){
    // delete tags line and subsequent list items if multiline
    const isJustKey = /^\s*tags\s*:\s*$/.test(lines[start]);
    lines.splice(start, 1);
    if(isJustKey){
      while(start < lines.length){
        const l = lines[start];
        if(/^\s*-\s*/.test(l)) { lines.splice(start,1); continue; }
        if(/^\s*$/.test(l)) { lines.splice(start,1); continue; }
        if(/^\s*[A-Za-z0-9_-]+\s*:/.test(l)) break;
        break;
      }
    }
  }

  // choose insertion point: after price_model if exists, else after category if exists, else after slug/title, else at top.
  const keyOrder = ['price_model','category','title','slug'];
  let insertAt = 0;
  for(const key of keyOrder){
    const idx = lines.findIndex(l => new RegExp(`^\\s*${key}\\s*:`).test(l));
    if(idx >= 0){ insertAt = idx + 1; break; }
  }

  const normalized = `tags: [${tagsArr.map(t => JSON.stringify(t)).join(', ')}]`;
  lines.splice(insertAt, 0, normalized);

  // trim extra blank lines at start/end
  while(lines.length && lines[0].trim()==='') lines.shift();
  while(lines.length && lines[lines.length-1].trim()==='') lines.pop();

  return lines.join('\n');
}

function normalizeSheetTags(tags) {
  const parsed = normalizeTags(tags, { maxTags: 5, preserveUnknown: true });
  return parsed;
}

async function loadSheetRows(){
  const sheets = await sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });
  const values = res.data.values || [];
  if(values.length < 2) return new Map();

  const header = (values[0] || []).map(h => String(h||'').trim());
  const idx = Object.fromEntries(header.map((h,i)=>[h,i]));
  if(idx.slug === undefined) die('Header missing column: slug');
  if(idx.tags === undefined) die('Header missing column: tags');

  const map = new Map(); // slug -> row data
  for(let r=1; r<values.length; r++){
    const row = values[r] || [];
    const slug = String(row[idx.slug] || '').trim();
    const tags = String(row[idx.tags] || '').trim();
    if(!slug || !tags) continue;
    map.set(slug, {
      slug,
      topic: 'topic' in idx ? String(row[idx.topic] || '').trim() : '',
      category: 'category' in idx ? String(row[idx.category] || '').trim() : '',
      notes: 'notes' in idx ? String(row[idx.notes] || '').trim() : '',
      official_url: 'official_url' in idx ? String(row[idx.official_url] || '').trim() : '',
      tags: tags.split(',').map(x=>x.trim()).filter(Boolean).slice(0, 20),
    });
  }
  return map;
}

async function main(){
  const args = parseArgs(process.argv.slice(2));

  const sheetRows = await loadSheetRows();
  if(sheetRows.size === 0){
    console.log(JSON.stringify({ ok:true, apply: args.apply, changed:0, note:'No tags found in sheet map' }, null, 2));
    return;
  }

  const dir = path.resolve(CONTENT_DIR);
  if(!fs.existsSync(dir)) die(`Content dir not found: ${dir}`);

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const changes = [];
  let skippedNoFm = 0, skippedNoSheetTags = 0, skippedEmptyNormalizedTags = 0;
  let touched = 0;

  for(const f of files){
    if (args.limit && touched >= args.limit) break;
    const fp = path.join(dir, f);
    const slugFromFile = path.basename(f, '.md');
    const md = fs.readFileSync(fp, 'utf8');
    const fmObj = parseFrontmatter(md);
    if(!fmObj){ skippedNoFm++; continue; }

    const sheetRow = sheetRows.get(slugFromFile);
    if(!sheetRow){ skippedNoSheetTags++; continue; }

    const currentTags = normalizeTags(parseTagsFromFrontmatter(fmObj.fm), { maxTags: 5, preserveUnknown: true }).tags;
    const sheetNormalized = normalizeSheetTags(sheetRow.tags, sheetRow).tags;
    let nextTags = [...sheetNormalized];

    if (args.gpt && (hasGenericTags(nextTags) || nextTags.length === 0)) {
      const gptResult = await enrichTagsIfGeneric({
        title: sheetRow.topic || slugFromFile,
        short_hint: sheetRow.category || '',
        description: sheetRow.notes || '',
        tags: nextTags,
        official_url: sheetRow.official_url || '',
      });
      if (gptResult.ok && Array.isArray(gptResult.tags) && gptResult.tags.length > 0) {
        nextTags = normalizeTags(gptResult.tags, { maxTags: 5, preserveUnknown: false }).tags;
      }
    }

    nextTags = normalizeTags(nextTags, { maxTags: 5, preserveUnknown: false }).tags;
    if (nextTags.length === 0) {
      skippedEmptyNormalizedTags += 1;
      continue;
    }

    const currentCsv = currentTags.join(',');
    const nextCsv = nextTags.join(',');
    if (currentCsv === nextCsv) continue;

    const newFm = injectOrReplaceTags(fmObj.fm, nextTags);
    const outMd = `---\n${newFm}\n---\n${fmObj.body.replace(/^\n+/, '\n')}`;
    changes.push({ file: fp, slug: slugFromFile, before: currentCsv, after: nextCsv, sheet: sheetNormalized.join(','), gpt: args.gpt && currentCsv !== nextCsv && (hasGenericTags(sheetNormalized) || sheetNormalized.length === 0) });
    touched += 1;

    if(args.apply){
      fs.writeFileSync(fp, outMd, 'utf8');
    }
  }

  const result = {
    ok:true,
    apply: args.apply,
    gpt: args.gpt,
    total_md: files.length,
    would_change: changes.length,
    changed: args.apply ? changes.length : 0,
    skipped: {
      no_frontmatter: skippedNoFm,
      no_sheet_tags_for_slug: skippedNoSheetTags,
      empty_normalized_tags: skippedEmptyNormalizedTags,
    },
    sample: changes.slice(0, 10),
    hint: args.apply ? undefined : "Run with: node scripts/backfill_md_tags_from_sheet.mjs --apply"
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch(e=>die(e.stack||String(e)));

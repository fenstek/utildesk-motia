#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const CONTENT_DIR = process.env.CONTENT_DIR || 'content/tools';

function die(msg){ console.error(`\n[ERROR] ${msg}\n`); process.exit(1); }

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

function hasNonEmptyTags(fm){
  // tags: [a,b] OR tags:\n  - a
  const m = fm.match(/^\s*tags\s*:\s*(.*)\s*$/m);
  if(!m) return false;
  const rest = (m[1] || '').trim();
  if(rest && rest !== '[]' && rest !== '""' && rest !== "''") return true;

  // multiline list
  const lines = fm.split('\n');
  const idx = lines.findIndex(l => /^\s*tags\s*:\s*$/.test(l));
  if(idx >= 0){
    for(let i=idx+1;i<lines.length;i++){
      const line = lines[i];
      if(/^\s*[A-Za-z0-9_-]+\s*:/.test(line)) break; // next key
      if(/^\s*-\s*\S+/.test(line)) return true;
    }
  }
  return false;
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

async function loadSheetTags(){
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

  const map = new Map(); // slug -> tagsArr
  for(let r=1; r<values.length; r++){
    const row = values[r] || [];
    const slug = String(row[idx.slug] || '').trim();
    const tags = String(row[idx.tags] || '').trim();
    if(!slug || !tags) continue;
    const arr = tags.split(',').map(x=>x.trim()).filter(Boolean).slice(0, 20);
    if(arr.length) map.set(slug, arr);
  }
  return map;
}

async function main(){
  const apply = process.argv.includes('--apply');

  const sheetTags = await loadSheetTags();
  if(sheetTags.size === 0){
    console.log(JSON.stringify({ ok:true, apply, changed:0, note:'No tags found in sheet map' }, null, 2));
    return;
  }

  const dir = path.resolve(CONTENT_DIR);
  if(!fs.existsSync(dir)) die(`Content dir not found: ${dir}`);

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  let would = [];
  let skippedNoFm = 0, skippedHasTags = 0, skippedNoSheetTags = 0;

  for(const f of files){
    const fp = path.join(dir, f);
    const slugFromFile = path.basename(f, '.md');
    const md = fs.readFileSync(fp, 'utf8');
    const fmObj = parseFrontmatter(md);
    if(!fmObj){ skippedNoFm++; continue; }

    if(hasNonEmptyTags(fmObj.fm)){ skippedHasTags++; continue; }

    const tagsArr = sheetTags.get(slugFromFile);
    if(!tagsArr){ skippedNoSheetTags++; continue; }

    const newFm = injectOrReplaceTags(fmObj.fm, tagsArr);
    const outMd = `---\n${newFm}\n---\n${fmObj.body.replace(/^\n+/, '\n')}`;
    would.push({ file: fp, slug: slugFromFile, tags: tagsArr });

    if(apply){
      fs.writeFileSync(fp, outMd, 'utf8');
    }
  }

  const result = {
    ok:true,
    apply,
    total_md: files.length,
    would_change: would.length,
    changed: apply ? would.length : 0,
    skipped: { no_frontmatter: skippedNoFm, already_has_tags: skippedHasTags, no_sheet_tags_for_slug: skippedNoSheetTags },
    sample: would.slice(0, 10),
    hint: apply ? undefined : "Run with: node scripts/backfill_md_tags_from_sheet.mjs --apply"
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch(e=>die(e.stack||String(e)));

#!/usr/bin/env node
import 'dotenv/config';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

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

function colLetter(idx){ // 0->A
  let n = idx + 1, s = '';
  while(n > 0){
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function buildTags(topic, category){
  const out = new Set();
  out.add('ai');
  if(category) out.add(String(category).toLowerCase());

  const t = String(topic || '').toLowerCase();

  // common signals
  if (t.includes('chat') || t.includes('assistant') || t.includes('bot')) out.add('chatbot');
  if (t.includes('gpt') || t.includes('llm')) out.add('llm');

  // modalities
  if (t.includes('image') || t.includes('photo') || t.includes('midjourney') || t.includes('stable')) out.add('image');
  if (t.includes('video')) out.add('video');
  if (t.includes('audio') || t.includes('voice') || t.includes('speech') || t.includes('tts')) out.add('audio');

  // dev / automation
  if (t.includes('code') || t.includes('dev') || t.includes('github') || t.includes('api') || t.includes('sdk')) out.add('devtools');
  if (t.includes('workflow') || t.includes('automation') || t.includes('n8n') || t.includes('zapier')) out.add('automation');

  // writing / productivity / design
  if (t.includes('write') || t.includes('writer') || t.includes('copy') || t.includes('text')) out.add('writing');
  if (t.includes('productivity') || t.includes('notes') || t.includes('docs')) out.add('productivity');
  if (t.includes('design') || t.includes('ui') || t.includes('ux') || t.includes('figma')) out.add('design');

  return Array.from(out).filter(Boolean).slice(0, 12).join(',');
}

async function main(){
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply');

  const sheets = await sheetsClient();

  const range = `${SHEET_NAME}!A1:Z`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
  const values = res.data.values || [];
  if(values.length < 2) die('Sheet has no data rows');

  const header = (values[0] || []).map(h => String(h||'').trim());
  const idx = Object.fromEntries(header.map((h,i)=>[h,i]));

  const need = ['topic','category','tags'];
  const missing = need.filter(k => !(k in idx));
  if(missing.length) die(`Missing columns in header: ${missing.join(', ')}`);

  const tagsCol = idx.tags; // we will update ONLY this column
  const tagsLetter = colLetter(tagsCol);

  const updates = [];
  let candidates = 0;

  for(let i=1; i<values.length; i++){
    const row = values[i] || [];
    const topic = String(row[idx.topic] || '').trim();
    const category = String(row[idx.category] || '').trim();
    const tags = String(row[idx.tags] || '').trim();

    if(!topic) continue;            // skip empty rows
    if(tags) continue;              // already has tags -> don't touch

    const newTags = buildTags(topic, category);
    if(!newTags) continue;

    const rowNumber = i + 1; // sheet is 1-indexed; i=1 => row 2
    candidates++;

    updates.push({
      range: `${SHEET_NAME}!${tagsLetter}${rowNumber}`,
      values: [[newTags]],
    });
  }

  if(!updates.length){
    console.log(JSON.stringify({ ok:true, apply, updated:0, candidates, note:'No missing tags found' }, null, 2));
    return;
  }

  if(!apply){
    console.log(JSON.stringify({
      ok:true,
      apply:false,
      would_update: updates.length,
      sample: updates.slice(0, 10),
      hint: "Run with: node scripts/backfill_tags_missing_v2.mjs --apply"
    }, null, 2));
    return;
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption:'RAW', data: updates },
  });

  console.log(JSON.stringify({ ok:true, apply:true, updated: updates.length }, null, 2));
}

main().catch(e=>die(e.stack||String(e)));

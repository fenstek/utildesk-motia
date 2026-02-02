#!/usr/bin/env node

import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const MIN_SITELINKS = Number(process.env.WIKIDATA_MIN_SITELINKS || 1);
const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 8000);

function die(msg){ console.error(`\n[ERROR] ${msg}\n`); process.exit(1); }

function slugify(s) {
  return String(s || '')
    .toLowerCase().trim()
    .replace(/&/g,' and ')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,64);
}
function hostname(u){
  try { return new URL(u).hostname.replace(/^www\./,'').toLowerCase(); }
  catch { return ''; }
}
async function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally { clearTimeout(t); }
}

async function sheetsClient(){
  if(!SPREADSHEET_ID) die('Missing SPREADSHEET_ID');
  if(!GOOGLE_CLIENT_EMAIL) die('Missing GOOGLE_CLIENT_EMAIL');
  if(!GOOGLE_PRIVATE_KEY) die('Missing GOOGLE_PRIVATE_KEY');
  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version:'v4', auth });
}

async function readExisting(){
  const sheets = await sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:P`,
  });
  const rows = res.data.values || [];
  if(!rows.length) die('Empty sheet');
  const header = rows[0].map(x=>String(x||'').trim().toLowerCase());
  const idx = Object.fromEntries(header.map((h,i)=>[h,i]));
  for(const k of ['topic','slug','wikidata_id']) if(!(k in idx)) die(`Missing column: ${k}`);

  const existingTopic = new Set();
  const existingSlug = new Set();
  const existingQ = new Set();
  const existingHost = new Set();

  for(const r of rows.slice(1)){
    const t = String(r[idx.topic]||'').trim().toLowerCase();
    const s = String(r[idx.slug]||'').trim().toLowerCase();
    const q = String(r[idx.wikidata_id]||'').trim().toUpperCase();
    const ou = ('official_url' in idx) ? String(r[idx.official_url]||'').trim() : '';
    const hk = hostname(ou);
    if(t) existingTopic.add(t);
    if(s) existingSlug.add(s);
    if(q) existingQ.add(q);
    if(hk) existingHost.add(hk);
  }
  return { existingTopic, existingSlug, existingQ, existingHost };
}

async function wikidataSearch(name, limit=8){
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.searchParams.set('action','wbsearchentities');
  url.searchParams.set('search', name);
  url.searchParams.set('language','en');
  url.searchParams.set('format','json');
  url.searchParams.set('limit', String(limit));
  const r = await fetchWithTimeout(url, { headers:{'user-agent':'utildesk-motia/1.0'} });
  if(!r.ok) return [];
  const j = await r.json();
  return (j?.search||[]).map(x=>({id:x.id,label:x.label,description:x.description||''}));
}

async function wikidataEntity(qid){
  const r = await fetchWithTimeout(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, { headers:{'user-agent':'utildesk-motia/1.0'} });
  if(!r.ok) return null;
  const j = await r.json();
  return j?.entities?.[qid] || null;
}

function officialUrl(ent){
  const v = ent?.claims?.P856?.[0]?.mainsnak?.datavalue?.value;
  return v ? String(v).trim() : '';
}
function sitelinks(ent){ return ent?.sitelinks ? Object.keys(ent.sitelinks).length : 0; }
function wiki(ent, lang){
  const title = ent?.sitelinks?.[`${lang}wiki`]?.title;
  return title ? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g,'_'))}` : '';
}

async function pickWikidata(name){
  const results = await wikidataSearch(name, 10);
  if(!results.length) return null;

  let best = null;
  for(const r of results){
    const ent = await wikidataEntity(r.id);
    if(!ent) continue;
    const off = officialUrl(ent);
    if(!off) continue;
    const sl = sitelinks(ent);
    if(sl < MIN_SITELINKS) continue;

    // prefer items with many sitelinks
    const score = sl;
    if(!best || score > best.score){
      best = {
        score,
        wikidata_id: r.id,
        wikidata_desc: r.description || (ent?.descriptions?.en?.value||''),
        official_url: off,
        wikipedia_de: wiki(ent,'de'),
        wikipedia_en: wiki(ent,'en'),
        wikidata_sitelinks: String(sl),
      };
    }
  }
  return best;
}

function categoryFallback(name){
  if (/(copilot|cursor|codeium|tabnine|replit)/i.test(name)) return 'Developer';
  if (/(midjourney|dall|stable diffusion|firefly|canva|leonardo)/i.test(name)) return 'Design';
  if (/(runway|pika|luma|synthesia|heygen|opus)/i.test(name)) return 'Video';
  if (/(elevenlabs|otter|krisp|suno|udio|whisper)/i.test(name)) return 'Audio';
  if (/(deepl|grammarly|jasper|copy\.ai|writesonic|quillbot|notion)/i.test(name)) return 'Produktivität';
  return 'AI';
}

async function main(){
  const WANT = [
    { name: 'Claude', url: 'https://www.claude.ai' },
    { name: 'Pika', url: 'https://www.pik.ai' },
    { name: 'Notion AI', url: 'https://www.notion.so/product/ai' },
    { name: 'Copy.ai', url: 'https://www.copy.ai' }
  ];

  const { existingTopic, existingSlug, existingQ, existingHost } = await readExisting();

  const rows = [];
  for(const { name, url } of WANT){
    const topic = name.trim();
    const tKey = topic.toLowerCase();
    const slug = slugify(topic);

    if(existingTopic.has(tKey) || existingSlug.has(slug)) {
      console.error(`[skip] already exists: ${topic}`);
      continue;
    }

    const category = categoryFallback(topic);

    rows.push([
      topic,                 // A topic
      slug,                  // B slug
      category,              // C category
      '',                    // D tags
      'freemium',            // E price_model
      '',                    // F affiliate_url
      'NEW',                 // G status
      `manual_add url=${url}`.trim(), // H notes
      '',                    // I title
      '',                    // J short_hint
      url,                   // K official_url
      '',                    // L brand_assets_url
      '',                    // M wikidata_id
      '',                    // N wikipedia_de
      '',                    // O wikipedia_en
      '',                    // P wikidata_sitelinks
    ]);
  }

  if(!rows.length) die('Nothing to add (all skipped).');

  const payload = JSON.stringify({ rows });
  const out = spawnSync('node', ['scripts/sheet_write_rows_strict_AP_v2.mjs'], {
    input: payload,
    encoding: 'utf8',
    cwd: process.cwd(),
  });
  if(out.status !== 0) die(out.stderr || out.stdout || 'writer failed');

  console.log(JSON.stringify({ ok:true, added: rows.length, writer: JSON.parse(out.stdout) }, null, 2));
}

main().catch(e=>die(e.stack||String(e)));

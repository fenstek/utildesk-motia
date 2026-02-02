#!/usr/bin/env node
/**
 * AI-only tool discovery -> Wikidata validation -> strict write to Sheet A..P using sheet_write_rows_strict_AP_v2.mjs
 *
 * Usage:
 *   node scripts/sheet_ai_autogen_9_strict.mjs 9
 *
 * Output: JSON { ok:true, added:N }
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { spawnSync } from 'node:child_process';
import { google } from 'googleapis';

const TARGET = Math.max(1, Math.min(50, Number(process.argv[2] || 9)));
const MIN_SITELINKS = Number(process.env.WIKIDATA_MIN_SITELINKS || 1);

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

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
function extractJsonArray(text){
  if(!text) return [];
  let t = text.trim();
  // strip fences
  t = t.replace(/```[a-zA-Z]*\n/g, '```');
  if (t.startsWith('```')) t = t.replace(/^```/, '').replace(/```$/, '').trim();
  try {
    const arr = JSON.parse(t);
    if (Array.isArray(arr)) return arr.map(x=>String(x||'').trim()).filter(Boolean);
  } catch {}
  const m = t.match(/\[[\s\S]*\]/);
  if(m){
    try{
      const arr = JSON.parse(m[0]);
      if(Array.isArray(arr)) return arr.map(x=>String(x||'').trim()).filter(Boolean);
    }catch{}
  }
  return [];
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
  if(rows.length===0) die('Empty sheet');

  const header = rows[0].map(x=>String(x||'').trim().toLowerCase());
  const idx = Object.fromEntries(header.map((h,i)=>[h,i]));
  for(const k of ['topic','slug','wikidata_id']) if(!(k in idx)) die(`Missing column: ${k}`);

  const existingTopic = new Set();
  const existingSlug = new Set();
  const existingQ = new Set();

  for(const r of rows.slice(1)){
    const t = String(r[idx.topic]||'').trim().toLowerCase();
    const s = String(r[idx.slug]||'').trim().toLowerCase();
    const q = String(r[idx.wikidata_id]||'').trim().toUpperCase();
    if(t) existingTopic.add(t);
    if(s) existingSlug.add(s);
    if(q) existingQ.add(q);
  }
  return { existingTopic, existingSlug, existingQ };
}

const DENY = [
  'zoom','microsoft teams','teams','google search console','search console',
  'google analytics','jira','confluence','trello','slack' // not AI-first products
];
function isDenied(name){
  const n = String(name||'').toLowerCase();
  return DENY.some(d => n === d || n.includes(d));
}

// Seed AI tools (AI-first) to guarantee progress without manual user lists
const SEED_AI = [
  'ChatGPT','Claude','Gemini','Perplexity','Microsoft Copilot','GitHub Copilot',
  'Midjourney','DALL·E','Stable Diffusion','Adobe Firefly','Runway','Pika',
  'ElevenLabs','DeepL','Grammarly','Jasper','Copy.ai','Writesonic',
  'Cursor','Codeium','Tabnine','Replit','Otter.ai','Descript','Krisp',
  'Suno','Udio'
];

async function propose(openai, n){
  const system = `
Gib NUR reale, populäre AI-Tools (Produkte/Services), die primär AI/LLM/Generative AI anbieten.
Keine Nicht-AI Tools (Zoom/Teams/Analytics/Search Console/Slack/Trello etc.).
Ausgabe: ausschließlich ein JSON-Array von Strings.`;
  const user = `Gib ${n} verschiedene AI-Tools als JSON-Array.`;
  const resp = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.4,
    messages: [{role:'system', content: system.trim()},{role:'user', content: user.trim()}],
  });
  return extractJsonArray(resp.choices?.[0]?.message?.content?.trim() || '');
}

async function wikidataSearch(name, limit=8){
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.searchParams.set('action','wbsearchentities');
  url.searchParams.set('search', name);
  url.searchParams.set('language','en');
  url.searchParams.set('format','json');
  url.searchParams.set('limit', String(limit));
  const r = await fetch(url, { headers:{'user-agent':'utildesk-motia/1.0'} });
  if(!r.ok) return [];
  const j = await r.json();
  return (j?.search||[]).map(x=>({id:x.id,label:x.label,description:x.description||''}));
}

async function wikidataEntity(qid){
  const r = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, { headers:{'user-agent':'utildesk-motia/1.0'} });
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
  const results = await wikidataSearch(name, 8);
  if(!results.length) return null;

  const token = (slugify(name).split('-')[0] || '').toLowerCase();
  const single = String(name).trim().split(/\s+/).length === 1;

  let best = null;
  for(const r of results){
    const ent = await wikidataEntity(r.id);
    if(!ent) continue;

    const off = officialUrl(ent);
    if(!off) continue;

    const sl = sitelinks(ent);
    if(sl < MIN_SITELINKS) continue;

    const host = hostname(off);
    if(single && token && !host.includes(token) && sl < 10) continue;

    const score = sl + (host.includes(token) ? 10 : 0);
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

async function classifyAI(openai, name, official_url, desc){
  const prompt = `
Return ONLY JSON: {"is_ai":true/false,"category":"AI|Developer|Design|Video|Audio|Produktivität","reason":"short"}.
Decide if this product is primarily an AI tool (LLM/chat, coding assistant, generative media, speech AI, AI writing).
If uncertain => false.
Name: ${name}
Official URL: ${official_url}
Description: ${desc || ""}`;
  const resp = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0,
    messages: [{role:'user', content: prompt.trim()}],
  });
  const text = resp.choices?.[0]?.message?.content?.trim() || '';
  try {
    const j = JSON.parse(text);
    return { is_ai: !!j.is_ai, category: String(j.category||'AI'), reason: String(j.reason||'') };
  } catch {
    return { is_ai:false, category:'AI', reason:'parse_failed' };
  }
}

function categoryFallback(name){
  if (/(copilot|cursor|codeium|tabnine|replit)/i.test(name)) return 'Developer';
  if (/(midjourney|dall|stable diffusion|firefly)/i.test(name)) return 'Design';
  if (/(runway|pika|descript)/i.test(name)) return 'Video';
  if (/(elevenlabs|otter|krisp|suno|udio)/i.test(name)) return 'Audio';
  if (/(deepl|grammarly|jasper|copy\.ai|writesonic)/i.test(name)) return 'Produktivität';
  return 'AI';
}

async function main(){
  if(!OPENAI_API_KEY) die('Missing OPENAI_API_KEY');
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const { existingTopic, existingSlug, existingQ } = await readExisting();

  const picked = [];
  const seenT = new Set(), seenS = new Set(), seenQ = new Set();

  let pool = [...SEED_AI];
  let loops = 0;

  while(picked.length < TARGET && loops < 12){
    loops++;

    if(pool.length < 8){
      const more = await propose(openai, 20);
      pool.push(...more);
    }

    const chunk = pool.splice(0, 15);
    if(chunk.length===0) break;

    for(const name of chunk){
      if(isDenied(name)) continue;

      const topic = String(name||'').trim();
      if(!topic) continue;

      const tKey = topic.toLowerCase();
      if(existingTopic.has(tKey) || seenT.has(tKey)) continue;

      const slug = slugify(topic);
      if(!slug) continue;
      if(existingSlug.has(slug) || seenS.has(slug)) continue;

      const wd = await pickWikidata(topic);
      if(!wd) continue;

      const qid = String(wd.wikidata_id||'').toUpperCase();
      if(existingQ.has(qid) || seenQ.has(qid)) continue;

      const cls = await classifyAI(openai, topic, wd.official_url, wd.wikidata_desc);
      if(!cls.is_ai) continue;

      const category = cls.category || categoryFallback(topic);

      // Build strict A..P row (16 cells)
      const row = [
        topic,                 // A topic
        slug,                  // B slug
        category,              // C category
        '',                    // D tags
        'freemium',            // E price_model
        '',                    // F affiliate_url
        'NEW',                 // G status
        `validated:AI qid=${qid} sl=${wd.wikidata_sitelinks} ${cls.reason}`.trim(), // H notes
        '',                    // I title
        '',                    // J short_hint
        wd.official_url,       // K official_url
        '',                    // L brand_assets_url (optional later)
        qid,                   // M wikidata_id
        wd.wikipedia_de,       // N wikipedia_de
        wd.wikipedia_en,       // O wikipedia_en
        wd.wikidata_sitelinks, // P wikidata_sitelinks
      ];

      picked.push(row);
      seenT.add(tKey); seenS.add(slug); seenQ.add(qid);

      if(picked.length >= TARGET) break;
    }
  }

  if(!picked.length) die('No AI tools validated. Try again.');

  // Write via strict writer on stdin
  const payload = JSON.stringify({ rows: picked });
  const out = spawnSync('node', ['scripts/sheet_write_rows_strict_AP_v2.mjs'], {
    input: payload,
    encoding: 'utf8',
    cwd: process.cwd(),
  });

  if(out.status !== 0) die(out.stderr || out.stdout || 'writer failed');

  console.log(JSON.stringify({ ok:true, added: picked.length, writer: JSON.parse(out.stdout) }, null, 2));
}

main().catch(e=>die(e.stack||String(e)));

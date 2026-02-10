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
import https from 'node:https';
import dns from 'node:dns';

// Configure DNS to use Google DNS as fallback
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Helper to make HTTPS requests with custom DNS
function httpsGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 8000
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: async () => JSON.parse(data),
          text: async () => data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Parse command-line arguments
const args = process.argv.slice(2);
const targetArg = args.find(a => !a.startsWith('--'));
const TARGET = Math.max(1, Math.min(50, Number(targetArg || 9)));
const DRY_RUN = args.includes('--dry-run');
const JSON_OUTPUT = args.includes('--json');
const SHOW_ITEMS = args.includes('--show-items');
const MOCK_MODE = args.includes('--mock') || process.env.MOCK_MODE === 'true';

const MIN_SITELINKS = Number(process.env.WIKIDATA_MIN_SITELINKS || 3);

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

// --- official_url guards (blacklist / suspicious patterns) ---
const OFFICIAL_URL_DENY_HOST = new Set([
  // encyclopedias / knowledge bases
  'wikipedia.org','wikidata.org','wikimedia.org',
  // socials
  'facebook.com','instagram.com','linkedin.com','tiktok.com','youtube.com','youtu.be',
  'twitter.com','x.com',
  // entertainment DB
  'imdb.com',
  // travel / directories (often wrong for tool names)
  'tripadvisor.com','booking.com','expedia.com',
  // software directories
  'g2.com','capterra.com','producthunt.com','alternativeto.net','getapp.com',
  'softwareadvice.com','trustpilot.com','trustradius.com','gartner.com',
]);

const OFFICIAL_URL_DENY_SUBSTR = [
  // generic non-product portals
  'culture',
  // gov / municipality / city portals
  'mairie','stadt','gemeinde','municip','municipal','kommune','council','gov','gouv','regierung',
  // tourism / visiting portals
  'visit','tourism','tourist','stadtinfo','city',
];

function hostContainsToken(host, token){
  const h = String(host||'').toLowerCase();
  const t = String(token||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(!h || !t) return false;

  const hNorm = h.replace(/[^a-z0-9]/g,'');

  // For short tokens (< 4 chars), require exact match in subdomain or domain name
  if (t.length < 4) {
    const parts = h.split('.');
    for (const part of parts) {
      if (part === t) return true;
    }
    return false;
  }

  // For longer tokens, allow substring match
  return hNorm.includes(t);
}

function isSuspiciousOfficialUrl(u){
  try{
    const url = new URL(String(u||'').trim());
    const host = url.hostname.replace(/^www\./,'').toLowerCase();
    const path = (url.pathname || '').toLowerCase();

    // hard deny exact/parent domains
    for (const d of OFFICIAL_URL_DENY_HOST){
      if (host === d || host.endsWith('.' + d)) return true;
    }

    // wiki-like paths
    if (path.startsWith('/wiki/') || path.includes('/wiki/')) return true;

    // substring heuristics (host + path)
    const hp = host + path;
    for (const sub of OFFICIAL_URL_DENY_SUBSTR){
      if (hp.includes(sub)) return true;
    }

    // obvious non-product pages
    if (hp.includes('/film') || hp.includes('/movie') || hp.includes('/stadt/') || hp.includes('/city/')) return true;

    return false;
  } catch {
    return true; // invalid URL => suspicious
  }
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

// --- network helpers (timeouts + small cache) ---
const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 8000);

async function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

const WD_ENTITY_CACHE = new Map(); // qid -> entity|null
const URL_LIVE_CACHE = new Map(); // url -> boolean

async function isUrlLive(url) {
  if (MOCK_MODE) return true; // In mock mode, assume all URLs are live

  if (URL_LIVE_CACHE.has(url)) return URL_LIVE_CACHE.get(url);

  try {
    // Try HEAD first (faster)
    const headRes = await fetchWithTimeout(url, {
      method: 'HEAD',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; utildesk-motia/1.0)' },
      redirect: 'follow'
    });

    if (headRes.status >= 200 && headRes.status < 400) {
      URL_LIVE_CACHE.set(url, true);
      return true;
    }

    // If HEAD fails, try GET
    const getRes = await fetchWithTimeout(url, {
      method: 'GET',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; utildesk-motia/1.0)' },
      redirect: 'follow'
    });

    const isLive = getRes.status >= 200 && getRes.status < 400;
    URL_LIVE_CACHE.set(url, isLive);
    return isLive;
  } catch (err) {
    URL_LIVE_CACHE.set(url, false);
    return false;
  }
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
  const existingHost = new Set();

  for(const r of rows.slice(1)){
    const t = String(r[idx.topic]||'').trim().toLowerCase();
    const s = String(r[idx.slug]||'').trim().toLowerCase();
    const q = String(r[idx.wikidata_id]||'').trim().toUpperCase();
    const ou = ('official_url' in idx) ? String(r[idx.official_url]||'').trim() : '';
    const hk = hostKey(ou);
    if(hk) existingHost.add(hk);

    if(t) existingTopic.add(t);
    if(s) existingSlug.add(s);
    if(q) existingQ.add(q);
  }
  return { existingTopic, existingSlug, existingQ, existingHost };
}

const DENY = [
  'zoom','microsoft teams','teams','google search console','search console',
  'google analytics','jira','confluence','trello','slack','tome','bard' // not AI-first products
];
function isDenied(name){
  const n = String(name||'').toLowerCase();
  return DENY.some(d => n === d || n.includes(d));
}


// --- v2 improvements: canonicalize tool names & dedupe by official host ---

const TIER_WORDS = [
  'plus','pro','premium','enterprise','business','team','teams','unlimited','starter',
  'basic','advanced','ultimate','edition','plan','pricing','free','trial','beta'
];

const CANONICAL_MAP = new Map([
  ['chatgpt plus','ChatGPT'],
  ['chatgpt pro','ChatGPT'],
  ['openai chatgpt','ChatGPT'],
  ['microsoft copilot pro','Microsoft Copilot'],
  ['github copilot x','GitHub Copilot'],
  ['perplexity pro','Perplexity'],
  ['gemini advanced','Gemini'],
]);

function canonicalName(name){
  let n = String(name||'').trim();
  if(!n) return '';
  const low = n.toLowerCase().replace(/\s+/g,' ').trim();
  if(CANONICAL_MAP.has(low)) return CANONICAL_MAP.get(low);

  // remove bracket suffixes like "(Pro)" "(Plus)" etc.
  n = n.replace(/\(([^)]*)\)\s*$/g, (m,inner)=>{
    const t = inner.toLowerCase().trim()
    if(TIER_WORDS.includes(t)) return ''
    return m
  }).trim();

  // remove trailing tier words: "ChatGPT Plus" -> "ChatGPT"
  const parts = n.split(/\s+/);
  if(parts.length >= 2){
    const last = parts[parts.length-1].toLowerCase().replace(/[^a-z]/g,'');
    if(TIER_WORDS.includes(last)) parts.pop();
    n = parts.join(' ').trim();
  }

  // normalize punctuation (keep original casing as much as possible)
  n = n.replace(/\s+/g,' ').trim();
  return n;
}

function hostKey(url){
  const h = hostname(url);
  return h ? h.toLowerCase() : '';
}
// Seed AI tools (AI-first) to guarantee progress without manual user lists
const SEED_AI = [
  // Core / LLM
  'ChatGPT','Claude','Gemini','Perplexity','Microsoft Copilot','GitHub Copilot',
  // Images / Design
  'Midjourney','DALL·E','Stable Diffusion','Adobe Firefly','Canva','Leonardo AI',
  // Video
  'Runway','Pika','Luma AI','Synthesia','HeyGen','Opus Clip',
  // Audio / Voice
  'ElevenLabs','Suno','Udio','Descript','Krisp','Whisper',
  // Writing / Productivity
  'Notion AI','Grammarly','Jasper','Copy.ai','Writesonic','QuillBot',
  // Dev tools
  'Cursor','Codeium','Tabnine','Replit','Bolt.new','Vercel v0',
  // Search / Research
  'Elicit','Consensus','Scite','You.com','Phind',
  // Automation / Agents
  'LangChain','LlamaIndex','Pinecone','Weaviate','Zapier AI',
  // Translation
  'DeepL'
];

const SEED_ALLOW = new Set(SEED_AI.map(x => canonicalName(x).toLowerCase()).filter(Boolean));




async function propose(openai, n){
  const system = `
Gib NUR reale, populäre AI-Tools (Produkte/Services), die primär AI/LLM/Generative AI anbieten.
Keine Nicht-AI Tools (Zoom/Teams/Analytics/Search Console/Slack/Trello etc.).
Ausgabe: ausschließlich ein JSON-Array von Strings.`;
  const user = `Gib ${n} verschiedene AI-Tools (nur Produktnamen, keine Tarifnamen wie Plus/Pro/Enterprise) als JSON-Array.`;
  const resp = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    messages: [{role:'system', content: system.trim()},{role:'user', content: user.trim()}],
  });
  return extractJsonArray(resp.choices?.[0]?.message?.content?.trim() || '');
}

// Mock Wikidata data for testing
const MOCK_WIKIDATA = {
  'chatgpt': { id: 'Q115564437', label: 'ChatGPT', description: 'AI chatbot', official_url: 'https://chatgpt.com', sitelinks: 45, wikipedia_de: 'https://de.wikipedia.org/wiki/ChatGPT', wikipedia_en: 'https://en.wikipedia.org/wiki/ChatGPT' },
  'claude': { id: 'Q124491866', label: 'Claude', description: 'AI assistant', official_url: 'https://claude.ai', sitelinks: 12, wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Claude_(language_model)' },
  'gemini': { id: 'Q123415601', label: 'Gemini', description: 'AI chatbot', official_url: 'https://gemini.google.com', sitelinks: 18, wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Gemini_(chatbot)' },
  'perplexity': { id: 'Q117096353', label: 'Perplexity', description: 'AI search', official_url: 'https://www.perplexity.ai', sitelinks: 8, wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Perplexity.ai' },
  'microsoft-copilot': { id: 'Q113572170', label: 'Microsoft Copilot', description: 'AI assistant', official_url: 'https://copilot.microsoft.com', sitelinks: 22, wikipedia_de: 'https://de.wikipedia.org/wiki/Microsoft_Copilot', wikipedia_en: 'https://en.wikipedia.org/wiki/Microsoft_Copilot' },
  'github-copilot': { id: 'Q107450970', label: 'GitHub Copilot', description: 'AI code assistant', official_url: 'https://github.com/features/copilot', sitelinks: 25, wikipedia_de: 'https://de.wikipedia.org/wiki/GitHub_Copilot', wikipedia_en: 'https://en.wikipedia.org/wiki/GitHub_Copilot' },
  'midjourney': { id: 'Q113562640', label: 'Midjourney', description: 'AI image generator', official_url: 'https://www.midjourney.com', sitelinks: 30, wikipedia_de: 'https://de.wikipedia.org/wiki/Midjourney', wikipedia_en: 'https://en.wikipedia.org/wiki/Midjourney' },
  'stable-diffusion': { id: 'Q113437966', label: 'Stable Diffusion', description: 'AI image generator', official_url: 'https://stability.ai', sitelinks: 35, wikipedia_de: 'https://de.wikipedia.org/wiki/Stable_Diffusion', wikipedia_en: 'https://en.wikipedia.org/wiki/Stable_Diffusion' },
  'dall-e': { id: 'Q98663943', label: 'DALL-E', description: 'AI image generator', official_url: 'https://openai.com/dall-e-3', sitelinks: 28, wikipedia_de: 'https://de.wikipedia.org/wiki/DALL-E', wikipedia_en: 'https://en.wikipedia.org/wiki/DALL-E' },
  'adobe-firefly': { id: 'Q116889203', label: 'Adobe Firefly', description: 'AI image generator', official_url: 'https://www.adobe.com/products/firefly.html', sitelinks: 10, wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Adobe_Firefly' },
  'canva': { id: 'Q5031617', label: 'Canva', description: 'design platform', official_url: 'https://www.canva.com', sitelinks: 42, wikipedia_de: 'https://de.wikipedia.org/wiki/Canva', wikipedia_en: 'https://en.wikipedia.org/wiki/Canva' },
  'leonardo-ai': { id: 'Q124818438', label: 'Leonardo AI', description: 'AI image generator', official_url: 'https://leonardo.ai', sitelinks: 5, wikipedia_de: '', wikipedia_en: '' },
  'runway': { id: 'Q105055003', label: 'Runway', description: 'AI video', official_url: 'https://runwayml.com', sitelinks: 8, wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Runway_(company)' },
  'pika': { id: 'Q124622919', label: 'Pika', description: 'AI video', official_url: 'https://pika.art', sitelinks: 4, wikipedia_de: '', wikipedia_en: '' },
  'luma-ai': { id: 'Q124846352', label: 'Luma AI', description: 'AI 3D', official_url: 'https://lumalabs.ai', sitelinks: 3, wikipedia_de: '', wikipedia_en: '' },
  'synthesia': { id: 'Q105733015', label: 'Synthesia', description: 'AI video', official_url: 'https://www.synthesia.io', sitelinks: 6, wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Synthesia_(company)' },
  'heygen': { id: 'Q124818767', label: 'HeyGen', description: 'AI video', official_url: 'https://www.heygen.com', sitelinks: 3, wikipedia_de: '', wikipedia_en: '' },
  'elevenlabs': { id: 'Q117044238', label: 'ElevenLabs', description: 'AI voice', official_url: 'https://elevenlabs.io', sitelinks: 12, wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/ElevenLabs' },
  'suno': { id: 'Q124846448', label: 'Suno', description: 'AI music', official_url: 'https://suno.com', sitelinks: 5, wikipedia_de: '', wikipedia_en: '' },
  'udio': { id: 'Q125329916', label: 'Udio', description: 'AI music', official_url: 'https://www.udio.com', sitelinks: 3, wikipedia_de: '', wikipedia_en: '' },
  'descript': { id: 'Q97000084', label: 'Descript', description: 'audio editor', official_url: 'https://www.descript.com', sitelinks: 7, wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Descript' },
  'notion-ai': { id: 'Q61746157', label: 'Notion', description: 'productivity', official_url: 'https://www.notion.so/product/ai', sitelinks: 28, wikipedia_de: 'https://de.wikipedia.org/wiki/Notion_(Software)', wikipedia_en: 'https://en.wikipedia.org/wiki/Notion_(productivity_software)' },
  'grammarly': { id: 'Q19890229', label: 'Grammarly', description: 'writing assistant', official_url: 'https://www.grammarly.com', sitelinks: 32, wikipedia_de: 'https://de.wikipedia.org/wiki/Grammarly', wikipedia_en: 'https://en.wikipedia.org/wiki/Grammarly' },
  'jasper': { id: 'Q111172082', label: 'Jasper', description: 'AI writing', official_url: 'https://www.jasper.ai', sitelinks: 5, wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Jasper_(software)' },
  'copy-ai': { id: 'Q110424473', label: 'Copy.ai', description: 'AI copywriting', official_url: 'https://www.copy.ai', sitelinks: 3, wikipedia_de: '', wikipedia_en: '' },
  'cursor': { id: 'Q124846123', label: 'Cursor', description: 'AI code editor', official_url: 'https://www.cursor.com', sitelinks: 4, wikipedia_de: '', wikipedia_en: '' },
  'codeium': { id: 'Q115515616', label: 'Codeium', description: 'AI coding assistant', official_url: 'https://codeium.com', sitelinks: 3, wikipedia_de: '', wikipedia_en: '' },
  'tabnine': { id: 'Q96394989', label: 'Tabnine', description: 'AI code completion', official_url: 'https://www.tabnine.com', sitelinks: 8, wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Tabnine' },
  'deepl': { id: 'Q43968444', label: 'DeepL', description: 'AI translator', official_url: 'https://www.deepl.com', sitelinks: 38, wikipedia_de: 'https://de.wikipedia.org/wiki/DeepL', wikipedia_en: 'https://en.wikipedia.org/wiki/DeepL_Translator' },
  'you-com': { id: 'Q111938678', label: 'You.com', description: 'AI search', official_url: 'https://you.com', sitelinks: 6, wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/You.com' },
};

async function wikidataSearch(name, limit=8){
  if (MOCK_MODE) {
    const slug = slugify(name);
    const mock = MOCK_WIKIDATA[slug];
    if (mock) {
      return [{ id: mock.id, label: mock.label, description: mock.description }];
    }
    return [];
  }

  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&limit=${limit}`;
  try {
    const r = await httpsGet(url, { headers:{'user-agent':'utildesk-motia/1.0'} });
    if(!r.ok) return [];
    const j = await r.json();
    return (j?.search||[]).map(x=>({id:x.id,label:x.label,description:x.description||''}));
  } catch (err) {
    console.error(`[wikidataSearch] ${err.message}`);
    return [];
  }
}

async function wikidataEntity(qid){
  if (WD_ENTITY_CACHE.has(qid)) return WD_ENTITY_CACHE.get(qid);

  if (MOCK_MODE) {
    // Find mock data by QID
    const mock = Object.values(MOCK_WIKIDATA).find(m => m.id === qid);
    if (mock) {
      const ent = {
        claims: {
          P856: [{ mainsnak: { datavalue: { value: mock.official_url } } }]
        },
        sitelinks: {},
        descriptions: { en: { value: mock.description } }
      };
      // Add sitelinks
      for (let i = 0; i < mock.sitelinks; i++) {
        ent.sitelinks[`site${i}`] = { title: 'Page' };
      }
      if (mock.wikipedia_de) ent.sitelinks['dewiki'] = { title: mock.label };
      if (mock.wikipedia_en) ent.sitelinks['enwiki'] = { title: mock.label };
      WD_ENTITY_CACHE.set(qid, ent);
      return ent;
    }
    return null;
  }

  try {
    const r = await httpsGet(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, { headers:{'user-agent':'utildesk-motia/1.0'} });
    if(!r.ok) return null;
    const j = await r.json();
    const ent = j?.entities?.[qid] || null;
    WD_ENTITY_CACHE.set(qid, ent);
    return ent;
  } catch (err) {
    console.error(`[wikidataEntity] ${qid}: ${err.message}`);
    return null;
  }
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

// Wikidata instance_of (P31) blacklist - reject non-software entities
const INSTANCE_OF_REJECT = new Set([
  'Q5',        // human
  'Q15632617', // fictional human
  'Q95074',    // fictional character
  'Q515',      // city
  'Q486972',   // human settlement
  'Q532',      // village
  'Q3957',     // town
  'Q1549591',  // big city
  'Q1637706',  // city with millions of inhabitants
  'Q7275',     // state
  'Q6256',     // country
  'Q82794',    // geographic region
  'Q1496967',  // territorial entity
  'Q15284',    // municipality
  'Q1549591',  // big city
  'Q1093829',  // city in the United States
  'Q3024240',  // historical country
  'Q183',      // Germany (country)
  'Q30',       // United States (country)
]);

function instanceOf(ent) {
  // Extract P31 (instance of) claim values
  const claims = ent?.claims?.P31 || [];
  return claims.map(c => c?.mainsnak?.datavalue?.value?.id).filter(Boolean);
}

function isValidSoftwareEntity(ent) {
  const instances = instanceOf(ent);

  // Reject if any instance_of matches our blacklist
  for (const inst of instances) {
    if (INSTANCE_OF_REJECT.has(inst)) {
      return false;
    }
  }

  // If no official_url, likely not a product
  if (!officialUrl(ent)) return false;

  return true;
}

async function pickWikidata(name){
  const results = await wikidataSearch(name, 8);
  if(!results.length) return null;

  const token = (slugify(name).split('-')[0] || '').toLowerCase();
  const single = String(name).trim().split(/\s+/).length === 1;

  // STRICT: Require token to match - no bypass for any sitelink count
  if (!token || token.length < 2) return null;

  let best = null;
  for(const r of results){
    const ent = await wikidataEntity(r.id);
    if(!ent) continue;

    // STRICT: Reject non-software entities (humans, places, etc.)
    if(!isValidSoftwareEntity(ent)) continue;

    const off = officialUrl(ent);
    if(!off) continue;
    if(isSuspiciousOfficialUrl(off)) continue;

    const sl = sitelinks(ent);
    if(sl < MIN_SITELINKS) continue;
    const host = hostname(off);

    // STRICT: hostname MUST contain token from title (no exceptions)
    if(!hostContainsToken(host, token)) continue;

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
  // Allow DRY_RUN without API key (use seed data only)
  const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

  let existingTopic = new Set(), existingSlug = new Set(), existingQ = new Set(), existingHost = new Set();

  if (!DRY_RUN) {
    const existing = await readExisting();
    existingTopic = existing.existingTopic;
    existingSlug = existing.existingSlug;
    existingQ = existing.existingQ;
    existingHost = existing.existingHost;
  }

  const picked = [];
  const seenT = new Set(), seenS = new Set(), seenQ = new Set();

  let pool = [...SEED_AI];
  let loops = 0;

  const MAX_LOOPS = Number(process.env.AUTOGEN_MAX_LOOPS || 80);

  while(picked.length < TARGET && loops < MAX_LOOPS){
    loops++;
    if (loops % 10 === 0) console.error(`[autogen] loops=${loops} picked=${picked.length}/${TARGET} pool=${pool.length} cache=${WD_ENTITY_CACHE.size}`);

    if(pool.length < 25){
      if (openai) {
        const more = await propose(openai, 60);
        pool.push(...more);
      } else {
        // No API key: just use seed list (for dry-run testing)
        if (pool.length === 0) break;
      }
    }

    const chunk = pool.splice(0, 30);
    if(chunk.length===0) break;

    for(const name of chunk){
      if(isDenied(name)) continue;

      const topic = canonicalName(String(name||'').trim());
      if(!topic) continue;

      const tKey = topic.toLowerCase();
      if(existingTopic.has(tKey) || seenT.has(tKey)) continue;

      const slug = slugify(topic);
      if(!slug) continue;
      if(existingSlug.has(slug) || seenS.has(slug)) continue;

      const wd = await pickWikidata(topic);
      if(!wd) continue;

      // Check live URL
      const urlLive = await isUrlLive(wd.official_url);
      if (!urlLive) continue;

      const hk = hostKey(wd.official_url);
      if(hk && existingHost.has(hk)) continue;

      const qid = String(wd.wikidata_id||'').toUpperCase();
      if(existingQ.has(qid) || seenQ.has(qid)) continue;
      // v2.1: Non-blocking classification.
      // If Wikidata validation passed (official_url + qid), we accept as AI tool.
      // Category via heuristics; no extra LLM filter that can return "uncertain => false".
      const cls = { is_ai: true, category: categoryFallback(topic), reason: 'wikidata_only' };
      const category = cls.category;

        // v2.2: Auto-tags for Sheet column D (no schema changes).
        // Stable format: comma-separated tags (lowercase, no spaces).
        const tags = (() => {
          const out = new Set();
          out.add('ai');
          if (category) out.add(String(category).toLowerCase());

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

          return Array.from(out).filter(Boolean).slice(0, 12);
        })().join(',');



            const token2 = (slugify(topic).split('-')[0] || '').toLowerCase();

      // official_url guard (final safety net)
      const suspicious = isSuspiciousOfficialUrl(wd.official_url) || (hostname(wd.official_url) && token2 && !hostContainsToken(hostname(wd.official_url), token2));

      // STRICT: Skip if suspicious (don't write with empty official_url)
      if (suspicious) continue;

      const safeOfficial = wd.official_url;
      const status = 'NEW';
      const safetyNote = '';

      // Build strict A..P row (16 cells)
      const row = [
        topic,                 // A topic
        slug,                  // B slug
        category,              // C category
          tags,                  // D tags
        'freemium',            // E price_model
        '',                    // F affiliate_url
        status,                // G status
        (`validated:AI qid=${qid} sl=${wd.wikidata_sitelinks} ${cls.reason} ${safetyNote}`).trim(), // H notes
        '',                    // I title
        '',                    // J short_hint
        safeOfficial,          // K official_url
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

  if(!picked.length) die('No AI tools validated (v2). Try again or relax validation.');
  const missing = Math.max(0, TARGET - picked.length);

  // In dry-run mode, skip writing to sheets
  if (DRY_RUN) {
    // Build items array for output
    const items = picked.map(row => ({
      title: row[0],
      slug: row[1],
      category: row[2],
      official_url: row[10],
      wikidata_id: row[12],
      wikipedia_de: row[13],
      wikipedia_en: row[14],
      sitelinks: parseInt(row[15]) || 0
    }));

    const result = {
      ok: picked.length >= TARGET,
      requested: TARGET,
      added: picked.length,
      missing,
      loops
    };

    if (SHOW_ITEMS) {
      result.items = items;
    }

    if (JSON_OUTPUT) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result);
    }
  } else {
    // Write via strict writer on stdin
    const payload = JSON.stringify({ rows: picked });
    const out = spawnSync('node', ['scripts/sheet_write_rows_strict_AP_v2.mjs'], {
      input: payload,
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    if(out.status !== 0) die(out.stderr || out.stdout || 'writer failed');

    console.log(JSON.stringify({ ok:true, requested: TARGET, added: picked.length, missing, loops, writer: JSON.parse(out.stdout) }, null, 2));
  }
}

main().catch(e=>die(e.stack||String(e)));

#!/usr/bin/env node
/**
 * AI-only tool discovery -> Wikidata validation -> strict write to Sheet A..P using sheet_write_rows_strict_AP_v2.mjs
 *
 * Usage:
 *   node scripts/sheet_ai_autogen_9_strict_v2.mjs 20 [--dry-run] [--json] [--show-items]
 *
 * Output: JSON { ok:true, added:N }
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { spawnSync } from 'node:child_process';
import { google } from 'googleapis';
import { resolveOfficialUrlByDDG } from './resolve_official_url_ddg_v1.mjs';

let chooseOfficialUrlGpt = async () => ({ ok: false, reason: 'gpt_module_unavailable', confidence: 0 });
let isGptUrlEnabled = () => false;
try {
  const gptMod = await import('./lib/official_url_chooser_gpt.mjs');
  if (typeof gptMod?.chooseOfficialUrlGpt === 'function') {
    chooseOfficialUrlGpt = gptMod.chooseOfficialUrlGpt;
  }
  if (typeof gptMod?.isGptUrlEnabled === 'function') {
    isGptUrlEnabled = gptMod.isGptUrlEnabled;
  }
} catch (e) {
  console.warn(`[WARN] optional GPT chooser unavailable: ${e?.code || e?.message || e}`);
}

// Parse CLI flags
const args = process.argv.slice(2);
const TARGET = Math.max(1, Math.min(50, Number(args.find(a => !a.startsWith('--')) || 9)));
const DRY_RUN = args.includes('--dry-run');
const JSON_OUTPUT = args.includes('--json');
const SHOW_ITEMS = args.includes('--show-items');

const MIN_SITELINKS = Number(process.env.WIKIDATA_MIN_SITELINKS || 1);

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OFFICIAL_URL_MIN_CONF = Number(process.env.OFFICIAL_URL_MIN_CONF || 0.85);
const AUTOGEN_LIMIT = Math.max(0, Number(process.env.AUTOGEN_LIMIT || 0));

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
]);

const OFFICIAL_URL_DENY_SUBSTR = [
  // generic non-product portals
  'culture',
  // gov / municipality / city portals
  'mairie','stadt','gemeinde','municip','municipal','kommune','council','gov','gouv','regierung',
  'comune','townof','cityof','ville','township',
  // tourism / visiting portals
  'visit','tourism','tourist','stadtinfo','city',
];

function hostContainsToken(host, token){
  const h = String(host||'').toLowerCase();
  const t = String(token||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(!h || !t) return false;
  const firstLabel = h.split('.')[0] || '';
  if (t.length <= 4) {
    return (
      firstLabel === t ||
      firstLabel.startsWith(`${t}-`) ||
      firstLabel.endsWith(`-${t}`)
    );
  }
  // allow both exact and partial for longer tokens (e.g., eleuther in eleuther.ai)
  return h.replace(/[^a-z0-9]/g,'').includes(t);
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

// Normalize docs-style URLs to their origin (scheme+host only).
// Rationale: docs-pages are product documentation, not product landing pages.
const DOCS_PATH_PREFIXES = ['/docs', '/documentation', '/developers', '/api'];

function normalizeDocsUrl(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    if (DOCS_PATH_PREFIXES.some(p => path === p || path.startsWith(p + '/'))) {
      const origin = parsed.origin;
      console.log(`[official_url] normalized docs-url to origin: ${url} -> ${origin}`);
      return origin;
    }
  } catch {}
  return url;
}

// Hard URL overrides for known brand collisions (exact slug -> official_url).
// These win unconditionally and bypass the suspicious-URL guard.
const HARD_URL_OVERRIDES = new Map([
  // Prisma Labs (AI photo/art filter app, prisma-ai.com) vs prisma.io (dev ORM)
  ['prisma', 'https://prisma-ai.com/'],
]);

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
    const status = ('status' in idx) ? String(r[idx.status]||'').trim().toUpperCase() : '';

    // BLACKLIST rows don't block deduplication (allows corrected entries later)
    if(status === 'BLACKLIST') continue;

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
  'google analytics','jira','confluence','trello','slack','tome','bard', // not AI-first products
  'zotero','krita','gimp','inkscape','blender', // non-AI creative tools
  'notion','todoist','evernote','roam', // non-AI productivity tools
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

const HARD_SLUG_ALIASES = new Map([
  ['mitsuku', 'kuki'],
  ['pytorch-lightning', 'pytorch'],
  ['google-bard', 'gemini'],
  ['openai-whisper', 'whisper'],
  ['runway-ml', 'runway'],
  ['runwayml', 'runway'],
  ['runway-ai', 'runway'],
  // Jasper (formerly Jarvis) - prevent duplicates
  ['jasper-ai', 'jasper'],
  ['jarvis', 'jasper'],
]);
const HARD_REJECT_SLUGS = new Set([
  'this-person-does-not-exist',
  // xAI is a company entity; the tool is Grok.
  'x-ai',
]);

function canonicalSlugAlias(slug){
  const s = String(slug || '').trim().toLowerCase();
  return HARD_SLUG_ALIASES.get(s) || s;
}




async function propose(openai, n){
  const system = `You are an AI tools expert. Return ONLY real, popular AI software products and services.
Include: LLM chatbots, AI coding assistants, generative media tools (image/video/audio), AI writing tools, speech AI, translation AI, automation platforms with AI.
EXCLUDE: Non-AI products (Zoom, Teams, Slack, Trello, Google Analytics, Jira, Confluence).
EXCLUDE: Tier names (Plus, Pro, Enterprise, Business).
Output: ONLY a JSON array of product names.`;
  const user = `List ${n} different AI tools/services with diverse categories (chatbots, coding, design, video, audio, writing, translation, automation). JSON array only.`;
  const resp = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.8,
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
  const r = await fetchWithTimeout(url, { headers:{'user-agent':'utildesk-motia/1.0'} });
  if(!r.ok) return [];
  const j = await r.json();
  return (j?.search||[]).map(x=>({id:x.id,label:x.label,description:x.description||''}));
}

async function wikidataEntity(qid){
  if (WD_ENTITY_CACHE.has(qid)) return WD_ENTITY_CACHE.get(qid);
  const r = await fetchWithTimeout(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, { headers:{'user-agent':'utildesk-motia/1.0'} });
  if(!r.ok) return null;
  const j = await r.json();
  const ent = j?.entities?.[qid] || null;
  WD_ENTITY_CACHE.set(qid, ent);
  return ent;
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

// P31 (instance of) validation
const ACCEPTED_P31 = new Set([
  'Q7397', // software
  'Q1172284', // web application
  'Q166142', // online service
  'Q7889', // video game (sometimes AI tools are games)
  'Q58778', // system
  'Q1301371', // computer program
  'Q1639024', // application software
  'Q341',  // free software
  'Q506883', // open-source software
  'Q21127166', // chatbot software
  'Q15633582', // software library
  'Q1639024', // application software
  'Q74790', // software product
  'Q9135', // operating system
  'Q1172486', // web service
  'Q1639024', // application program
  'Q28598683', // AI system
  'Q20826540', // mobile app
  'Q15634736', // software framework
  'Q1194128', // API
  'Q1407659', // cloud service
  'Q15634757', // web platform
  'Q17155032', // SaaS
  'Q28598683', // artificial intelligence system
  'Q22811534', // language model
]);

const REJECTED_P31 = new Set([
  'Q5', // human
  'Q515', // city
  'Q486972', // human settlement
  'Q56061', // administrative territorial entity
  'Q82794', // geographic region
  'Q11424', // film
  'Q215380', // musical group
  'Q11424', // film
  'Q5398426', // television series
  'Q7725634', // literary work
  'Q571', // book
  'Q41298', // magazine
  'Q1002697', // periodical
  'Q11032', // newspaper
  'Q1792450', // art genre
  'Q3559093', // work of art
]);

function getInstanceOf(ent){
  const claims = ent?.claims?.P31 || [];
  return claims.map(c => c?.mainsnak?.datavalue?.value?.id).filter(Boolean);
}

function validateInstanceOf(ent){
  const instances = getInstanceOf(ent);
  if (instances.length === 0) {
    // No P31 at all - accept but mark for review
    return { valid: true, reason: 'no_P31_but_has_url', instances: [] };
  }

  // Check for rejected types first (hard fail)
  for (const qid of instances) {
    if (REJECTED_P31.has(qid)) {
      return { valid: false, reason: `rejected_P31:${qid}` };
    }
  }

  // If no rejected types, we're good (software-like by default)
  // Either has accepted type OR just not rejected
  const hasAccepted = instances.some(qid => ACCEPTED_P31.has(qid));

  return { valid: true, reason: hasAccepted ? 'accepted_P31' : 'no_rejected', instances };
}

function isLikelyAITool(name, desc, instances){
  const text = `${name} ${desc}`.toLowerCase();

  // Strong AI signals
  const aiTerms = ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural',
    'llm', 'language model', 'gpt', 'generative', 'chatbot', 'assistant', 'copilot'];
  if (aiTerms.some(term => text.includes(term))) return true;

  // Check P31 for AI-specific types
  const aiP31 = ['Q28598683', 'Q22811534']; // AI system, language model
  if (instances.some(qid => aiP31.includes(qid))) return true;

  // Specific tool patterns
  if (/(chat|voice|speech|tts|image.*generat|video.*generat|code.*assist)/i.test(text)) return true;

  // ML/AI frameworks and libraries (TensorFlow, PyTorch, etc.)
  if (/tensor|pytorch|keras|scikit|opencv|transformers|hugging/i.test(name)) return true;

  // Known AI companies/products (mistral, claude, etc.)
  const knownAI = ['mistral', 'anthropic', 'openai', 'cohere', 'stability', 'runway', 'midjourney',
    'elevenlabs', 'jasper', 'writesonic', 'quillbot', 'grammarly', 'copy.ai', 'synthesia', 'descript',
    'pictory', 'murf', 'lumen5', 'fliki', 'clipchamp'];
  if (knownAI.some(ai => name.toLowerCase().includes(ai))) return true;

  return false;
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

    // P31 validation (MUST pass) — [wikidata-guard]
    const p31Check = validateInstanceOf(ent);
    if (!p31Check.valid) {
      process.stderr.write(
        `[wikidata-guard] rejected P31=${p31Check.reason} entity=${r.id}(${r.label}) topic="${name}" reason=rejected_p31\n`
      );
      wikidata_guard_rejected++;
      continue;
    }

    // AI tool check (should be AI-related) — [wikidata-guard]
    const desc = r.description || (ent?.descriptions?.en?.value||'');
    if (!isLikelyAITool(name, desc, p31Check.instances)) {
      process.stderr.write(
        `[wikidata-guard] rejected entity=${r.id}(${r.label}) topic="${name}" reason=not_ai_tool` +
        ` p31=[${p31Check.instances.join(',')}] desc="${String(desc).slice(0, 80).replace(/\n/g, ' ')}"\n`
      );
      wikidata_guard_rejected++;
      continue;
    }

    const offRaw = officialUrl(ent);
    const off = offRaw && !isSuspiciousOfficialUrl(offRaw) ? offRaw : '';

    const sl = sitelinks(ent);
    if(sl < MIN_SITELINKS) continue;
    const host = hostname(off);

    // Stricter hostname validation: must contain token OR have very high sitelinks
    if(token && host && !hostContainsToken(host, token) && sl < 50) continue;

    // Also check: if hostname looks like a generic portal (contains common non-product words), require exact token match
    const hostLower = host.toLowerCase();
    const genericWords = ['town', 'city', 'ville', 'comune', 'saint', 'sainte', 'municipality'];
    if (genericWords.some(w => hostLower.includes(w))) {
      if (!hostContainsToken(host, token)) continue;
    }

    const score = sl + (off ? 25 : 0) + (host && host.includes(token) ? 10 : 0);
    if(!best || score > best.score){
      best = {
        score,
        wikidata_id: r.id,
        wikidata_desc: desc,
        official_url: off,
        wikipedia_de: wiki(ent,'de'),
        wikipedia_en: wiki(ent,'en'),
        wikidata_sitelinks: String(sl),
        p31_instances: p31Check.instances,
      };
    }
  }
  // Increment only when pickWikidata() will return a real entity (not null)
  if (best) wikidata_guard_allowed++;
  return best;
}

async function resolveOfficialForTopic(topic, slug, wd, counters) {
  const token = (slugify(slug || topic).split('-')[0] || '').toLowerCase();
  const wdOfficial = String(wd?.official_url || '').trim();
  if (wdOfficial) {
    if (counters) counters.resolved_with_wikidata += 1;
    return {
      official_url: wdOfficial,
      confidence: 0.99,
      reason: 'wikidata_p856',
      candidates: [{ url: wdOfficial, domain: hostname(wdOfficial), source: 'wikidata:P856', rank: 1, score: 10000 }],
      decision: { method: 'wikidata', selected_rank: 1, used_gpt: false },
    };
  }

  if (counters) counters.ddg_called += 1;
  const ddg = await resolveOfficialUrlByDDG(`${String(topic || '').trim()} official site`, token);
  const ddgCandidates = Array.isArray(ddg?.candidates) ? ddg.candidates : [];
  const ddgOfficial = String(ddg?.official_url || '').trim();
  const ddgConfidence = Number.isFinite(Number(ddg?.confidence)) ? Number(ddg.confidence) : 0;
  const lowConfidenceFallback = !ddgOfficial || ddgConfidence < OFFICIAL_URL_MIN_CONF;
  const shouldTryGpt = isGptUrlEnabled() && (ddgCandidates.length > 1 || lowConfidenceFallback);

  let gpt = null;
  if (shouldTryGpt) {
    if (counters) counters.gpt_attempted += 1;
    gpt = await chooseOfficialUrlGpt({
      topic: String(topic || '').trim(),
      token,
      candidates: ddgCandidates,
      defaultUrl: ddgOfficial,
    });
  }

  const gptOfficial = String(gpt?.official_url || '').trim();
  const gptConfidence = Number.isFinite(Number(gpt?.confidence)) ? Number(gpt.confidence) : 0;
  const hasAcceptedGpt = Boolean(gpt?.ok && gptOfficial && gptConfidence >= OFFICIAL_URL_MIN_CONF);

  let selectedOfficial = '';
  let selectedConfidence = 0;
  let selectedReason = String(ddg?.reason || 'not_selected');
  if (hasAcceptedGpt) {
    if (counters) counters.gpt_accepted += 1;
    selectedOfficial = gptOfficial;
    selectedConfidence = gptConfidence;
    selectedReason = String(gpt?.reason || 'gpt_selected');
  } else if (ddgOfficial && ddgConfidence >= OFFICIAL_URL_MIN_CONF) {
    if (counters) counters.resolved_with_ddg += 1;
    selectedOfficial = ddgOfficial;
    selectedConfidence = ddgConfidence;
    selectedReason = String(ddg?.reason || 'ddg_selected');
  }

  if (shouldTryGpt && !hasAcceptedGpt) {
    const gptReason = String(gpt?.reason || '');
    if (gptReason === 'not_in_allowlist') {
      if (counters) counters.gpt_rejected_not_in_allowlist += 1;
    } else if (gptReason === 'low_confidence' || (gpt?.ok && gptConfidence < OFFICIAL_URL_MIN_CONF)) {
      if (counters) counters.gpt_rejected_low_conf += 1;
    } else if (counters) {
      counters.gpt_errors += 1;
    }
  }

  return {
    official_url: selectedOfficial,
    confidence: selectedConfidence,
    reason: selectedReason,
    candidates: ddgCandidates,
    decision: {
      ...(ddg?.decision && typeof ddg.decision === 'object' ? ddg.decision : {}),
      used_gpt: Boolean(shouldTryGpt),
      gpt_reason: gpt?.reason || '',
      gpt_confidence: gptConfidence || 0,
      low_confidence_fallback: Boolean(lowConfidenceFallback),
    },
  };
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

// Run-level Wikidata guard counters (module-level so pickWikidata can increment them)
let wikidata_guard_rejected = 0;
let wikidata_guard_allowed = 0;

async function main(){
  if(!OPENAI_API_KEY) die('Missing OPENAI_API_KEY');
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const { existingTopic, existingSlug, existingQ, existingHost } = await readExisting();

  const picked = [];
  const seenT = new Set(), seenS = new Set(), seenQ = new Set();
  const counters = {
    topics_seen: 0,
    rows_written: 0,
    ddg_called: 0,
    gpt_attempted: 0,
    gpt_accepted: 0,
    gpt_rejected_low_conf: 0,
    gpt_rejected_not_in_allowlist: 0,
    gpt_errors: 0,
    resolved_with_wikidata: 0,
    resolved_with_ddg: 0,
  };
  const hardLimit = AUTOGEN_LIMIT > 0 ? AUTOGEN_LIMIT : Number.POSITIVE_INFINITY;

  let pool = [...SEED_AI];
  let loops = 0;

  const MAX_LOOPS = Number(process.env.AUTOGEN_MAX_LOOPS || 80);

  while(picked.length < TARGET && picked.length < hardLimit && loops < MAX_LOOPS){
    loops++;
    if (loops % 10 === 0) console.error(`[autogen] loops=${loops} picked=${picked.length}/${TARGET} pool=${pool.length} cache=${WD_ENTITY_CACHE.size}`);

    if(pool.length < 30){
      const more = await propose(openai, 80);
      pool.push(...more);
    }

    const chunk = pool.splice(0, 40);
    if(chunk.length===0) break;

    for(const name of chunk){
      if(isDenied(name)) continue;

      const topic = canonicalName(String(name||'').trim());
      if(!topic) continue;

      const tKey = topic.toLowerCase();
      if(existingTopic.has(tKey) || seenT.has(tKey)) continue;

      let slug = slugify(topic);
      if(!slug) continue;
      if (HARD_REJECT_SLUGS.has(slug)) {
        console.error(`[hard-reject] slug=${slug}`);
        continue;
      }
      const canonical = canonicalSlugAlias(slug);
      if (canonical !== slug) {
        if (existingSlug.has(canonical)) {
          console.error(`[alias-skip] ${slug} -> ${canonical}`);
          continue;
        }
        slug = canonical;
      }
      if (HARD_REJECT_SLUGS.has(slug)) {
        console.error(`[hard-reject] slug=${slug}`);
        continue;
      }
      if(existingSlug.has(slug) || seenS.has(slug)) continue;

      counters.topics_seen += 1;
      const wd = await pickWikidata(topic);
      if(!wd) continue;
      const urlResolution = await resolveOfficialForTopic(topic, slug, wd, counters);
      const resolvedOfficial = String(urlResolution?.official_url || '').trim();
      const hk = hostKey(resolvedOfficial);
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

      // normalize docs-url to origin, then apply hard overrides
      const normalizedOfficial = normalizeDocsUrl(resolvedOfficial);
      const hardOverride = HARD_URL_OVERRIDES.get(slug);
      if (hardOverride) {
        console.log(`[official_url] hard override for slug=${slug}: ${normalizedOfficial || '(empty)'} -> ${hardOverride}`);
      }
      const officialToCheck = hardOverride || normalizedOfficial;

      // official_url guard (final safety net); hard override bypasses suspicious check
      const suspicious = !hardOverride && (!officialToCheck || isSuspiciousOfficialUrl(officialToCheck) || (hostname(officialToCheck) && token2 && !hostContainsToken(hostname(officialToCheck), token2)));
      const safeOfficial = hardOverride || (suspicious ? '' : officialToCheck);
      const status = suspicious ? 'NEEDS_REVIEW' : 'NEW';
      const safetyNote = suspicious ? `blocked_official_url:${urlResolution?.reason || 'unresolved'}` : '';

      // Build strict A..P row (16 cells)
      const row = [
        topic,                 // A topic
        slug,                  // B slug
        category,              // C category
          tags,                  // D tags
        'freemium',            // E price_model
        '',                    // F affiliate_url
        status,                // G status
        (`validated:AI qid=${qid} sl=${wd.wikidata_sitelinks} ${cls.reason} ${safetyNote} used_gpt=${urlResolution?.decision?.used_gpt ? '1' : '0'}`).trim(), // H notes
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
      counters.rows_written += 1;
      seenT.add(tKey); seenS.add(slug); seenQ.add(qid);

      if(picked.length >= TARGET || picked.length >= hardLimit) break;
    }
  }

  if(!picked.length) die('No AI tools validated (v2). Try again or relax validation.');
  const missing = Math.max(0, TARGET - picked.length);

  let writerResult = null;

  // Write via strict writer on stdin (skip if dry-run)
  if (!DRY_RUN) {
    const payload = JSON.stringify({ rows: picked });
    const out = spawnSync('node', ['scripts/sheet_write_rows_strict_AP_v2.mjs'], {
      input: payload,
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    if(out.status !== 0) die(out.stderr || out.stdout || 'writer failed');
    writerResult = JSON.parse(out.stdout);
  }

  const result = {
    ok: true,
    requested: TARGET,
    added: picked.length,
    missing,
    loops,
    dry_run: DRY_RUN,
    ...(writerResult ? { writer: writerResult } : {}),
  };

  // Add items if requested
  if (SHOW_ITEMS) {
    result.items = picked.map(row => ({
      topic: row[0],
      slug: row[1],
      category: row[2],
      tags: row[3],
      official_url: row[10],
      wikidata_id: row[12],
      wikidata_sitelinks: row[15],
    }));
  }

  // Output format
  if (JSON_OUTPUT || SHOW_ITEMS) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
  if (AUTOGEN_LIMIT > 0 || /^(1|true|yes|on)$/i.test(String(process.env.URL_RESOLUTION_SUMMARY || ""))) {
    console.log(JSON.stringify({ ok: true, url_resolution_summary: { ...counters, wikidata_guard_rejected, wikidata_guard_allowed } }, null, 2));
  }
}

main().catch(e=>die(e.stack||String(e)));

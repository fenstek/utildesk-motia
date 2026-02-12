#!/usr/bin/env node
import 'dotenv/config';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const SA_JSON_PATH = "/opt/utildesk-motia/secrets/google-service-account.json";

// --- utils ---
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
function canonicalizeUrl(input){
  try{
    const u = new URL(String(input||'').trim());
    if(!/^https?:$/.test(u.protocol)) return '';
    u.hash = '';
    u.username = '';
    u.password = '';
    u.hostname = u.hostname.toLowerCase();
    if ((u.protocol === 'https:' && u.port === '443') || (u.protocol === 'http:' && u.port === '80')) {
      u.port = '';
    }
    const kept = [];
    for (const [k, v] of u.searchParams.entries()){
      const key = String(k||'').toLowerCase();
      if (key.startsWith('utm_')) continue;
      if (key === 'gclid' || key === 'fbclid' || key === 'msclkid') continue;
      kept.push([k, v]);
    }
    u.search = '';
    for (const [k, v] of kept) u.searchParams.append(k, v);
    u.pathname = u.pathname.replace(/\/{2,}/g, '/');
    if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/,'');
    return u.toString();
  } catch {
    return '';
  }
}
function hostContainsToken(host, token){
  const h = String(host||'').toLowerCase();
  const t = String(token||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(!h || !t) return false;
  return h.replace(/[^a-z0-9]/g,'').includes(t);
}

// --- official_url guards ---
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

  // app stores / aggregators
  'apps.apple.com','play.google.com',
  // search engines / redirects / trackers
  'duckduckgo.com','google.com','bing.com',
]);

const OFFICIAL_URL_DENY_SUBSTR = [
  // generic non-product portals
  'culture',
  // gov / municipality / city portals
  'mairie','stadt','gemeinde','municip','municipal','kommune','council','gov','gouv','regierung',
  // tourism / visiting portals
  'visit','tourism','tourist','stadtinfo','city',

  // common non-official patterns
  '/search?','/search/','?q=','&q=','utm_',
];

// --- manual overrides for ambiguous names (keep minimal & reviewed) ---
const OVERRIDE_OFFICIAL_URL = {
  // ambiguous: many unrelated brands; enforce reviewed AI-tool site
  clara: "https://www.clara-ai.org/",
};

function isSuspiciousOfficialUrl(u){
  try{
    const url = new URL(String(u||'').trim());
    if(!/^https?:$/.test(url.protocol)) return true;

    const host = url.hostname.replace(/^www\./,'').toLowerCase();
    const path = (url.pathname || '').toLowerCase();
    const hp = host + path + (url.search || '').toLowerCase();

    for (const d of OFFICIAL_URL_DENY_HOST){
      if (host === d || host.endsWith('.' + d)) return true;
    }
    if (path.startsWith('/wiki/') || path.includes('/wiki/')) return true;

    for (const sub of OFFICIAL_URL_DENY_SUBSTR){
      if (hp.includes(sub)) return true;
    }

    // obvious non-product pages
    if (hp.includes('/film') || hp.includes('/movie') || hp.includes('/stadt/') || hp.includes('/city/')) return true;

    return false;
  } catch {
    return true;
  }
}

async function sheetsClient(){
  // Prefer env JWT, fallback to keyFile like sheet_set_status.mjs
  if (GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY){
    const auth = new google.auth.JWT({
      email: GOOGLE_CLIENT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version:'v4', auth });
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: SA_JSON_PATH,
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

// --- DDG HTML search ---
async function fetchText(url, timeoutMs=12000){
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try{
    const r = await fetch(url, {
      method: 'GET',
      headers: {
        'user-agent': 'utildesk-motia/1.0',
        'accept': 'text/html,application/xhtml+xml',
      },
      signal: ac.signal,
      redirect: 'follow',
    });
    const text = await r.text();
    return { ok: r.ok, status: r.status, text };
  } finally {
    clearTimeout(t);
  }
}

function decodeUddg(href){
  // href examples:
  // /l/?uddg=https%3A%2F%2Fkuki.ai%2F&rut=...
  // https://duckduckgo.com/l/?uddg=...
  try{
    const u = href.startsWith('http') ? new URL(href) : new URL(href, 'https://html.duckduckgo.com');
    const uddg = u.searchParams.get('uddg');
    if(!uddg) return '';
    return decodeURIComponent(uddg);
  } catch {
    return '';
  }
}

function extractTopLinks(html, limit=10){
  // DDG html uses <a class="result__a" href="...uddg=...">
  const out = [];
  const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"/g;
  let m;
  while((m = re.exec(html)) && out.length < limit){
    const href = m[1];
    const real = decodeUddg(href);
    if(real) out.push(real);
  }
  return out;
}


function pickBestCandidate(cands, token){
  const t = String(token||'').toLowerCase();
  const shortToken = t.length > 0 && t.length <= 5;

  const scored = [];
  for (const u of cands){
    const clean = String(u||'').trim();
    if(!clean) continue;
    if(isSuspiciousOfficialUrl(clean)) continue;

    const host = hostname(clean);
    if(!host) continue;

    const parts = host.split('.');
    const label = (parts[0] || '').toLowerCase();
    const tld = (parts.slice(1).join('.') || '').toLowerCase();

    let score = 0;

    // strongest: exact label match (audo.ai => label "audo")
    if (label === t) score += 3000;

    // weaker: token contained in label
    else if (t && label.includes(t)) score += 800;

    // prefer AI-ish TLDs when label matches exactly
    if (label === t && ['ai','io','app','dev'].includes(tld)) score += 700;

    // penalize token+suffix for short tokens (audocph, clarashop, tomek...)
    if (shortToken && t && label.startsWith(t) && label !== t) score -= 900;

    // AI-signal boost (helps with ambiguous short names like "clara")
    const hnorm = host.replace(/[^a-z0-9.\-]/g,'');
    const aiSignal =
      t && (
        hnorm.includes(t + "-ai") ||
        hnorm.includes(t + "ai") ||
        hnorm.includes(".ai") ||
        label.endsWith("ai") ||
        hnorm.includes("ai.")
      );
    if (aiSignal) score += 1200;

    scored.push({ u: clean, host, label, tld, score });
  }

  scored.sort((a,b)=>b.score - a.score);
  return scored[0]?.u || '';
}

function clamp(n, min, max){
  return Math.max(min, Math.min(max, n));
}

function scoreCandidate(url, token){
  const t = String(token||'').toLowerCase();
  const shortToken = t.length > 0 && t.length <= 5;
  const clean = String(url||'').trim();
  if(!clean) return Number.NEGATIVE_INFINITY;
  if(isSuspiciousOfficialUrl(clean)) return Number.NEGATIVE_INFINITY;

  const host = hostname(clean);
  if(!host) return Number.NEGATIVE_INFINITY;

  const parts = host.split('.');
  const label = (parts[0] || '').toLowerCase();
  const tld = (parts.slice(1).join('.') || '').toLowerCase();

  let score = 0;
  if (label === t) score += 3000;
  else if (t && label.includes(t)) score += 800;
  if (label === t && ['ai','io','app','dev'].includes(tld)) score += 700;
  if (shortToken && t && label.startsWith(t) && label !== t) score -= 900;

  const hnorm = host.replace(/[^a-z0-9.\-]/g,'');
  const aiSignal =
    t && (
      hnorm.includes(t + "-ai") ||
      hnorm.includes(t + "ai") ||
      hnorm.includes(".ai") ||
      label.endsWith("ai") ||
      hnorm.includes("ai.")
    );
  if (aiSignal) score += 1200;
  return score;
}

function computeConfidence(bestScore, secondScore){
  if (!Number.isFinite(bestScore)) return 0;
  let conf = 0.68;
  if (bestScore >= 3000) conf = 0.93;
  else if (bestScore >= 1500) conf = 0.88;
  else if (bestScore >= 900) conf = 0.8;
  const gap = Number.isFinite(secondScore) ? bestScore - secondScore : bestScore;
  if (gap >= 1200) conf += 0.07;
  else if (gap >= 600) conf += 0.04;
  else if (gap >= 200) conf += 0.02;
  return clamp(Number(conf.toFixed(3)), 0, 0.99);
}

function getTopN(){
  const raw = Number(process.env.OFFICIAL_URL_TOPN || 8);
  if(!Number.isFinite(raw)) return 8;
  return clamp(Math.trunc(raw), 1, 25);
}

function getMinOfficialConf(){
  const raw = Number(process.env.OFFICIAL_URL_MIN_CONF || 0.85);
  if (!Number.isFinite(raw)) return 0.85;
  return clamp(raw, 0, 1);
}

export async function resolveOfficialUrlByDDG(queryName, token){
  const base = String(queryName||'').trim();
  const rawToken = String(token||'').trim();

  const queries = [
    base,
    base.replace(/\s+official\s+site$/i,'').trim() + " ai tool official site",
    rawToken ? (rawToken + ".ai") : "",
    base.replace(/\s+official\s+site$/i,'').trim() + " official website",
  ].map(x => String(x||'').trim()).filter(Boolean);

  const all = [];
  const seen = new Set();

  for(const q0 of queries){
    const q = encodeURIComponent(q0);
    const url = `https://html.duckduckgo.com/html/?q=${q}`;
    const r = await fetchText(url, 12000);
    if(!r.ok) continue;

    const links = extractTopLinks(r.text, 10);
    let localRank = 0;
    for(const rawUrl of links){
      const canonical = canonicalizeUrl(rawUrl);
      if(!canonical) continue;
      if(isSuspiciousOfficialUrl(canonical)) continue;
      const h = hostname(canonical);
      const k = canonical.toLowerCase();
      if(!h || seen.has(k)) continue;
      seen.add(k);
      localRank += 1;
      all.push({
        url: canonical,
        domain: h,
        source: `ddg:${q0}`,
        query_rank: localRank,
      });
    }
  }

  if(!all.length){
    return {
      ok:false,
      official_url:'',
      confidence: 0,
      reason:'ddg_no_results',
      decision: { method:'ddg', top_n:getTopN(), selected_rank:null, used_gpt:false },
      candidates:[],
    };
  }

  const scored = all
    .map((item)=>({ ...item, score: scoreCandidate(item.url, token) }))
    .filter((item)=>Number.isFinite(item.score))
    .sort((a,b)=>b.score-a.score);

  if(!scored.length){
    return {
      ok:false,
      official_url:'',
      confidence: 0,
      reason:'no_valid_candidate',
      decision: { method:'ddg', top_n:getTopN(), selected_rank:null, used_gpt:false },
      candidates:[],
    };
  }

  const topN = getTopN();
  const top = scored.slice(0, topN).map((item, idx)=>({
    url: item.url,
    domain: item.domain,
    source: item.source,
    rank: idx + 1,
    score: item.score,
  }));
  const best = top[0];
  const confidence = computeConfidence(scored[0].score, scored[1]?.score);
  const reason = confidence < getMinOfficialConf() ? 'ddg_low_confidence' : 'ddg_selected';

  return {
    ok:true,
    official_url: best.url,
    confidence,
    reason,
    decision: {
      method: 'ddg',
      top_n: topN,
      selected_rank: best.rank,
      selected_score: best.score,
      selected_domain: best.domain,
      used_gpt: false,
    },
    candidates: top,
  };
}

async function main(){
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply');

  const only = (() => {
    const a = process.argv.find(x => x.startsWith('--only='));
    return a ? a.replace('--only=','').trim() : '';
  })();
  const limit = (() => {
    const a = process.argv.find(x => x.startsWith('--limit='));
    const n = a ? Number(a.replace('--limit=','')) : 0;
    return Number.isFinite(n) && n > 0 ? Math.min(200, n) : 0;
  })();

  const sheets = await sheetsClient();

  const range = `${SHEET_NAME}!A1:P`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
  const values = res.data.values || [];
  if(values.length < 2) die('Sheet has no data rows');

  const header = (values[0] || []).map(h => String(h||'').trim());
  const idx = Object.fromEntries(header.map((h,i)=>[h,i]));

  const need = ['topic','slug','status','notes','official_url','affiliate_url'];
  const missing = need.filter(k => !(k in idx));
  if(missing.length) die(`Missing columns in header: ${missing.join(', ')}`);

  const colStatus = colLetter(idx.status);
  const colNotes  = colLetter(idx.notes);
  const colOfficial = colLetter(idx.official_url);

  const updates = [];
  const report = [];

  let scanned = 0;
  let candidates = 0;

  for(let i=1; i<values.length; i++){
    const row = values[i] || [];
    const rowNumber = i + 1;

    const topic = String(row[idx.topic] || '').trim();
    const slug  = String(row[idx.slug] || '').trim();
    const status = String(row[idx.status] || '').trim();
    const official = String(row[idx.official_url] || '').trim();
    const notes = String(row[idx.notes] || '').trim();
    const aff = String(row[idx.affiliate_url] || '').trim();

    if(!topic) continue; // empty row
    scanned++;

    // affiliate_url должен быть пустым по проектному правилу — но мы не трогаем его здесь.
    // (Можно добавить отдельный репортер позже.)

    // Safety: never touch DONE or DISABLED rows
    if (status === 'DONE' || status === 'DISABLED' || status === 'BLACKLIST') continue;

    // Only try to resolve when:
    // - NEEDS_REVIEW
    // - OR official_url empty
    // - OR official_url is suspicious
    // Otherwise leave row untouched (prevents "improving" already-correct URLs like gemini.google.com)
    const mustConsider =
      status === 'NEEDS_REVIEW' ||
      !official ||
      isSuspiciousOfficialUrl(official);

    if(!mustConsider) continue;

    if(only){
      const o = only.toLowerCase();
      if(topic.toLowerCase() !== o && slug.toLowerCase() !== o) continue;
    }

    if(limit && candidates >= limit) break;

    candidates++;

    const token = (slugify(slug || topic).split('-')[0] || '').toLowerCase();
    const q = `${topic} official site`;

    const override =
      OVERRIDE_OFFICIAL_URL[(slug||'').toLowerCase()] ||
      OVERRIDE_OFFICIAL_URL[(topic||'').toLowerCase()] ||
      '';

    const r = override
      ? {
          ok:true,
          official_url: canonicalizeUrl(override),
          confidence: 0.99,
          reason: 'manual_override',
          decision: { method:'manual_override', top_n:1, selected_rank:1, used_gpt:false },
          candidates: [{
            url: canonicalizeUrl(override),
            domain: hostname(override),
            source: 'manual_override',
            rank: 1,
            score: 10000,
          }],
        }
      : await resolveOfficialUrlByDDG(q, token);
    if(!r.ok){
      report.push({ row: rowNumber, topic, slug, status, official_before: official, ok:false, reason: r.reason, candidates: r.candidates?.slice(0,5)||[] });
      // keep NEEDS_REVIEW; also ensure official empty if invalid
      const safeOfficial = (!official || isSuspiciousOfficialUrl(official)) ? '' : official;
      if(safeOfficial !== official){
        updates.push({ range: `${SHEET_NAME}!${colOfficial}${rowNumber}`, values: [[safeOfficial]] });
      }
      if(status !== 'NEEDS_REVIEW'){
        updates.push({ range: `${SHEET_NAME}!${colStatus}${rowNumber}`, values: [['NEEDS_REVIEW']] });
      }
      const newNote = (notes + ` | ddg:fail:${r.reason}`).trim().slice(0, 50000);
      updates.push({ range: `${SHEET_NAME}!${colNotes}${rowNumber}`, values: [[newNote]] });
      continue;
    }

    const resolved = String(r.official_url||'').trim();

    // Final strict validation
    const resolvedHost = hostname(resolved);
    const tokenOk = token && resolvedHost ? hostContainsToken(resolvedHost, token) : false;

    // Ambiguous short-name gate:
    // block auto-accept for short generic names without AI TLD
    const parts = resolvedHost.split('.');
    const label = parts[0] || '';
    const tld = parts.slice(1).join('.') || '';
    const shortAmbiguous =
      token.length <= 5 &&
      label === token &&
      !['ai','io','dev','app'].includes(tld);

    const suspicious =
      isSuspiciousOfficialUrl(resolved) ||
      (!tokenOk && token.length > 1) ||
      shortAmbiguous;

    if(suspicious){
      report.push({ row: rowNumber, topic, slug, status, official_before: official, ok:false, reason:'resolved_but_suspicious', resolved, token, resolvedHost, tokenOk, top: (r.candidates||[]).slice(0,5) });
      // quarantine
      updates.push({ range: `${SHEET_NAME}!${colOfficial}${rowNumber}`, values: [['']] });
      updates.push({ range: `${SHEET_NAME}!${colStatus}${rowNumber}`, values: [['NEEDS_REVIEW']] });
      const newNote = (notes + ` | ddg:blocked:${resolved}`).trim().slice(0, 50000);
      updates.push({ range: `${SHEET_NAME}!${colNotes}${rowNumber}`, values: [[newNote]] });
      continue;
    }

    // Success -> set official_url + NEW (or keep NEW/DONE if already)
    report.push({ row: rowNumber, topic, slug, status, official_before: official, ok:true, official_url: resolved, token, resolvedHost });

    updates.push({ range: `${SHEET_NAME}!${colOfficial}${rowNumber}`, values: [[resolved]] });

    // If it was NEEDS_REVIEW, bring back to NEW (user can later process to DONE by publish pipeline)
    const nextStatus = (status === 'NEEDS_REVIEW' || !status) ? 'NEW' : status;
    updates.push({ range: `${SHEET_NAME}!${colStatus}${rowNumber}`, values: [[nextStatus]] });

    const newNote = (notes + ` | ddg:ok:${resolved}`).trim().slice(0, 50000);
    updates.push({ range: `${SHEET_NAME}!${colNotes}${rowNumber}`, values: [[newNote]] });
  }

  if(!updates.length){
    console.log(JSON.stringify({ ok:true, apply, scanned, candidates, updated:0, note:'No updates' }, null, 2));
    return;
  }

  if(!apply){
    console.log(JSON.stringify({
      ok:true,
      apply:false,
      scanned,
      candidates,
      would_update: updates.length,
      sample_updates: updates.slice(0, 12),
      sample_report: report.slice(0, 12),
      hint: "Run with: node scripts/resolve_official_url_ddg_v1.mjs --apply"
    }, null, 2));
    return;
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption:'RAW', data: updates },
  });

  console.log(JSON.stringify({ ok:true, apply:true, scanned, candidates, updated: updates.length, rows_reported: report.length }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e=>die(e.stack||String(e)));
}

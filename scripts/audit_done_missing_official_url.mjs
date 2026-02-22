#!/usr/bin/env node
/**
 * audit_done_missing_official_url.mjs
 *
 * Scans Google Sheet for rows where status == DONE but official_url is missing.
 * Prints a report. With --fix=1 attempts to repair each row via:
 *   1) Wikidata P856
 *   2) DDG resolver (resolve_official_url_ddg_v1.mjs)
 *   3) Optional GPT chooser (USE_GPT_URL=1)
 *
 * If URL is found and valid:
 *   - writes official_url to Sheet + notes
 *   - updates content/tools/<slug>.md frontmatter
 *   - checks tags (tries GPT enrichment if USE_GPT_TAG_ENRICH=1)
 *   - status remains DONE if tags ok, else NEEDS_REVIEW
 *
 * If URL cannot be resolved:
 *   - sets status = NEEDS_REVIEW + notes="missing official_url - blocked"
 *   - does NOT touch the MD file
 *
 * Usage:
 *   node scripts/audit_done_missing_official_url.mjs               # dry-run
 *   node scripts/audit_done_missing_official_url.mjs --fix=1       # apply
 *   USE_GPT_URL=1 node ... --fix=1                                 # + GPT for URL
 *   USE_GPT_TAG_ENRICH=1 node ... --fix=1                          # + GPT for tags
 *   node ... --fix=1 --only=inkscape                               # single slug
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';
import { pathToFileURL } from 'node:url';
import { resolveOfficialUrlByDDG } from './resolve_official_url_ddg_v1.mjs';
import { isGptUrlEnabled, chooseOfficialUrlGpt } from './lib/official_url_chooser_gpt.mjs';

// ─── Config ─────────────────────────────────────────────────────────────────

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ";
const SHEET_NAME     = process.env.SHEET_NAME     || "Tabellenblatt1";
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY  = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const SA_JSON_PATH = "/opt/utildesk-motia/secrets/google-service-account.json";
const CONTENT_DIR  = process.env.CONTENT_DIR || "/opt/utildesk-motia/content/tools";

const TAG_ALLOWLIST = [
  "chatbot", "assistant", "writing", "content", "marketing", "seo", "social-media",
  "design", "image", "video", "audio", "transcription",
  "productivity", "automation", "workflow", "no-code",
  "data", "analytics", "spreadsheet", "crm",
  "coding", "developer-tools", "api", "translation", "education", "customer-support", "meeting",
];
const TAG_ALLOWLIST_SET = new Set(TAG_ALLOWLIST);

// ─── URL validation (mirrors resolve_official_url_ddg_v1.mjs) ───────────────

const DENY_HOST = new Set([
  'wikipedia.org','wikidata.org','wikimedia.org',
  'facebook.com','instagram.com','linkedin.com','tiktok.com','youtube.com','youtu.be',
  'twitter.com','x.com','imdb.com',
  'tripadvisor.com','booking.com','expedia.com',
  'apps.apple.com','play.google.com',
  'duckduckgo.com','google.com','bing.com',
]);
const DENY_SUBSTR = [
  'culture','mairie','stadt','gemeinde','municip','municipal','kommune','council','gov','gouv','regierung',
  'visit','tourism','tourist','stadtinfo','city',
  '/search?','/search/','?q=','&q=','utm_',
];

function isSuspiciousUrl(u) {
  try {
    const url = new URL(String(u || '').trim());
    if (!/^https?:$/.test(url.protocol)) return true;
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    const path  = (url.pathname || '').toLowerCase();
    const hp    = host + path + (url.search || '').toLowerCase();
    for (const d of DENY_HOST) {
      if (host === d || host.endsWith('.' + d)) return true;
    }
    if (path.includes('/wiki/')) return true;
    for (const sub of DENY_SUBSTR) {
      if (hp.includes(sub)) return true;
    }
    return false;
  } catch {
    return true;
  }
}

function hostnameOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); }
  catch { return ''; }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function die(msg) { console.error(`\n[ERROR] ${msg}\n`); process.exit(1); }

function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}

function colLetter(idx) {
  let n = idx + 1, s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function isMissingUrl(v) {
  const s = String(v || '').trim().toLowerCase();
  return !s || s === 'nan' || s === 'null' || s === 'undefined' || s === '""' || s === "''";
}

function extractQidFromNotes(notes) {
  const m = String(notes || '').match(/qid=(Q\d+)/i);
  return m ? m[1].toUpperCase() : null;
}

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// ─── Google Sheets client ────────────────────────────────────────────────────

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

// ─── Wikidata P856 ────────────────────────────────────────────────────────────

async function fetchWikidataP856(qid) {
  if (!qid) return null;
  try {
    const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const e = j?.entities?.[qid];
    const p856 = e?.claims?.P856;
    if (!Array.isArray(p856) || !p856[0]) return null;
    const v = p856[0]?.mainsnak?.datavalue?.value;
    if (typeof v === 'string' && v.startsWith('http')) return v;
    return null;
  } catch {
    return null;
  }
}

// ─── MD frontmatter helpers ───────────────────────────────────────────────────

/**
 * Parse frontmatter from a markdown file.
 * Returns { fm: Map<key, rawValue>, body: string after closing --- }
 */
function parseFrontmatter(md) {
  const match = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { fm: new Map(), rest: md, hasFm: false };

  const fmBody = match[1];
  const rest   = md.slice(match[0].length);
  const fm     = new Map();

  // Parse simple key: value lines AND multiline arrays (tags:\n  - item)
  const lines = fmBody.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)\s*$/);
    if (!m) { i++; continue; }
    const key = m[1];
    const rest_ = m[2].trim();

    // Check if this is a block sequence (next lines are "  - item")
    if (rest_ === '' || rest_ === '[]') {
      const items = [];
      let j = i + 1;
      while (j < lines.length && /^\s{2}-\s/.test(lines[j])) {
        items.push(lines[j].replace(/^\s{2}-\s/, '').trim());
        j++;
      }
      if (items.length > 0) {
        fm.set(key, { type: 'array', items });
        i = j;
        continue;
      }
    }
    fm.set(key, { type: 'scalar', value: rest_ });
    i++;
  }

  return { fm, rest, hasFm: true, rawFmBody: fmBody };
}

/**
 * Serialize frontmatter map back to YAML string (between --- markers).
 */
function serializeFrontmatter(fm) {
  const preferred = ['slug','title','category','price_model','tags','official_url','affiliate_url','created_at','popularity'];
  const lines = [];
  const seen = new Set();

  function renderKey(key, val) {
    if (val.type === 'array') {
      if (!val.items || val.items.length === 0) return `${key}: []`;
      return `${key}:\n` + val.items.map(it => `  - ${it}`).join('\n');
    }
    return `${key}: ${val.value}`;
  }

  for (const k of preferred) {
    if (fm.has(k)) {
      lines.push(renderKey(k, fm.get(k)));
      seen.add(k);
    }
  }
  for (const [k, v] of fm.entries()) {
    if (seen.has(k)) continue;
    lines.push(renderKey(k, v));
  }
  return lines.join('\n');
}

/**
 * Update official_url (and optionally tags) in a markdown file.
 * Preserves all other frontmatter fields.
 */
function updateMdFrontmatter(mdPath, updates) {
  const md = fs.readFileSync(mdPath, 'utf8');
  const { fm, rest, hasFm } = parseFrontmatter(md);

  if (!hasFm) {
    // No frontmatter – cannot safely update; skip
    return { ok: false, reason: 'no_frontmatter' };
  }

  let changed = false;

  if (updates.official_url !== undefined) {
    const quoted = `"${String(updates.official_url).replace(/"/g, '\\"')}"`;
    const prev = fm.get('official_url');
    if (!prev || prev.value !== quoted) {
      fm.set('official_url', { type: 'scalar', value: quoted });
      changed = true;
    }
  }

  if (updates.affiliate_url !== undefined && updates.affiliate_url) {
    const quoted = `"${String(updates.affiliate_url).replace(/"/g, '\\"')}"`;
    fm.set('affiliate_url', { type: 'scalar', value: quoted });
    changed = true;
  }

  if (updates.tags !== undefined && Array.isArray(updates.tags) && updates.tags.length > 0) {
    const prev = fm.get('tags');
    const prevEmpty = !prev || prev.type !== 'array' || !prev.items?.length;
    if (prevEmpty) {
      fm.set('tags', { type: 'array', items: updates.tags });
      changed = true;
    }
  }

  if (!changed) return { ok: true, changed: false };

  const newMd = `---\n${serializeFrontmatter(fm)}\n---\n` + rest;
  fs.writeFileSync(mdPath, newMd, 'utf8');
  return { ok: true, changed: true };
}

/**
 * Read tags from a markdown file's frontmatter.
 * Returns [] if empty or not set.
 */
function readMdTags(mdPath) {
  try {
    const md = fs.readFileSync(mdPath, 'utf8');
    const { fm } = parseFrontmatter(md);
    const tagsEntry = fm.get('tags');
    if (!tagsEntry) return [];
    if (tagsEntry.type === 'array') return tagsEntry.items || [];
    // inline: ["tag1","tag2"] or []
    try {
      const parsed = JSON.parse(tagsEntry.value);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  } catch { return []; }
}

// ─── GPT tag enrichment (optional, USE_GPT_TAG_ENRICH=1) ─────────────────────

function asBool(v) { return /^(1|true|yes|on)$/i.test(String(v || '').trim()); }

async function enrichTagsGpt(topic, title) {
  if (!asBool(process.env.USE_GPT_TAG_ENRICH)) return { ok: false, reason: 'gpt_tag_disabled' };

  const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) return { ok: false, reason: 'no_openai_key' };

  // Dynamically import tag_enricher if available, else use inline GPT call
  try {
    const mod = await import('./lib/tag_enricher_gpt.mjs').catch(() => null);
    if (mod?.enrichTagsGpt) {
      return await mod.enrichTagsGpt({ topic, title, tags: [] });
    }
  } catch { /* fallback to inline */ }

  // Inline minimal tag enrichment via OpenAI
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey });
  const model  = String(process.env.GPT_TAG_MODEL || 'gpt-4o-mini');

  const prompt = {
    task: "Choose 2–4 tags from allowlist for this AI/software tool.",
    allowlist: TAG_ALLOWLIST,
    tool_topic: topic,
    tool_title: title,
    output_schema: { tags: "array_of_strings_from_allowlist" },
  };

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 100,
      messages: [
        { role: 'system', content: 'Return strict JSON only: {"tags":["tag1","tag2"]}' },
        { role: 'user',   content: JSON.stringify(prompt) },
      ],
    });
    const text = String(completion?.choices?.[0]?.message?.content || '');
    const start = text.indexOf('{');
    const end   = text.lastIndexOf('}');
    if (start < 0 || end < 0) return { ok: false, reason: 'no_json' };
    const parsed = JSON.parse(text.slice(start, end + 1));
    const tags   = (parsed.tags || []).filter(t => TAG_ALLOWLIST_SET.has(t));
    if (!tags.length) return { ok: false, reason: 'no_valid_tags' };
    return { ok: true, tags };
  } catch (err) {
    return { ok: false, reason: String(err?.message || 'gpt_error').slice(0, 120) };
  }
}

// ─── URL resolution pipeline ──────────────────────────────────────────────────

/**
 * Try to resolve official_url for a row.
 * Order: Wikidata P856 → DDG → GPT chooser.
 * Returns { ok, url, source, confidence, candidates }
 */
async function resolveUrl({ topic, slug, notes, wikidataId }) {
  const token = slugify(slug || topic).split('-')[0] || '';

  // 1. Wikidata P856
  const qid = wikidataId || extractQidFromNotes(notes);
  if (qid) {
    const wdUrl = await fetchWikidataP856(qid);
    if (wdUrl && !isSuspiciousUrl(wdUrl)) {
      return { ok: true, url: wdUrl, source: 'wikidata_p856', confidence: 1.0, candidates: [wdUrl] };
    }
  }

  // 2. DDG resolver
  const q = `${topic} official site`;
  const ddgResult = await resolveOfficialUrlByDDG(q, token);

  // 3. GPT chooser (when enabled and multiple candidates available)
  if (isGptUrlEnabled() && ddgResult.candidates?.length >= 1) {
    const candidateUrls = ddgResult.candidates.filter(u => !isSuspiciousUrl(u));
    if (candidateUrls.length) {
      const gptResult = await chooseOfficialUrlGpt({
        topic,
        token,
        candidates: candidateUrls.map((u, i) => ({ url: u, rank: i, score: 0, source: 'ddg' })),
      });
      if (gptResult.ok && gptResult.official_url && !isSuspiciousUrl(gptResult.official_url)) {
        return {
          ok: true, url: gptResult.official_url,
          source: 'gpt', confidence: gptResult.confidence,
          candidates: candidateUrls, gpt_reason: gptResult.reason,
        };
      }
    }
  }

  if (ddgResult.ok && !isSuspiciousUrl(ddgResult.official_url)) {
    return {
      ok: true, url: ddgResult.official_url,
      source: 'ddg', confidence: 0.8,
      candidates: ddgResult.candidates || [],
    };
  }

  return {
    ok: false,
    reason: ddgResult.reason || 'no_valid_url',
    candidates: ddgResult.candidates || [],
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const argv    = process.argv.slice(2);
  const fix     = argv.some(a => a === '--fix=1' || a === '--fix');
  const onlyRaw = (argv.find(a => a.startsWith('--only=')) || '').replace('--only=', '').trim().toLowerCase();

  console.error(`[audit_done_missing_official_url] mode=${fix ? 'FIX' : 'DRY-RUN'} ts=${nowIso()}`);

  const sheets = await sheetsClient();
  const range  = `${SHEET_NAME}!A1:P`;
  const res    = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
  const values = res.data.values || [];
  if (values.length < 2) die('Sheet has no data rows');

  const header = (values[0] || []).map(h => String(h || '').trim());
  const idx    = Object.fromEntries(header.map((h, i) => [h, i]));

  const required = ['topic', 'slug', 'status', 'notes', 'official_url'];
  const missing  = required.filter(k => !(k in idx));
  if (missing.length) die(`Missing columns: ${missing.join(', ')}`);

  const colStatus    = colLetter(idx.status);
  const colNotes     = colLetter(idx.notes);
  const colOfficial  = colLetter(idx.official_url);
  const hasWdCol     = 'wikidata_id' in idx;
  const hasTitleCol  = 'title' in idx;

  // ── Scan: find DONE rows missing official_url ──────────────────────────────
  const candidates = [];

  for (let i = 1; i < values.length; i++) {
    const row    = values[i] || [];
    const topic  = String(row[idx.topic]        || '').trim();
    const slug   = String(row[idx.slug]         || '').trim();
    const status = String(row[idx.status]       || '').trim();
    const offUrl = String(row[idx.official_url] || '').trim();
    const notes  = String(row[idx.notes]        || '').trim();
    const wdId   = hasWdCol ? String(row[idx.wikidata_id] || '').trim() : '';
    const title  = hasTitleCol ? String(row[idx.title] || '').trim() : topic;

    if (!topic) continue;
    if (status !== 'DONE') continue;
    if (!isMissingUrl(offUrl)) continue;

    if (onlyRaw && slug.toLowerCase() !== onlyRaw && topic.toLowerCase() !== onlyRaw) continue;

    candidates.push({ rowNumber: i + 1, topic, slug, title, status, notes, wikidataId: wdId });
  }

  // ── Report table ──────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`DONE rows missing official_url — found: ${candidates.length}`);
  console.log(`${'─'.repeat(80)}`);
  if (candidates.length > 0) {
    console.log(`${'#'.padEnd(5)} ${'row'.padEnd(5)} ${'slug'.padEnd(30)} ${'wikidata_id'.padEnd(14)} notes`);
    console.log(`${'─'.repeat(80)}`);
    candidates.forEach((c, i) => {
      const wd = c.wikidataId || (extractQidFromNotes(c.notes) || '—');
      const notesShort = c.notes.slice(0, 30);
      console.log(`${String(i + 1).padEnd(5)} ${String(c.rowNumber).padEnd(5)} ${c.slug.padEnd(30)} ${wd.padEnd(14)} ${notesShort}`);
    });
  }
  console.log('');

  if (!fix) {
    // JSON summary for dry-run
    const summary = {
      ok: true,
      mode: 'dry-run',
      found: candidates.length,
      rows: candidates.map(c => ({
        row: c.rowNumber, slug: c.slug, topic: c.topic, wikidata_id: c.wikidataId,
      })),
      hint: 'Run with --fix=1 to apply repairs.',
    };
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  // ── Fix mode ──────────────────────────────────────────────────────────────
  console.error(`[audit_done_missing_official_url] Starting repairs for ${candidates.length} rows…`);

  const batchUpdates = [];
  const report = [];

  let fixedUrl  = 0;  // URL found + written to sheet + MD
  let fixedTags = 0;  // tags also enriched
  let reviewed  = 0;  // moved to NEEDS_REVIEW (no URL found)

  for (const c of candidates) {
    const { rowNumber, topic, slug, title, notes, wikidataId } = c;
    const mdPath = path.join(CONTENT_DIR, `${slug}.md`);
    const mdExists = fs.existsSync(mdPath);

    console.error(`\n[fix] row=${rowNumber} slug=${slug} …`);

    // Resolve URL
    const resolved = await resolveUrl({ topic, slug, notes, wikidataId });

    if (!resolved.ok) {
      // ── No URL found → NEEDS_REVIEW ───────────────────────────────────────
      const newNote = `${notes} | audit:missing_url:blocked (${resolved.reason})`.trim().slice(0, 50000);
      batchUpdates.push(
        { range: `${SHEET_NAME}!${colStatus}${rowNumber}`,   values: [['NEEDS_REVIEW']] },
        { range: `${SHEET_NAME}!${colNotes}${rowNumber}`,    values: [[newNote]] },
      );
      report.push({ row: rowNumber, slug, action: 'NEEDS_REVIEW', reason: resolved.reason, candidates: resolved.candidates.slice(0, 5) });
      reviewed++;
      console.error(`[fix] row=${rowNumber} slug=${slug} → NEEDS_REVIEW (${resolved.reason})`);
      continue;
    }

    // ── URL found ──────────────────────────────────────────────────────────
    const url  = resolved.url;
    const host = hostnameOf(url);
    console.error(`[fix] row=${rowNumber} slug=${slug} URL=${url} source=${resolved.source}`);

    // Check tags
    let tags         = mdExists ? readMdTags(mdPath) : [];
    let tagsEnriched = false;
    let tagsNeedReview = false;
    let tagNote      = '';

    const tagsEmpty = !tags.length || (tags.length === 1 && tags[0] === 'ai');
    if (tagsEmpty) {
      const tagResult = await enrichTagsGpt(topic, title);
      if (tagResult.ok && tagResult.tags?.length) {
        tags         = tagResult.tags;
        tagsEnriched = true;
        tagNote      = `tags_enriched:gpt[${tags.join(',')}]`;
        fixedTags++;
      } else {
        tagsNeedReview = true;
        tagNote        = `tags_empty:needs_review`;
      }
    }

    // Determine final sheet status
    const finalStatus = tagsNeedReview ? 'NEEDS_REVIEW' : 'DONE';

    // Build note
    const noteFragment = `audit:url_fixed:${resolved.source}:${host} ${tagNote}`.trim();
    const newNote      = `${notes} | ${noteFragment}`.trim().slice(0, 50000);

    // Sheet updates
    batchUpdates.push(
      { range: `${SHEET_NAME}!${colOfficial}${rowNumber}`, values: [[url]] },
      { range: `${SHEET_NAME}!${colNotes}${rowNumber}`,    values: [[newNote]] },
    );
    // Only change status if we need to downgrade to NEEDS_REVIEW
    if (finalStatus !== 'DONE') {
      batchUpdates.push(
        { range: `${SHEET_NAME}!${colStatus}${rowNumber}`, values: [[finalStatus]] },
      );
    }

    // MD frontmatter update
    let mdUpdated = false;
    let mdResult  = { ok: false, reason: 'no_md' };
    if (mdExists) {
      const mdUpdates = { official_url: url };
      if (tagsEnriched && tags.length) mdUpdates.tags = tags;
      mdResult  = updateMdFrontmatter(mdPath, mdUpdates);
      mdUpdated = mdResult.ok && mdResult.changed;
    }

    fixedUrl++;
    report.push({
      row: rowNumber, slug,
      action: 'FIXED',
      url, source: resolved.source, confidence: resolved.confidence,
      status: finalStatus,
      tags_before: tagsEmpty ? '[]' : tags.join(','),
      tags_after: tagsEnriched ? tags.join(',') : '(unchanged)',
      md_updated: mdUpdated,
      candidates: resolved.candidates.slice(0, 5),
    });
    console.error(`[fix] row=${rowNumber} slug=${slug} → FIXED url=${url} status=${finalStatus} md=${mdUpdated}`);
  }

  // ── Apply sheet batch ─────────────────────────────────────────────────────
  if (batchUpdates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: batchUpdates },
    });
  }

  // ── Final report ──────────────────────────────────────────────────────────
  const summary = {
    ok: true,
    mode: 'fix',
    ts: nowIso(),
    scanned: candidates.length,
    fixed_url: fixedUrl,
    fixed_tags: fixedTags,
    moved_to_needs_review: reviewed,
    detail: report,
  };
  console.log(JSON.stringify(summary, null, 2));
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const isDirectRun = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  try { return import.meta.url === pathToFileURL(entry).href; }
  catch { return false; }
})();

if (isDirectRun) {
  main().catch(e => { console.error(e?.stack || String(e)); process.exit(1); });
}

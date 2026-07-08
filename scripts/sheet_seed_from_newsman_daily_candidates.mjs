#!/usr/bin/env node
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { google } from 'googleapis';
import { resolveOfficialUrlByDDG } from './resolve_official_url_ddg_v1.mjs';
import { validateOfficialUrl, normalizeHost } from './lib/url_policy.mjs';
import { normalizeTags } from './lib/tag_policy.mjs';

const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || 'secrets/google-service-account.json';
const SERVICE_ACCOUNT = loadServiceAccount();
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || SERVICE_ACCOUNT.client_email || '';
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || SERVICE_ACCOUNT.private_key || '').replace(/\\n/g, '\n');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const SHOW_SKIPPED = args.includes('--show-skipped');
const INPUT = valueArg('--input') || 'data/tool_candidates/daily_candidates.jsonl';
const SINCE = valueArg('--since') || '';
const LIMIT = Number(valueArg('--limit') || 20);
const MIN_SCORE = Number(valueArg('--min-score') || 12);
const DEFAULT_STATUS = (valueArg('--status') || 'NEEDS_REVIEW').toUpperCase();
const RESOLVE_MISSING = args.includes('--resolve-missing');
const RESOLVE_LIMIT = Number(valueArg('--resolve-limit') || 12);

function valueArg(name) {
  const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
  if (prefixed) return prefixed.slice(name.length + 1);
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : '';
}

function die(message) {
  console.error(`\n[ERROR] ${message}\n`);
  process.exit(1);
}

function loadServiceAccount() {
  if (!existsSync(SERVICE_ACCOUNT_PATH)) return {};
  try {
    return JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function categoryFrom(candidate) {
  const raw = String(candidate.category_guess || '').trim().toLowerCase();
  const text = `${candidate.tool_name || ''} ${candidate.source_item_title || ''} ${candidate.short_description_en_if_available || ''}`.toLowerCase();
  if (raw.includes('agent') || /\bagent|automation|workflow|browser-use\b/.test(text)) return 'AI Agents';
  if (raw.includes('developer') || /\bdeveloper|code|coding|github|swe-bench|benchmark\b/.test(text)) return 'Developer Tools';
  if (raw.includes('search') || /\bsearch|seo|visibility|crawler\b/.test(text)) return 'Marketing & Vertrieb';
  if (raw.includes('audio') || /\baudio|voice|speech|meeting|transcription\b/.test(text)) return 'Audio & Video';
  if (raw.includes('video') || /\bvideo|director|film|runway\b/.test(text)) return 'Audio & Video';
  if (raw.includes('design') || /\bdesign|figma|image|creative\b/.test(text)) return 'Design & Kreativität';
  if (raw.includes('productivity') || /\bcalendar|task|notes|email|productivity\b/.test(text)) return 'Produktivität';
  return 'Automatisierung';
}

function tagsFrom(candidate) {
  const tags = new Set(
    (Array.isArray(candidate.tags_guess) ? candidate.tags_guess : [])
      .map((tag) => String(tag || '').toLowerCase().trim())
      .filter(Boolean),
  );
  const text = `${candidate.tool_name || ''} ${candidate.source_item_title || ''} ${candidate.short_description_en_if_available || ''}`.toLowerCase();
  tags.add('ai');
  if (/\bagent|agents\b/.test(text)) tags.add('agents');
  if (/\bautomation|workflow\b/.test(text)) tags.add('automation');
  if (/\bdeveloper|code|coding|swe-bench|benchmark\b/.test(text)) tags.add('developer-tools');
  if (/\bsearch|seo|crawler|visibility\b/.test(text)) tags.add('search');
  if (/\bvideo|director\b/.test(text)) tags.add('video');
  if (/\bvoice|audio|speech|meeting|transcription\b/.test(text)) tags.add('audio');
  if (/\bdesign|figma|image|creative\b/.test(text)) tags.add('design');
  if (/\bemail|calendar|task|notes|productivity\b/.test(text)) tags.add('productivity');
  return normalizeTags([...tags], { maxTags: 5, preserveUnknown: true }).tags.join(',');
}

function loadJsonl(path) {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSONL at line ${index + 1}: ${error.message}`);
      }
    });
}

async function sheetsClient() {
  if (!SPREADSHEET_ID) die('Missing SPREADSHEET_ID');
  if (!GOOGLE_CLIENT_EMAIL) die('Missing GOOGLE_CLIENT_EMAIL');
  if (!GOOGLE_PRIVATE_KEY) die('Missing GOOGLE_PRIVATE_KEY');
  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

async function readSheetKeys() {
  const sheets = await sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:P`,
  });
  const rows = res.data.values || [];
  if (!rows.length) die('Empty sheet');
  const header = rows[0].map((cell) => String(cell || '').trim().toLowerCase());
  const idx = Object.fromEntries(header.map((name, index) => [name, index]));
  for (const key of ['topic', 'slug', 'official_url']) {
    if (!(key in idx)) die(`Missing sheet column: ${key}`);
  }

  const topics = new Set();
  const slugs = new Set();
  const hosts = new Set();
  for (const row of rows.slice(1)) {
    const status = String(row[idx.status] || '').trim().toUpperCase();
    if (status === 'BLACKLIST') continue;
    const topic = String(row[idx.topic] || '').trim().toLowerCase();
    const slug = String(row[idx.slug] || '').trim().toLowerCase();
    const host = normalizeHost(row[idx.official_url] || '');
    if (topic) topics.add(topic);
    if (slug) slugs.add(slug);
    if (host) hosts.add(host);
  }
  return { topics, slugs, hosts };
}

function readContentSlugs() {
  const slugs = new Set();
  for (const dir of ['content/tools', 'content/en/tools']) {
    let files = [];
    try {
      files = readdirSync(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (file.endsWith('.md')) slugs.add(file.replace(/\.md$/, '').toLowerCase());
    }
  }
  return slugs;
}

function isTooGenericName(name) {
  const normalized = String(name || '').trim().toLowerCase();
  return !normalized || normalized.length < 4 || ['design', 'browser', 'senior', 'mark', 'sequence', 'act', 'flow'].includes(normalized);
}

async function main() {
  const rows = loadJsonl(INPUT);
  const latestAt = rows.reduce((max, row) => {
    const value = String(row.discovered_at || '');
    return value > max ? value : max;
  }, '');
  const effectiveSince = SINCE || latestAt;
  const sheetKeys = await readSheetKeys();
  const contentSlugs = readContentSlugs();
  const seenSlugs = new Set();
  const seenHosts = new Set();
  const accepted = [];
  const skipped = [];
  let resolveAttempts = 0;

  const candidates = rows
    .filter((row) => String(row.discovered_at || '') >= effectiveSince)
    .sort((a, b) => Number(b.ai_relevance_score || 0) - Number(a.ai_relevance_score || 0));

  for (const candidate of candidates) {
    if (accepted.length >= LIMIT) break;
    const topic = String(candidate.tool_name || candidate.source_item_title || '').trim();
    const slug = slugify(candidate.slug_candidate || topic);
    let officialUrl = String(candidate.official_url_guess || '').trim();
    const score = Number(candidate.ai_relevance_score || 0);

    const reject = (reason) => skipped.push({ topic, slug, reason, score, official_url: officialUrl });
    if (score < MIN_SCORE) {
      reject('score_below_minimum');
      continue;
    }
    if (isTooGenericName(topic)) {
      reject('generic_or_ambiguous_name');
      continue;
    }
    if (sheetKeys.topics.has(topic.toLowerCase()) || sheetKeys.slugs.has(slug) || contentSlugs.has(slug)) {
      reject('duplicate_topic_or_slug');
      continue;
    }

    if (!officialUrl && RESOLVE_MISSING && resolveAttempts < RESOLVE_LIMIT) {
      resolveAttempts += 1;
      const query = String(candidate.source_item_title || topic).trim();
      const resolved = await resolveOfficialUrlByDDG(query, slug.split('-')[0] || slug);
      if (resolved?.ok && resolved.official_url) {
        officialUrl = String(resolved.official_url).trim();
      }
    }
    if (!officialUrl) {
      reject('missing_official_url_guess');
      continue;
    }

    const host = normalizeHost(officialUrl);
    if ((host && sheetKeys.hosts.has(host)) || seenHosts.has(host)) {
      reject('duplicate_official_host');
      continue;
    }
    if (seenSlugs.has(slug)) {
      reject('duplicate_in_batch');
      continue;
    }

    const validation = validateOfficialUrl(officialUrl, { slug, title: topic });
    if (!validation.ok) {
      reject(`official_url_blocked:${validation.reason || 'validation_failed'}`);
      continue;
    }
    if (RESOLVE_MISSING && validation.flags?.includes('hostname_mismatch')) {
      reject('resolved_url_hostname_mismatch');
      continue;
    }

    const tags = tagsFrom(candidate);
    const specificTags = tags.split(',').filter((tag) => tag && !['ai', 'assistant', 'productivity'].includes(tag));
    if (!specificTags.length) {
      reject('tags_not_specific_enough');
      continue;
    }

    const status = DEFAULT_STATUS === 'NEW' ? 'NEW' : 'NEEDS_REVIEW';
    const note = [
      'newsman_daily_seed',
      `discovered_at=${candidate.discovered_at || ''}`,
      `source=${candidate.source_name || ''}`,
      `source_url=${candidate.source_item_url || ''}`,
      `score=${candidate.ai_relevance_score || ''}`,
      validation.flags?.length ? `url_flags=${validation.flags.join(',')}` : '',
    ].filter(Boolean).join(' ');

    accepted.push([
      topic,
      slug,
      categoryFrom(candidate),
      tags,
      candidate.price_model_guess || '',
      '',
      status,
      note,
      '',
      candidate.short_description_en_if_available || '',
      officialUrl,
      '',
      '',
      '',
      '',
      '',
    ]);
    seenSlugs.add(slug);
    if (host) seenHosts.add(host);
  }

  let writer = null;
  if (APPLY && accepted.length) {
    const out = spawnSync('node', ['scripts/sheet_write_rows_strict_AP_v2.mjs'], {
      input: JSON.stringify({ rows: accepted }),
      encoding: 'utf8',
      cwd: process.cwd(),
      env: {
        ...process.env,
        SPREADSHEET_ID,
        SHEET_NAME,
        GOOGLE_CLIENT_EMAIL,
        GOOGLE_PRIVATE_KEY,
      },
    });
    if (out.status !== 0) die(out.stderr || out.stdout || 'writer failed');
    writer = JSON.parse(out.stdout);
  }

  const result = {
    ok: true,
    input: INPUT,
    latest_discovered_at: latestAt,
    since: effectiveSince,
    apply: APPLY,
    resolve_missing: RESOLVE_MISSING,
    resolve_attempts: resolveAttempts,
    accepted_count: accepted.length,
    accepted: accepted.map((row) => ({
      topic: row[0],
      slug: row[1],
      category: row[2],
      tags: row[3],
      status: row[6],
      official_url: row[10],
    })),
    ...(writer ? { writer } : {}),
    ...(SHOW_SKIPPED ? { skipped } : { skipped_count: skipped.length }),
  };
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => die(error.stack || String(error)));

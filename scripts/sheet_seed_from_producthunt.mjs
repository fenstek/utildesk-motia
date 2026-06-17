#!/usr/bin/env node
/**
 * Seed tool candidates from Product Hunt GraphQL API into Sheet A..P.
 *
 * Default mode is dry-run. Apply writes rows through sheet_write_rows_strict_AP_v2.mjs.
 *
 * Required env:
 *   PRODUCTHUNT_ACCESS_TOKEN  Bearer token for Product Hunt API v2
 *
 * Optional env:
 *   PRODUCTHUNT_TOPICS        Comma-separated topic slugs (default: artificial-intelligence)
 *   PRODUCTHUNT_POSTED_AFTER_DAYS  Lookback window in days (default: 30)
 *   PRODUCTHUNT_MIN_VOTES     Minimum votes threshold (default: 150)
 *   PRODUCTHUNT_FEATURED      1/0 whether to request featured posts only (default: 1)
 *
 * Usage:
 *   node scripts/sheet_seed_from_producthunt.mjs --dry-run --limit 20 --json
 *   node scripts/sheet_seed_from_producthunt.mjs --apply --limit 20
 */

import 'dotenv/config';
import process from 'node:process';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { google } from 'googleapis';
import { normalizeDocsUrl, validateOfficialUrl } from './lib/url_policy.mjs';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const PRODUCTHUNT_ACCESS_TOKEN = process.env.PRODUCTHUNT_ACCESS_TOKEN || '';
const PRODUCTHUNT_TOPICS = String(process.env.PRODUCTHUNT_TOPICS || 'artificial-intelligence')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const PRODUCTHUNT_POSTED_AFTER_DAYS = Math.max(1, Number(process.env.PRODUCTHUNT_POSTED_AFTER_DAYS || '30') || 30);
const PRODUCTHUNT_MIN_VOTES = Math.max(0, Number(process.env.PRODUCTHUNT_MIN_VOTES || '150') || 150);
const PRODUCTHUNT_FEATURED = String(process.env.PRODUCTHUNT_FEATURED || '1') !== '0';
const TOOLS_DIR = join(process.cwd(), 'content', 'tools');

const args = process.argv.slice(2);

function getFlagValue(name, fallback = '') {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  return String(args[i + 1] || fallback);
}

const limit = Math.max(1, Number(getFlagValue('--limit', '20')) || 20);
const applyMode = args.includes('--apply');
const dryRun = !applyMode || args.includes('--dry-run');
const topicFilter = getFlagValue('--topic', '');
const topics = topicFilter
  ? topicFilter.split(',').map((s) => s.trim()).filter(Boolean)
  : PRODUCTHUNT_TOPICS;

function die(msg) {
  console.error(`\n[ERROR] ${msg}\n`);
  process.exit(1);
}

if (!SPREADSHEET_ID) die('SPREADSHEET_ID env var is missing');
if (!PRODUCTHUNT_ACCESS_TOKEN) die('PRODUCTHUNT_ACCESS_TOKEN env var is missing');
if (!topics.length) die('No Product Hunt topics configured');

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function hostFromUrl(u) {
  try {
    return new URL(String(u || '').trim()).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function categoryFallback(name, tagline = '') {
  const n = `${String(name || '')} ${String(tagline || '')}`.toLowerCase();
  if (/(copilot|cursor|codeium|tabnine|replit|editor|ide|sdk|api|developer|coding|code)/i.test(n)) return 'Developer';
  if (/(midjourney|dall|stable diffusion|firefly|canva|leonardo|figma|sketch|adobe|design|image|photo)/i.test(n)) return 'Design';
  if (/(runway|pika|luma|synthesia|heygen|opus|video|premiere|editing)/i.test(n)) return 'Video';
  if (/(elevenlabs|otter|krisp|suno|udio|whisper|audio|music|sound|voice)/i.test(n)) return 'Audio';
  if (/(deepl|grammarly|jasper|copy\.ai|writesonic|quillbot|notion|text|write|document|meeting|notes)/i.test(n)) return 'Produktivit?t';
  return 'AI';
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function sheetsClient(readonly = true) {
  const ce = process.env.GOOGLE_CLIENT_EMAIL || '';
  const pk = String(process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!ce || !pk) die('Missing GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY env vars');

  const auth = new google.auth.JWT({
    email: ce,
    key: pk,
    scopes: readonly
      ? ['https://www.googleapis.com/auth/spreadsheets.readonly']
      : ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

async function readExistingSheet() {
  const sheets = await sheetsClient(true);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:P`,
  });

  const values = res.data.values || [];
  if (values.length < 2) {
    return { existingTopic: new Set(), existingSlug: new Set(), existingHost: new Set() };
  }

  const header = values[0].map((h) => String(h).trim().toLowerCase());
  const rows = values.slice(1);
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  const existingTopic = new Set();
  const existingSlug = new Set();
  const existingHost = new Set();

  for (const row of rows) {
    const topic = String(row[idx.topic] || '').trim().toLowerCase();
    const slug = String(row[idx.slug] || '').trim().toLowerCase();
    const officialUrl = idx.official_url !== undefined ? String(row[idx.official_url] || '').trim() : '';
    const host = hostFromUrl(officialUrl);

    if (topic) existingTopic.add(topic);
    if (slug) existingSlug.add(slug);
    if (host) existingHost.add(host);
  }

  return { existingTopic, existingSlug, existingHost };
}

const POSTS_QUERY = `
query ProductHuntPosts($first: Int!, $after: String, $topic: String!, $featured: Boolean, $postedAfter: DateTime) {
  posts(first: $first, after: $after, topic: $topic, featured: $featured, postedAfter: $postedAfter) {
    edges {
      cursor
      node {
        id
        name
        slug
        tagline
        url
        website
        votesCount
        commentsCount
        createdAt
        featuredAt
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;

async function productHuntRequest(query, variables) {
  const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${PRODUCTHUNT_ACCESS_TOKEN}`,
      'user-agent': 'utildesk-motia/1.0',
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await res.text();
  let payload = null;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new Error(`Product Hunt API ${res.status}: ${text.slice(0, 300)}`);
  }
  if (payload?.errors?.length) {
    throw new Error(`Product Hunt GraphQL error: ${payload.errors.map((e) => e.message).join('; ')}`);
  }

  return payload?.data || {};
}

async function fetchPostsByTopic(topic, maxItems) {
  const items = [];
  let after = null;
  const postedAfter = new Date(Date.now() - PRODUCTHUNT_POSTED_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();

  while (items.length < maxItems) {
    const pageSize = Math.min(20, maxItems - items.length);
    const data = await productHuntRequest(POSTS_QUERY, {
      first: pageSize,
      after,
      topic,
      featured: PRODUCTHUNT_FEATURED,
      postedAfter,
    });

    const edges = data?.posts?.edges || [];
    const pageInfo = data?.posts?.pageInfo || {};

    for (const edge of edges) {
      if (edge?.node) items.push(edge.node);
    }

    if (!pageInfo.hasNextPage || !pageInfo.endCursor || edges.length === 0) break;
    after = pageInfo.endCursor;
  }

  return items;
}

async function main() {
  const summary = {
    topics,
    total_fetched: 0,
    below_vote_threshold: 0,
    invalid_official_url: 0,
    dedup_skipped: 0,
    already_in_sheet: 0,
    already_has_file: 0,
    to_add: 0,
    written: 0,
    errors: [],
  };

  const { existingTopic, existingSlug, existingHost } = await readExistingSheet();
  const seen = new Set();
  const candidates = [];

  for (const topic of topics) {
    const posts = await fetchPostsByTopic(topic, limit * 3);
    summary.total_fetched += posts.length;

    for (const post of posts) {
      const name = String(post?.name || '').trim();
      const tagline = String(post?.tagline || '').trim();
      const votesCount = Number(post?.votesCount || 0);
      const productHuntUrl = String(post?.url || '').trim();
      const rawWebsite = String(post?.website || '').trim();
      const slug = slugify(name);
      const topicKey = name.toLowerCase();

      if (!name || !slug) continue;
      if (votesCount < PRODUCTHUNT_MIN_VOTES) {
        summary.below_vote_threshold += 1;
        continue;
      }

      const normalizedWebsite = normalizeDocsUrl(rawWebsite);
      const urlValidation = normalizedWebsite
        ? validateOfficialUrl(normalizedWebsite, { slug, title: name })
        : { ok: false, reason: 'missing_url' };
      const officialUrl = urlValidation.ok ? normalizedWebsite : '';
      const host = hostFromUrl(officialUrl);

      if (!officialUrl) {
        summary.invalid_official_url += 1;
      }

      const dedupKey = `${slug}|${host}`;
      if (seen.has(dedupKey)) {
        summary.dedup_skipped += 1;
        continue;
      }
      seen.add(dedupKey);

      if (existingTopic.has(topicKey) || existingSlug.has(slug) || (host && existingHost.has(host))) {
        summary.already_in_sheet += 1;
        continue;
      }

      const filePath = join(TOOLS_DIR, `${slug}.md`);
      if (await fileExists(filePath)) {
        summary.already_has_file += 1;
        continue;
      }

      candidates.push({
        topic: name,
        slug,
        category: categoryFallback(name, tagline),
        short_hint: tagline,
        official_url: officialUrl,
        notes: `PRODUCTHUNT_SEED topic=${topic} votes=${votesCount} ph_url=${productHuntUrl}`.slice(0, 500),
        status: 'NEEDS_REVIEW',
      });

      if (candidates.length >= limit) break;
    }

    if (candidates.length >= limit) break;
  }

  summary.to_add = candidates.length;

  if (!candidates.length) {
    const out = { summary, dry_run: dryRun, rows: [] };
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  const rows = candidates.map((item) => [
    item.topic,
    item.slug,
    item.category,
    '',
    '',
    '',
    item.status,
    item.notes,
    item.topic,
    item.short_hint,
    item.official_url,
    '',
    '',
    '',
    '',
    '',
  ]);

  if (dryRun) {
    console.log(JSON.stringify({ summary, dry_run: true, rows: candidates }, null, 2));
    return;
  }

  const payload = JSON.stringify({ rows });
  const out = spawnSync('node', ['scripts/sheet_write_rows_strict_AP_v2.mjs'], {
    input: payload,
    encoding: 'utf8',
    cwd: process.cwd(),
  });

  if (out.status !== 0) {
    summary.errors.push(out.stderr || out.stdout || 'writer failed');
    console.log(JSON.stringify({ summary, rows: [] }, null, 2));
    process.exit(1);
  }

  const writerResult = JSON.parse(out.stdout || '{}');
  summary.written = writerResult.written || 0;
  console.log(JSON.stringify({ summary, writer: writerResult, rows: candidates }, null, 2));
}

main().catch((e) => {
  console.error(`\n[ERROR] ${e?.stack || e?.message || String(e)}\n`);
  process.exit(1);
});

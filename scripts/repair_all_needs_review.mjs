#!/usr/bin/env node
import 'dotenv/config';
import { google } from 'googleapis';
import { pathToFileURL } from 'node:url';

import { resolveOfficialUrlByDDG } from './resolve_official_url_ddg_v1.mjs';
import { validateOfficialUrl, isMissingUrl, normalizeDocsUrl, normalizeHost, isDeniedFinalHost } from './lib/url_policy.mjs';
import { classifyEntity } from './lib/entity_disambiguation.mjs';
import { chooseOfficialUrlGpt, isGptUrlEnabled } from './lib/official_url_chooser_gpt.mjs';
import { enrichTagsIfGeneric } from './lib/tag_enricher_gpt.mjs';
import { resolveFinalUrl } from './lib/http_verify_url.mjs';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const SA_JSON_PATH = '/opt/utildesk-motia/secrets/google-service-account.json';

const URL_UNRESOLVED_REASON_KEYS = [
  'missing_title',
  'wikidata_no_p856',
  'ddg_no_candidates',
  'ddg_error',
  'gpt_skipped_no_candidates',
  'redirected_to_denied_host',
  'all_candidates_rejected_by_policy',
  'head_check_failed',
];

const BRAND_NOISE_TOKENS = new Set([
  'tool', 'tools', 'app', 'apps', 'free', 'download', 'online', 'software',
  'platform', 'site', 'official', 'review', 'reviews', 'alternative', 'alternatives',
  'best', 'top', 'list', 'vergleich', 'vergleichstool', 'kostenlos', 'demo', 'trial',
]);

const GENERIC_TAGS = new Set(['ai', 'productivity', 'produktivitat', 'produktivität']);
const HEURISTIC_MAP = [
  { re: /chat|assistant|copilot|agent|q&a|conversation/i, tag: 'assistant' },
  { re: /chatbot|bot/i, tag: 'chatbot' },
  { re: /write|writing|copy|blog|article|text/i, tag: 'writing' },
  { re: /content|creator|post|social/i, tag: 'content' },
  { re: /marketing|campaign|ads|advert/i, tag: 'marketing' },
  { re: /seo|search engine optimization/i, tag: 'seo' },
  { re: /image|photo|picture|design|graphic|logo/i, tag: 'image' },
  { re: /design|ui|ux|figma|mockup/i, tag: 'design' },
  { re: /video|clip|movie|editing|render/i, tag: 'video' },
  { re: /audio|voice|speech|music|podcast/i, tag: 'audio' },
  { re: /transcri|subtitle|caption/i, tag: 'transcription' },
  { re: /autom|workflow|zap|integration/i, tag: 'automation' },
  { re: /workflow|pipeline|process/i, tag: 'workflow' },
  { re: /no-code|nocode/i, tag: 'no-code' },
  { re: /data|database|etl|sql|sheet/i, tag: 'data' },
  { re: /analytics|dashboard|bi|insight/i, tag: 'analytics' },
  { re: /spreadsheet|excel|google sheets/i, tag: 'spreadsheet' },
  { re: /crm|sales|lead/i, tag: 'crm' },
  { re: /code|coding|developer|programming|github/i, tag: 'coding' },
  { re: /api|sdk|endpoint|webhook/i, tag: 'api' },
  { re: /translat|localiz/i, tag: 'translation' },
  { re: /education|learn|course|teacher|student/i, tag: 'education' },
  { re: /support|ticket|helpdesk|customer support/i, tag: 'customer-support' },
  { re: /meeting|calendar|minutes|summar/i, tag: 'meeting' },
];

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function colLetter(idx) {
  let n = idx + 1;
  let out = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function parseArgs(argv) {
  const apply = argv.includes('--apply=1') || argv.includes('--apply');
  const json = argv.includes('--json');
  const selfTest = argv.includes('--self-test');
  const limitArg = (argv.find((a) => a.startsWith('--limit=')) || '').replace('--limit=', '').trim();
  const limit = limitArg ? Math.max(1, Math.min(10000, Number(limitArg) || 0)) : 0;
  const offsetArg = (argv.find((a) => a.startsWith('--offset=')) || '').replace('--offset=', '').trim();
  const offset = Math.max(0, Number(offsetArg || 0) || 0);
  const onlyRaw = (argv.find((a) => a.startsWith('--only=')) || '').replace('--only=', '').trim();
  const only = onlyRaw ? new Set(onlyRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)) : null;
  return { apply, dryRun: !apply, json, selfTest, limit, offset, only };
}

function normalizeTags(raw) {
  const arr = Array.isArray(raw)
    ? raw
    : String(raw || '').split(',');

  const seen = new Set();
  const out = [];
  for (const t0 of arr) {
    const t = String(t0 || '').toLowerCase().trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function countSpecificTags(tags) {
  return normalizeTags(tags).filter((t) => !GENERIC_TAGS.has(t)).length;
}

function tagsNeedRepair(rawTags) {
  const tags = normalizeTags(rawTags);
  if (tags.length === 0) return true;
  if (tags.length === 1 && GENERIC_TAGS.has(tags[0])) return true;
  if (countSpecificTags(tags) === 0) return true;
  return false;
}

function buildHeuristicTags({ title, topic, description, category, existingTags }) {
  const corpus = [title, topic, description, category, existingTags.join(',')]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .join(' \n ');

  const out = [];
  for (const rule of HEURISTIC_MAP) {
    if (rule.re.test(corpus)) out.push(rule.tag);
  }

  const seen = new Set();
  const merged = [];
  for (const t of [...existingTags, ...out]) {
    const n = String(t || '').toLowerCase().trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    merged.push(n);
  }

  if (countSpecificTags(merged) === 0) {
    if (!seen.has('assistant')) merged.push('assistant');
    if (!seen.has('automation')) merged.push('automation');
  }

  if (countSpecificTags(merged) === 1) {
    if (!seen.has('workflow')) merged.push('workflow');
  }

  return normalizeTags(merged).slice(0, 6);
}

function appendNote(prev, fragment) {
  const base = String(prev || '').trim();
  const part = String(fragment || '').trim();
  if (!part) return base;
  if (!base) return part;
  if (base.includes(part)) return base;
  return `${base} | ${part}`.slice(0, 50000);
}

function tokenFromSlugOrTopic(slug, topic) {
  const src = String(slug || topic || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (src.split('-')[0] || '').trim();
}

function normalizeSlugSimple(slug) {
  return String(slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
}

function buildDomainGuessCandidates(slug) {
  const clean = normalizeSlugSimple(slug);
  const tlds = ['.com', '.ai', '.io', '.app', '.net', '.org'];
  return tlds.map((tld) => `https://${clean}${tld}`);
}

function isBrandLikeSlug(slug) {
  const clean = normalizeSlugSimple(slug);
  if (!clean) return false;
  if (!/^[a-z0-9-]{3,30}$/.test(clean)) return false;
  if (clean.startsWith('-') || clean.endsWith('-') || clean.includes('--')) return false;

  const parts = clean.split('-').filter(Boolean);
  if (!parts.length || parts.length > 4) return false;
  if (parts.some((p) => p.length < 2)) return false;
  if (parts.some((p) => BRAND_NOISE_TOKENS.has(p))) return false;

  return true;
}

function uniqueStrings(arr) {
  const out = [];
  const seen = new Set();
  for (const item of arr || []) {
    const s = String(item || '').trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function slugTokens(slug) {
  return normalizeSlugSimple(slug)
    .split('-')
    .map((x) => x.trim())
    .filter((x) => x && x.length >= 3);
}

function looksLikeSlugReference(text, slug) {
  const raw = String(text || '').toLowerCase();
  const compact = normalizeSlugSimple(slug).replace(/-/g, '');
  if (!raw || !compact) return false;

  const normalized = raw.replace(/[^a-z0-9]/g, '');
  if (normalized.includes(compact)) return true;

  const tokens = slugTokens(slug);
  if (!tokens.length) return false;

  let hits = 0;
  for (const t of tokens) {
    if (normalized.includes(t)) hits += 1;
  }
  return hits >= Math.min(2, tokens.length);
}

function buildLibraryFallbackCandidates(slug) {
  const clean = normalizeSlugSimple(slug);
  if (!clean) return [];

  const compact = clean.replace(/-/g, '');
  return uniqueStrings([
    `https://huggingface.co/${clean}`,
    compact !== clean ? `https://huggingface.co/${compact}` : '',
    `https://github.com/${clean}`,
    `https://github.com/${clean}/${clean}`,
    `https://github.com/huggingface/${clean}`,
  ]);
}

function isOfficialLookingLibraryFallback(url, slug) {
  try {
    const u = new URL(String(url || '').trim());
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const parts = u.pathname.split('/').filter(Boolean);

    if (host === 'github.com') {
      const owner = String(parts[0] || '');
      const repo = String(parts[1] || owner || '');
      return looksLikeSlugReference(owner, slug) || looksLikeSlugReference(repo, slug);
    }

    if (host === 'huggingface.co') {
      const first = String(parts[0] || '');
      const second = String(parts[1] || '');
      return looksLikeSlugReference(first, slug) || looksLikeSlugReference(second, slug);
    }

    return false;
  } catch {
    return false;
  }
}

function createUnresolvedDiagnostics() {
  const reasons = {};
  const samples = {};
  for (const key of URL_UNRESOLVED_REASON_KEYS) {
    reasons[key] = 0;
    samples[key] = [];
  }
  return { reasons, samples };
}

function markUnresolvedReason(diag, reason, slug) {
  if (!diag || !reason || !(reason in diag.reasons)) return;
  diag.reasons[reason] += 1;
  if (diag.samples[reason].length < 5) {
    diag.samples[reason].push(String(slug || '').trim() || '(no-slug)');
  }
}

function selectPrimaryUnresolvedReason(trace) {
  if (trace.missing_title) return 'missing_title';
  if (trace.ddg_error) return 'ddg_error';
  if (trace.redirected_to_denied_host) return 'redirected_to_denied_host';
  if (trace.all_candidates_rejected_by_policy) return 'all_candidates_rejected_by_policy';
  if (trace.head_check_failed) return 'head_check_failed';
  if (trace.ddg_no_candidates) return 'ddg_no_candidates';
  if (trace.gpt_skipped_no_candidates) return 'gpt_skipped_no_candidates';
  if (trace.wikidata_no_p856) return 'wikidata_no_p856';
  return 'ddg_no_candidates';
}

function selectNeedsReviewRows(values, idx, args) {
  const matched = [];
  for (let i = 1; i < values.length; i += 1) {
    const row = values[i] || [];
    const status = String(row[idx.status] || '').trim().toUpperCase();
    if (status !== 'NEEDS_REVIEW') continue;

    const slug = String(row[idx.slug] || '').trim();
    if (args.only && !args.only.has(slug.toLowerCase())) continue;

    matched.push({
      rowNumber: i + 1,
      row,
    });
  }

  matched.sort((a, b) => a.rowNumber - b.rowNumber);

  const offset = Math.max(0, Number(args.offset || 0) || 0);
  const start = Math.min(offset, matched.length);
  const end = args.limit ? Math.min(start + args.limit, matched.length) : matched.length;
  return {
    totalMatched: matched.length,
    selected: matched.slice(start, end),
  };
}

function runSelfTest() {
  const args = parseArgs(['--offset=-10', '--limit=2']);
  if (args.offset !== 0) throw new Error('self-test failed: negative offset must clamp to 0');

  const values = [
    ['topic', 'slug', 'status', 'notes', 'official_url', 'tags'],
    ['A', 'a', 'NEEDS_REVIEW', '', '', 'ai'],
    ['B', 'b', 'DONE', '', '', 'ai'],
    ['C', 'c', 'NEEDS_REVIEW', '', '', 'ai'],
    ['D', 'd', 'NEEDS_REVIEW', '', '', 'ai'],
  ];
  const idx = { topic: 0, slug: 1, status: 2, notes: 3, official_url: 4, tags: 5 };
  const picked = selectNeedsReviewRows(values, idx, { only: null, offset: 1, limit: 2 }).selected;
  const got = picked.map((x) => x.rowNumber).join(',');
  if (got !== '4,5') throw new Error(`self-test failed: expected rowNumber 4,5, got ${got}`);
  if (!isDeniedFinalHost('dot-tech.org')) throw new Error('self-test failed: dot-tech.org must be denied');
  if (!isDeniedFinalHost('www.dot-tech.org')) throw new Error('self-test failed: www.dot-tech.org must be denied');
}

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

async function resolveWikidataP856(qid) {
  if (!qid || !/^Q\d+$/.test(String(qid).trim())) return null;
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  try {
    const ac = new AbortController();
    const tid = setTimeout(() => ac.abort(), Number(process.env.WIKIDATA_FETCH_TIMEOUT_MS || 8000));
    const r = await fetch(url, { signal: ac.signal });
    clearTimeout(tid);
    if (!r.ok) return null;
    const data = await r.json();
    const entity = data?.entities?.[qid];
    const p856 = entity?.claims?.P856;
    if (!Array.isArray(p856) || !p856.length) return null;
    const preferred = p856.find((c) => c.rank === 'preferred') || p856[0];
    const rawUrl = preferred?.mainsnak?.datavalue?.value;
    return rawUrl ? String(rawUrl).trim() : null;
  } catch {
    return null;
  }
}

async function tryValidateCandidate(url, row) {
  const normalized = normalizeDocsUrl(String(url || '').trim());
  const check = validateOfficialUrl(normalized, { slug: row.slug, title: row.title || row.topic });
  if (!check.ok) return { acceptedUrl: '', rejectReason: check.reason || 'policy_reject' };

  const verified = await resolveFinalUrl(normalized, { timeoutMs: 3500, maxRedirects: 5 });
  if (verified.ok && verified.finalUrl) {
    const finalHost = normalizeHost(verified.finalUrl);
    if (isDeniedFinalHost(finalHost)) {
      return { acceptedUrl: '', rejectReason: 'redirected_to_denied_host' };
    }
  }

  return { acceptedUrl: normalized, rejectReason: '' };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.selfTest) {
    runSelfTest();
    console.log(JSON.stringify({ ok: true, self_test: true, ts: nowIso() }, null, args.json ? 0 : 2));
    return;
  }
  console.error(`[repair_all] mode=${args.apply ? 'APPLY' : 'DRY-RUN'} ts=${nowIso()} gpt_url=${isGptUrlEnabled()}`);

  const sheets = await sheetsClient();
  const range = `${SHEET_NAME}!A1:Z`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
  const values = res.data.values || [];
  if (values.length < 2) {
    console.log(JSON.stringify({ ok: true, note: 'No data rows', total_needs_review: 0 }, null, 2));
    return;
  }

  const header = (values[0] || []).map((h) => String(h || '').trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  const required = ['topic', 'slug', 'status', 'notes', 'official_url', 'tags'];
  const missingCols = required.filter((k) => !(k in idx));
  if (missingCols.length) {
    throw new Error(`Missing columns: ${missingCols.join(', ')}`);
  }

  const col = {
    status: colLetter(idx.status),
    notes: colLetter(idx.notes),
    official_url: colLetter(idx.official_url),
    tags: colLetter(idx.tags),
  };

  const queue = selectNeedsReviewRows(values, idx, args);
  const toProcess = [];
  for (const item of queue.selected) {
    const row = item.row;
    const topic = String(row[idx.topic] || '').trim();
    const slug = String(row[idx.slug] || '').trim();
    toProcess.push({
      rowNumber: item.rowNumber,
      topic,
      slug,
      title: String(row[idx.title] || row[idx.topic] || '').trim(),
      category: String(row[idx.category] || '').trim(),
      description: String(row[idx.description] || row[idx.short_description] || '').trim(),
      wikidata_id: String(row[idx.wikidata_id] || '').trim(),
      official_url: String(row[idx.official_url] || '').trim(),
      tags: String(row[idx.tags] || '').trim(),
      notes: String(row[idx.notes] || '').trim(),
      status: 'NEEDS_REVIEW',
    });
  }

  const unresolvedDiag = createUnresolvedDiagnostics();

  const summary = {
    total_needs_review: toProcess.length,
    url_fixed: 0,
    url_unresolved: 0,
    tags_fixed: 0,
    tags_unresolved: 0,
    moved_to_new: 0,
    still_needs_review: 0,
  };

  const movedToNewSlugs = [];
  const stillNeedsReview = [];
  const rowResults = [];
  const updates = [];

  for (const row of toProcess) {
    let finalUrl = row.official_url;
    let finalTags = normalizeTags(row.tags);
    let finalNotes = row.notes;

    const reasons = [];
    const actions = [];

    const initialValidation = validateOfficialUrl(finalUrl, { slug: row.slug, title: row.title || row.topic });
    const urlNeedsRepair = isMissingUrl(finalUrl) || !initialValidation.ok;

    if (urlNeedsRepair) {
      let repaired = false;
      const token = tokenFromSlugOrTopic(row.slug, row.topic);
      const queryBase = String(row.topic || row.title || row.slug || '').trim();
      const entityClass = classifyEntity(row.slug, row.title || row.topic);

      const unresolvedTrace = {
        missing_title: false,
        wikidata_no_p856: false,
        ddg_no_candidates: false,
        ddg_error: false,
        gpt_skipped_no_candidates: false,
        redirected_to_denied_host: false,
        all_candidates_rejected_by_policy: false,
        head_check_failed: false,
      };

      if (!String(row.topic || row.title || '').trim()) {
        unresolvedTrace.missing_title = true;
      }

      if (row.wikidata_id) {
        const p856 = await resolveWikidataP856(row.wikidata_id);
        if (p856) {
          const checked = await tryValidateCandidate(p856, row);
          if (checked.acceptedUrl) {
            finalUrl = checked.acceptedUrl;
            repaired = true;
            summary.url_fixed += 1;
            finalNotes = appendNote(finalNotes, 'url_repaired(method=wikidata_p856)');
            actions.push('url:fixed:wikidata_p856');
          } else {
            if (checked.rejectReason === 'redirected_to_denied_host') {
              unresolvedTrace.redirected_to_denied_host = true;
            }
            unresolvedTrace.all_candidates_rejected_by_policy = true;
          }
        } else {
          unresolvedTrace.wikidata_no_p856 = true;
        }
      }

      let ddgResult = null;
      let ddgCandidates = [];

      if (!repaired) {
        try {
          ddgResult = await resolveOfficialUrlByDDG(`${queryBase} official site`, token);
        } catch {
          ddgResult = null;
          unresolvedTrace.ddg_error = true;
        }

        ddgCandidates = uniqueStrings(ddgResult?.candidates || []);
        if (!ddgCandidates.length) unresolvedTrace.ddg_no_candidates = true;

        if (ddgResult?.ok && ddgResult.official_url) {
          const checked = await tryValidateCandidate(ddgResult.official_url, row);
          if (checked.acceptedUrl) {
            finalUrl = checked.acceptedUrl;
            repaired = true;
            summary.url_fixed += 1;
            finalNotes = appendNote(finalNotes, 'url_repaired(method=ddg)');
            actions.push('url:fixed:ddg');
          } else if (checked.rejectReason === 'redirected_to_denied_host') {
            unresolvedTrace.redirected_to_denied_host = true;
          }
        }
      }

      if (!repaired && ddgCandidates.length) {
        for (const candidate of ddgCandidates) {
          const checked = await tryValidateCandidate(candidate, row);
          if (checked.acceptedUrl) {
            finalUrl = checked.acceptedUrl;
            repaired = true;
            summary.url_fixed += 1;
            finalNotes = appendNote(finalNotes, 'url_repaired(method=ddg_candidates)');
            actions.push('url:fixed:ddg_candidates');
            break;
          }
          if (checked.rejectReason === 'redirected_to_denied_host') {
            unresolvedTrace.redirected_to_denied_host = true;
          }
        }
        if (!repaired) unresolvedTrace.all_candidates_rejected_by_policy = true;
      }

      if (!repaired && ddgCandidates.length && isGptUrlEnabled()) {
        const gpt = await chooseOfficialUrlGpt({
          topic: queryBase,
          token,
          candidates: ddgCandidates.map((u, i) => ({ url: u, rank: i + 1 })),
          defaultUrl: ddgResult?.official_url || '',
        });

        if (gpt.ok && gpt.official_url) {
          const checked = await tryValidateCandidate(gpt.official_url, row);
          if (checked.acceptedUrl) {
            finalUrl = checked.acceptedUrl;
            repaired = true;
            summary.url_fixed += 1;
            finalNotes = appendNote(finalNotes, 'url_repaired(method=gpt_candidates)');
            actions.push('url:fixed:gpt_candidates');
          } else {
            if (checked.rejectReason === 'redirected_to_denied_host') {
              unresolvedTrace.redirected_to_denied_host = true;
            }
            unresolvedTrace.all_candidates_rejected_by_policy = true;
          }
        }
      } else if (!repaired && !ddgCandidates.length && isGptUrlEnabled()) {
        unresolvedTrace.gpt_skipped_no_candidates = true;
      }

      if (!repaired && !ddgCandidates.length) {
        const fallbackCandidates = [];

        if (isBrandLikeSlug(row.slug)) {
          fallbackCandidates.push(...buildDomainGuessCandidates(row.slug));
        }

        if (entityClass === 'library_or_model') {
          fallbackCandidates.push(...buildLibraryFallbackCandidates(row.slug));
        }

        const uniqueFallbackCandidates = uniqueStrings(fallbackCandidates);

        let anyHeadCheckOk = false;
        let anyPolicyRejected = false;

        const verifiedFallback = await Promise.all(
          uniqueFallbackCandidates.map(async (candidate) => ({
            candidate,
            verified: await resolveFinalUrl(candidate, { timeoutMs: 3500, maxRedirects: 5 }),
          })),
        );

        for (const item of verifiedFallback) {
          const verified = item.verified;
          if (!verified.ok || !verified.finalUrl) {
            unresolvedTrace.head_check_failed = true;
            continue;
          }

          anyHeadCheckOk = true;
          const normalizedFinal = normalizeDocsUrl(verified.finalUrl);

          if (entityClass === 'library_or_model') {
            try {
              const host = new URL(normalizedFinal).hostname.replace(/^www\./, '').toLowerCase();
              if ((host === 'github.com' || host === 'huggingface.co') && !isOfficialLookingLibraryFallback(normalizedFinal, row.slug)) {
                anyPolicyRejected = true;
                continue;
              }
            } catch {
              anyPolicyRejected = true;
              continue;
            }
          }

          const checked = await tryValidateCandidate(normalizedFinal, row);
          if (checked.acceptedUrl) {
            finalUrl = checked.acceptedUrl;
            repaired = true;
            summary.url_fixed += 1;
            finalNotes = appendNote(finalNotes, entityClass === 'library_or_model'
              ? 'url_repaired(method=fallback_library_or_guess)'
              : 'url_repaired(method=fallback_domain_guess)');
            actions.push(entityClass === 'library_or_model'
              ? 'url:fixed:fallback_library_or_guess'
              : 'url:fixed:fallback_domain_guess');
            break;
          }

          if (checked.rejectReason === 'redirected_to_denied_host') {
            unresolvedTrace.redirected_to_denied_host = true;
          }
          anyPolicyRejected = true;
        }

        if (!repaired && !anyHeadCheckOk && uniqueFallbackCandidates.length > 0) {
          unresolvedTrace.head_check_failed = true;
        }
        if (!repaired && anyPolicyRejected) {
          unresolvedTrace.all_candidates_rejected_by_policy = true;
        }
      }

      if (!repaired) {
        summary.url_unresolved += 1;
        finalNotes = appendNote(finalNotes, 'url_unresolved');

        const primaryUnresolvedReason = selectPrimaryUnresolvedReason(unresolvedTrace);
        reasons.push(primaryUnresolvedReason);

        const reasonSet = new Set([primaryUnresolvedReason]);
        for (const key of URL_UNRESOLVED_REASON_KEYS) {
          if (unresolvedTrace[key]) reasonSet.add(key);
        }
        for (const reason of reasonSet) {
          markUnresolvedReason(unresolvedDiag, reason, row.slug);
        }

        if (args.apply) {
          updates.push(
            { range: `${SHEET_NAME}!${col.notes}${row.rowNumber}`, values: [[finalNotes]] },
          );
        }

        rowResults.push({
          row: row.rowNumber,
          slug: row.slug,
          moved_to_new: false,
          reasons: Array.from(new Set(reasons)),
          actions,
        });

        stillNeedsReview.push({ slug: row.slug, row: row.rowNumber, reasons: Array.from(new Set(reasons)) });
        continue;
      }
    }

    const hadTagIssue = tagsNeedRepair(finalTags);
    if (hadTagIssue) {
      const enrich = await enrichTagsIfGeneric({
        title: row.title || row.topic,
        short_hint: row.category,
        description: row.description,
        tags: finalTags,
        official_url: finalUrl,
      });

      let candidateTags = normalizeTags(enrich?.tags || finalTags);
      const heuristicTags = buildHeuristicTags({
        title: row.title,
        topic: row.topic,
        description: row.description,
        category: row.category,
        existingTags: candidateTags,
      });

      if (countSpecificTags(candidateTags) < 2) {
        candidateTags = normalizeTags([...candidateTags, ...heuristicTags]);
      }

      if (countSpecificTags(candidateTags) >= 1) {
        finalTags = candidateTags;
        summary.tags_fixed += 1;
        actions.push('tags:fixed:gpt+heuristic');
      } else {
        summary.tags_unresolved += 1;
        finalNotes = appendNote(finalNotes, 'tags_unresolved');
        reasons.push('tags_unresolved');
      }
    }

    const finalValidation = validateOfficialUrl(finalUrl, { slug: row.slug, title: row.title || row.topic });
    const hasSpecificTag = countSpecificTags(finalTags) >= 1;

    let nextStatus = 'NEEDS_REVIEW';
    if (finalValidation.ok && hasSpecificTag) {
      nextStatus = 'NEW';
      summary.moved_to_new += 1;
      movedToNewSlugs.push(row.slug);
      finalNotes = appendNote(finalNotes, 'auto_repaired_full');
      actions.push('status:NEW');
    } else {
      if (!finalValidation.ok) reasons.push(`invalid_url:${finalValidation.reason || 'unknown'}`);
      if (!hasSpecificTag) reasons.push('missing_specific_tags');
      stillNeedsReview.push({ slug: row.slug, row: row.rowNumber, reasons: Array.from(new Set(reasons)) });
    }

    if (args.apply) {
      const rowUpdates = [];

      if (finalUrl !== row.official_url) {
        rowUpdates.push({ range: `${SHEET_NAME}!${col.official_url}${row.rowNumber}`, values: [[finalUrl]] });
      }

      const finalTagsCsv = finalTags.join(',');
      if (finalTagsCsv !== row.tags) {
        rowUpdates.push({ range: `${SHEET_NAME}!${col.tags}${row.rowNumber}`, values: [[finalTagsCsv]] });
      }

      if (nextStatus !== row.status) {
        rowUpdates.push({ range: `${SHEET_NAME}!${col.status}${row.rowNumber}`, values: [[nextStatus]] });
      }

      if (finalNotes !== row.notes) {
        rowUpdates.push({ range: `${SHEET_NAME}!${col.notes}${row.rowNumber}`, values: [[finalNotes]] });
      }

      updates.push(...rowUpdates);
    }

    rowResults.push({
      row: row.rowNumber,
      slug: row.slug,
      moved_to_new: nextStatus === 'NEW',
      reasons: Array.from(new Set(reasons)),
      actions,
    });
  }

  summary.still_needs_review = summary.total_needs_review - summary.moved_to_new;

  if (args.apply && updates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates,
      },
    });
  }

  const output = {
    ok: true,
    mode: args.apply ? 'apply' : 'dry-run',
    ts: nowIso(),
    offset: args.offset,
    limit: args.limit,
    needs_review_pool_size: queue.totalMatched,
    ...summary,
    url_unresolved_reasons: unresolvedDiag.reasons,
    samples_by_reason: unresolvedDiag.samples,
    moved_to_new_slugs: movedToNewSlugs,
    still_needs_review_rows: stillNeedsReview,
    applied_updates: args.apply ? updates.length : 0,
  };

  if (!args.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(JSON.stringify(output));
  }

  if (args.apply && movedToNewSlugs.length) {
    console.log('\nMOVED_TO_NEW_SLUGS');
    for (const slug of movedToNewSlugs) console.log(slug);
  }

  if (args.apply && stillNeedsReview.length) {
    console.log('\nSTILL_NEEDS_REVIEW');
    for (const r of stillNeedsReview) {
      console.log(`${r.row}\t${r.slug}\t${r.reasons.join(';')}`);
    }
  }
}

const isDirectRun = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return import.meta.url === pathToFileURL(entry).href;
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  main().catch((e) => {
    console.error(e?.stack || String(e));
    process.exit(1);
  });
}

#!/usr/bin/env node
import 'dotenv/config';
import { google } from 'googleapis';
import { pathToFileURL } from 'node:url';

import { resolveOfficialUrlByDDG } from './resolve_official_url_ddg_v1.mjs';
import { validateOfficialUrl, isMissingUrl, normalizeDocsUrl } from './lib/url_policy.mjs';
import { chooseOfficialUrlGpt, isGptUrlEnabled } from './lib/official_url_chooser_gpt.mjs';
import { enrichTagsIfGeneric } from './lib/tag_enricher_gpt.mjs';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const SA_JSON_PATH = '/opt/utildesk-motia/secrets/google-service-account.json';

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
  const limitArg = (argv.find((a) => a.startsWith('--limit=')) || '').replace('--limit=', '').trim();
  const limit = limitArg ? Math.max(1, Math.min(10000, Number(limitArg) || 0)) : 0;
  const onlyRaw = (argv.find((a) => a.startsWith('--only=')) || '').replace('--only=', '').trim();
  const only = onlyRaw ? new Set(onlyRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)) : null;
  return { apply, dryRun: !apply, json, limit, only };
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
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

  const toProcess = [];
  for (let i = 1; i < values.length; i += 1) {
    const row = values[i] || [];
    const status = String(row[idx.status] || '').trim().toUpperCase();
    if (status !== 'NEEDS_REVIEW') continue;

    const topic = String(row[idx.topic] || '').trim();
    const slug = String(row[idx.slug] || '').trim();
    if (args.only && !args.only.has(slug.toLowerCase())) continue;

    toProcess.push({
      rowNumber: i + 1,
      topic,
      slug,
      title: String(row[idx.title] || row[idx.topic] || '').trim(),
      category: String(row[idx.category] || '').trim(),
      description: String(row[idx.description] || row[idx.short_description] || '').trim(),
      wikidata_id: String(row[idx.wikidata_id] || '').trim(),
      official_url: String(row[idx.official_url] || '').trim(),
      tags: String(row[idx.tags] || '').trim(),
      notes: String(row[idx.notes] || '').trim(),
      status,
    });

    if (args.limit && toProcess.length >= args.limit) break;
  }

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

      if (row.wikidata_id) {
        const p856 = await resolveWikidataP856(row.wikidata_id);
        if (p856) {
          const candidate = normalizeDocsUrl(p856);
          const check = validateOfficialUrl(candidate, { slug: row.slug, title: row.title || row.topic });
          if (check.ok) {
            finalUrl = candidate;
            repaired = true;
            summary.url_fixed += 1;
            finalNotes = appendNote(finalNotes, 'url_repaired(method=wikidata_p856)');
            actions.push('url:fixed:wikidata_p856');
          }
        }
      }

      let ddgResult = null;
      if (!repaired) {
        ddgResult = await resolveOfficialUrlByDDG(`${row.topic} official site`, token);
        if (ddgResult?.ok && ddgResult.official_url) {
          const candidate = normalizeDocsUrl(ddgResult.official_url);
          const check = validateOfficialUrl(candidate, { slug: row.slug, title: row.title || row.topic });
          if (check.ok) {
            finalUrl = candidate;
            repaired = true;
            summary.url_fixed += 1;
            finalNotes = appendNote(finalNotes, 'url_repaired(method=ddg)');
            actions.push('url:fixed:ddg');
          }
        }
      }

      if (!repaired && ddgResult?.candidates?.length && isGptUrlEnabled()) {
        const candidates = ddgResult.candidates.map((u, i) => ({ url: u, rank: i + 1 }));
        const gpt = await chooseOfficialUrlGpt({
          topic: row.topic,
          token,
          candidates,
          defaultUrl: ddgResult.official_url || '',
        });
        if (gpt.ok && gpt.official_url) {
          const candidate = normalizeDocsUrl(gpt.official_url);
          const check = validateOfficialUrl(candidate, { slug: row.slug, title: row.title || row.topic });
          if (check.ok) {
            finalUrl = candidate;
            repaired = true;
            summary.url_fixed += 1;
            finalNotes = appendNote(finalNotes, 'url_repaired(method=gpt_candidates)');
            actions.push('url:fixed:gpt_candidates');
          }
        }
      }

      if (!repaired) {
        summary.url_unresolved += 1;
        finalNotes = appendNote(finalNotes, 'url_unresolved');
        reasons.push('url_unresolved');

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
    ...summary,
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

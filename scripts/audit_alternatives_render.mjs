#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const TOOLS_DIR = join(process.cwd(), 'content', 'tools');
const ALT_HEADING_RE = /^\s{0,3}(#{2,6})\s+(Alternativen|Alternatives?)\b/i;
const ANY_HEADING_RE = /^\s{0,3}(#{1,6})\s+/;
const LINK_TOOLS_RE = /\[[^\]]+\]\(\/tools\/([^/)\s]+)\/?(?:\s+"[^"]*")?\)/i;

function parseArgs(argv) {
  const opts = {
    json: true,
    pretty: false,
    only: '',
    limit: 0,
    out: '',
    debug: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = String(argv[i] || '');

    if (arg === '--json') {
      opts.json = true;
      continue;
    }
    if (arg === '--pretty') {
      opts.pretty = true;
      continue;
    }
    if (arg === '--debug') {
      opts.debug = true;
      continue;
    }
    if (arg === '--only') {
      const v = String(argv[i + 1] || '').trim();
      if (!v) throw new Error('--only requires <slug>');
      opts.only = v;
      i += 1;
      continue;
    }
    if (arg === '--limit') {
      const n = Number(argv[i + 1] || '');
      if (!Number.isFinite(n) || n < 1) throw new Error('--limit requires a positive integer');
      opts.limit = Math.floor(n);
      i += 1;
      continue;
    }
    if (arg === '--out') {
      const out = String(argv[i + 1] || '').trim();
      if (!out) throw new Error('--out requires <path>');
      opts.out = out;
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function dbg(enabled, msg) {
  if (enabled) process.stderr.write(`[debug] ${msg}\n`);
}

function parseFrontmatter(text) {
  const src = String(text ?? '');
  if (!src.startsWith('---')) {
    return { data: {}, content: src };
  }

  const lines = src.split(/\r?\n/);
  if (lines.length < 2 || lines[0].trim() !== '---') {
    return { data: {}, content: src };
  }

  let closeIdx = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') {
      closeIdx = i;
      break;
    }
  }
  if (closeIdx === -1) {
    return { data: {}, content: src };
  }

  const data = {};
  for (const line of lines.slice(1, closeIdx)) {
    const m = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*?)\s*$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      const v = value.toLowerCase();
      if (v === 'true') value = true;
      else if (v === 'false') value = false;
    }
    data[key] = value;
  }

  const content = lines.slice(closeIdx + 1).join('\n');
  return { data, content };
}

function normalizeTitle(value) {
  const stripped = String(value ?? '')
    .replace(/\[[^\]]*\]\(([^)]+)\)/g, (m, href) => {
      const text = m.match(/^\[([^\]]*)\]/);
      return text ? text[1] : href;
    })
    .replace(/[`*_~]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped;
}

function normalizeForFuzzy(normValue) {
  return String(normValue || '')
    .replace(/\b(the|a|an)\b/g, ' ')
    .replace(/\b(ai|tool|tools|app|software|platform|assistant)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokensFrom(normValue) {
  return String(normValue || '')
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function extractSection(content) {
  const lines = String(content || '').split(/\r?\n/);
  let startIdx = -1;
  let startLevel = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(ALT_HEADING_RE);
    if (!m) continue;
    startIdx = i + 1;
    startLevel = m[1].length;
    break;
  }

  if (startIdx === -1) {
    return { hasAlternatives: false, sectionText: '' };
  }

  let endIdx = lines.length;
  for (let i = startIdx; i < lines.length; i += 1) {
    const h = lines[i].match(ANY_HEADING_RE);
    if (!h) continue;
    const level = h[1].length;
    if (level <= startLevel) {
      endIdx = i;
      break;
    }
  }

  return {
    hasAlternatives: true,
    sectionText: lines.slice(startIdx, endIdx).join('\n'),
  };
}

function extractRawAltItems(sectionText) {
  return String(sectionText || '')
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*[-*]\s+(.+)$/)?.[1]?.trim() || '')
    .filter(Boolean);
}

function extractFromRaw(raw) {
  const item = String(raw || '').trim();

  const linkMatch = item.match(LINK_TOOLS_RE);
  const linkSlug = linkMatch ? String(linkMatch[1]).trim() : null;

  const boldColonInside = item.match(/^\s*\*\*([^*]+?)\s*:\s*\*\*\s*(.+)$/);
  if (boldColonInside) {
    return { linkSlug, titleCandidate: String(boldColonInside[1]).trim() || null };
  }

  const boldWithSeparator = item.match(/^\s*\*\*([^*]+)\*\*\s*(?::|–|—|-)\s*(.+)?$/i);
  if (boldWithSeparator) {
    return { linkSlug, titleCandidate: String(boldWithSeparator[1]).trim() || null };
  }

  const bold = item.match(/^\s*\*\*([^*]+?)\*\*\s*:\s*(.+)$/);
  if (bold) {
    return { linkSlug, titleCandidate: String(bold[1]).trim() || null };
  }

  const linked = item.match(/^\s*\[([^\]]+)\]\(([^)]+)\)\s*(?::\s*(.+))?$/);
  if (linked) {
    return { linkSlug, titleCandidate: String(linked[1]).trim() || null };
  }

  const byColon = item.split(':', 1)[0]?.trim();
  if (byColon && byColon.length > 0 && byColon.length < item.length) {
    return { linkSlug, titleCandidate: byColon };
  }

  const plainWithSeparator = item.match(/^\s*([^:–—-][^:–—-]{1,80})\s*(?::|–|—|-)\s*(.+)?$/);
  if (plainWithSeparator) {
    return { linkSlug, titleCandidate: String(plainWithSeparator[1]).trim() || null };
  }

  const byDash = item.split(/\s+[—-]\s+/, 1)[0]?.trim();
  if (byDash && byDash.length > 0 && byDash.length < item.length) {
    return { linkSlug, titleCandidate: byDash };
  }

  return { linkSlug, titleCandidate: null };
}

function indexByTitle(entries) {
  const map = new Map();
  for (const e of entries) {
    const norm = normalizeTitle(e.title);
    if (!norm) continue;
    if (!map.has(norm)) map.set(norm, []);
    map.get(norm).push(e);
  }
  return map;
}

function tryFuzzyTitleMatch(titleCandidate, allEntries, debug) {
  const norm = normalizeTitle(titleCandidate);
  const fuzzyNorm = normalizeForFuzzy(norm);
  if (!fuzzyNorm) return { type: 'none', candidates: [] };

  const fuzzyExact = allEntries.filter((e) => normalizeForFuzzy(normalizeTitle(e.title)) === fuzzyNorm);
  if (fuzzyExact.length === 1) {
    return { type: 'single', method: 'fuzzy_normalized', candidate: fuzzyExact[0] };
  }
  if (fuzzyExact.length > 1) {
    dbg(debug, `ambiguous fuzzy_normalized for "${titleCandidate}": ${fuzzyExact.map((x) => x.slug).join(', ')}`);
    return { type: 'ambiguous', candidates: fuzzyExact };
  }

  const candTokens = tokensFrom(fuzzyNorm);
  if (candTokens.length === 0) return { type: 'none', candidates: [] };

  const tokenMatches = allEntries.filter((e) => {
    const tks = new Set(tokensFrom(normalizeForFuzzy(normalizeTitle(e.title))));
    return candTokens.every((tk) => tks.has(tk));
  });

  if (tokenMatches.length === 1) {
    return { type: 'single', method: 'fuzzy_tokens', candidate: tokenMatches[0] };
  }
  if (tokenMatches.length > 1) {
    dbg(debug, `ambiguous fuzzy_tokens for "${titleCandidate}": ${tokenMatches.map((x) => x.slug).join(', ')}`);
    return { type: 'ambiguous', candidates: tokenMatches };
  }

  return { type: 'none', candidates: [] };
}

function matchRawItem({ extracted, slugIndex, titleIndex, allEntries, debug }) {
  const { linkSlug, titleCandidate } = extracted;

  if (!linkSlug && !titleCandidate) {
    return {
      match: { matched: false, slug: null, title: null, disabled: null },
      reason: 'parse_failed',
      missing: { reason: 'parse_failed', detail: extracted.raw ?? null },
    };
  }

  if (linkSlug) {
    const m = slugIndex.get(linkSlug);
    if (!m) {
      return {
        match: { matched: false, slug: null, title: null, disabled: null },
        reason: 'no_match',
        missing: { reason: 'slug_not_found', detail: linkSlug },
      };
    }

    if (m.disabled) {
      return {
        match: { matched: true, slug: m.slug, title: m.title, disabled: true },
        reason: 'matched_but_disabled',
        missing: { reason: 'matched_disabled', detail: m.slug },
      };
    }

    return {
      match: { matched: true, slug: m.slug, title: m.title, disabled: false },
      reason: 'link_slug_match',
      missing: null,
    };
  }

  if (!titleCandidate) {
    return {
      match: { matched: false, slug: null, title: null, disabled: null },
      reason: 'parse_failed',
      missing: { reason: 'parse_failed', detail: null },
    };
  }

  const norm = normalizeTitle(titleCandidate);
  const exact = titleIndex.get(norm) || [];

  if (exact.length === 1) {
    const m = exact[0];
    if (m.disabled) {
      return {
        match: { matched: true, slug: m.slug, title: m.title, disabled: true },
        reason: 'matched_but_disabled',
        missing: { reason: 'matched_disabled', detail: m.slug },
      };
    }
    return {
      match: { matched: true, slug: m.slug, title: m.title, disabled: false },
      reason: 'title_exact_match',
      missing: null,
    };
  }

  if (exact.length > 1) {
    return {
      match: { matched: false, slug: null, title: null, disabled: null },
      reason: 'no_match',
      missing: { reason: 'ambiguous_exact_match', detail: exact.map((x) => x.slug) },
    };
  }

  const fuzzy = tryFuzzyTitleMatch(titleCandidate, allEntries, debug);
  if (fuzzy.type === 'single') {
    const m = fuzzy.candidate;
    if (m.disabled) {
      return {
        match: { matched: true, slug: m.slug, title: m.title, disabled: true },
        reason: 'matched_but_disabled',
        missing: { reason: 'matched_disabled', detail: m.slug },
      };
    }
    return {
      match: { matched: true, slug: m.slug, title: m.title, disabled: false },
      reason: 'title_fuzzy_match',
      missing: null,
    };
  }

  if (fuzzy.type === 'ambiguous') {
    return {
      match: { matched: false, slug: null, title: null, disabled: null },
      reason: 'no_match',
      missing: { reason: 'ambiguous_fuzzy_match', detail: fuzzy.candidates.map((x) => x.slug) },
    };
  }

  return {
    match: { matched: false, slug: null, title: null, disabled: null },
    reason: 'no_match',
    missing: { reason: 'title_not_found', detail: titleCandidate },
  };
}

async function main() {
  const opts = parseArgs(process.argv);

  const allFiles = (await readdir(TOOLS_DIR))
    .filter((f) => f.endsWith('.md') && f !== '_TEMPLATE.md')
    .sort();

  const allPages = [];
  for (const file of allFiles) {
    const fullPath = join(TOOLS_DIR, file);
    const raw = await readFile(fullPath, 'utf8');
    const fm = parseFrontmatter(raw);
    const pageSlug = String(fm.data.slug ?? file.replace(/\.md$/, '')).trim();
    allPages.push({
      file,
      fullPath,
      pageSlug,
      pageTitle: String(fm.data.title ?? pageSlug).trim(),
      pageDisabled: fm.data.disabled === true,
      content: fm.content,
      frontmatter: fm.data,
    });
  }

  let pages = allPages;
  if (opts.only) pages = pages.filter((p) => p.pageSlug === opts.only);
  if (opts.limit > 0) pages = pages.slice(0, opts.limit);

  const allToolEntries = allPages.map((p) => ({
    slug: p.pageSlug,
    title: p.pageTitle,
    disabled: p.pageDisabled,
    file: `content/tools/${p.file}`,
  }));

  const slugIndex = new Map(allToolEntries.map((e) => [e.slug, e]));
  const titleIndex = indexByTitle(allToolEntries);

  const items = pages.map((page) => {
    const { hasAlternatives, sectionText } = extractSection(page.content);
    const rawAltItems = hasAlternatives ? extractRawAltItems(sectionText) : [];

    const rawDetails = rawAltItems.map((rawItem) => {
      const extracted = { ...extractFromRaw(rawItem), raw: rawItem };
      const outcome = matchRawItem({
        extracted,
        slugIndex,
        titleIndex,
        allEntries: allToolEntries,
        debug: opts.debug,
      });

      return {
        raw: rawItem,
        extracted,
        match: outcome.match,
        reason: outcome.reason,
        _missing: outcome.missing,
      };
    });

    const matchedCount = rawDetails.filter((x) => x.match.matched).length;
    const matchedEnabled = rawDetails.filter((x) => x.match.matched && x.match.disabled === false);
    const matchedEnabledCount = matchedEnabled.length;

    const renderSlugsTop = [];
    const seen = new Set();
    for (const r of matchedEnabled) {
      const s = r.match.slug;
      if (!s || seen.has(s)) continue;
      seen.add(s);
      renderSlugsTop.push(s);
      if (renderSlugsTop.length >= 3) break;
    }

    const missingMatches = rawDetails
      .map((x, idx) => {
        if (!x._missing) return null;
        return {
          index: idx,
          raw: x.raw,
          reason: x._missing.reason,
          detail: x._missing.detail,
        };
      })
      .filter(Boolean);

    return {
      pageSlug: page.pageSlug,
      pageTitle: page.pageTitle,
      pageDisabled: page.pageDisabled,
      hasAlternatives,
      rawCount: rawAltItems.length,
      matchedCount,
      matchedEnabledCount,
      expectedRenderCount: Math.min(3, matchedEnabledCount),
      renderSlugsTop,
      rawAltItems: rawDetails.map(({ _missing, ...rest }) => rest),
      missingMatches,
    };
  });

  const summary = {
    scannedFiles: items.length,
    pagesWithAlternatives: items.filter((i) => i.hasAlternatives).length,
    pagesWithAlternativesAndNoMatches: items.filter((i) => i.hasAlternatives && i.rawCount > 0 && i.matchedCount === 0).length,
    totalRawItems: items.reduce((acc, i) => acc + i.rawCount, 0),
    totalMatchedItems: items.reduce((acc, i) => acc + i.matchedCount, 0),
    totalMatchedEnabledItems: items.reduce((acc, i) => acc + i.matchedEnabledCount, 0),
    totalExpectedRenderCards: items.reduce((acc, i) => acc + i.expectedRenderCount, 0),
  };

  const payload = { summary, items };
  const jsonText = opts.pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);

  if (opts.out) {
    await writeFile(opts.out, jsonText + '\n', 'utf8');
    dbg(opts.debug, `written JSON report to ${opts.out}`);
  }

  if (opts.json) {
    process.stdout.write(`${jsonText}\n`);
    return;
  }

  process.stdout.write('Alternatives render audit\n');
  process.stdout.write(`- scanned files: ${summary.scannedFiles}\n`);
  process.stdout.write(`- pages with alternatives: ${summary.pagesWithAlternatives}\n`);
  process.stdout.write(`- pages with alternatives and no matches: ${summary.pagesWithAlternativesAndNoMatches}\n`);
  process.stdout.write(`- total raw items: ${summary.totalRawItems}\n`);
  process.stdout.write(`- total matched items: ${summary.totalMatchedItems}\n`);
  process.stdout.write(`- total matched enabled items: ${summary.totalMatchedEnabledItems}\n`);
  process.stdout.write(`- total expected render cards: ${summary.totalExpectedRenderCards}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.message || String(err)}\n`);
  process.exit(1);
});

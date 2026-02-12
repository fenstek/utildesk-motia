#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const TOOLS_DIR = join(process.cwd(), 'content', 'tools');
const ALT_SECTION_RE = /(?:^|\r?\n)#{1,3}\s+(Alternativen|Alternatives?)\b[^\r\n]*\r?\n([\s\S]*?)(?=\r?\n#{1,3}\s|\s*$)/i;

function parseArgs(argv) {
  const opts = { json: false, top: 20 };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = String(argv[i] || '');
    if (arg === '--json') {
      opts.json = true;
      continue;
    }
    if (arg === '--top') {
      const n = Number(argv[i + 1] || '');
      if (!Number.isFinite(n) || n < 1) throw new Error('--top requires a positive integer');
      opts.top = Math.floor(n);
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

function parseScalar(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  if (/^(true|false)$/i.test(v)) return v.toLowerCase() === 'true';
  return v;
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return {};
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!pair) continue;
    data[pair[1]] = parseScalar(pair[2]);
  }
  return data;
}

function isDisabled(data) {
  return data.disabled === true || String(data.disabled || '').toLowerCase() === 'true';
}

function normalizeName(value) {
  return String(value ?? '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function parseAltItem(item) {
  const internalLink = item.match(/^\[([^\]]+)\]\(\/tools\/([^/)\s]+)\/?\)\s*(?::\s*(.*))?$/);
  if (internalLink) {
    return { kind: 'internal_link', name: internalLink[1], slug: internalLink[2] };
  }

  const linked = item.match(/^\[([^\]]+)\]\(([^)]+)\)\s*(?::\s*(.*))?$/);
  if (linked) {
    return { kind: 'linked', name: linked[1] };
  }

  const boldColonInside = item.match(/^\*\*([^*]+?)\s*:\s*\*\*\s*(.+)$/);
  if (boldColonInside) {
    return { kind: 'bold', name: boldColonInside[1] };
  }

  const bold = item.match(/^\*\*([^*]+?)\*\*\s*:\s*(.+)$/);
  if (bold) {
    return { kind: 'bold', name: bold[1] };
  }

  const plain = item.match(/^([^:]+?)\s*:\s*(.+)$/);
  if (plain) {
    return { kind: 'plain', name: plain[1] };
  }

  return null;
}

function extractAltItems(content) {
  const section = content.match(ALT_SECTION_RE);
  if (!section) return { hasSection: false, items: [] };
  const items = (section[2].match(/^[-*]\s+(.+)$/gm) ?? []).map((l) => l.replace(/^[-*]\s+/, '').trim());
  return { hasSection: true, items };
}

async function main() {
  const opts = parseArgs(process.argv);
  const files = (await readdir(TOOLS_DIR))
    .filter((name) => name.endsWith('.md') && !name.startsWith('_'))
    .sort();

  const entries = [];
  for (const file of files) {
    const fullPath = join(TOOLS_DIR, file);
    const raw = await readFile(fullPath, 'utf8');
    const data = parseFrontmatter(raw);
    const slug = String(data.slug || file.replace(/\.md$/, '')).trim();
    const title = String(data.title || slug).trim();
    entries.push({ file, raw, slug, title, disabled: isDisabled(data) });
  }

  const enabled = entries.filter((e) => !e.disabled);
  const enabledBySlug = new Map(enabled.map((e) => [e.slug, e]));
  const enabledByNormTitle = new Map(enabled.map((e) => [normalizeName(e.title), e]));

  const reportFiles = [];
  for (const entry of entries) {
    const content = entry.raw.startsWith('---') ? entry.raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '') : entry.raw;
    const { hasSection, items } = extractAltItems(content);
    let resolved = 0;

    for (const item of items) {
      const parsed = parseAltItem(item);
      if (!parsed) continue;
      const tool = parsed.kind === 'internal_link'
        ? enabledBySlug.get(parsed.slug)
        : enabledByNormTitle.get(normalizeName(parsed.name));
      if (tool) resolved += 1;
    }

    reportFiles.push({
      file: `content/tools/${entry.file}`,
      slug: entry.slug,
      title: entry.title,
      disabled: entry.disabled,
      has_alternatives_section: hasSection,
      bullet_items: items.length,
      resolved_items: resolved,
      unresolved_items: items.length - resolved,
    });
  }

  const withSection = reportFiles.filter((f) => f.has_alternatives_section);
  const withBullets = withSection.filter((f) => f.bullet_items > 0);
  const problematic = withBullets
    .filter((f) => f.resolved_items === 0)
    .sort((a, b) => b.bullet_items - a.bullet_items)
    .slice(0, opts.top);

  const totals = {
    scanned_files: reportFiles.length,
    enabled_files: reportFiles.filter((f) => !f.disabled).length,
    files_with_alternatives_section: withSection.length,
    files_with_bullets: withBullets.length,
    total_bullet_items: withBullets.reduce((acc, f) => acc + f.bullet_items, 0),
    total_resolved_items: withBullets.reduce((acc, f) => acc + f.resolved_items, 0),
    files_with_zero_resolved: withBullets.filter((f) => f.resolved_items === 0).length,
  };

  if (opts.json) {
    console.log(JSON.stringify({ totals, problematic_files: problematic, files: reportFiles }, null, 2));
    return;
  }

  console.log('Alternatives render audit');
  console.log(`- scanned files: ${totals.scanned_files}`);
  console.log(`- enabled files: ${totals.enabled_files}`);
  console.log(`- files with alternatives section: ${totals.files_with_alternatives_section}`);
  console.log(`- files with bullets: ${totals.files_with_bullets}`);
  console.log(`- bullet items total: ${totals.total_bullet_items}`);
  console.log(`- resolved items total: ${totals.total_resolved_items}`);
  console.log(`- files with zero resolved: ${totals.files_with_zero_resolved}`);

  if (problematic.length > 0) {
    console.log(`\nTop problematic files (resolved=0, top ${opts.top}):`);
    for (const f of problematic) {
      console.log(`- ${f.file}: bullets=${f.bullet_items}, resolved=${f.resolved_items}`);
    }
  }
}

main().catch((err) => {
  console.error(err.message || String(err));
  process.exit(1);
});

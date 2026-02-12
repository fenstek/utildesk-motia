#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const TOOLS_DIR = join(process.cwd(), 'content', 'tools');
const ALT_SECTION_RE = /(?:^|\r?\n)(#{1,3})\s+(Alternativen|Alternatives?)\b[^\r\n]*\r?\n([\s\S]*?)(?=\r?\n#{1,3}\s|\s*$)/i;
const BULLET_RE = /^(\s*[-*]\s+)(.+)$/;
const INTERNAL_TOOL_LINK_RE = /^\s*\[[^\]]+\]\(\/tools\/([^/)\s]+)\/?\)\s*:\s*(.+)$/i;

function parseArgs(argv) {
  const opts = {
    write: false,
    dryRun: true,
    json: false,
    changedSlug: '',
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = String(argv[i] || '');
    if (arg === '--write') {
      opts.write = true;
      opts.dryRun = false;
      continue;
    }
    if (arg === '--dry-run') {
      opts.dryRun = true;
      opts.write = false;
      continue;
    }
    if (arg === '--json') {
      opts.json = true;
      continue;
    }
    if (arg === '--changed-slug') {
      const next = String(argv[i + 1] || '').trim();
      if (!next) throw new Error('--changed-slug requires a value');
      opts.changedSlug = next;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function isDisabledTool(data) {
  return data.disabled === true || String(data.disabled || '').toLowerCase() === 'true';
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

function normalizeName(input) {
  return String(input || '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/[™®]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function extractAltSection(markdown) {
  const match = markdown.match(ALT_SECTION_RE);
  if (!match) return null;

  const full = match[0];
  const headingMarks = match[1];
  const headingText = match[2];
  const body = match[3];

  return { full, headingMarks, headingText, body };
}

function parseItem(itemText) {
  const internal = itemText.match(INTERNAL_TOOL_LINK_RE);
  if (internal) {
    return {
      kind: 'already_internal_link',
      name: '',
      desc: internal[2],
      href: `/tools/${internal[1]}/`,
    };
  }

  const linked = itemText.match(/^\s*\[([^\]]+)\]\(([^)]+)\)\s*:\s*(.+)$/);
  if (linked) {
    return {
      kind: 'linked',
      name: linked[1],
      href: linked[2],
      desc: linked[3],
    };
  }

  const boldColonInside = itemText.match(/^\s*\*\*([\s\S]+?)\s*:\s*\*\*\s*(.+)$/);
  if (boldColonInside) {
    return {
      kind: 'bold',
      name: boldColonInside[1],
      desc: boldColonInside[2],
      href: '',
    };
  }

  const bold = itemText.match(/^\s*\*\*([\s\S]+?)\*\*\s*:\s*(.+)$/);
  if (bold) {
    return {
      kind: 'bold',
      name: bold[1],
      desc: bold[2],
      href: '',
    };
  }

  const plain = itemText.match(/^\s*([^:][\s\S]*?)\s*:\s*(.+)$/);
  if (plain) {
    return {
      kind: 'plain',
      name: plain[1],
      desc: plain[2],
      href: '',
    };
  }

  return null;
}

function mentionsChangedSlug(altBody, changedSlug, changedTitle) {
  const slugRefRe = new RegExp(String.raw`\/tools\/${changedSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\/?`, 'i');
  if (slugRefRe.test(altBody)) return true;

  if (!changedTitle) return false;

  const normTitle = normalizeName(changedTitle);
  if (!normTitle) return false;

  for (const rawLine of altBody.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const bullet = line.match(BULLET_RE);
    if (!bullet) continue;
    const parsed = parseItem(bullet[2]);
    if (!parsed || !parsed.name) continue;
    if (normalizeName(parsed.name) === normTitle) return true;
  }

  return false;
}

function createToolMaps(entries) {
  const enabled = [];

  for (const entry of entries) {
    if (entry.disabled) continue;
    enabled.push({ slug: entry.slug, title: entry.title });
  }

  const bySlug = new Map();
  const byNormTitle = new Map();

  for (const tool of enabled) {
    bySlug.set(tool.slug, tool);
    const norm = normalizeName(tool.title);
    if (norm && !byNormTitle.has(norm)) {
      byNormTitle.set(norm, tool);
    }
  }

  return { enabled, bySlug, byNormTitle };
}

async function loadToolsIndex(files) {
  const entries = [];

  for (const file of files) {
    const fullPath = join(TOOLS_DIR, file);
    const raw = await readFile(fullPath, 'utf8');
    const data = parseFrontmatter(raw);
    const slug = String(data.slug || file.replace(/\.md$/, '')).trim();
    const title = String(data.title || slug).trim();
    entries.push({ file, slug, title, disabled: isDisabledTool(data) });
  }

  return entries;
}

function processAlternativesBody(body, byNormTitle, lineBase) {
  const lines = body.split(/\r?\n/);
  const changes = [];
  let changedLines = 0;

  const nextLines = lines.map((line, idx) => {
    const m = line.match(BULLET_RE);
    if (!m) return line;

    const prefix = m[1];
    const item = m[2];
    const parsed = parseItem(item);
    if (!parsed || parsed.kind === 'already_internal_link') return line;

    const tool = byNormTitle.get(normalizeName(parsed.name));
    if (!tool) return line;

    const nextLine = `${prefix}[${tool.title}](/tools/${tool.slug}/): ${parsed.desc}`;
    if (nextLine === line) return line;

    changedLines += 1;
    changes.push({
      line: lineBase + idx,
      before: line,
      after: nextLine,
    });
    return nextLine;
  });

  return {
    changed: changedLines > 0,
    changedLines,
    changes,
    body: nextLines.join('\n'),
  };
}

function printTextReport(report, opts) {
  const mode = opts.write ? 'write' : 'dry-run';
  console.log(`mode: ${mode}`);
  if (opts.changedSlug) console.log(`changed_slug: ${opts.changedSlug}`);
  console.log(`scanned_files: ${report.scanned_files}`);
  console.log(`processed_files: ${report.processed_files}`);
  console.log(`changed_files: ${report.changed_files}`);
  console.log(`changed_lines: ${report.changed_lines}`);

  for (const file of report.files) {
    if (!file.changed) continue;
    console.log(`\n${file.file}`);
    for (const c of file.changes) {
      console.log(`  L${c.line}`);
      console.log(`  - ${c.before}`);
      console.log(`  + ${c.after}`);
    }
  }
}

async function main() {
  const opts = parseArgs(process.argv);

  const files = (await readdir(TOOLS_DIR))
    .filter((name) => name.endsWith('.md') && !name.startsWith('_'))
    .sort();

  const index = await loadToolsIndex(files);
  const { bySlug, byNormTitle } = createToolMaps(index);
  const changedToolTitle = opts.changedSlug ? bySlug.get(opts.changedSlug)?.title || '' : '';

  const report = {
    scanned_files: files.length,
    processed_files: 0,
    changed_files: 0,
    changed_lines: 0,
    files: [],
  };

  for (const file of files) {
    const filePath = join(TOOLS_DIR, file);
    const raw = await readFile(filePath, 'utf8');
    const section = extractAltSection(raw);

    const fileReport = {
      file: `content/tools/${file}`,
      changed: false,
      changes: [],
    };

    if (!section) {
      report.files.push(fileReport);
      continue;
    }

    if (opts.changedSlug && !mentionsChangedSlug(section.body, opts.changedSlug, changedToolTitle)) {
      report.files.push(fileReport);
      continue;
    }

    report.processed_files += 1;

    const sectionStart = raw.indexOf(section.full);
    const bodyStartInSection = section.full.indexOf(section.body);
    const bodyStartInFile = sectionStart + bodyStartInSection;
    const lineBase = raw.slice(0, bodyStartInFile).split(/\r?\n/).length;

    const transformed = processAlternativesBody(section.body, byNormTitle, lineBase);
    if (!transformed.changed) {
      report.files.push(fileReport);
      continue;
    }

    const updatedSection = section.full.replace(section.body, transformed.body);
    const nextRaw = raw.replace(section.full, updatedSection);

    if (opts.write) {
      await writeFile(filePath, nextRaw, 'utf8');
    }

    fileReport.changed = true;
    fileReport.changes = transformed.changes;

    report.changed_files += 1;
    report.changed_lines += transformed.changedLines;
    report.files.push(fileReport);
  }

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printTextReport(report, opts);
  }
}

main().catch((err) => {
  console.error(err.message || String(err));
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Fails if duplicate slugs exist in content/tools/*.md
 * Also checks that frontmatter.slug matches filename.
 */
import fs from 'node:fs';
import path from 'node:path';

const TOOLS_DIR = path.resolve('content/tools');

function die(msg) {
  console.error('\n[ERROR]', msg, '\n');
  process.exit(1);
}

function parseFrontmatter(md) {
  // very small YAML-frontmatter parser for "key: value" lines
  if (!md.startsWith('---')) return {};
  const end = md.indexOf('\n---', 3);
  if (end === -1) return {};
  const block = md.slice(3, end).trim();
  const out = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

if (!fs.existsSync(TOOLS_DIR)) die(`Missing directory: ${TOOLS_DIR}`);

const files = fs.readdirSync(TOOLS_DIR)
  .filter(f => f.endsWith('.md') && f !== '_TEMPLATE.md')
  .map(f => path.join(TOOLS_DIR, f));

const seen = new Map(); // slug -> file
let count = 0;

for (const file of files) {
  const md = fs.readFileSync(file, 'utf8');
  const fm = parseFrontmatter(md);

  const filenameSlug = path.basename(file, '.md');
  const fmSlug = (fm.slug || '').trim();

  if (!fmSlug) die(`No frontmatter slug in: ${file}`);
  if (fmSlug !== filenameSlug) {
    die(`Slug mismatch:\n  file: ${file}\n  filename slug: ${filenameSlug}\n  frontmatter slug: ${fmSlug}`);
  }

  if (seen.has(fmSlug)) {
    die(`Duplicate slug "${fmSlug}" in:\n  - ${seen.get(fmSlug)}\n  - ${file}`);
  }
  seen.set(fmSlug, file);
  count++;
}

console.log(JSON.stringify({ ok: true, checked: count }, null, 2));

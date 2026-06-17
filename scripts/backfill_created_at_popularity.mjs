#!/usr/bin/env node
/**
 * Backfill created_at and popularity fields into content/tools/*.md frontmatter
 *
 * For each .md file:
 * - If created_at missing: use git log --follow to get first commit date
 * - If popularity missing: set to 0
 * - Preserve all other frontmatter fields
 *
 * Usage:
 *   node scripts/backfill_created_at_popularity.mjs [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const TOOLS_DIR = path.resolve('content/tools');
const DRY_RUN = process.argv.includes('--dry-run');

const stats = {
  total: 0,
  updated_created_at: 0,
  updated_popularity: 0,
  skipped_no_frontmatter: 0,
  skipped_has_all: 0,
  errors: 0,
};

function parseFrontmatter(md) {
  if (!md.startsWith('---')) return null;
  const end = md.indexOf('\n---', 3);
  if (end === -1) return null;

  const fmBlock = md.slice(4, end);
  const body = md.slice(end + 4);

  return { fmBlock, body };
}

function parseFrontmatterFields(fmBlock) {
  const lines = fmBlock.split('\n');
  const fm = {};
  const order = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Check if this is a key: value line
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2];
      order.push(key);

      // Check if value is multiline (array/object)
      if (value.trim() === '' || value.trim() === '[' || value.trim() === '{') {
        // Multiline value - collect until next key or end
        const multilineValue = [value];
        i++;
        while (i < lines.length && !lines[i].match(/^[A-Za-z0-9_]+:/)) {
          multilineValue.push(lines[i]);
          i++;
        }
        fm[key] = multilineValue.join('\n');
        continue;
      } else {
        fm[key] = value;
      }
    }
    i++;
  }

  return { fm, order };
}

function buildFrontmatter(fm, order) {
  const lines = ['---'];
  const usedKeys = new Set();

  // Write keys in original order
  for (const key of order) {
    if (fm[key] !== undefined) {
      const value = fm[key];
      // Check if it's a multiline value
      if (value.includes('\n')) {
        lines.push(`${key}:${value}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
      usedKeys.add(key);
    }
  }

  // Add any new keys at the end
  for (const key of Object.keys(fm)) {
    if (!usedKeys.has(key)) {
      const value = fm[key];
      if (value.includes('\n')) {
        lines.push(`${key}:${value}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
  }

  lines.push('---');
  return lines.join('\n');
}

function getGitFirstCommitDate(filePath) {
  try {
    const cmd = `git log --follow --diff-filter=A --format=%aI -- "${filePath}" | tail -n 1`;
    const result = execSync(cmd, { encoding: 'utf8', cwd: path.resolve('.') }).trim();
    if (!result) return null;
    // Extract YYYY-MM-DD from ISO date
    const dateMatch = result.match(/^(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : null;
  } catch (err) {
    return null;
  }
}

function processFile(filePath) {
  const fileName = path.basename(filePath);
  stats.total++;

  // Skip files starting with _
  if (fileName.startsWith('_')) {
    if (!DRY_RUN) {
      console.log(`[SKIP] ${fileName} (starts with _)`);
    }
    return;
  }

  let md;
  try {
    md = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`[ERROR] Failed to read ${fileName}: ${err.message}`);
    stats.errors++;
    return;
  }

  const parsed = parseFrontmatter(md);
  if (!parsed) {
    console.log(`[SKIP] ${fileName} (no frontmatter)`);
    stats.skipped_no_frontmatter++;
    return;
  }

  const { fm, order } = parseFrontmatterFields(parsed.fmBlock);
  let needsUpdate = false;
  let updatedFields = [];

  // Check created_at
  if (!fm.created_at || fm.created_at.trim() === '') {
    const gitDate = getGitFirstCommitDate(filePath);
    const dateValue = gitDate || '1970-01-01';
    fm.created_at = `"${dateValue}"`;
    order.push('created_at');
    needsUpdate = true;
    updatedFields.push('created_at');
    stats.updated_created_at++;
  }

  // Check popularity
  if (!fm.popularity || fm.popularity.trim() === '') {
    fm.popularity = '0';
    order.push('popularity');
    needsUpdate = true;
    updatedFields.push('popularity');
    stats.updated_popularity++;
  }

  if (!needsUpdate) {
    if (DRY_RUN) {
      console.log(`[SKIP] ${fileName} (already has all fields)`);
    }
    stats.skipped_has_all++;
    return;
  }

  const updatedFrontmatter = buildFrontmatter(fm, order);
  const updatedMd = updatedFrontmatter + '\n' + parsed.body;

  if (DRY_RUN) {
    console.log(`[DRY-RUN] Would update ${fileName}: ${updatedFields.join(', ')}`);
    if (updatedFields.includes('created_at')) {
      console.log(`  created_at: ${fm.created_at}`);
    }
    if (updatedFields.includes('popularity')) {
      console.log(`  popularity: ${fm.popularity}`);
    }
  } else {
    try {
      fs.writeFileSync(filePath, updatedMd, 'utf8');
      console.log(`[UPDATE] ${fileName}: ${updatedFields.join(', ')}`);
    } catch (err) {
      console.error(`[ERROR] Failed to write ${fileName}: ${err.message}`);
      stats.errors++;
    }
  }
}

function main() {
  console.log(DRY_RUN ? '=== DRY RUN MODE ===' : '=== LIVE MODE ===');
  console.log(`Processing files in: ${TOOLS_DIR}\n`);

  if (!fs.existsSync(TOOLS_DIR)) {
    console.error(`[ERROR] Directory not found: ${TOOLS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(TOOLS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(TOOLS_DIR, f))
    .sort();

  for (const file of files) {
    processFile(file);
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total files scanned:       ${stats.total}`);
  console.log(`Updated created_at:        ${stats.updated_created_at}`);
  console.log(`Updated popularity:        ${stats.updated_popularity}`);
  console.log(`Skipped (no frontmatter):  ${stats.skipped_no_frontmatter}`);
  console.log(`Skipped (has all fields):  ${stats.skipped_has_all}`);
  console.log(`Errors:                    ${stats.errors}`);

  if (DRY_RUN) {
    console.log('\n✓ Dry run complete. Run without --dry-run to apply changes.');
  } else {
    console.log('\n✓ Complete!');
  }
}

main();

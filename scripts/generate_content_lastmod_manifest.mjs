#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const OUTPUT_FILE = join(REPO_ROOT, 'site/src/data/content-lastmod.json');
const CONTENT_DIRS = [
  'content/tools',
  'content/en/tools',
  'content/ratgeber',
  'content/en/ratgeber',
];

const normalizeRepoPath = (value) => String(value || '').replace(/\\/g, '/');

const formatDate = (date) => date.toISOString().split('T')[0];

async function readExistingManifest() {
  try {
    return JSON.parse(await readFile(OUTPUT_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function readGitLastmodMap() {
  const lastmodByPath = new Map();
  try {
    const output = execFileSync(
      'git',
      ['log', '--format=%cs', '--name-only', '--', ...CONTENT_DIRS],
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );

    let currentDate = null;
    for (const rawLine of output.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;
      if (/^\d{4}-\d{2}-\d{2}$/.test(line)) {
        currentDate = line;
        continue;
      }
      if (currentDate) {
        const relativePath = normalizeRepoPath(line);
        if (!lastmodByPath.has(relativePath)) {
          lastmodByPath.set(relativePath, currentDate);
        }
      }
    }
  } catch {
    // Shallow or non-git build environments preserve committed manifest values.
  }

  return lastmodByPath;
}

function shouldIgnoreGitLastmodMap(gitLastmodByPath, existingManifest) {
  const gitDates = new Set(gitLastmodByPath.values());
  const existingDates = new Set(Object.values(existingManifest).filter(Boolean));

  return (
    gitLastmodByPath.size > 1000 &&
    gitDates.size <= 2 &&
    existingDates.size > 5
  );
}

async function listMarkdownFiles(relativeDir) {
  const absoluteDir = join(REPO_ROOT, relativeDir);
  const files = [];

  async function walk(dir) {
    let entries = [];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const absolutePath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.md')) {
        continue;
      }
      files.push(normalizeRepoPath(relative(REPO_ROOT, absolutePath)));
    }
  }

  await walk(absoluteDir);
  return files;
}

async function readRatgeberUpdatedDate(relativePath) {
  const normalizedPath = normalizeRepoPath(relativePath);
  const isRatgeber =
    normalizedPath.startsWith('content/ratgeber/') ||
    normalizedPath.startsWith('content/en/ratgeber/');
  if (!isRatgeber) return null;

  try {
    const raw = await readFile(join(REPO_ROOT, normalizedPath), 'utf8');
    const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const updated = frontmatter?.[1]?.match(/^updated:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m)?.[1];
    if (updated) {
      return updated;
    }
  } catch {
    // Keep the existing git/manifest/mtime fallback for malformed or missing files.
  }
  return null;
}

async function main() {
  const existingManifest = await readExistingManifest();
  const gitLastmodByPath = readGitLastmodMap();
  const ignoreGitLastmod = shouldIgnoreGitLastmodMap(gitLastmodByPath, existingManifest);
  const files = [];

  for (const dir of CONTENT_DIRS) {
    files.push(...await listMarkdownFiles(dir));
  }

  const nextManifest = {};
  for (const relativePath of files.sort((a, b) => a.localeCompare(b))) {
    let lastmod =
      (await readRatgeberUpdatedDate(relativePath)) ||
      (ignoreGitLastmod ? null : gitLastmodByPath.get(relativePath)) ||
      existingManifest[relativePath];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(lastmod || ''))) {
      try {
        lastmod = formatDate((await stat(join(REPO_ROOT, relativePath))).mtime);
      } catch {
        lastmod = formatDate(new Date());
      }
    }
    nextManifest[relativePath] = lastmod;
  }

  const serialized = `${JSON.stringify(nextManifest, null, 2)}\n`;
  const previous = await readFile(OUTPUT_FILE, 'utf8').catch(() => '');
  if (serialized !== previous) {
    await writeFile(OUTPUT_FILE, serialized, 'utf8');
  }

  console.log(
    `Wrote ${Object.keys(nextManifest).length} content lastmod dates to ${OUTPUT_FILE} ` +
      `(${ignoreGitLastmod ? 0 : gitLastmodByPath.size} from git, ` +
      `${Object.keys(existingManifest).length} preserved candidates` +
      `${ignoreGitLastmod ? ', ignored shallow git snapshot' : ''})`,
  );
}

main().catch((error) => {
  console.error(`Failed to generate content lastmod manifest: ${error.message}`);
  process.exit(1);
});

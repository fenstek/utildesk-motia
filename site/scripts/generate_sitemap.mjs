#!/usr/bin/env node
/**
 * Generate search-engine sitemaps during build
 *
 * Reads BUILT pages from dist/ (not source .md files)
 * This ensures 1:1 match between sitemap and published pages
 *
 * sitemap.xml is intentionally compact for Google: articles plus strong tools.
 * sitemap-bing.xml mirrors the compact focus sitemap so Bing does not receive
 * a broad long-tail feed with mixed noindex signals.
 */

import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { getToolPublicState } from '../shared/toolPublicState.mjs';
import {
  createToolAddedAtRankMap,
  getToolSearchIndexDecision,
} from '../src/lib/searchIndexPolicy.mjs';
import { FOCUS_TOOL_SLUGS } from '../src/lib/searchFocus.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://tools.utildesk.de';
const REPO_ROOT = join(__dirname, '../..');
const DIST_DIR = join(__dirname, '../dist');
const DIST_TOOLS_DIR = join(DIST_DIR, 'tools');
const DIST_CATEGORY_DIR = join(DIST_DIR, 'category');
const DIST_RATGEBER_DIR = join(DIST_DIR, 'ratgeber');
const DIST_EN_DIR = join(DIST_DIR, 'en');
const DIST_EN_TOOLS_DIR = join(DIST_EN_DIR, 'tools');
const DIST_EN_CATEGORY_DIR = join(DIST_EN_DIR, 'category');
const DIST_EN_RATGEBER_DIR = join(DIST_EN_DIR, 'ratgeber');
const CONTENT_TOOLS_DIR = join(REPO_ROOT, 'content/tools');
const TOOL_ADDED_AT_FILE = join(__dirname, '../src/data/tool-added-at.json');
const CONTENT_LASTMOD_FILE = join(__dirname, '../src/data/content-lastmod.json');
const GOOGLE_OUTPUT_FILE = join(DIST_DIR, 'sitemap.xml');
const BING_OUTPUT_FILE = join(DIST_DIR, 'sitemap-bing.xml');
const FOCUS_OUTPUT_FILE = join(DIST_DIR, 'sitemap-focus.xml');
const OUTPUT_FILE = GOOGLE_OUTPUT_FILE;
const RESERVED_TOOL_SEGMENTS = new Set(['tag']);

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

let gitLastmodByPath = null;
let contentLastmodManifest = null;

function normalizeRepoPath(relativePath) {
  return String(relativePath || '').replace(/\\/g, '/');
}

function readGitLastmodMap() {
  if (gitLastmodByPath) {
    return gitLastmodByPath;
  }

  const lastmodByPath = new Map();
  try {
    const output = execFileSync(
      'git',
      [
        'log',
        '--format=%cs',
        '--name-only',
        '--',
        'content/tools',
        'content/en/tools',
        'content/ratgeber',
        'content/en/ratgeber',
      ],
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );

    let currentDate = null;
    for (const rawLine of output.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }
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
    // Non-git build environments fall back to source file mtimes below.
  }

  gitLastmodByPath = lastmodByPath;
  return gitLastmodByPath;
}

function readGitLastmod(relativePath) {
  return readGitLastmodMap().get(normalizeRepoPath(relativePath)) ?? null;
}

async function readContentLastmodManifest() {
  if (contentLastmodManifest) {
    return contentLastmodManifest;
  }

  try {
    contentLastmodManifest = JSON.parse(await readFile(CONTENT_LASTMOD_FILE, 'utf8'));
  } catch {
    contentLastmodManifest = {};
  }

  return contentLastmodManifest;
}

async function readSourceLastmod(relativePath, fallbackPath = null) {
  const manifest = await readContentLastmodManifest();
  const manifestLastmod = manifest[normalizeRepoPath(relativePath)];
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(manifestLastmod || ''))) {
    return manifestLastmod;
  }

  const gitLastmod = readGitLastmod(relativePath);
  if (gitLastmod) {
    return gitLastmod;
  }

  try {
    const stats = await stat(join(REPO_ROOT, relativePath));
    return formatDate(stats.mtime);
  } catch {
    if (fallbackPath) {
      return formatDate(await getFileModTime(fallbackPath));
    }
    return formatDate(new Date());
  }
}

async function readToolSourceLastmod(slug, locale, fallbackPath) {
  const relativePath = locale === 'en'
    ? `content/en/tools/${slug}.md`
    : `content/tools/${slug}.md`;
  return readSourceLastmod(relativePath, fallbackPath);
}

async function readRatgeberSourceLastmod(slug, locale, fallbackPath) {
  const relativePath = locale === 'en'
    ? `content/en/ratgeber/${slug}.md`
    : `content/ratgeber/${slug}.md`;
  try {
    const raw = await readFile(join(REPO_ROOT, relativePath), 'utf8');
    const parsed = matter(raw);
    const updated = parsed.data?.updated;
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(updated || ''))) {
      return String(updated);
    }
  } catch {
    // Fall back to the generated manifest, git, or built file mtime below.
  }
  return readSourceLastmod(relativePath, fallbackPath);
}

async function getFileModTime(filepath) {
  try {
    const stats = await stat(filepath);
    return stats.mtime;
  } catch {
    return new Date();
  }
}

async function readToolIndexPolicySlugs() {
  let addedAtManifest = {};
  try {
    addedAtManifest = JSON.parse(await readFile(TOOL_ADDED_AT_FILE, 'utf8'));
  } catch {
    addedAtManifest = {};
  }

  const addedAtRankMap = createToolAddedAtRankMap(addedAtManifest);
  const googleIndexableSlugs = new Set();
  const decisionCounts = new Map();

  try {
    const files = await readdir(CONTENT_TOOLS_DIR);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const sourcePath = join(CONTENT_TOOLS_DIR, file);
      const raw = await readFile(sourcePath, 'utf8');
      const parsed = matter(raw);
      const publicState = getToolPublicState({ filename: file, data: parsed.data });
      if (!publicState.isPublishable) continue;
      const slug = publicState.slug;

      const decision = getToolSearchIndexDecision(
        {
          slug,
          data: parsed.data,
          content: parsed.content,
        },
        {
          addedAtRank: addedAtRankMap.get(slug) ?? 0,
        },
      );
      decisionCounts.set(decision.reason, (decisionCounts.get(decision.reason) || 0) + 1);
      if (decision.indexable) {
        googleIndexableSlugs.add(slug);
      }
    }
  } catch (error) {
    throw new Error(`Failed to read tool indexing policy from content/tools/. Error: ${error.message}`);
  }

  return {
    googleIndexableSlugs,
    decisionCounts: Object.fromEntries([...decisionCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
  };
}

async function readBuiltTools(indexableSlugs, rootDir = DIST_TOOLS_DIR, locale = 'de') {
  try {
    const entries = await readdir(rootDir, { withFileTypes: true });
    const tools = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const slug = entry.name;
      if (slug.startsWith('_') || RESERVED_TOOL_SEGMENTS.has(slug)) {
        continue;
      }
      if (indexableSlugs && !indexableSlugs.has(slug)) {
        continue;
      }
      const indexPath = join(rootDir, slug, 'index.html');

      // Verify index.html exists
      try {
        await stat(indexPath);
        tools.push({
          slug,
          lastmod: await readToolSourceLastmod(slug, locale, indexPath),
        });
      } catch {
        // Skip if index.html doesn't exist
        continue;
      }
    }

    return tools.sort((a, b) => a.slug.localeCompare(b.slug));
  } catch (error) {
    throw new Error(
      `Failed to read dist/tools/. Make sure to run this script AFTER astro build. Error: ${error.message}`
    );
  }
}

async function readBuiltCategories() {
  try {
    const categories = [];

    // Check if category directory exists
    try {
      await stat(DIST_CATEGORY_DIR);
    } catch {
      // Category directory doesn't exist, return empty array
      return categories;
    }

    const entries = await readdir(DIST_CATEGORY_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const slug = entry.name;
      const indexPath = join(DIST_CATEGORY_DIR, slug, 'index.html');

      // Verify index.html exists
      try {
        const mtime = await getFileModTime(indexPath);
        categories.push({
          slug,
          lastmod: formatDate(mtime),
        });
      } catch {
        // Skip if index.html doesn't exist
        continue;
      }
    }

    return categories.sort((a, b) => a.slug.localeCompare(b.slug));
  } catch (error) {
    // If category directory doesn't exist or error reading it, just return empty array
    console.warn(`Warning: Could not read category directory: ${error.message}`);
    return [];
  }
}

async function readBuiltRatgeber(rootDir = DIST_RATGEBER_DIR, locale = 'de') {
  try {
    const ratgeber = [];

    try {
      await stat(rootDir);
    } catch {
      return ratgeber;
    }

    const entries = await readdir(rootDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const slug = entry.name;
      const indexPath = join(rootDir, slug, 'index.html');

      try {
        await stat(indexPath);
        ratgeber.push({
          slug,
          lastmod: await readRatgeberSourceLastmod(slug, locale, indexPath),
        });
      } catch {
        continue;
      }
    }

    return ratgeber.sort((a, b) => a.slug.localeCompare(b.slug));
  } catch (error) {
    console.warn(`Warning: Could not read ratgeber directory: ${error.message}`);
    return [];
  }
}

async function readBuiltLocalizedDirectories(rootDir, reservedSegments = new Set()) {
  try {
    const entries = await readdir(rootDir, { withFileTypes: true });
    const items = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const slug = entry.name;
      if (slug.startsWith('_') || reservedSegments.has(slug)) continue;
      const indexPath = join(rootDir, slug, 'index.html');
      try {
        const mtime = await getFileModTime(indexPath);
        items.push({ slug, lastmod: formatDate(mtime) });
      } catch {
        continue;
      }
    }

    return items.sort((a, b) => a.slug.localeCompare(b.slug));
  } catch {
    return [];
  }
}

async function readBuiltLocalizedTools(rootDir, indexableSlugs) {
  return readBuiltTools(indexableSlugs, rootDir, 'en');
}

async function readBuiltStaticPage(...segments) {
  const indexPath = join(DIST_DIR, ...segments, 'index.html');
  try {
    const mtime = await getFileModTime(indexPath);
    return { lastmod: formatDate(mtime) };
  } catch {
    return null;
  }
}

function buildSitemapXml(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    if (url.priority) {
      xml += `    <priority>${url.priority}</priority>\n`;
    }
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';
  return xml;
}

async function writeSitemapFile(outputFile, urls) {
  await writeFile(outputFile, buildSitemapXml(urls), 'utf8');
}

function countStaticPages(result) {
  return (
    result.count -
    result.tools -
    result.categories -
    result.ratgeber -
    result.enTools -
    result.enCategories -
    result.enRatgeber -
    (result.categories > 0 ? 1 : 0) -
    (result.ratgeber > 0 ? 1 : 0) -
    (result.enTools > 0 ? 2 : 0) -
    (result.enCategories > 0 ? 1 : 0) -
    (result.enRatgeber > 0 ? 1 : 0)
  );
}

async function collectSharedSitemapInputs() {
  const categories = await readBuiltCategories();
  const ratgeber = await readBuiltRatgeber();
  const enCategories = await readBuiltLocalizedDirectories(DIST_EN_CATEGORY_DIR);
  const enRatgeber = await readBuiltRatgeber(DIST_EN_RATGEBER_DIR, 'en');
  const methodologyPage = await readBuiltStaticPage('methodologie');
  const enMethodologyPage = await readBuiltStaticPage('en', 'methodology');
  const today = formatDate(new Date());

  // Check if category index exists
  let categoryIndexLastmod = today;
  try {
    const categoryIndexPath = join(DIST_CATEGORY_DIR, 'index.html');
    const mtime = await getFileModTime(categoryIndexPath);
    categoryIndexLastmod = formatDate(mtime);
  } catch {
    // Category index doesn't exist, use today
  }

  let ratgeberIndexLastmod = today;
  try {
    const ratgeberIndexPath = join(DIST_RATGEBER_DIR, 'index.html');
    const mtime = await getFileModTime(ratgeberIndexPath);
    ratgeberIndexLastmod = formatDate(mtime);
  } catch {
    // Ratgeber index doesn't exist, use today
  }

  let enIndexLastmod = today;
  try {
    const enIndexPath = join(DIST_EN_DIR, 'index.html');
    const mtime = await getFileModTime(enIndexPath);
    enIndexLastmod = formatDate(mtime);
  } catch {
    // English index doesn't exist, use today
  }

  let enToolsIndexLastmod = today;
  try {
    const enToolsIndexPath = join(DIST_EN_TOOLS_DIR, 'index.html');
    const mtime = await getFileModTime(enToolsIndexPath);
    enToolsIndexLastmod = formatDate(mtime);
  } catch {
    // English tools index doesn't exist, use today
  }

  let enCategoryIndexLastmod = today;
  try {
    const enCategoryIndexPath = join(DIST_EN_CATEGORY_DIR, 'index.html');
    const mtime = await getFileModTime(enCategoryIndexPath);
    enCategoryIndexLastmod = formatDate(mtime);
  } catch {
    // English category index doesn't exist, use today
  }

  let enRatgeberIndexLastmod = today;
  try {
    const enRatgeberIndexPath = join(DIST_EN_RATGEBER_DIR, 'index.html');
    const mtime = await getFileModTime(enRatgeberIndexPath);
    enRatgeberIndexLastmod = formatDate(mtime);
  } catch {
    // English ratgeber index doesn't exist, use today
  }

  return {
    categories,
    ratgeber,
    enCategories,
    enRatgeber,
    methodologyPage,
    enMethodologyPage,
    today,
    categoryIndexLastmod,
    ratgeberIndexLastmod,
    enIndexLastmod,
    enToolsIndexLastmod,
    enCategoryIndexLastmod,
    enRatgeberIndexLastmod,
  };
}

function buildUrlList(inputs, tools, enTools) {
  const {
    categories,
    ratgeber,
    enCategories,
    enRatgeber,
    methodologyPage,
    enMethodologyPage,
    today,
    categoryIndexLastmod,
    ratgeberIndexLastmod,
    enIndexLastmod,
    enToolsIndexLastmod,
    enCategoryIndexLastmod,
    enRatgeberIndexLastmod,
  } = inputs;

  const urls = [
    // Homepage
    {
      loc: `${BASE_URL}/`,
      lastmod: today,
      priority: '1.0',
    },
    // Tools index
    {
      loc: `${BASE_URL}/tools/`,
      lastmod: today,
      priority: '0.9',
    },
    ...(methodologyPage
      ? [
          {
            loc: `${BASE_URL}/methodologie/`,
            lastmod: methodologyPage.lastmod,
            priority: '0.6',
          },
        ]
      : []),
    // All built tool pages
    ...tools.map((tool) => ({
      loc: `${BASE_URL}/tools/${escapeXml(tool.slug)}/`,
      lastmod: tool.lastmod,
      priority: '0.8',
    })),
    // Category index (if exists)
    ...(categories.length > 0
      ? [
          {
            loc: `${BASE_URL}/category/`,
            lastmod: categoryIndexLastmod,
            priority: '0.7',
          },
        ]
      : []),
    // All built category pages
    ...categories.map((cat) => ({
      loc: `${BASE_URL}/category/${escapeXml(cat.slug)}/`,
      lastmod: cat.lastmod,
      priority: '0.7',
    })),
    // Ratgeber index (if exists)
    ...(ratgeber.length > 0
      ? [
          {
            loc: `${BASE_URL}/ratgeber/`,
            lastmod: ratgeberIndexLastmod,
            priority: '0.8',
          },
        ]
      : []),
    // All built ratgeber pages
    ...ratgeber.map((article) => ({
      loc: `${BASE_URL}/ratgeber/${escapeXml(article.slug)}/`,
      lastmod: article.lastmod,
      priority: '0.7',
    })),
    // English homepage
    ...(enTools.length > 0
      ? [
          {
            loc: `${BASE_URL}/en/`,
            lastmod: enIndexLastmod,
            priority: '0.9',
          },
          {
            loc: `${BASE_URL}/en/tools/`,
            lastmod: enToolsIndexLastmod,
            priority: '0.8',
          },
          ...(enMethodologyPage
            ? [
                {
                  loc: `${BASE_URL}/en/methodology/`,
                  lastmod: enMethodologyPage.lastmod,
                  priority: '0.5',
                },
              ]
            : []),
        ]
      : []),
    ...enTools.map((tool) => ({
      loc: `${BASE_URL}/en/tools/${escapeXml(tool.slug)}/`,
      lastmod: tool.lastmod,
      priority: '0.6',
    })),
    ...(enCategories.length > 0
      ? [
          {
            loc: `${BASE_URL}/en/category/`,
            lastmod: enCategoryIndexLastmod,
            priority: '0.6',
          },
        ]
      : []),
    ...enCategories.map((cat) => ({
      loc: `${BASE_URL}/en/category/${escapeXml(cat.slug)}/`,
      lastmod: cat.lastmod,
      priority: '0.6',
    })),
    ...(enRatgeber.length > 0
      ? [
          {
            loc: `${BASE_URL}/en/ratgeber/`,
            lastmod: enRatgeberIndexLastmod,
            priority: '0.7',
          },
        ]
      : []),
    ...enRatgeber.map((article) => ({
      loc: `${BASE_URL}/en/ratgeber/${escapeXml(article.slug)}/`,
      lastmod: article.lastmod,
      priority: '0.6',
    })),
  ];

  return urls;
}

function dedupeUrls(urls) {
  const seen = new Set();
  return urls.filter((url) => {
    if (seen.has(url.loc)) {
      return false;
    }
    seen.add(url.loc);
    return true;
  });
}

function buildFocusedUrlList(inputs, tools, enTools) {
  const {
    ratgeber,
    enRatgeber,
    methodologyPage,
    enMethodologyPage,
    today,
    ratgeberIndexLastmod,
    enIndexLastmod,
    enToolsIndexLastmod,
    enRatgeberIndexLastmod,
  } = inputs;

  const toolsBySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  const enToolsBySlug = new Map(enTools.map((tool) => [tool.slug, tool]));
  const focusedTools = FOCUS_TOOL_SLUGS
    .map((slug) => toolsBySlug.get(slug))
    .filter(Boolean);
  const focusedEnTools = FOCUS_TOOL_SLUGS
    .map((slug) => enToolsBySlug.get(slug))
    .filter(Boolean);

  return dedupeUrls([
    {
      loc: `${BASE_URL}/`,
      lastmod: today,
      priority: '1.0',
    },
    {
      loc: `${BASE_URL}/tools/`,
      lastmod: today,
      priority: '0.9',
    },
    ...(methodologyPage
      ? [
          {
            loc: `${BASE_URL}/methodologie/`,
            lastmod: methodologyPage.lastmod,
            priority: '0.7',
          },
        ]
      : []),
    ...(ratgeber.length > 0
      ? [
          {
            loc: `${BASE_URL}/ratgeber/`,
            lastmod: ratgeberIndexLastmod,
            priority: '0.9',
          },
        ]
      : []),
    ...ratgeber.map((article) => ({
      loc: `${BASE_URL}/ratgeber/${article.slug}/`,
      lastmod: article.lastmod,
      priority: '0.8',
    })),
    ...focusedTools.map((tool) => ({
      loc: `${BASE_URL}/tools/${tool.slug}/`,
      lastmod: tool.lastmod,
      priority: '0.8',
    })),
    ...(focusedEnTools.length > 0
      ? [
          {
            loc: `${BASE_URL}/en/`,
            lastmod: enIndexLastmod,
            priority: '0.8',
          },
          {
            loc: `${BASE_URL}/en/tools/`,
            lastmod: enToolsIndexLastmod,
            priority: '0.7',
          },
          ...(enMethodologyPage
            ? [
                {
                  loc: `${BASE_URL}/en/methodology/`,
                  lastmod: enMethodologyPage.lastmod,
                  priority: '0.6',
                },
              ]
            : []),
        ]
      : []),
    ...(enRatgeber.length > 0
      ? [
          {
            loc: `${BASE_URL}/en/ratgeber/`,
            lastmod: enRatgeberIndexLastmod,
            priority: '0.7',
          },
        ]
      : []),
    ...enRatgeber.map((article) => ({
      loc: `${BASE_URL}/en/ratgeber/${article.slug}/`,
      lastmod: article.lastmod,
      priority: '0.7',
    })),
    ...focusedEnTools.map((tool) => ({
      loc: `${BASE_URL}/en/tools/${tool.slug}/`,
      lastmod: tool.lastmod,
      priority: '0.6',
    })),
  ]);
}

async function generateSitemaps() {
  const toolIndexPolicy = await readToolIndexPolicySlugs();
  const sharedInputs = await collectSharedSitemapInputs();
  const googleTools = await readBuiltTools(toolIndexPolicy.googleIndexableSlugs);
  const googleEnTools = await readBuiltLocalizedTools(DIST_EN_TOOLS_DIR, toolIndexPolicy.googleIndexableSlugs);

  const focusUrls = buildFocusedUrlList(sharedInputs, googleTools, googleEnTools);
  const googleUrls = focusUrls;
  const bingUrls = focusUrls;
  const focusSummary = {
    count: focusUrls.length,
    tools: focusUrls.filter((url) => /^https:\/\/tools\.utildesk\.de\/tools\/[^/]+\/$/.test(url.loc)).length,
    enTools: focusUrls.filter((url) => /^https:\/\/tools\.utildesk\.de\/en\/tools\/[^/]+\/$/.test(url.loc)).length,
    ratgeber: focusUrls.filter((url) => /^https:\/\/tools\.utildesk\.de\/ratgeber\/[^/]+\/$/.test(url.loc)).length,
    enRatgeber: focusUrls.filter((url) => /^https:\/\/tools\.utildesk\.de\/en\/ratgeber\/[^/]+\/$/.test(url.loc)).length,
  };

  await writeSitemapFile(GOOGLE_OUTPUT_FILE, googleUrls);
  await writeSitemapFile(BING_OUTPUT_FILE, bingUrls);
  await writeSitemapFile(FOCUS_OUTPUT_FILE, focusUrls);

  return {
    google: {
      urls: googleUrls,
      count: googleUrls.length,
      tools: focusSummary.tools,
      categories: 0,
      ratgeber: focusSummary.ratgeber,
      enTools: focusSummary.enTools,
      enCategories: 0,
      enRatgeber: focusSummary.enRatgeber,
    },
    bing: {
      urls: bingUrls,
      count: bingUrls.length,
      tools: focusSummary.tools,
      categories: 0,
      ratgeber: focusSummary.ratgeber,
      enTools: focusSummary.enTools,
      enCategories: 0,
      enRatgeber: focusSummary.enRatgeber,
    },
    focus: {
      urls: focusUrls,
      ...focusSummary,
    },
    toolIndexDecisionCounts: toolIndexPolicy.decisionCounts,
  };
}

async function main() {
  try {
    const result = await generateSitemaps();
    const bingResult = result.bing;
    Object.assign(result, result.google);
    console.log(`✅ Sitemap generated: ${OUTPUT_FILE}`);
    console.log(`   Total URLs: ${result.count}`);
    console.log(`   Tools: ${result.tools} (from dist/tools/)`);
    console.log(`   Categories: ${result.categories} (from dist/category/)`);
    console.log(`   Ratgeber: ${result.ratgeber} (from dist/ratgeber/)`);
    console.log(`   English tools: ${result.enTools} (from dist/en/tools/)`);
    console.log(`   English categories: ${result.enCategories} (from dist/en/category/)`);
    console.log(`   English ratgeber: ${result.enRatgeber} (from dist/en/ratgeber/)`);
    const staticPages =
      result.count -
      result.tools -
      result.categories -
      result.ratgeber -
      result.enTools -
      result.enCategories -
      result.enRatgeber -
      (result.categories > 0 ? 1 : 0) -
      (result.ratgeber > 0 ? 1 : 0) -
      (result.enTools > 0 ? 2 : 0) -
      (result.enCategories > 0 ? 1 : 0) -
      (result.enRatgeber > 0 ? 1 : 0);
    console.log(`   Static pages: ${staticPages}`);
    console.log(`   Bing sitemap: ${BING_OUTPUT_FILE}`);
    console.log(`   Bing total URLs: ${bingResult.count}`);
    console.log(`   Bing tools: ${bingResult.tools} (from dist/tools/)`);
    console.log(`   Bing English tools: ${bingResult.enTools} (from dist/en/tools/)`);
    console.log(`   Focus sitemap: ${FOCUS_OUTPUT_FILE}`);
    console.log(`   Focus total URLs: ${result.focus.count}`);
    console.log(`   Focus tools: ${result.focus.tools}`);
    console.log(`   Focus English tools: ${result.focus.enTools}`);
    console.log(`   Focus Ratgeber: ${result.focus.ratgeber}`);
    console.log(`   Focus English Ratgeber: ${result.focus.enRatgeber}`);
    console.log(`   Tool index policy: ${JSON.stringify(result.toolIndexDecisionCounts)}`);
  } catch (error) {
    console.error('❌ Failed to generate sitemap:', error.message);
    process.exit(1);
  }
}

main();

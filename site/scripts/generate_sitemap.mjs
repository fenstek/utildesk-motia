#!/usr/bin/env node
/**
 * Generate sitemap.xml during build
 *
 * Reads BUILT pages from dist/ (not source .md files)
 * This ensures 1:1 match between sitemap and published pages
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import {
  createToolAddedAtRankMap,
  getToolSearchIndexDecision,
} from '../src/lib/searchIndexPolicy.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://tools.utildesk.de';
const DIST_DIR = join(__dirname, '../dist');
const DIST_TOOLS_DIR = join(DIST_DIR, 'tools');
const DIST_CATEGORY_DIR = join(DIST_DIR, 'category');
const DIST_RATGEBER_DIR = join(DIST_DIR, 'ratgeber');
const DIST_EN_DIR = join(DIST_DIR, 'en');
const DIST_EN_TOOLS_DIR = join(DIST_EN_DIR, 'tools');
const DIST_EN_CATEGORY_DIR = join(DIST_EN_DIR, 'category');
const DIST_EN_RATGEBER_DIR = join(DIST_EN_DIR, 'ratgeber');
const CONTENT_TOOLS_DIR = join(__dirname, '../../content/tools');
const TOOL_ADDED_AT_FILE = join(__dirname, '../src/data/tool-added-at.json');
const OUTPUT_FILE = join(DIST_DIR, 'sitemap.xml');
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

async function getFileModTime(filepath) {
  try {
    const stats = await stat(filepath);
    return stats.mtime;
  } catch {
    return new Date();
  }
}

async function readToolIndexableSlugs() {
  let addedAtManifest = {};
  try {
    addedAtManifest = JSON.parse(await readFile(TOOL_ADDED_AT_FILE, 'utf8'));
  } catch {
    addedAtManifest = {};
  }

  const addedAtRankMap = createToolAddedAtRankMap(addedAtManifest);
  const indexableSlugs = new Set();
  const decisionCounts = new Map();

  try {
    const files = await readdir(CONTENT_TOOLS_DIR);
    for (const file of files) {
      if (!file.endsWith('.md') || file.startsWith('_')) continue;
      const sourcePath = join(CONTENT_TOOLS_DIR, file);
      const raw = await readFile(sourcePath, 'utf8');
      const parsed = matter(raw);
      const slug = String(parsed.data.slug ?? file.replace(/\.md$/i, ''));
      const disabled =
        parsed.data.disabled === true ||
        String(parsed.data.disabled || '').toLowerCase() === 'true';
      if (disabled) continue;

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
        indexableSlugs.add(slug);
      }
    }
  } catch (error) {
    throw new Error(`Failed to read tool indexing policy from content/tools/. Error: ${error.message}`);
  }

  return {
    indexableSlugs,
    decisionCounts: Object.fromEntries([...decisionCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
  };
}

async function readBuiltTools(indexableSlugs) {
  try {
    const entries = await readdir(DIST_TOOLS_DIR, { withFileTypes: true });
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
      const indexPath = join(DIST_TOOLS_DIR, slug, 'index.html');

      // Verify index.html exists
      try {
        const mtime = await getFileModTime(indexPath);
        tools.push({
          slug,
          lastmod: formatDate(mtime),
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

async function readBuiltRatgeber() {
  try {
    const ratgeber = [];

    try {
      await stat(DIST_RATGEBER_DIR);
    } catch {
      return ratgeber;
    }

    const entries = await readdir(DIST_RATGEBER_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const slug = entry.name;
      const indexPath = join(DIST_RATGEBER_DIR, slug, 'index.html');

      try {
        const mtime = await getFileModTime(indexPath);
        ratgeber.push({
          slug,
          lastmod: formatDate(mtime),
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
  const tools = await readBuiltLocalizedDirectories(rootDir, RESERVED_TOOL_SEGMENTS);
  return indexableSlugs ? tools.filter((tool) => indexableSlugs.has(tool.slug)) : tools;
}

async function generateSitemap() {
  const toolIndexPolicy = await readToolIndexableSlugs();
  const tools = await readBuiltTools(toolIndexPolicy.indexableSlugs);
  const categories = await readBuiltCategories();
  const ratgeber = await readBuiltRatgeber();
  const enTools = await readBuiltLocalizedTools(DIST_EN_TOOLS_DIR, toolIndexPolicy.indexableSlugs);
  const enCategories = await readBuiltLocalizedDirectories(DIST_EN_CATEGORY_DIR);
  const enRatgeber = await readBuiltLocalizedDirectories(DIST_EN_RATGEBER_DIR);
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

  await writeFile(OUTPUT_FILE, xml, 'utf8');

  return {
    urls,
    count: urls.length,
    tools: tools.length,
    categories: categories.length,
    ratgeber: ratgeber.length,
    enTools: enTools.length,
    enCategories: enCategories.length,
    enRatgeber: enRatgeber.length,
    toolIndexDecisionCounts: toolIndexPolicy.decisionCounts,
  };
}

async function main() {
  try {
    const result = await generateSitemap();
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
    console.log(`   Tool index policy: ${JSON.stringify(result.toolIndexDecisionCounts)}`);
  } catch (error) {
    console.error('❌ Failed to generate sitemap:', error.message);
    process.exit(1);
  }
}

main();

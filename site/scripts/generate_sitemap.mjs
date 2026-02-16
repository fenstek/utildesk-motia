#!/usr/bin/env node
/**
 * Generate sitemap.xml during build
 *
 * Reads BUILT pages from dist/ (not source .md files)
 * This ensures 1:1 match between sitemap and published pages
 */

import { readdir, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://tools.utildesk.de';
const DIST_DIR = join(__dirname, '../dist');
const DIST_TOOLS_DIR = join(DIST_DIR, 'tools');
const OUTPUT_FILE = join(DIST_DIR, 'sitemap.xml');

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

async function readBuiltTools() {
  try {
    const entries = await readdir(DIST_TOOLS_DIR, { withFileTypes: true });
    const tools = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const slug = entry.name;
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

async function generateSitemap() {
  const tools = await readBuiltTools();
  const today = formatDate(new Date());

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

  return { urls, count: urls.length, tools: tools.length };
}

async function main() {
  try {
    const result = await generateSitemap();
    console.log(`✅ Sitemap generated: ${OUTPUT_FILE}`);
    console.log(`   Total URLs: ${result.count}`);
    console.log(`   Tools: ${result.tools} (from dist/tools/)`);
    console.log(`   Static pages: ${result.count - result.tools}`);
  } catch (error) {
    console.error('❌ Failed to generate sitemap:', error.message);
    process.exit(1);
  }
}

main();

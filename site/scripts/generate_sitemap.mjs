#!/usr/bin/env node
/**
 * Generate sitemap.xml during build
 *
 * Reads all tools from ../content/tools/*.md
 * Excludes disabled tools
 * Generates sitemap.xml in dist/
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://tools.utildesk.de';
const CONTENT_DIR = join(__dirname, '../../content/tools');
const DIST_DIR = join(__dirname, '../dist');
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

async function readTools() {
  const files = await readdir(CONTENT_DIR);
  const tools = [];

  for (const file of files) {
    if (!file.endsWith('.md') || file.startsWith('_')) {
      continue;
    }

    const filepath = join(CONTENT_DIR, file);
    const content = await readFile(filepath, 'utf8');
    const { data } = matter(content);

    // Skip disabled tools
    if (data.disabled === true) {
      continue;
    }

    const slug = data.slug || file.replace(/\.md$/, '');
    const mtime = await getFileModTime(filepath);

    tools.push({
      slug,
      lastmod: formatDate(mtime),
      title: data.title || slug,
    });
  }

  return tools.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function generateSitemap() {
  const tools = await readTools();
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
    // All tools
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
    console.log(`   Tools: ${result.tools}`);
    console.log(`   Static pages: ${result.count - result.tools}`);
  } catch (error) {
    console.error('❌ Failed to generate sitemap:', error.message);
    process.exit(1);
  }
}

main();

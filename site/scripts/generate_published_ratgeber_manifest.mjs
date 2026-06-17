#!/usr/bin/env node
/**
 * Generate a small public manifest of built Ratgeber pages.
 *
 * Cloudflare Pages Functions cannot reliably inspect the static output
 * filesystem at runtime, so the private review admin reads this manifest to
 * hide candidates that are already live even if an older publish flow forgot
 * to mark the KV candidate as published.
 */

import matter from "gray-matter";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = join(__dirname, "../dist");
const CONTENT_RATGEBER_DIR = join(__dirname, "../../content/ratgeber");
const OUTPUT_FILE = join(DIST_DIR, "data/ratgeber-published.json");

function normalizeDate(value) {
  if (!value) {
    return "";
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value).trim();
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return raw.slice(0, 10);
}

async function readBuiltSlugs(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

async function readSourceMeta() {
  const bySlug = new Map();
  try {
    const entries = await readdir(CONTENT_RATGEBER_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) {
        continue;
      }
      const filepath = join(CONTENT_RATGEBER_DIR, entry.name);
      const parsed = matter(await readFile(filepath, "utf8"));
      const fallbackSlug = entry.name.replace(/\.md$/i, "");
      const slug = String(parsed.data.slug || fallbackSlug).trim();
      if (!slug) {
        continue;
      }
      bySlug.set(slug, {
        slug,
        title: String(parsed.data.title || slug).trim(),
        date: normalizeDate(parsed.data.date),
      });
    }
  } catch {
    // The manifest can still be useful with slug-only entries.
  }
  return bySlug;
}

async function main() {
  const sourceMeta = await readSourceMeta();
  const deSlugs = await readBuiltSlugs(join(DIST_DIR, "ratgeber"));
  const enSlugs = await readBuiltSlugs(join(DIST_DIR, "en/ratgeber"));
  const allSlugs = Array.from(new Set([...deSlugs, ...enSlugs])).sort((a, b) => a.localeCompare(b));
  const items = allSlugs.map((slug) => ({
    slug,
    title: sourceMeta.get(slug)?.title || slug,
    date: sourceMeta.get(slug)?.date || "",
    urls: [
      deSlugs.includes(slug) ? `/ratgeber/${slug}/` : "",
      enSlugs.includes(slug) ? `/en/ratgeber/${slug}/` : "",
    ].filter(Boolean),
  }));

  await mkdir(dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(
    OUTPUT_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: items.length,
        items,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`✅ Published Ratgeber manifest generated: ${OUTPUT_FILE}`);
  console.log(`   Ratgeber pages: ${items.length}`);
}

await main();

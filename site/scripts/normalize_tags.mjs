#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";

const TOOLS_DIR = join(process.cwd(), "..", "content", "tools");

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return tags;

  const normalized = tags.map((tag) => {
    let t = String(tag).toLowerCase().trim();

    // Normalize produktivität/produktivitaet -> produktivitat
    if (t === "produktivität" || t === "produktivitaet") {
      t = "produktivitat";
    }

    return t;
  });

  // Remove duplicates while preserving order
  const seen = new Set();
  return normalized.filter((tag) => {
    if (seen.has(tag)) return false;
    seen.add(tag);
    return true;
  });
};

async function main() {
  const files = (await readdir(TOOLS_DIR))
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"));

  let changedCount = 0;

  for (const file of files) {
    const filePath = join(TOOLS_DIR, file);
    const raw = await readFile(filePath, "utf-8");
    const { data, content } = matter(raw);

    if (!data.tags || !Array.isArray(data.tags)) {
      continue;
    }

    const originalTags = data.tags;
    const normalizedTags = normalizeTags(originalTags);

    // Check if tags changed
    const tagsChanged = JSON.stringify(originalTags) !== JSON.stringify(normalizedTags);

    if (tagsChanged) {
      data.tags = normalizedTags;

      // Reconstruct file with gray-matter
      const updated = matter.stringify(content, data);
      await writeFile(filePath, updated, "utf-8");

      changedCount++;
      console.log(`✓ Updated: ${file}`);
      console.log(`  Before: ${JSON.stringify(originalTags)}`);
      console.log(`  After:  ${JSON.stringify(normalizedTags)}`);
    }
  }

  console.log(`\n✅ Done! Changed ${changedCount} file(s).`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

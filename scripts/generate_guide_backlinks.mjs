#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "../site/node_modules/gray-matter/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "site", "src", "data", "guide-backlinks.json");

async function collect(locale) {
  const directory = join(root, "content", ...(locale === "en" ? ["en", "ratgeber"] : ["ratgeber"]));
  const result = {};
  for (const file of await readdir(directory)) {
    if (!file.endsWith(".md")) continue;
    const parsed = matter(await readFile(join(directory, file), "utf8"));
    const slug = String(parsed.data.slug || file.replace(/\.md$/, ""));
    const guide = {
      slug,
      title: String(parsed.data.title || slug),
      excerpt: String(parsed.data.excerpt || ""),
    };
    for (const tool of Array.isArray(parsed.data.relatedTools) ? parsed.data.relatedTools : []) {
      const match = String(tool?.href || "").match(/\/(?:en\/)?tools\/([^/?#]+)\/?/i);
      if (!match) continue;
      (result[match[1]] ||= []).push(guide);
    }
  }
  return result;
}

const payload = { de: await collect("de"), en: await collect("en") };
await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote guide backlinks for ${Object.keys(payload.de).length} DE and ${Object.keys(payload.en).length} EN tools`);

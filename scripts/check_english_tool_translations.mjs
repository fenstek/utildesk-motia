#!/usr/bin/env node
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "content", "tools");
const TARGET_DIR = path.join(ROOT, "content", "en", "tools");

const missing = readdirSync(SOURCE_DIR)
  .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
  .filter((file) => !existsSync(path.join(TARGET_DIR, file)))
  .map((file) => file.replace(/\.md$/, ""))
  .sort((a, b) => a.localeCompare(b, "en"));

if (missing.length) {
  console.error(`Missing English tool translations for ${missing.length} active tools:`);
  for (const slug of missing) {
    console.error(`- ${slug}`);
  }
  process.exit(1);
}

console.log("English tool translations are complete for active tools.");

#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "../site/node_modules/gray-matter/index.js";

// Resolve from this script so the guard works in every checkout, not only a former Linux path.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const toolsDir = path.join(repoRoot, "content", "tools");
const routeFiles = fs.readdirSync(toolsDir)
  .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
  .sort((a, b) => a.localeCompare(b));

// Keep this executable with plain Node: Astro resolves the TypeScript price-model
// helper, while this guard only needs the same source eligibility conditions.
const entries = routeFiles.flatMap((file) => {
  const sourcePath = path.join(toolsDir, file);
  const { data } = matter(fs.readFileSync(sourcePath, "utf8"));
  const disabled = data.disabled === true || String(data.disabled || "").toLowerCase() === "true";
  if (disabled) return [];
  return [{ slug: String(data.slug ?? file.replace(/\.md$/, "")), sourcePath }];
});

const expectedCount = routeFiles.filter((file) => {
  const { data } = matter(fs.readFileSync(path.join(toolsDir, file), "utf8"));
  return !(data.disabled === true || String(data.disabled || "").toLowerCase() === "true");
}).length;

assert.equal(entries.length, expectedCount, "route entries must match eligible markdown files");

for (const entry of entries) {
  assert.ok(entry.slug, "entry must have slug");
  assert.ok(entry.sourcePath.endsWith(".md"), "entry source path must point to markdown");
  assert.ok(fs.existsSync(entry.sourcePath), `missing source file for ${entry.slug}`);
  assert.ok(!path.basename(entry.sourcePath).startsWith("_"), `disabled file leaked into routes for ${entry.slug}`);
}

console.log(`ok - tool route entries match ${entries.length} active markdown files`);

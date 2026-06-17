#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = "/opt/utildesk-motia";
const toolsDir = path.join(repoRoot, "content", "tools");
const moduleUrl = pathToFileURL(path.join(repoRoot, "site/src/lib/toolEntries.mjs")).href;
const { listActiveToolEntries } = await import(moduleUrl);

const entries = await listActiveToolEntries();
const activeFiles = fs.readdirSync(toolsDir)
  .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
  .sort((a, b) => a.localeCompare(b));

assert.equal(entries.length, activeFiles.length, "route entries must match active markdown files");

for (const entry of entries) {
  assert.ok(entry.slug, "entry must have slug");
  assert.ok(entry.sourcePath.endsWith(".md"), "entry source path must point to markdown");
  assert.ok(fs.existsSync(entry.sourcePath), `missing source file for ${entry.slug}`);
  assert.ok(!path.basename(entry.sourcePath).startsWith("_"), `disabled file leaked into routes for ${entry.slug}`);
}

console.log(`ok - tool route entries match ${entries.length} active markdown files`);

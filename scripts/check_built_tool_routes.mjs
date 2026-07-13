#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "../site/node_modules/gray-matter/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const toolsDir = path.join(repoRoot, "content", "tools");
const distToolsDir = path.join(repoRoot, "site", "dist", "tools");

const activeSlugs = fs.readdirSync(toolsDir)
  .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
  .flatMap((file) => {
    const sourcePath = path.join(toolsDir, file);
    const { data } = matter(fs.readFileSync(sourcePath, "utf8"));
    const disabled = data.disabled === true || String(data.disabled || "").toLowerCase() === "true";
    return disabled ? [] : [String(data.slug || file.slice(0, -3))];
  });

const missing = activeSlugs.filter((slug) => !fs.existsSync(path.join(distToolsDir, slug, "index.html")));

if (missing.length) {
  console.error(`Built tool-route guard failed: ${missing.length} active pages are missing from dist.`);
  console.error(missing.join("\n"));
  process.exit(1);
}

console.log(`Built tool-route guard passed: ${activeSlugs.length} active pages present in dist.`);

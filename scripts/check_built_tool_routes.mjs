#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "../site/node_modules/gray-matter/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const toolsDir = path.join(repoRoot, "content", "tools");
const distToolsDir = path.join(repoRoot, "site", "dist", "tools");
const distEnglishToolsDir = path.join(repoRoot, "site", "dist", "en", "tools");
const distToolApiDir = path.join(repoRoot, "site", "dist", "api", "tools");
const distEnglishToolApiDir = path.join(repoRoot, "site", "dist", "en", "api", "tools");
const distToolMarkdownDir = path.join(repoRoot, "site", "dist", "markdown", "tools");
const distEnglishToolMarkdownDir = path.join(repoRoot, "site", "dist", "en", "markdown", "tools");
const frozenBuild = process.env.UTILDESK_BUILD_FROZEN_TOOL_DETAILS === "1";

const activeSlugs = fs.readdirSync(toolsDir)
  .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
  .flatMap((file) => {
    const sourcePath = path.join(toolsDir, file);
    const { data } = matter(fs.readFileSync(sourcePath, "utf8"));
    const disabled = data.disabled === true || String(data.disabled || "").toLowerCase() === "true";
    return disabled ? [] : [String(data.slug || file.slice(0, -3))];
  });

const built = activeSlugs.filter((slug) =>
  fs.existsSync(path.join(distToolsDir, slug, "index.html"))
  || fs.existsSync(path.join(distEnglishToolsDir, slug, "index.html")),
);
const missing = activeSlugs.filter((slug) =>
  !fs.existsSync(path.join(distToolsDir, slug, "index.html"))
  || !fs.existsSync(path.join(distEnglishToolsDir, slug, "index.html")),
);
const emittedMachineMirrors = activeSlugs.filter((slug) =>
  fs.existsSync(path.join(distToolApiDir, `${slug}.json`))
  || fs.existsSync(path.join(distEnglishToolApiDir, `${slug}.json`))
  || fs.existsSync(path.join(distToolMarkdownDir, `${slug}.md`))
  || fs.existsSync(path.join(distEnglishToolMarkdownDir, `${slug}.md`)),
);
const missingFrozenMachineMirrors = activeSlugs.filter((slug) =>
  !fs.existsSync(path.join(distToolApiDir, `${slug}.json`))
  || !fs.existsSync(path.join(distEnglishToolApiDir, `${slug}.json`))
  || !fs.existsSync(path.join(distToolMarkdownDir, `${slug}.md`))
  || !fs.existsSync(path.join(distEnglishToolMarkdownDir, `${slug}.md`)),
);

if (frozenBuild && missing.length) {
  console.error(`Built tool-route guard failed: ${missing.length} active pages are missing from dist.`);
  console.error(missing.join("\n"));
  process.exit(1);
}

if (frozenBuild && missingFrozenMachineMirrors.length) {
  console.error(`Frozen tool-machine guard failed: ${missingFrozenMachineMirrors.length} active mirror sets are incomplete.`);
  console.error(missingFrozenMachineMirrors.join("\n"));
  process.exit(1);
}

if (!frozenBuild && built.length) {
  console.error(`Runtime build guard failed: ${built.length} active tool detail routes were emitted into dist.`);
  console.error(built.join("\n"));
  process.exit(1);
}


if (!frozenBuild && emittedMachineMirrors.length) {
  console.error(`Runtime build guard failed: ${emittedMachineMirrors.length} static tool machine mirror sets were emitted into dist.`);
  console.error(emittedMachineMirrors.join("\n"));
  process.exit(1);
}

console.log(frozenBuild
  ? `Frozen tool-route guard passed: ${activeSlugs.length * 2} DE/EN detail pages and ${activeSlugs.length * 4} machine mirrors present in dist.`
  : `Runtime tool-route guard passed: zero static detail pages or detail mirrors; ${activeSlugs.length * 6} DE/EN HTML/JSON/Markdown routes are D1-owned.`);

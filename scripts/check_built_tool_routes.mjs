#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "../site/node_modules/gray-matter/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function inspectBuiltToolRoutes({
  toolsDir = path.join(repoRoot, "content", "tools"),
  distDir = path.join(repoRoot, "site", "dist"),
  frozenBuild = process.env.UTILDESK_BUILD_FROZEN_TOOL_DETAILS === "1",
} = {}) {
  const activeSlugs = fs.readdirSync(toolsDir)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .flatMap((file) => {
      const sourcePath = path.join(toolsDir, file);
      const { data } = matter(fs.readFileSync(sourcePath, "utf8"));
      const disabled = data.disabled === true || String(data.disabled || "").toLowerCase() === "true";
      return disabled ? [] : [String(data.slug || file.slice(0, -3))];
    });
  const detailPaths = (slug) => [
    path.join(distDir, "tools", slug, "index.html"),
    path.join(distDir, "en", "tools", slug, "index.html"),
  ];
  const machinePaths = (slug) => [
    path.join(distDir, "api", "tools", `${slug}.json`),
    path.join(distDir, "en", "api", "tools", `${slug}.json`),
    path.join(distDir, "markdown", "tools", `${slug}.md`),
    path.join(distDir, "en", "markdown", "tools", `${slug}.md`),
  ];
  const emittedDetails = activeSlugs.filter((slug) => detailPaths(slug).some(fs.existsSync));
  const incompleteFrozenDetails = activeSlugs.filter((slug) => detailPaths(slug).some((file) => !fs.existsSync(file)));
  const emittedMachineMirrors = activeSlugs.filter((slug) => machinePaths(slug).some(fs.existsSync));
  const incompleteFrozenMachineMirrors = activeSlugs.filter((slug) => machinePaths(slug).some((file) => !fs.existsSync(file)));

  if (frozenBuild && incompleteFrozenDetails.length) {
    throw new Error(`Built tool-route guard failed: ${incompleteFrozenDetails.length} active page pairs are incomplete in dist.\n${incompleteFrozenDetails.join("\n")}`);
  }
  if (frozenBuild && incompleteFrozenMachineMirrors.length) {
    throw new Error(`Frozen tool-machine guard failed: ${incompleteFrozenMachineMirrors.length} active mirror sets are incomplete.\n${incompleteFrozenMachineMirrors.join("\n")}`);
  }
  if (!frozenBuild && emittedDetails.length) {
    throw new Error(`Runtime build guard failed: ${emittedDetails.length} active tool detail route sets were emitted into dist.\n${emittedDetails.join("\n")}`);
  }
  if (!frozenBuild && emittedMachineMirrors.length) {
    throw new Error(`Runtime build guard failed: ${emittedMachineMirrors.length} static tool machine mirror sets were emitted into dist.\n${emittedMachineMirrors.join("\n")}`);
  }

  return {
    activeSlugs,
    frozenBuild,
    message: frozenBuild
      ? `Frozen tool-route guard passed: ${activeSlugs.length * 2} DE/EN detail pages and ${activeSlugs.length * 4} machine mirrors present in dist.`
      : `Runtime tool-route guard passed: zero static detail pages or detail mirrors; ${activeSlugs.length * 6} DE/EN HTML/JSON/Markdown routes are D1-owned.`,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(inspectBuiltToolRoutes().message);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

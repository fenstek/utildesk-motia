import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = existsSync(join(scriptDir, "..", "content", "tools"))
  ? join(scriptDir, "..")
  : process.cwd();
const toolsDir = join(repoRoot, "content", "tools");
const outputPath = join(repoRoot, "site", "src", "data", "tool-added-at.json");

const files = readdirSync(toolsDir)
  .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
  .sort((a, b) => a.localeCompare(b, "en"));

const readExistingManifest = () => {
  try {
    return JSON.parse(readFileSync(outputPath, "utf8"));
  } catch {
    return {};
  }
};

const readCreatedAtMs = (file) => {
  try {
    const raw = readFileSync(join(toolsDir, file), "utf8");
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return 0;
    const createdAtMatch = match[1].match(/^created_at:\s*["']?([^"'\r\n]+)["']?\s*$/m);
    if (!createdAtMatch) return 0;
    const timestamp = new Date(createdAtMatch[1]).getTime();
    return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0;
  } catch {
    return 0;
  }
};

const readGitAddedAtMs = (file) => {
  const gitPath = `content/tools/${file}`;

  try {
    const output = execFileSync(
      "git",
      ["log", "--diff-filter=A", "--follow", "--format=%ct", "--", gitPath],
      { cwd: repoRoot, encoding: "utf8" },
    ).trim();
    const firstTimestamp = output.split(/\r?\n/).filter(Boolean).pop();
    const timestampSeconds = Number(firstTimestamp);

    return Number.isFinite(timestampSeconds) && timestampSeconds > 0
      ? timestampSeconds * 1000
      : 0;
  } catch {
    return 0;
  }
};

const existingManifest = readExistingManifest();
const manifest = {};
let addedCount = 0;
let preservedCount = 0;
const missing = [];

for (const file of files) {
  const slug = file.replace(/\.md$/i, "");
  const existingAddedAtMs = Number(existingManifest[slug] || 0);

  if (Number.isFinite(existingAddedAtMs) && existingAddedAtMs > 0) {
    manifest[slug] = existingAddedAtMs;
    preservedCount += 1;
    continue;
  }

  const discoveredAddedAtMs = readGitAddedAtMs(file) || readCreatedAtMs(file);
  if (discoveredAddedAtMs > 0) {
    manifest[slug] = discoveredAddedAtMs;
    addedCount += 1;
  } else {
    missing.push(slug);
  }
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `Wrote ${Object.keys(manifest).length} tool added dates to ${outputPath} ` +
    `(${preservedCount} preserved, ${addedCount} discovered, ${missing.length} missing)`,
);

if (missing.length > 0) {
  console.warn(`Missing added dates for: ${missing.join(", ")}`);
}

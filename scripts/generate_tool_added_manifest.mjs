import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
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

const manifest = {};

for (const file of files) {
  const slug = file.replace(/\.md$/i, "");
  const gitPath = `content/tools/${file}`;

  try {
    const output = execFileSync(
      "git",
      ["log", "--diff-filter=A", "--follow", "--format=%ct", "--", gitPath],
      { cwd: repoRoot, encoding: "utf8" },
    ).trim();
    const firstTimestamp = output.split(/\r?\n/).filter(Boolean).pop();
    const timestampSeconds = Number(firstTimestamp);

    if (Number.isFinite(timestampSeconds) && timestampSeconds > 0) {
      manifest[slug] = timestampSeconds * 1000;
    }
  } catch {
    // Leave the slug out; the site will fall back to created_at/git/mtime.
  }
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Wrote ${Object.keys(manifest).length} tool added dates to ${outputPath}`);

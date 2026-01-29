import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fetchSiteIconForSlug } from "./fetch_site_icon.mjs";

const repoRoot = process.cwd();
const toolsDir = join(repoRoot, "content", "tools");

const parseFrontmatter = (raw) => {
  if (!raw.startsWith("---")) return {};
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return {};
  const fmBlock = raw.slice(3, end).trim();
  const data = {};

  fmBlock.split("\n").forEach((line) => {
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.+)?$/);
    if (!match) return;
    const key = match[1];
    let value = (match[2] ?? "").trim();
    value = value.replace(/^['"]|['"]$/g, "");
    if (value) data[key] = value;
  });

  return data;
};

const run = async () => {
  if (!existsSync(toolsDir)) {
    console.error("No tools directory found.");
    return;
  }
  const files = (await readdir(toolsDir)).filter(
    (file) => file.endsWith(".md") && !file.startsWith("_")
  );

  let ok = 0;
  let failed = 0;

  for (const file of files) {
    const raw = await readFile(join(toolsDir, file), "utf-8");
    const data = parseFrontmatter(raw);
    const slug = String(data.slug ?? file.replace(/\.md$/, ""));
    if (!data.homepage) continue;
    const result = await fetchSiteIconForSlug(slug);
    if (result.ok) {
      ok += 1;
    } else {
      failed += 1;
      console.error(`${slug}: ${result.reason}`);
    }
  }

  console.log(`Summary: ok=${ok} failed=${failed}`);
};

run();

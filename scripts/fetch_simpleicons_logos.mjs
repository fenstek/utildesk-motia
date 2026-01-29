import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { icons } from "simple-icons";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const toolsDir = join(repoRoot, "content", "tools");
const outputDir = join(repoRoot, "site", "public", "images", "logos");

const args = new Set(process.argv.slice(2));
const force = args.has("--force");

const normalizeKey = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

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

const resolveIcon = (title, brandKey) => {
  const candidates = [];
  if (brandKey) {
    candidates.push(brandKey, normalizeKey(brandKey));
  }
  candidates.push(normalizeKey(title));

  for (const key of candidates) {
    if (!key) continue;
    if (icons[key]) return { key, icon: icons[key] };
  }
  return null;
};

const run = async () => {
  await mkdir(outputDir, { recursive: true });
  const files = (await readdir(toolsDir)).filter(
    (file) => file.endsWith(".md") && !file.startsWith("_")
  );

  const report = {
    created: [],
    skipped: [],
    missing: [],
  };

  for (const file of files) {
    const fullPath = join(toolsDir, file);
    const raw = await readFile(fullPath, "utf-8");
    const frontmatter = parseFrontmatter(raw);
    const slug = frontmatter.slug ?? basename(file, ".md");
    const title = frontmatter.title ?? slug;
    const brandKey = frontmatter.brandKey ?? null;
    const resolved = resolveIcon(title, brandKey);
    const outputPath = join(outputDir, `${slug}.svg`);

    if (!resolved) {
      report.missing.push({ slug, title, brandKey });
      continue;
    }

    if (!force && existsSync(outputPath)) {
      report.skipped.push({ slug, key: resolved.key });
      continue;
    }

    await writeFile(outputPath, resolved.icon.svg, "utf-8");
    report.created.push({ slug, key: resolved.key });
  }

  console.log(`Created: ${report.created.length}`);
  report.created.forEach(({ slug, key }) => {
    console.log(`  ✓ ${slug} -> ${key}`);
  });

  console.log(`Skipped: ${report.skipped.length}`);
  report.skipped.forEach(({ slug, key }) => {
    console.log(`  • ${slug} -> ${key}`);
  });

  console.log(`Missing: ${report.missing.length}`);
  report.missing.forEach(({ slug, title, brandKey }) => {
    console.log(`  ✕ ${slug} (${title})${brandKey ? ` [${brandKey}]` : ""}`);
  });
};

run().catch((error) => {
  console.error("Failed to fetch logos:", error);
  process.exit(1);
});

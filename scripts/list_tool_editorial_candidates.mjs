import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const registryPath = path.join(root, "docs", "04_operations", "tool_card_editorial_registry.json");
const toolsDir = path.join(root, "content", "tools");
const enToolsDir = path.join(root, "content", "en", "tools");

const markers = [
  "## Was im Alltag wirklich zaehlt",
  "## Was im Alltag wirklich zählt",
  "## Workflow-Fit",
  "## Redaktionelle Einschaetzung",
  "## Redaktionelle Einschätzung",
  "## What really matters in daily use",
  "## Workflow Fit",
  "## Editorial Assessment",
];

const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : 50;

function frontmatterValue(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

function wordCount(text) {
  return text
    .replace(/^---[\s\S]*?---/, "")
    .split(/\s+/)
    .filter(Boolean).length;
}

function hasEditorialMarker(text) {
  return markers.some((marker) => text.includes(marker));
}

const registry = JSON.parse(await fs.readFile(registryPath, "utf8"));
const registered = new Set();

for (const batch of registry.batches || []) {
  for (const slug of batch.slugs || []) {
    registered.add(slug);
  }
}

const files = (await fs.readdir(toolsDir))
  .filter((name) => name.endsWith(".md"))
  .sort((a, b) => a.localeCompare(b));

const candidates = [];
const skipped = {
  registered: 0,
  inactive: 0,
  missingEnglish: 0,
  alreadyMarked: 0,
};

for (const file of files) {
  const slug = file.replace(/\.md$/, "");
  const dePath = path.join(toolsDir, file);
  const enPath = path.join(enToolsDir, file);
  const de = await fs.readFile(dePath, "utf8");

  if (registered.has(slug)) {
    skipped.registered += 1;
    continue;
  }

  if (frontmatterValue(de, "active") === "false") {
    skipped.inactive += 1;
    continue;
  }

  try {
    await fs.access(enPath);
  } catch {
    skipped.missingEnglish += 1;
    continue;
  }

  const en = await fs.readFile(enPath, "utf8");

  if (hasEditorialMarker(de) || hasEditorialMarker(en)) {
    skipped.alreadyMarked += 1;
    continue;
  }

  candidates.push({
    slug,
    title: frontmatterValue(de, "title") || slug,
    popularity: Number(frontmatterValue(de, "popularity") || 0),
    de_words: wordCount(de),
    en_words: wordCount(en),
  });
}

candidates.sort((a, b) => {
  if (b.popularity !== a.popularity) return b.popularity - a.popularity;
  if (a.de_words !== b.de_words) return a.de_words - b.de_words;
  return a.slug.localeCompare(b.slug);
});

console.log(JSON.stringify({
  registry: path.relative(root, registryPath).replace(/\\/g, "/"),
  registered_count: registered.size,
  skipped,
  candidate_count: candidates.length,
  limit,
  candidates: candidates.slice(0, limit),
}, null, 2));

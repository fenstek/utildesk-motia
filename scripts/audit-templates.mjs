#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  TEMPLATE_PHRASES,
  classifyToolEntry,
  parseSimpleFrontmatter,
  splitMarkdownDocument,
} from "../site/src/lib/toolQuality.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const toolsDir = path.join(repoRoot, "content", "tools");
const ratgeberDir = path.join(repoRoot, "content", "ratgeber");
const reportsDir = path.join(repoRoot, "reports");
const date = new Date().toISOString().slice(0, 10);
const outPath = path.join(reportsDir, `template-audit-${date}.json`);

const normalizeBlock = (value) =>
  String(value ?? "")
    .replace(/\[[^\]]+]\([^)]*\)/g, "")
    .replace(/[`*_>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const extractRatgeberLinks = (content) => {
  const slugs = new Set();
  for (const match of String(content ?? "").matchAll(/\/ratgeber\/([a-z0-9-]+)\/?/gi)) {
    slugs.add(match[1]);
  }
  return [...slugs].sort();
};

const getLastGitDate = (relativePath) => {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", relativePath], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

const toolFiles = fs
  .readdirSync(toolsDir)
  .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
  .sort((a, b) => a.localeCompare(b, "de"));

const ratgeberTexts = fs.existsSync(ratgeberDir)
  ? fs
      .readdirSync(ratgeberDir)
      .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
      .map((file) => ({
        slug: file.replace(/\.md$/, ""),
        text: fs.readFileSync(path.join(ratgeberDir, file), "utf8"),
      }))
  : [];

const templatePhrases = Object.fromEntries(
  TEMPLATE_PHRASES.map((phrase) => [phrase, { count: 0, slugs: [] }]),
);
const duplicateBlockMap = new Map();
const tools = [];

for (const file of toolFiles) {
  const relativePath = `content/tools/${file}`;
  const raw = fs.readFileSync(path.join(toolsDir, file), "utf8");
  const data = parseSimpleFrontmatter(raw);
  if (data.disabled === true || String(data.disabled || "").toLowerCase() === "true") {
    continue;
  }
  const { body } = splitMarkdownDocument(raw);
  const slug = String(data.slug || file.replace(/\.md$/, ""));

  for (const phrase of TEMPLATE_PHRASES) {
    if (body.includes(phrase)) {
      templatePhrases[phrase].count += 1;
      templatePhrases[phrase].slugs.push(slug);
    }
  }

  const blocksInFile = new Map();
  for (const block of body.split(/\n\s*\n/).map(normalizeBlock).filter((block) => block.length >= 60)) {
    blocksInFile.set(block, (blocksInFile.get(block) ?? 0) + 1);
  }
  for (const [block, count] of blocksInFile.entries()) {
    if (!duplicateBlockMap.has(block)) {
      duplicateBlockMap.set(block, { slugs: new Set(), internalRepeatSlugs: new Set() });
    }
    duplicateBlockMap.get(block).slugs.add(slug);
    if (count > 1) duplicateBlockMap.get(block).internalRepeatSlugs.add(slug);
  }

  const linkedRatgeber = new Set(extractRatgeberLinks(body));
  for (const article of ratgeberTexts) {
    if (article.text.includes(`/tools/${slug}/`)) {
      linkedRatgeber.add(article.slug);
    }
  }

  const quality = classifyToolEntry({
    slug,
    data,
    content: body,
  });
  if (linkedRatgeber.size > 0 && !["A", "B", "C", "D"].includes(String(data.tier || "").toUpperCase())) {
    quality.tier = "A";
    quality.mentionedInRatgeber = true;
  }

  tools.push({
    slug,
    bodyLen: body.length,
    editorialBlocks: quality.editorialBlocks,
    hasLastReviewed: quality.hasLastReviewed,
    templatePhraseCount: quality.templatePhraseCount,
    internalRepeats: quality.internalRepeats,
    tier: quality.tier,
    mentionedIn: [...linkedRatgeber].sort(),
    lastGitReviewed: quality.tier === "A" ? getLastGitDate(relativePath) : null,
  });
}

const duplicateBlocks = [...duplicateBlockMap.entries()]
  .map(([phrase, value]) => ({
    phrase,
    occurrences: value.slugs.size,
    slugs: [...value.slugs].sort(),
    internalRepeatSlugs: [...value.internalRepeatSlugs].sort(),
  }))
  .filter((item) => item.occurrences > 1 || item.internalRepeatSlugs.length > 0)
  .sort((a, b) => b.occurrences - a.occurrences || a.phrase.localeCompare(b.phrase, "de"));

for (const value of Object.values(templatePhrases)) {
  value.slugs.sort();
}

const tierCounts = tools.reduce((acc, tool) => {
  acc[tool.tier] = (acc[tool.tier] ?? 0) + 1;
  return acc;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  totalTools: tools.length,
  tierCounts,
  templatePhrases,
  duplicateBlocks,
  tools,
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ ok: true, outPath, totalTools: tools.length, tierCounts }, null, 2));

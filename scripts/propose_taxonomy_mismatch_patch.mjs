#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { hasMatchingCategory } from "./lib/category_matcher.mjs";
import {
  DEFAULT_AUDIT_PATH,
  DEFAULT_SNAPSHOT_PATH,
  ensureSnapshotsDir,
  getPrimarySheet,
  loadSnapshot,
  parseArgValue,
  parseTags,
} from "./sheet_snapshot_lib.mjs";
import { qcEligibility } from "./qc_eligibility.mjs";
import { REPO_ROOT } from "./project_memory_lib.mjs";

const DEFAULT_LIMIT = 25;
const GENERIC_TAGS = new Set(["ai", "productivity", "produktivitat", "produktivität"]);
const HEURISTIC_MAP = [
  { re: /chat|assistant|copilot|agent|q&a|conversation|gemini|perplexity|replika|character/i, tag: "assistant" },
  { re: /chatbot|bot|llm|gpt/i, tag: "chatbot" },
  { re: /write|writing|copy|blog|article|text/i, tag: "writing" },
  { re: /content|creator|post|social/i, tag: "content" },
  { re: /marketing|campaign|ads|advert/i, tag: "marketing" },
  { re: /image|photo|picture|design|graphic|logo|canva|leonardo/i, tag: "image" },
  { re: /design|ui|ux|figma|mockup|canva/i, tag: "design" },
  { re: /video|clip|movie|editing|render|runway|sora/i, tag: "video" },
  { re: /audio|voice|speech|music|podcast|wavepad/i, tag: "audio" },
  { re: /transcri|subtitle|caption/i, tag: "transcription" },
  { re: /autom|workflow|zap|integration|uipath|monday/i, tag: "automation" },
  { re: /workflow|pipeline|process/i, tag: "workflow" },
  { re: /no-code|nocode/i, tag: "no-code" },
  { re: /data|database|etl|sql|sheet|table/i, tag: "data" },
  { re: /analytics|dashboard|bi|insight/i, tag: "analytics" },
  { re: /spreadsheet|excel|google sheets|google-tabellen/i, tag: "spreadsheet" },
  { re: /crm|sales|lead/i, tag: "crm" },
  { re: /code|coding|developer|programming|github|vercel|bolt/i, tag: "coding" },
  { re: /api|sdk|endpoint|webhook|assemblyai|openrouter/i, tag: "api" },
  { re: /translat|localiz/i, tag: "translation" },
  { re: /education|learn|course|teacher|student/i, tag: "education" },
  { re: /support|ticket|helpdesk|customer support/i, tag: "customer-support" },
  { re: /meeting|calendar|minutes|summar/i, tag: "meeting" },
];

const argv = process.argv.slice(2);
const auditPath = path.resolve(parseArgValue(argv, "--in", DEFAULT_AUDIT_PATH));
const snapshotPath = path.resolve(parseArgValue(argv, "--snapshot", DEFAULT_SNAPSHOT_PATH));
const categoryArg = String(parseArgValue(argv, "--category", "")).trim();
const limit = Math.max(1, Number.parseInt(parseArgValue(argv, "--limit", String(DEFAULT_LIMIT)), 10) || DEFAULT_LIMIT);
const dryRun = argv.includes("--dry-run");

if (!categoryArg) {
  console.error("MISSING_CATEGORY");
  process.exit(1);
}

ensureSnapshotsDir();

const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const snapshot = loadSnapshot(snapshotPath);
const sheet = getPrimarySheet(snapshot);
const allowlist = readTagAllowlist();
const mismatchWarning = "tags do not match known category taxonomy";
const rowsById = new Map(sheet.rows.map((row) => [Number(row.row_id), row]));
const categories = new Map([...new Set(sheet.rows.map((row) => String(row.values.category || "").trim()).filter(Boolean))].map((category) => [slugify(category), category]));
const category = categories.get(slugify(categoryArg)) || categoryArg;
const targetIssues = (audit.errors || [])
  .filter((item) => item.severity === "warn" && item.message === mismatchWarning)
  .filter((item) => String(rowsById.get(Number(item.row_id))?.values?.category || "").trim() === category)
  .slice(0, limit);

const mismatchRowIds = new Set(
  (audit.errors || [])
    .filter((item) => item.severity === "warn" && item.message === mismatchWarning)
    .map((item) => Number(item.row_id))
);

const categoryProfile = buildCategoryProfile({ category, sheet, mismatchRowIds, allowlist });
const outputPath = path.join(REPO_ROOT, "backups", "snapshots", `sheet_patch.taxonomy_mismatch.${slugify(category)}.json`);
const changes = [];
const unresolved = [];

for (const issue of targetIssues) {
  const row = rowsById.get(Number(issue.row_id));
  if (!row) continue;
  if (!qcEligibility(row).eligible) continue;

  const currentTags = normalizeTags(parseTags(row.values.tags || ""));
  const kept = currentTags.filter((tag) => categoryProfile.allowedSet.has(tag));
  const repoTags = readRepoTags(row.slug).filter((tag) => categoryProfile.allowedSet.has(tag));
  const inferred = repoTags.length
    ? repoTags
    : inferTags(row).filter((tag) => categoryProfile.allowedSet.has(tag));
  const merged = mergeTags([...kept, ...inferred]);
  const finalTags = ensureTaxonomyMatch(merged, categoryProfile.fallbackTags);

  if (!finalTags.length || !hasMatchingCategory(finalTags)) {
    unresolved.push(`${row.row_id}:${row.slug}:no_safe_taxonomy_tags`);
    continue;
  }

  const before = currentTags.join(",");
  const after = finalTags.join(",");
  if (!after || before === after) {
    unresolved.push(`${row.row_id}:${row.slug}:unchanged`);
    continue;
  }

  changes.push({
    row_id: Number(row.row_id),
    slug: String(row.slug || row.values.slug || ""),
    column: "tags",
    old_value: String(row.values.tags || ""),
    new_value: after,
    reason: `reconcile_tags_to_category_taxonomy:${category}`,
    confidence: "high",
  });
}

const patch = {
  meta: {
    generated_at: new Date().toISOString(),
    source_snapshot: path.relative(REPO_ROOT, snapshotPath),
    notes: `category=${category}; dry_run=${dryRun ? "1" : "0"}; unresolved=${unresolved.slice(0, 20).join(" | ") || "none"}`,
  },
  changes,
};

fs.writeFileSync(outputPath, JSON.stringify(patch, null, 2));
console.log(`PATCH_TAXONOMY_MISMATCH category=${category} changes=${changes.length} unresolved=${unresolved.length}`);
for (const change of changes) {
  console.log(`${change.slug}\t${category}\t${change.old_value || "(empty)"} -> ${change.new_value}`);
}

function buildCategoryProfile({ category, sheet, mismatchRowIds, allowlist }) {
  const counts = new Map();
  for (const row of sheet.rows) {
    if (!qcEligibility(row).eligible) continue;
    if (String(row.values.category || "").trim() !== category) continue;
    if (mismatchRowIds.has(Number(row.row_id))) continue;
    const tags = normalizeTags(parseTags(row.values.tags || ""))
      .filter((tag) => allowlist.has(tag))
      .filter((tag) => !GENERIC_TAGS.has(tag));
    for (const tag of tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  const ordered = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
  const allowed = ordered.filter((tag) => allowlist.has(tag));
  const fallbackTags = allowed.filter((tag) => hasMatchingCategory([tag])).slice(0, 2);
  return {
    allowedSet: new Set(allowed),
    fallbackTags,
  };
}

function inferTags(row) {
  const corpus = [
    row.slug,
    row.values.slug,
    row.values.title,
    row.values.topic,
    row.values.short_hint,
    row.values.notes,
    row.values.official_url,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" \n ");

  const out = [];
  for (const rule of HEURISTIC_MAP) {
    if (rule.re.test(corpus)) out.push(rule.tag);
  }
  return normalizeTags(out);
}

function normalizeTags(tags) {
  const seen = new Set();
  const out = [];
  for (const raw of tags) {
    const tag = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    if (!tag || seen.has(tag) || GENERIC_TAGS.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

function mergeTags(tags) {
  return normalizeTags(tags);
}

function ensureTaxonomyMatch(tags, fallbackTags) {
  const out = [...tags];
  if (hasMatchingCategory(out)) return out;
  for (const tag of fallbackTags) {
    if (!out.includes(tag)) out.push(tag);
    if (hasMatchingCategory(out)) break;
  }
  return normalizeTags(out);
}

function readTagAllowlist() {
  const file = path.join(REPO_ROOT, "scripts", "lib", "tag_enricher_gpt.mjs");
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/const TAG_ALLOWLIST = \[(.*?)\]/s);
  const tags = new Set();
  for (const item of match?.[1]?.matchAll(/"([^"]+)"/g) || []) {
    tags.add(item[1]);
  }
  return tags;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readRepoTags(slug) {
  const file = path.join(REPO_ROOT, "content", "tools", `${slug}.md`);
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf8");
  const inline = text.match(/^tags:\s*\[(.*?)\]/m);
  if (inline?.[1]) {
    return normalizeTags(inline[1].split(","));
  }
  const block = text.match(/^tags:\s*\n((?:\s*-\s*.*\n)+)/m);
  if (!block?.[1]) return [];
  return normalizeTags(
    block[1]
      .split("\n")
      .map((line) => line.replace(/^\s*-\s*/, ""))
      .filter(Boolean)
  );
}

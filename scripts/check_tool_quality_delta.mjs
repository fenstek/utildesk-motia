#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  TEMPLATE_PHRASES,
  countTemplatePhrases,
  parseSimpleFrontmatter,
  splitMarkdownDocument,
} from "../site/src/lib/toolQuality.mjs";

const args = process.argv.slice(2);
const baseIndex = args.indexOf("--base");
const base = baseIndex >= 0 ? args[baseIndex + 1] : "";
if (!base) {
  console.error("Usage: node scripts/check_tool_quality_delta.mjs --base <sha>");
  process.exit(2);
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const toolsDir = path.join(repoRoot, "content", "tools");
const minActiveTools = Number(process.env.UTILDESK_MIN_ACTIVE_TOOLS || 1167);
const maxCategories = Number(process.env.UTILDESK_MAX_TOOL_CATEGORIES || 14);
const bannedCategoryValues = new Set([
  "AI",
  "Automation",
  "Developer",
  "Design & Kreativitat",
  "Design & Kreativität",
]);

const git = (args, options = {}) => execFileSync("git", args, { encoding: "utf8", ...options });
const changedFiles = git(["diff", "--name-only", base, "HEAD", "--", "content/tools"])
  .split(/\r?\n/)
  .filter((file) => file.endsWith(".md") && !file.split("/").at(-1).startsWith("_"));

function inspectFile(raw, fallbackSlug) {
  if (!raw) return null;
  const data = parseSimpleFrontmatter(raw);
  const disabled = data.disabled === true || String(data.disabled || "").toLowerCase() === "true";
  if (disabled) return { active: false, category: "", failures: new Map() };

  const slug = String(data.slug || fallbackSlug);
  const tier = String(data.tier || "").toUpperCase();
  const category = String(data.category || "").trim();
  const { body } = splitMarkdownDocument(raw);
  const failures = new Map();
  const add = (kind, message) => failures.set(`${slug}:${kind}`, message);

  if (!['A', 'B', 'C', 'D'].includes(tier)) add("invalid-tier", `${slug}: missing or invalid tier \"${data.tier ?? ""}\"`);
  if (tier !== "A" && countTemplatePhrases(body) > 0) {
    const phrases = TEMPLATE_PHRASES.filter((phrase) => body.includes(phrase));
    add("template-phrases", `${slug}: non-A page contains template phrase(s): ${phrases.join(", ")}`);
  }
  if ((tier === "C" || tier === "D") && /lastReviewed|last_reviewed|zuletzt geprüft/i.test(raw)) {
    add("last-reviewed", `${slug}: non-curated page contains a last-reviewed signal`);
  }
  if ((tier === "C" || tier === "D") && /Kuratiert von Utildesk Redaktion/i.test(raw)) {
    add("curated-attribution", `${slug}: non-curated page contains false curated attribution`);
  }
  if (bannedCategoryValues.has(category)) add("legacy-category", `${slug}: non-canonical category \"${category}\"`);

  return { active: true, category, failures };
}

function inspectHeadCatalog() {
  const categoryCounts = new Map();
  let activeTools = 0;
  for (const file of fs.readdirSync(toolsDir).filter((file) => file.endsWith(".md") && !file.startsWith("_"))) {
    const entry = inspectFile(fs.readFileSync(path.join(toolsDir, file), "utf8"), file.replace(/\.md$/, ""));
    if (!entry?.active) continue;
    activeTools += 1;
    categoryCounts.set(entry.category || "(missing)", (categoryCounts.get(entry.category || "(missing)") ?? 0) + 1);
  }
  return { activeTools, categoryCounts };
}

const headCatalog = inspectHeadCatalog();
const baseCategoryCounts = new Map(headCatalog.categoryCounts);
let baseActiveTools = headCatalog.activeTools;
const decrement = (map, key) => {
  const next = (map.get(key) ?? 0) - 1;
  if (next <= 0) map.delete(key);
  else map.set(key, next);
};
const regressions = [];

for (const file of changedFiles) {
  const slug = path.basename(file, ".md");
  const headPath = path.join(repoRoot, file);
  const after = fs.existsSync(headPath) ? inspectFile(fs.readFileSync(headPath, "utf8"), slug) : null;
  let before = null;
  try {
    before = inspectFile(git(["show", `${base}:${file}`]), slug);
  } catch {
    before = null;
  }

  if (after?.active) {
    decrement(baseCategoryCounts, after.category || "(missing)");
    baseActiveTools -= 1;
  }
  if (before?.active) {
    baseCategoryCounts.set(before.category || "(missing)", (baseCategoryCounts.get(before.category || "(missing)") ?? 0) + 1);
    baseActiveTools += 1;
  }

  for (const [id, message] of after?.failures ?? []) {
    if (!before?.failures?.has(id)) regressions.push(message);
  }
}

const headMissingCategories = headCatalog.categoryCounts.get("(missing)") ?? 0;
const baseMissingCategories = baseCategoryCounts.get("(missing)") ?? 0;
if (headCatalog.activeTools < minActiveTools && baseActiveTools >= minActiveTools) {
  regressions.push(`active tool count ${headCatalog.activeTools} is below expected minimum ${minActiveTools}`);
}
if (headCatalog.categoryCounts.size > baseCategoryCounts.size) {
  regressions.push(`active category count increased from ${baseCategoryCounts.size} to ${headCatalog.categoryCounts.size} (maximum ${maxCategories})`);
}
if (headMissingCategories > baseMissingCategories) {
  regressions.push(`active tools without a category increased from ${baseMissingCategories} to ${headMissingCategories}`);
}

const summary = {
  base,
  head: git(["rev-parse", "HEAD"]).trim(),
  changedToolFiles: changedFiles.length,
  baseline: {
    activeTools: baseActiveTools,
    uniqueCategories: baseCategoryCounts.size,
    missingCategories: baseMissingCategories,
  },
  candidate: {
    activeTools: headCatalog.activeTools,
    uniqueCategories: headCatalog.categoryCounts.size,
    missingCategories: headMissingCategories,
  },
  regressions,
};

if (regressions.length) {
  console.error("Tool quality regression guard failed:");
  for (const regression of regressions) console.error(`- ${regression}`);
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, ...summary }, null, 2));

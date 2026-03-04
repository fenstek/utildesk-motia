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

const DEFAULT_OUTPUT_PATH = path.join(REPO_ROOT, "backups", "snapshots", "sheet_patch.missing_tags.overrides.json");
const CATEGORY_TAG_MAP = new Map([
  ["Automatisierung", ["automation", "workflow"]],
  ["Video", ["video"]],
  ["AI Agents", ["automation"]],
  ["Developer", ["coding", "developer-tools"]],
  ["Audio", ["audio"]],
  ["AI Infrastructure", ["developer-tools", "api"]],
  ["Cloud", ["developer-tools"]],
]);
const MISSING_TAGS_OVERRIDES_BY_SLUG = new Map([
  ["anything-llm", ["assistant", "chatbot", "api"]],
  ["open-webui", ["assistant", "chatbot"]],
  ["jan-ai", ["automation", "data", "analytics"]],
  ["openai-gpt-modelle", ["chatbot", "assistant", "writing"]],
  ["uipath", ["automation", "workflow", "data"]],
  ["monday-com", ["productivity", "workflow", "automation"]],
  ["google-tabellen", ["spreadsheet", "data", "productivity"]],
  ["wavepad", ["audio", "transcription"]],
  ["rephrase-ai", ["productivity", "automation", "data"]],
]);

const argv = process.argv.slice(2);
const auditPath = path.resolve(parseArgValue(argv, "--in", DEFAULT_AUDIT_PATH));
const snapshotPath = path.resolve(parseArgValue(argv, "--snapshot", DEFAULT_SNAPSHOT_PATH));
const outputPath = path.resolve(parseArgValue(argv, "--out", DEFAULT_OUTPUT_PATH));

ensureSnapshotsDir();

const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const snapshot = loadSnapshot(snapshotPath);
const sheet = getPrimarySheet(snapshot);
const rowMap = new Map(sheet.rows.map((row) => [Number(row.row_id), row]));
const policyAllowlist = readPolicyTagAllowlist();
const allowlist = buildSnapshotAllowlist(sheet, policyAllowlist);
const changes = [];
const unresolved = [];

for (const issue of audit.errors || []) {
  if (issue.severity !== "warn" || issue.message !== "missing tags") continue;
  const row = rowMap.get(Number(issue.row_id));
  if (!row) continue;

  const { eligible } = qcEligibility(row);
  if (!eligible) continue;

  const slug = String(row.slug || row.values.slug || "");
  const overrideTags = MISSING_TAGS_OVERRIDES_BY_SLUG.get(slug);
  if (overrideTags?.length) {
    const normalizedOverride = normalizeTags(overrideTags).slice(0, 3);
    const invalidOverrideTags = normalizedOverride.filter((tag) => !allowlist.has(tag));
    if (!normalizedOverride.length || normalizedOverride.length > 3) {
      unresolved.push(`${row.row_id}:${slug}:invalid_override_size`);
      continue;
    }
    if (invalidOverrideTags.length) {
      unresolved.push(`${row.row_id}:${slug}:override_not_in_allowlist:${invalidOverrideTags.join(",")}`);
      continue;
    }
    if (!hasMatchingCategory(normalizedOverride)) {
      unresolved.push(`${row.row_id}:${slug}:override_has_no_taxonomy_match`);
      continue;
    }

    changes.push({
      row_id: Number(row.row_id),
      slug,
      column: "tags",
      old_value: String(row.values.tags || ""),
      new_value: normalizedOverride.join(","),
      reason: `backfill_missing_tags_slug_override:${slug}`,
      confidence: "high",
    });
    continue;
  }

  const category = String(row.values.category || "").trim();
  const mappedTags = CATEGORY_TAG_MAP.get(category);
  if (!mappedTags || !mappedTags.length) {
    unresolved.push(`${row.row_id}:${slug}:no_category_mapping:${category}`);
    continue;
  }

  const normalized = normalizeTags(mappedTags);
  if (!normalized.length || normalized.some((tag) => !allowlist.has(tag))) {
    unresolved.push(`${row.row_id}:${slug}:tag_not_in_allowlist:${category}`);
    continue;
  }
  if (!hasMatchingCategory(normalized)) {
    unresolved.push(`${row.row_id}:${slug}:category_mapping_has_no_taxonomy_match:${category}`);
    continue;
  }

  changes.push({
    row_id: Number(row.row_id),
    slug,
    column: "tags",
    old_value: String(row.values.tags || ""),
    new_value: normalized.join(","),
    reason: `backfill_missing_tags_from_category:${category}`,
    confidence: "high",
  });
}

const patch = {
  meta: {
    generated_at: new Date().toISOString(),
    source_snapshot: path.relative(REPO_ROOT, snapshotPath),
    notes: unresolved.length
      ? `missing_tags unresolved: ${unresolved.slice(0, 20).join(" | ")}`
      : "missing_tags resolved for all eligible mapped rows",
  },
  changes,
};

fs.writeFileSync(outputPath, JSON.stringify(patch, null, 2));

console.log(`PATCH_MISSING_TAGS changes=${changes.length} unresolved=${unresolved.length}`);
console.log("slug | category | tags_after");
for (const change of changes) {
  const row = rowMap.get(Number(change.row_id));
  console.log(`${change.slug} | ${String(row?.values?.category || "")} | ${change.new_value}`);
}

function normalizeTags(rawTags) {
  const seen = new Set();
  const out = [];
  for (const raw of rawTags) {
    const tag = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

function readPolicyTagAllowlist() {
  const file = path.join(REPO_ROOT, "scripts", "lib", "tag_enricher_gpt.mjs");
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/const TAG_ALLOWLIST = \[(.*?)\]/s);
  const tags = new Set();
  for (const item of match?.[1]?.matchAll(/"([^"]+)"/g) || []) {
    tags.add(item[1]);
  }
  return tags;
}

function buildSnapshotAllowlist(sheet, policyAllowlist) {
  const tags = new Set();
  for (const row of sheet.rows) {
    for (const tag of normalizeTags(parseTags(row.values.tags || ""))) {
      if (policyAllowlist.has(tag)) tags.add(tag);
    }
  }
  return tags;
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_AUDIT_PATH,
  DEFAULT_SNAPSHOT_PATH,
  ensureSnapshotsDir,
  getPrimarySheet,
  loadSnapshot,
  parseArgValue,
} from "./sheet_snapshot_lib.mjs";
import { qcEligibility } from "./qc_eligibility.mjs";
import { REPO_ROOT } from "./project_memory_lib.mjs";

const DEFAULT_OUTPUT_PATH = path.join(REPO_ROOT, "backups", "snapshots", "sheet_patch.missing_tags.json");
const CATEGORY_TAG_MAP = new Map([
  ["Automatisierung", ["automation", "workflow"]],
  ["Video", ["video"]],
  ["AI Agents", ["automation"]],
  ["Developer", ["coding", "developer-tools"]],
  ["Audio", ["audio"]],
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
const allowlist = readTagAllowlist();
const changes = [];
const unresolved = [];

for (const issue of audit.errors || []) {
  if (issue.severity !== "warn" || issue.message !== "missing tags") continue;
  const row = rowMap.get(Number(issue.row_id));
  if (!row) continue;

  const { eligible } = qcEligibility(row);
  if (!eligible) continue;

  const category = String(row.values.category || "").trim();
  const mappedTags = CATEGORY_TAG_MAP.get(category);
  if (!mappedTags || !mappedTags.length) {
    unresolved.push(`${row.row_id}:${row.slug}:no_category_mapping:${category}`);
    continue;
  }

  const normalized = normalizeTags(mappedTags);
  if (!normalized.length || normalized.some((tag) => !allowlist.has(tag))) {
    unresolved.push(`${row.row_id}:${row.slug}:tag_not_in_allowlist:${category}`);
    continue;
  }

  changes.push({
    row_id: Number(row.row_id),
    slug: String(row.slug || row.values.slug || ""),
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
for (const change of changes) {
  const row = rowMap.get(Number(change.row_id));
  console.log(`${change.slug}\t${String(row?.values?.category || "")}\t(empty) -> ${change.new_value}`);
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

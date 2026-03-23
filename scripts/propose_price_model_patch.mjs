#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { normalizePriceModel } from "./lib/price_model_policy.mjs";

const REPO_ROOT = path.resolve(process.cwd());
const argv = process.argv.slice(2);
const snapshotPath = path.resolve(getArg("--snapshot", path.join(REPO_ROOT, "backups", "snapshots", "sheet_snapshot.latest.json")));
const outputPath = path.resolve(getArg("--out", path.join(REPO_ROOT, "backups", "snapshots", "sheet_patch.price_models.json")));
const limit = Math.max(0, Number(getArg("--limit", "0")) || 0);

if (!fs.existsSync(snapshotPath)) {
  console.error(`SNAPSHOT_NOT_FOUND ${snapshotPath}`);
  process.exit(1);
}

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
const sheet = getPrimarySheet(snapshot);
const changes = [];

for (const row of sheet.rows || []) {
  const rowId = Number(row.row_id);
  if (!Number.isInteger(rowId) || rowId < 2) continue;

  const values = row.values || {};
  const current = String(values.price_model || "").trim();
  const normalized = normalizePriceModel(current);
  if (current === normalized) continue;

  changes.push({
    row_id: rowId,
    slug: String(row.slug || values.slug || "").trim(),
    column: "price_model",
    old_value: current,
    new_value: normalized,
    reason: "normalize_price_model_to_canonical_policy",
    confidence: "high",
  });

  if (limit && changes.length >= limit) break;
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({
  meta: {
    generated_at: new Date().toISOString(),
    source_snapshot: path.relative(REPO_ROOT, snapshotPath),
    notes: "Normalize price_model to canonical policy",
  },
  changes,
}, null, 2));

console.log(`PATCH_PRICE_MODELS changes=${changes.length}`);

function getArg(name, fallback) {
  const exact = argv.find((arg) => arg.startsWith(`${name}=`));
  return exact ? exact.slice(name.length + 1) : fallback;
}

function getPrimarySheet(snapshotObject) {
  if (snapshotObject && Array.isArray(snapshotObject.sheets) && snapshotObject.sheets[0]) {
    return snapshotObject.sheets[0];
  }
  if (snapshotObject && Array.isArray(snapshotObject.rows) && Array.isArray(snapshotObject.header)) {
    return snapshotObject;
  }
  throw new Error("Unsupported snapshot format");
}

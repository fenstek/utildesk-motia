#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_PATCH_PATH, parseArgValue } from "./sheet_snapshot_lib.mjs";

export const PATCH_ALLOWLIST = new Set([
  "slug",
  "official_url",
  "notes",
  "tags",
  "category",
  "affiliate_url",
  "title",
  "short_hint",
]);
export const DUPLICATE_STATUS_ALLOWLIST = new Set(["duplicate", "dup", "alias", "aliased"]);

export function validatePatchObject(patch, { maxChanges = 50, allowStatus = false, allowDuplicateStatusResolution = false } = {}) {
  const problems = [];
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    problems.push("patch must be an object");
    return { ok: false, problems };
  }
  if (!patch.meta || typeof patch.meta !== "object" || Array.isArray(patch.meta)) {
    problems.push("meta must be an object");
  }
  if (!Array.isArray(patch.changes)) {
    problems.push("changes must be an array");
    return { ok: false, problems };
  }
  if (patch.changes.length > maxChanges) {
    problems.push(`changes exceed limit ${maxChanges}`);
  }

  patch.changes.forEach((change, index) => {
    if (!change || typeof change !== "object" || Array.isArray(change)) {
      problems.push(`change[${index}] must be an object`);
      return;
    }
    const rowId = Number(change.row_id);
    const column = String(change.column || "").toLowerCase();
    const reason = String(change.reason || "").trim();
    const confidence = String(change.confidence || "");
    if (!Number.isInteger(rowId) || rowId < 2) problems.push(`change[${index}] invalid row_id`);
    if (!column) problems.push(`change[${index}] missing column`);
    if (!reason) problems.push(`change[${index}] missing reason`);
    if (!["low", "medium", "high"].includes(confidence)) {
      problems.push(`change[${index}] invalid confidence`);
    }
    if (column === "status") {
      if (allowDuplicateStatusResolution) {
        const nextStatus = String(change.new_value || "").trim().toLowerCase();
        if (!DUPLICATE_STATUS_ALLOWLIST.has(nextStatus)) {
          problems.push(`change[${index}] status ${nextStatus || "(empty)"} not allowed for duplicate resolution`);
        }
        if (!reason.startsWith("resolve_duplicate_official_url:")) {
          problems.push(`change[${index}] invalid duplicate resolution reason`);
        }
      } else if (!allowStatus) {
        problems.push(`change[${index}] status changes forbidden`);
      }
    }
    if (column !== "status" && !PATCH_ALLOWLIST.has(column)) {
      problems.push(`change[${index}] column ${column} not in allowlist`);
    }
  });

  return { ok: problems.length === 0, problems };
}

function main() {
  const argv = process.argv.slice(2);
  const patchPath = path.resolve(parseArgValue(argv, "--patch", DEFAULT_PATCH_PATH));
  const maxChanges = Math.max(1, Number(parseArgValue(argv, "--max-changes", "50")) || 50);
  const allowStatus = argv.includes("--allow-status");
  const allowDuplicateStatusResolution = argv.includes("--allow-duplicate-status-resolution");

  const patch = JSON.parse(fs.readFileSync(patchPath, "utf8"));
  const result = validatePatchObject(patch, { maxChanges, allowStatus, allowDuplicateStatusResolution });
  if (!result.ok) {
    console.error(`PATCH_INVALID ${result.problems.join(" | ")}`);
    process.exit(1);
  }
  console.log(`PATCH_VALID changes=${patch.changes.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createSheetsClient, getSpreadsheetId } from "./google_auth_lib.mjs";
import {
  DEFAULT_AUDIT_PATH,
  DEFAULT_APPLY_LOG_PATH,
  DEFAULT_PATCH_PATH,
  DEFAULT_SNAPSHOT_PATH,
  colLetter,
  ensureSnapshotsDir,
  getPrimarySheet,
  loadSnapshot,
  parseArgValue,
  stringValue,
} from "./sheet_snapshot_lib.mjs";
import { DUPLICATE_STATUS_ALLOWLIST, PATCH_ALLOWLIST, validatePatchObject } from "./validate_sheet_patch.mjs";

const argv = process.argv.slice(2);
const patchPath = parseArgValue(argv, "--patch", "");
const dryRun = argv.includes("--dry-run");
const strict = !argv.includes("--strict=false");
const allowStatus = argv.includes("--allow-status");
const allowDuplicateStatusResolution = argv.includes("--allow-duplicate-status-resolution");
const maxChanges = Math.max(1, Number(parseArgValue(argv, "--max-changes", "50")) || 50);
const snapshotPath = path.resolve(parseArgValue(argv, "--snapshot", DEFAULT_SNAPSHOT_PATH));
const auditPath = path.resolve(parseArgValue(argv, "--audit", DEFAULT_AUDIT_PATH));
const logPath = path.resolve(parseArgValue(argv, "--log", DEFAULT_APPLY_LOG_PATH));
const patchFile = path.resolve(patchPath || DEFAULT_PATCH_PATH);

ensureSnapshotsDir();

if (!fs.existsSync(patchFile)) {
  console.error("Missing patch file");
  process.exit(1);
}

const patch = JSON.parse(fs.readFileSync(patchFile, "utf8"));
const patchValidation = validatePatchObject(patch, { maxChanges, allowStatus, allowDuplicateStatusResolution });
if (!patchValidation.ok) {
  throw new Error(`Patch validation failed: ${patchValidation.problems.join(" | ")}`);
}
const audit = fs.existsSync(auditPath) ? JSON.parse(fs.readFileSync(auditPath, "utf8")) : null;
const snapshot = loadSnapshot(snapshotPath);
const sheet = getPrimarySheet(snapshot);
const rowMap = new Map(sheet.rows.map((row) => [Number(row.row_id), row]));
const headerIndex = Object.fromEntries(sheet.header.map((name, index) => [String(name).toLowerCase(), index]));
const spreadsheetId = getSpreadsheetId({ fallback: snapshot.spreadsheet_id });
const sheetName = sheet.title || process.env.SHEET_NAME || "Tabellenblatt1";

if (!spreadsheetId) {
  console.error("Missing spreadsheet id");
  process.exit(1);
}

const planned = [];
for (const change of patch.changes || []) {
  validateChange(change);
  const rowId = Number(change.row_id);
  const row = rowMap.get(rowId);
  if (!row) {
    throw new Error(`Row ${rowId} not found in snapshot`);
  }
  const column = String(change.column || "").toLowerCase();
  if (!(column in headerIndex)) {
    throw new Error(`Column ${column} not found in snapshot header`);
  }
  const snapshotValue = stringValue(row.values[column]);
  if (strict && snapshotValue !== stringValue(change.old_value)) {
    throw new Error(`Strict mismatch for row ${rowId} column ${column}: snapshot old_value differs`);
  }
  planned.push({
    row_id: rowId,
    slug: change.slug || row.slug || "",
    column,
    old_value: snapshotValue,
    new_value: stringValue(change.new_value),
    reason: String(change.reason || ""),
    confidence: String(change.confidence || ""),
    range: `${sheetName}!${colLetter(headerIndex[column])}${rowId}`,
  });
}

if (allowDuplicateStatusResolution) {
  assertDuplicateStatusResolutionAllowed(planned, audit, rowMap);
}

if (dryRun) {
  for (const item of planned) {
    console.log(`${item.row_id}\t${item.column}\t${item.old_value} -> ${item.new_value}\t${item.reason}`);
  }
  console.log(`DRY_RUN changes=${planned.length}`);
  process.exit(0);
}

const sheets = await createSheetsClient({ readonly: false });
if (strict && planned.length) {
  await assertCurrentValuesMatch(sheets, planned, spreadsheetId);
}

for (let index = 0; index < planned.length; index += 50) {
  const chunk = planned.slice(index, index + 50);
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: chunk.map((item) => ({
        range: item.range,
        values: [[item.new_value]],
      })),
    },
  });
}

appendLog(logPath, {
  applied_at: new Date().toISOString(),
  patch: path.relative(process.cwd(), patchFile),
  snapshot: path.relative(process.cwd(), snapshotPath),
  changes: planned.map((item) => ({
    row_id: item.row_id,
    slug: item.slug,
    column: item.column,
    old_value: item.old_value,
    new_value: item.new_value,
    reason: item.reason,
    confidence: item.confidence,
  })),
});

console.log(`APPLY_OK changes=${planned.length}`);

function validateChange(change) {
  const column = String(change.column || "").toLowerCase();
  if (!column) throw new Error("Patch change missing column");
  if (column === "status") {
    if (allowDuplicateStatusResolution) {
      const nextStatus = String(change.new_value || "").trim().toLowerCase();
      if (!DUPLICATE_STATUS_ALLOWLIST.has(nextStatus)) {
        throw new Error(`Status ${nextStatus || "(empty)"} not allowed for duplicate resolution`);
      }
    } else if (!allowStatus) {
      throw new Error("Status changes require --allow-status");
    }
  }
  if (column !== "status" && !PATCH_ALLOWLIST.has(column)) {
    throw new Error(`Column ${column} not in allowlist`);
  }
  if (!["low", "medium", "high"].includes(String(change.confidence || ""))) {
    throw new Error(`Invalid confidence for row ${change.row_id} column ${column}`);
  }
  if (!String(change.reason || "").trim()) {
    throw new Error(`Missing reason for row ${change.row_id} column ${column}`);
  }
}

function assertDuplicateStatusResolutionAllowed(plannedChanges, auditReport, rowMap) {
  if (!auditReport) {
    throw new Error("Duplicate status resolution requires an audit report");
  }
  const duplicateRows = new Set(
    (auditReport.errors || [])
      .filter((item) => item.severity === "warn")
      .filter((item) => String(item.field || "").toLowerCase() === "official_url")
      .filter((item) => String(item.message || "").startsWith("duplicate official_url: "))
      .map((item) => Number(item.row_id))
  );
  for (const item of plannedChanges) {
    if (item.column !== "status") continue;
    if (!duplicateRows.has(Number(item.row_id))) {
      throw new Error(`Row ${item.row_id} is not in the duplicate official_url warning bucket`);
    }
    const row = rowMap.get(Number(item.row_id));
    const currentStatus = String(row?.values?.status || "").trim().toLowerCase();
    if (DUPLICATE_STATUS_ALLOWLIST.has(currentStatus)) {
      throw new Error(`Row ${item.row_id} already has duplicate/alias skip status`);
    }
  }
}

async function assertCurrentValuesMatch(sheets, plannedChanges, activeSpreadsheetId) {
  const ranges = plannedChanges.map((item) => item.range);
  const result = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: activeSpreadsheetId,
    ranges,
  });
  const valueRanges = result.data.valueRanges || [];
  for (let i = 0; i < plannedChanges.length; i += 1) {
    const liveValue = stringValue(valueRanges[i]?.values?.[0]?.[0]);
    if (liveValue !== plannedChanges[i].old_value) {
      throw new Error(`Current sheet mismatch for row ${plannedChanges[i].row_id} column ${plannedChanges[i].column}`);
    }
  }
}

function appendLog(filePath, entry) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`);
}

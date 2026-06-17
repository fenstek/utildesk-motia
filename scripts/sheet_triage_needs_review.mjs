#!/usr/bin/env node
/**
 * Triage script for NEEDS_REVIEW rows
 *
 * Read-only by default.
 *
 * Usage:
 *   node scripts/sheet_triage_needs_review.mjs [--limit N] [--json]
 *
 * Write (explicit):
 *   node scripts/sheet_triage_needs_review.mjs --apply --set-status ROW STATUS
 */

import process from "node:process";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";

const ALLOWED_STATUSES = ["NEW", "BLACKLIST", "REBUILD", "DISABLED", "ERROR"];

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf("--limit") + 1] || 50);
const jsonOutput = args.includes("--json");
const applyMode = args.includes("--apply");
const setStatusIdx = args.indexOf("--set-status");

let targetRow = null;
let targetStatus = null;
if (setStatusIdx !== -1) {
  targetRow = Number(args[setStatusIdx + 1]);
  targetStatus = String(args[setStatusIdx + 2] || "").trim().toUpperCase();
}

function die(msg) {
  console.error(`\n[ERROR] ${msg}\n`);
  process.exit(1);
}

if (!SPREADSHEET_ID) {
  die("SPREADSHEET_ID env var is missing");
}

async function createSheetsClient() {
  if (!SPREADSHEET_ID) die("SPREADSHEET_ID env var is missing");

  const client_email = process.env.GOOGLE_CLIENT_EMAIL || "";
  let private_key = process.env.GOOGLE_PRIVATE_KEY || "";

  if (!client_email || !private_key) {
    die("Missing GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY env vars");
  }

  // Google private keys in env are often stored with literal \n
  private_key = private_key.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: applyMode
      ? ["https://www.googleapis.com/auth/spreadsheets"]
      : ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
}

async function getStatusColumnIndex(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z1`,
  });
  const header = (res.data.values?.[0] || []).map((h) =>
    String(h).trim().toLowerCase()
  );
  const idx = header.indexOf("status");
  if (idx === -1) die('Column "status" not found');
  return idx;
}

async function updateStatus(sheets, rowNumber, newStatus) {
  const statusColIdx = await getStatusColumnIndex(sheets);
  const colLetter = String.fromCharCode("A".charCodeAt(0) + statusColIdx);
  const cell = `${SHEET_NAME}!${colLetter}${rowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: cell,
    valueInputOption: "RAW",
    requestBody: { values: [[newStatus]] },
  });

  return { cell, status: newStatus };
}

async function main() {
  if (setStatusIdx !== -1 && !applyMode) {
    die("--set-status requires --apply");
  }

  const sheets = await createSheetsClient();

  // WRITE MODE
  if (applyMode && setStatusIdx !== -1) {
    if (!targetRow || targetRow < 2) die("Invalid row number");
    if (!ALLOWED_STATUSES.includes(targetStatus)) {
      die(`Invalid status "${targetStatus}". Allowed: ${ALLOWED_STATUSES.join(", ")}`);
    }
    console.log(`[APPLY] Row ${targetRow} -> ${targetStatus}`);
    const res = await updateStatus(sheets, targetRow, targetStatus);
    console.log(JSON.stringify({ ok: true, updated: res }, null, 2));
    return;
  }

  // READ MODE
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) {
    console.log(jsonOutput ? "[]" : "No data");
    return;
  }

  const header = values[0].map((h) => String(h).trim());
  const rows = values.slice(1);
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  if (!("status" in idx)) die('Column "status" not found');

  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const status = String(row[idx.status] || "").trim().toUpperCase();
    if (status === "NEEDS_REVIEW") {
      out.push({
        row: i + 2,
        topic: row[idx.topic] || "",
        slug: row[idx.slug] || "",
        official_url: row[idx.official_url] || "",
        wikidata_id: row[idx.wikidata_id] || "",
      });
      if (out.length >= limit) break;
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  if (!out.length) {
    console.log("No NEEDS_REVIEW rows found");
    return;
  }

  console.log(`Found ${out.length} NEEDS_REVIEW rows:\n`);
  console.log("ROW | TOPIC                              | SLUG                  | OFFICIAL_URL                               | WIKIDATA_ID");
  console.log("----+------------------------------------+-----------------------+--------------------------------------------+-----------");
  for (const r of out) {
    console.log(
      `${String(r.row).padStart(3)} | ` +
      `${String(r.topic).slice(0, 34).padEnd(34)} | ` +
      `${String(r.slug).slice(0, 21).padEnd(21)} | ` +
      `${String(r.official_url).slice(0, 44).padEnd(44)} | ` +
      `${String(r.wikidata_id).slice(0, 11).padEnd(11)}`
    );
  }
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});

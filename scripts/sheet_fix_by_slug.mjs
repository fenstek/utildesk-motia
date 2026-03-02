#!/usr/bin/env node
import "dotenv/config";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || "";
const privateKey = String(process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function usage() {
  die(
    "Usage: node scripts/sheet_fix_by_slug.mjs <slug> <new_status> [new_official_url] [note]\n" +
      "Use - to keep official_url unchanged."
  );
}

function colLetter(index) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

if (!SPREADSHEET_ID) die("SPREADSHEET_ID env var is missing");
if (!clientEmail || !privateKey) die("Missing GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY env vars");

const slug = String(process.argv[2] || "").trim().toLowerCase();
const newStatus = String(process.argv[3] || "").trim();
const rawOfficialUrl = process.argv[4];
const note = String(process.argv[5] || "").trim();

if (!slug || !newStatus) usage();
if (rawOfficialUrl && rawOfficialUrl !== "-" && !String(rawOfficialUrl).startsWith("http")) {
  die("new_official_url must start with http or be omitted / '-'");
}

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

async function main() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) die("Sheet has no data rows");

  const header = values[0].map((cell) => String(cell || "").trim().toLowerCase());
  const idx = Object.fromEntries(header.map((name, index) => [name, index]));

  for (const required of ["slug", "status"]) {
    if (!(required in idx)) die(`Column "${required}" not found in sheet header`);
  }
  if (!("official_url" in idx)) die('Column "official_url" not found in sheet header');
  if (!("notes" in idx)) die('Column "notes" not found in sheet header');

  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    const rowSlug = String(values[i]?.[idx.slug] || "").trim().toLowerCase();
    if (rowSlug === slug) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    die(JSON.stringify({ ok: false, slug, error: "slug not found" }), 2);
  }

  const currentRow = values[rowIndex - 1] || [];
  const currentStatus = String(currentRow[idx.status] || "").trim();
  const currentOfficialUrl = String(currentRow[idx.official_url] || "").trim();
  const currentNotes = String(currentRow[idx.notes] || "").trim();

  const updates = [];
  const changed = {};

  if (currentStatus !== newStatus) {
    updates.push({
      range: `${SHEET_NAME}!${colLetter(idx.status)}${rowIndex}`,
      values: [[newStatus]],
    });
    changed.status = { before: currentStatus, after: newStatus };
  }

  if (rawOfficialUrl && rawOfficialUrl !== "-" && currentOfficialUrl !== rawOfficialUrl) {
    updates.push({
      range: `${SHEET_NAME}!${colLetter(idx.official_url)}${rowIndex}`,
      values: [[rawOfficialUrl]],
    });
    changed.official_url = { before: currentOfficialUrl, after: rawOfficialUrl };
  }

  if (note) {
    const mergedNotes = currentNotes ? `${currentNotes} | ${note}` : note;
    if (mergedNotes !== currentNotes) {
      updates.push({
        range: `${SHEET_NAME}!${colLetter(idx.notes)}${rowIndex}`,
        values: [[mergedNotes]],
      });
      changed.notes = { before: currentNotes, after: mergedNotes };
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "RAW",
        data: updates,
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        rowNumber: rowIndex,
        slug,
        changed,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(`ERROR: ${error?.message || String(error)}`);
  process.exit(1);
});

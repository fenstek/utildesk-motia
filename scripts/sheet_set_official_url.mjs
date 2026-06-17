#!/usr/bin/env node
/**
 * Update the official_url column for a specific row in Google Sheet.
 *
 * Usage:
 *   node scripts/sheet_set_official_url.mjs <row_index> <official_url>
 *
 * Arguments:
 *   row_index    - 1-based spreadsheet row number (e.g. 42)
 *   official_url - new URL value (e.g. https://kive.ai/)
 *
 * ENV:
 *   SPREADSHEET_ID  - Google Sheet ID
 *   SHEET_NAME      - Sheet tab name (default: Tabellenblatt1)
 *   GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY  - service account credentials
 */

import 'dotenv/config';
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";

if (!SPREADSHEET_ID) {
  console.error("SPREADSHEET_ID env var is missing");
  process.exit(1);
}

const client_email = process.env.GOOGLE_CLIENT_EMAIL;
const private_key = String(process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

if (!client_email || !private_key) {
  console.error("Missing GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY env vars");
  process.exit(1);
}

const row_index = Number(process.argv[2] || 0);
const official_url = String(process.argv[3] || "").trim();

if (!row_index || row_index < 2) {
  console.error("Usage: node scripts/sheet_set_official_url.mjs <row_index> <official_url>");
  console.error("  row_index must be a 1-based row number >= 2 (row 1 is header)");
  process.exit(1);
}
if (!official_url || !official_url.startsWith("http")) {
  console.error("Usage: node scripts/sheet_set_official_url.mjs <row_index> <official_url>");
  console.error("  official_url must be a valid URL starting with http");
  process.exit(1);
}

const auth = new google.auth.JWT({
  email: client_email,
  key: private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

function colLetter(i) {
  return String.fromCharCode("A".charCodeAt(0) + i);
}

async function main() {
  // Read header to find official_url column index
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z1`,
  });

  const header = (headerRes.data.values?.[0] || []).map((h) => String(h || "").trim().toLowerCase());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  if (!("official_url" in idx)) {
    console.error('Column "official_url" not found in sheet header');
    process.exit(1);
  }

  // Read current value
  const cellRange = `${SHEET_NAME}!${colLetter(idx.official_url)}${row_index}`;
  const curRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: cellRange,
  });
  const url_before = String(curRes.data.values?.[0]?.[0] || "").trim();

  console.log(JSON.stringify({ row_index, url_before, url_after: official_url }));

  // Apply update
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: cellRange,
    valueInputOption: "RAW",
    requestBody: { values: [[official_url]] },
  });

  // Read back to confirm
  const afterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: cellRange,
  });
  const url_after_confirmed = String(afterRes.data.values?.[0]?.[0] || "").trim();

  console.log(JSON.stringify({
    ok: true,
    row_index,
    url_before,
    official_url: url_after_confirmed,
  }));
}

main().catch((e) => {
  console.error("ERROR:", e?.message || String(e));
  process.exit(1);
});

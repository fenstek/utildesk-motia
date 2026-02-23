#!/usr/bin/env node
/**
 * Update the notes column for a specific row in Google Sheet.
 *
 * Usage:
 *   node scripts/sheet_set_notes.mjs <row_index> <notes_text>
 *
 * ENV: SPREADSHEET_ID, SHEET_NAME, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY
 */

import 'dotenv/config';
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";

const client_email = process.env.GOOGLE_CLIENT_EMAIL;
const private_key = String(process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

if (!SPREADSHEET_ID || !client_email || !private_key) {
  console.error("Missing env vars: SPREADSHEET_ID / GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY");
  process.exit(1);
}

const row_index = Number(process.argv[2] || 0);
const notes_text = String(process.argv[3] || "").trim();

if (!row_index || row_index < 2) {
  console.error("Usage: node scripts/sheet_set_notes.mjs <row_index> <notes_text>");
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
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z1`,
  });

  const header = (headerRes.data.values?.[0] || []).map((h) => String(h || "").trim().toLowerCase());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  if (!("notes" in idx)) {
    console.error('Column "notes" not found in sheet header');
    process.exit(1);
  }

  const cellRange = `${SHEET_NAME}!${colLetter(idx.notes)}${row_index}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: cellRange,
    valueInputOption: "RAW",
    requestBody: { values: [[notes_text]] },
  });

  console.log(JSON.stringify({ ok: true, row_index, notes: notes_text }));
}

main().catch((e) => {
  console.error("ERROR:", e?.message || String(e));
  process.exit(1);
});

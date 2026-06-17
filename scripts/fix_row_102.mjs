#!/usr/bin/env node
/**
 * Fix row 102 (Domo) with correct official_url and append to notes
 */

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

const auth = new google.auth.JWT({
  email: client_email,
  key: private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

async function main() {
  // Read header and row 102
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z102`,
  });

  const values = res.data.values || [];
  if (values.length < 102) {
    console.error("Sheet has fewer than 102 rows");
    process.exit(1);
  }

  const header = values[0].map((h) => String(h).trim());
  const row102 = values[101]; // 0-indexed, so row 102 is at index 101
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  // Check required columns exist
  for (const col of ["official_url", "status", "notes"]) {
    if (!(col in idx)) {
      console.error(`Column "${col}" not found`);
      process.exit(1);
    }
  }

  // Get current notes
  const currentNotes = String(row102[idx.notes] || "").trim();
  const newNotesAppend = "WRONG_DOMAIN: domodedovo";
  const updatedNotes = currentNotes
    ? `${currentNotes} ${newNotesAppend}`
    : newNotesAppend;

  console.log("Current row 102 state:");
  console.log({
    topic: row102[idx.topic] || "",
    official_url: row102[idx.official_url] || "",
    status: row102[idx.status] || "",
    notes: currentNotes,
  });

  // Column letters (A=0, B=1, C=2, ...)
  const colLetter = (i) => String.fromCharCode("A".charCodeAt(0) + i);

  // Update cells
  const updates = [
    {
      range: `${SHEET_NAME}!${colLetter(idx.official_url)}102`,
      values: [["https://www.domo.com/"]],
    },
    {
      range: `${SHEET_NAME}!${colLetter(idx.status)}102`,
      values: [["NEEDS_REVIEW"]],
    },
    {
      range: `${SHEET_NAME}!${colLetter(idx.notes)}102`,
      values: [[updatedNotes]],
    },
  ];

  // Apply updates
  for (const update of updates) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: update.range,
      valueInputOption: "RAW",
      requestBody: { values: update.values },
    });
  }

  console.log("\nUpdates applied!");

  // Read back row 102
  const resAfter = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A102:Z102`,
  });

  const row102After = resAfter.data.values?.[0] || [];

  console.log("\nUpdated row 102:");
  console.log({
    topic: row102After[idx.topic] || "",
    official_url: row102After[idx.official_url] || "",
    status: row102After[idx.status] || "",
    notes: row102After[idx.notes] || "",
  });
}

main().catch((e) => {
  console.error("ERROR:", e?.message || String(e));
  process.exit(1);
});

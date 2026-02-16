#!/usr/bin/env node
/**
 * Fix row 157 (Let's Enhance) with correct official_url
 *
 * Issue: Row 157 has incorrect official_url "https://let.ai/"
 * Fix: Update to correct URL "https://letsenhance.io/"
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

const auth = new google.auth.JWT({
  email: client_email,
  key: private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

async function main() {
  // Read header and row 157
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z157`,
  });

  const values = res.data.values || [];
  if (values.length < 157) {
    console.error("Sheet has fewer than 157 rows");
    process.exit(1);
  }

  const header = values[0].map((h) => String(h).trim());
  const row157 = values[156]; // 0-indexed, so row 157 is at index 156
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  // Check required columns exist
  for (const col of ["official_url", "status", "topic"]) {
    if (!(col in idx)) {
      console.error(`Column "${col}" not found`);
      process.exit(1);
    }
  }

  console.log("Current row 157 state:");
  console.log({
    topic: row157[idx.topic] || "",
    official_url: row157[idx.official_url] || "",
    status: row157[idx.status] || "",
  });

  // Column letters (A=0, B=1, C=2, ...)
  const colLetter = (i) => String.fromCharCode("A".charCodeAt(0) + i);

  // Update official_url only
  const updates = [
    {
      range: `${SHEET_NAME}!${colLetter(idx.official_url)}157`,
      values: [["https://letsenhance.io/"]],
    },
  ];

  console.log("\nApplying update to official_url column...");

  // Apply updates
  for (const update of updates) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: update.range,
      valueInputOption: "RAW",
      requestBody: { values: update.values },
    });
  }

  console.log("✅ Update applied!");

  // Read back row 157
  const resAfter = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A157:Z157`,
  });

  const row157After = resAfter.data.values?.[0] || [];

  console.log("\nUpdated row 157:");
  console.log({
    topic: row157After[idx.topic] || "",
    official_url: row157After[idx.official_url] || "",
    status: row157After[idx.status] || "",
  });
}

main().catch((e) => {
  console.error("ERROR:", e?.message || String(e));
  process.exit(1);
});

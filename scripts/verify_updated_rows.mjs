#!/usr/bin/env node
/**
 * Verify updated rows and check for forbidden patterns
 */

import { google } from "googleapis";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";
const TARGET_ROWS = [86, 97, 102, 108, 125, 137];

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
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

async function main() {
  // Read header and all rows up to max target row
  const maxRow = Math.max(...TARGET_ROWS);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z${maxRow}`,
  });

  const values = res.data.values || [];
  if (values.length < 2) {
    console.error("Sheet has insufficient data");
    process.exit(1);
  }

  const header = values[0].map((h) => String(h).trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  // Check required columns exist
  for (const col of ["topic", "official_url", "status"]) {
    if (!(col in idx)) {
      console.error(`Column "${col}" not found`);
      process.exit(1);
    }
  }

  console.log("Updated rows from sheet:\n");
  const results = [];

  for (const rowNum of TARGET_ROWS) {
    const rowIndex = rowNum - 1; // 0-indexed
    if (rowIndex >= values.length) {
      console.log(`Row ${rowNum}: NOT FOUND`);
      continue;
    }

    const row = values[rowIndex];
    const data = {
      row: rowNum,
      topic: String(row[idx.topic] || "").trim(),
      status: String(row[idx.status] || "").trim(),
      official_url: String(row[idx.official_url] || "").trim(),
    };

    console.log(JSON.stringify(data, null, 2));
    results.push(data);
  }

  // Verification check
  console.log("\n" + "=".repeat(60));
  console.log("VERIFICATION: Checking for forbidden patterns");
  console.log("=".repeat(60) + "\n");

  const forbiddenPatterns = ["duckduckgo.com", "domodedovo", "uddg="];
  let hasIssues = false;

  for (const data of results) {
    const url = data.official_url.toLowerCase();
    const violations = forbiddenPatterns.filter(pattern => url.includes(pattern));

    if (violations.length > 0) {
      console.log(`❌ Row ${data.row}: VIOLATION FOUND`);
      console.log(`   URL: ${data.official_url}`);
      console.log(`   Forbidden patterns: ${violations.join(", ")}`);
      hasIssues = true;
    }
  }

  if (!hasIssues) {
    console.log("✅ ALL CLEAN: No forbidden patterns found");
    console.log("   - No duckduckgo.com URLs");
    console.log("   - No domodedovo references");
    console.log("   - No uddg= redirect parameters");
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Summary: ${results.length} rows verified`);
  console.log("=".repeat(60));
}

main().catch((e) => {
  console.error("ERROR:", e?.message || String(e));
  process.exit(1);
});

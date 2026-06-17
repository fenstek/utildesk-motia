#!/usr/bin/env node
/**
 * Find a Google Sheet row by slug and print its details as JSON.
 *
 * Usage:
 *   node scripts/sheet_find_row_by_slug.mjs <slug>
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

const slug = String(process.argv[2] || "").trim();
if (!slug) {
  console.error("Usage: node scripts/sheet_find_row_by_slug.mjs <slug>");
  process.exit(1);
}

const auth = new google.auth.JWT({
  email: client_email,
  key: private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

async function main() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) {
    console.error("Sheet has no data rows");
    process.exit(1);
  }

  const header = values[0].map((h) => String(h || "").trim().toLowerCase());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  for (const col of ["slug", "official_url", "status"]) {
    if (!(col in idx)) {
      console.error(`Column "${col}" not found in sheet header`);
      process.exit(1);
    }
  }

  let found = null;
  for (let i = 1; i < values.length; i++) {
    const rowSlug = String(values[i]?.[idx.slug] || "").trim();
    if (rowSlug === slug) {
      const row = values[i];
      found = {
        ok: true,
        row_index: i + 1, // 1-based (spreadsheet row number)
        slug: rowSlug,
        topic: String(row[idx.topic] ?? "").trim(),
        official_url: String(row[idx.official_url] ?? "").trim(),
        status: String(row[idx.status] ?? "").trim(),
      };
      break;
    }
  }

  if (!found) {
    console.log(JSON.stringify({ ok: false, slug, error: "slug not found" }));
    process.exit(1);
  }

  console.log(JSON.stringify(found, null, 2));
}

main().catch((e) => {
  console.error("ERROR:", e?.message || String(e));
  process.exit(1);
});

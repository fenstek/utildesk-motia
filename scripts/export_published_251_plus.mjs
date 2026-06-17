#!/usr/bin/env node
import "dotenv/config";
import fs from "node:fs";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";
const OUT_PATH = "/tmp/published_251_plus.json";
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || "";
const privateKey = String(process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const PUBLISHED = new Set(["DONE", "PUBLISHED", "LIVE"]);

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

if (!SPREADSHEET_ID) die("SPREADSHEET_ID env var is missing");
if (!clientEmail || !privateKey) die("Missing GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY env vars");

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

async function main() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) die("Sheet has no data rows");

  const header = values[0].map((cell) => String(cell || "").trim());
  const idx = Object.fromEntries(header.map((name, i) => [name.toLowerCase(), i]));

  for (const required of ["slug", "status", "official_url"]) {
    if (!(required in idx)) die(`Missing column "${required}"`);
  }

  const rows = [];
  for (let i = 250; i < values.length; i += 1) {
    const row = values[i] || [];
    const status = String(row[idx.status] || "").trim().toUpperCase();
    if (!PUBLISHED.has(status)) continue;

    const item = {
      row_number: i + 1,
      slug: String(row[idx.slug] || "").trim(),
      title: String(row[idx.topic] || row[idx.title] || "").trim(),
      description: String(row[idx.description] || row[idx.summary] || "").trim(),
      category: String(row[idx.category] || "").trim(),
      tags: String(row[idx.tags] || "").trim(),
      official_url: String(row[idx.official_url] || "").trim(),
      status,
      notes: String(row[idx.notes] || "").trim(),
    };

    if (!item.slug) continue;
    rows.push(item);
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify({ exported_at: new Date().toISOString(), count: rows.length, rows }, null, 2));
  console.log(JSON.stringify({ ok: true, out_path: OUT_PATH, count: rows.length }, null, 2));
}

main().catch((error) => {
  console.error(`ERROR: ${error?.message || String(error)}`);
  process.exit(1);
});

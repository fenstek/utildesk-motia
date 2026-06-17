#!/usr/bin/env node
import "dotenv/config";
import fs from "node:fs";
import { google } from "googleapis";

const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID || "1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";
const SA_JSON_PATH = "/opt/utildesk-motia/secrets/google-service-account.json";

const args = process.argv.slice(2);

function getArg(name, fallback = "") {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? String(args[idx + 1] || "") : fallback;
}

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

async function createSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || "";
  const privateKey = String(process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    return google.sheets({ version: "v4", auth });
  }

  if (!fs.existsSync(SA_JSON_PATH)) {
    die("Missing Google credentials for sheet export");
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: SA_JSON_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

async function main() {
  const outPath = getArg("out");
  const startRow = Math.max(2, Number.parseInt(getArg("startRow", "251"), 10) || 251);
  const statusesRaw = getArg("statuses", "NEEDS_REVIEW");
  const wantedStatuses = new Set(
    statusesRaw
      .split(",")
      .map((s) => String(s || "").trim().toUpperCase())
      .filter(Boolean),
  );

  if (!outPath) die("Missing required --out argument");

  const sheets = await createSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) die("Sheet has no data rows");

  const header = values[0].map((cell) => String(cell || "").trim().toLowerCase());
  const idx = Object.fromEntries(header.map((name, index) => [name, index]));

  for (const required of ["topic", "slug", "category", "tags", "official_url", "status", "notes"]) {
    if (!(required in idx)) die(`Column "${required}" not found in sheet header`);
  }

  const rows = [];
  for (let i = startRow - 1; i < values.length; i += 1) {
    const row = values[i] || [];
    const status = String(row[idx.status] || "").trim().toUpperCase();
    if (!wantedStatuses.has(status)) continue;

    rows.push({
      row_number: i + 1,
      slug: String(row[idx.slug] || "").trim(),
      title: String(row[idx.topic] || "").trim(),
      description: String(row[idx.description] || "").trim(),
      category: String(row[idx.category] || "").trim(),
      tags: String(row[idx.tags] || "").trim(),
      official_url: String(row[idx.official_url] || "").trim(),
      status,
      notes: String(row[idx.notes] || "").trim(),
    });
  }

  const payload = {
    exported_at: new Date().toISOString(),
    start_row: startRow,
    statuses: Array.from(wantedStatuses),
    count: rows.length,
    rows,
  };

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ ok: true, out: outPath, count: rows.length }, null, 2));
}

main().catch((error) => {
  console.error(`ERROR: ${error?.message || String(error)}`);
  process.exit(1);
});

#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";
import { google } from "googleapis";
import { normalizePriceModel } from "./lib/price_model_policy.mjs";

const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID || "1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";
const SA_JSON_PATH = "/opt/utildesk-motia/secrets/google-service-account.json";

function die(message) {
  console.error(`\n[FAIL] ${message}\n`);
  process.exit(1);
}

async function sheetsClient() {
  const ce = process.env.GOOGLE_CLIENT_EMAIL || "";
  const pk = process.env.GOOGLE_PRIVATE_KEY || "";

  if (ce && pk) {
    const auth = new google.auth.JWT({
      email: ce,
      key: pk.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return google.sheets({ version: "v4", auth });
  }

  if (!fs.existsSync(SA_JSON_PATH)) {
    die(
      "Missing Google credentials: set GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY or provide service account key file",
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: SA_JSON_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const maxChangesArg = argv.find((arg) => arg.startsWith("--max-changes="));
const maxChanges = Math.max(1, Number(maxChangesArg?.split("=")[1] || "5000") || 5000);

const sheets = await sheetsClient();
const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: `${SHEET_NAME}!A1:Z`,
});

const values = res.data.values || [];
if (values.length < 2) die("Sheet has no data rows");

const header = values[0].map((value) => String(value || "").trim().toLowerCase());
const index = Object.fromEntries(header.map((name, idx) => [name, idx]));
if (!(index.slug >= 0) || !(index.price_model >= 0)) {
  die('Missing required columns "slug" and/or "price_model"');
}

const changes = [];
for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
  const row = values[rowIndex] || [];
  const current = String(row[index.price_model] || "").trim();
  const normalized = normalizePriceModel(current);
  if (current === normalized) continue;

  changes.push({
    row_number: rowIndex + 1,
    slug: String(row[index.slug] || "").trim(),
    old_value: current,
    new_value: normalized,
    range: `${SHEET_NAME}!${String.fromCharCode("A".charCodeAt(0) + index.price_model)}${rowIndex + 1}`,
  });

  if (changes.length >= maxChanges) break;
}

if (!apply) {
  console.log(JSON.stringify({
    ok: true,
    apply: false,
    changes: changes.length,
    sample: changes.slice(0, 50),
  }, null, 2));
  process.exit(0);
}

for (let i = 0; i < changes.length; i += 50) {
  const chunk = changes.slice(i, i + 50);
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: "RAW",
      data: chunk.map((item) => ({
        range: item.range,
        values: [[item.new_value]],
      })),
    },
  });
}

console.log(JSON.stringify({
  ok: true,
  apply: true,
  changes: changes.length,
  sample: changes.slice(0, 50),
}, null, 2));

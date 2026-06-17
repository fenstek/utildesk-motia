#!/usr/bin/env node
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const SA_JSON_PATH = "/opt/utildesk-motia/secrets/google-service-account.json";

function nowIso() {
  return new Date().toISOString();
}

function logLine(msg) {
  console.log(`[AUDIT] ${nowIso()} ${msg}`);
}

function isTrackedByGit(path) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", path], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function sheetsClient() {
  try {
    if (GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY) {
      const auth = new google.auth.JWT({
        email: GOOGLE_CLIENT_EMAIL,
        key: GOOGLE_PRIVATE_KEY,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
      return google.sheets({ version: "v4", auth });
    }
  } catch {
    // Fallback to key file auth below.
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: SA_JSON_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

async function main() {
  if (!SPREADSHEET_ID) {
    logLine("ERROR: missing SPREADSHEET_ID");
    process.exit(0);
  }

  try {
    const sheets = await sheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:Z`,
    });

    const rows = res.data.values || [];
    if (rows.length === 0) {
      logLine("OK: 0 missing (DONE rows: 0)");
      process.exit(0);
    }

    const header = (rows[0] || []).map((x) => String(x || "").trim().toLowerCase());
    const slugIdx = header.indexOf("slug");
    const statusIdx = header.indexOf("status");
    if (slugIdx === -1 || statusIdx === -1) {
      logLine("ERROR: missing required columns slug/status");
      process.exit(0);
    }

    const doneSlugs = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const slug = String(row[slugIdx] || "").trim();
      const status = String(row[statusIdx] || "").trim();
      if (slug && status === "DONE") doneSlugs.push(slug);
    }

    const missing = [];
    for (const slug of doneSlugs) {
      const mdPath = `content/tools/${slug}.md`;
      const exists = existsSync(mdPath);
      const tracked = exists && isTrackedByGit(mdPath);
      if (!exists || !tracked) missing.push(slug);
    }

    const uniqueMissing = [...new Set(missing)].sort((a, b) => a.localeCompare(b));
    if (uniqueMissing.length === 0) {
      logLine(`OK: 0 missing (DONE rows: ${doneSlugs.length})`);
      process.exit(0);
    }

    logLine(
      `MISMATCH: ${uniqueMissing.length} missing (DONE rows: ${doneSlugs.length}) -> ${uniqueMissing.join(", ")}`
    );
    process.exit(0);
  } catch (err) {
    const msg = err?.message || String(err);
    logLine(`ERROR: ${msg}`);
    process.exit(0);
  }
}

main();

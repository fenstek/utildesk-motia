#!/usr/bin/env node
import "dotenv/config";
import fs from "node:fs";
import { google } from "googleapis";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const SA_JSON_PATH = "/opt/utildesk-motia/secrets/google-service-account.json";

const XAI_NOTE = "AUTO: company entity xAI; tool is Grok; migrated to grok";
const GROK_NOTE = "AUTO: migrated from x-ai (company xAI)";

function die(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function colLetter(index) {
  let n = Number(index) + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function appendNote(existing, note) {
  const prev = String(existing || "").trim();
  if (!prev) return note;
  if (prev.includes(note)) return prev;
  return `${prev} | ${note}`;
}

function findIndex(header, name) {
  const target = String(name || "").trim().toLowerCase();
  return header.findIndex((h) => String(h || "").trim().toLowerCase() === target);
}

async function sheetsClient() {
  if (!SPREADSHEET_ID) die("Missing SPREADSHEET_ID");
  if (GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY) {
    const auth = new google.auth.JWT({
      email: GOOGLE_CLIENT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return google.sheets({ version: "v4", auth });
  }
  if (fs.existsSync(SA_JSON_PATH)) {
    const auth = new google.auth.GoogleAuth({
      keyFile: SA_JSON_PATH,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return google.sheets({ version: "v4", auth });
  }
  die("Missing Google credentials (GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY or service account file)");
}

async function main() {
  const sheets = await sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:P`,
  });

  const values = res.data.values || [];
  if (values.length < 1) die("Sheet header not found");

  const header = values[0] || [];
  const rows = values.slice(1);

  const slugIdx = findIndex(header, "slug");
  const statusIdx = findIndex(header, "status");
  const notesIdx = findIndex(header, "notes");
  const topicIdx = findIndex(header, "topic");
  const titleIdx = findIndex(header, "title");
  const officialUrlIdx = findIndex(header, "official_url");

  if (slugIdx < 0 || statusIdx < 0 || notesIdx < 0) {
    die('Required columns missing: need at least "slug", "status", "notes"');
  }

  const xaiMatches = [];
  const grokMatches = [];
  for (let i = 0; i < rows.length; i += 1) {
    const rowNumber = i + 2;
    const slugRaw = String(rows[i]?.[slugIdx] || "");
    if (slugRaw === "x-ai") xaiMatches.push({ rowNumber, row: rows[i] || [] });
    if (slugRaw.trim().toLowerCase() === "grok") grokMatches.push({ rowNumber, row: rows[i] || [] });
  }

  const plan = {
    dryRun: DRY_RUN,
    spreadsheetId: SPREADSHEET_ID,
    sheetName: SHEET_NAME,
    xAiMatches: xaiMatches.map((m) => m.rowNumber),
    grokMatches: grokMatches.map((m) => m.rowNumber),
    updates: [],
    appendGrok: false,
    noOp: false,
    message: "",
  };

  if (!xaiMatches.length) {
    plan.noOp = true;
    plan.message = 'No row with slug exactly "x-ai" found';
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const target = xaiMatches[0];
  const currentStatus = String(target.row[statusIdx] || "").trim();
  const currentNotes = String(target.row[notesIdx] || "").trim();
  const nextNotes = appendNote(currentNotes, XAI_NOTE);
  const alreadyBlacklisted = currentStatus.toUpperCase() === "BLACKLIST";

  if (!alreadyBlacklisted) {
    plan.updates.push({
      rowNumber: target.rowNumber,
      status: { from: currentStatus, to: "BLACKLIST" },
      notes: { from: currentNotes, to: nextNotes },
    });
  } else if (nextNotes !== currentNotes) {
    plan.updates.push({
      rowNumber: target.rowNumber,
      status: { from: currentStatus, to: currentStatus },
      notes: { from: currentNotes, to: nextNotes },
    });
  }

  if (!grokMatches.length) {
    plan.appendGrok = true;
  } else {
    plan.message = 'Row with slug "grok" already exists; will not append new Grok row';
  }

  if (alreadyBlacklisted && !plan.appendGrok && plan.updates.length === 0) {
    plan.noOp = true;
    plan.message = 'x-ai already BLACKLIST and grok already exists; nothing to do';
  }

  if (DRY_RUN) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  if (plan.updates.length) {
    const data = [];
    for (const upd of plan.updates) {
      const r = upd.rowNumber;
      if (upd.status.to !== upd.status.from) {
        data.push({
          range: `${SHEET_NAME}!${colLetter(statusIdx)}${r}`,
          values: [[upd.status.to]],
        });
      }
      if (upd.notes.to !== upd.notes.from) {
        data.push({
          range: `${SHEET_NAME}!${colLetter(notesIdx)}${r}`,
          values: [[upd.notes.to]],
        });
      }
    }
    if (data.length) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: "RAW",
          data,
        },
      });
    }
  }

  if (plan.appendGrok) {
    const row = new Array(16).fill("");
    if (topicIdx >= 0 && topicIdx < 16) row[topicIdx] = "Grok";
    else if (titleIdx >= 0 && titleIdx < 16) row[titleIdx] = "Grok";
    if (slugIdx >= 0 && slugIdx < 16) row[slugIdx] = "grok";
    if (officialUrlIdx >= 0 && officialUrlIdx < 16) row[officialUrlIdx] = "https://grok.com/";
    if (statusIdx >= 0 && statusIdx < 16) row[statusIdx] = "NEW";
    if (notesIdx >= 0 && notesIdx < 16) row[notesIdx] = GROK_NOTE;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:P`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        ...plan,
      },
      null,
      2
    )
  );
}

main().catch((e) => die(e?.stack || String(e)));

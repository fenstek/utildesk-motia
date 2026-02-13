#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { google } from "googleapis";

/**
 * FIXED CONFIGURATION
 */
const SPREADSHEET_ID = "1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ";
const SHEET_NAME = "Tabellenblatt1";
const SA_JSON_PATH = "/opt/utildesk-motia/secrets/google-service-account.json";

/**
 * Hardcoded rows to fix (stuck IN_PROGRESS)
 */
const TARGET_ROWS = [90, 95, 105, 107];

/**
 * Parse command-line flags
 */
function parseFlags() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    apply: args.includes("--apply"),
  };
}

/**
 * Get column letter from index (0=A, 1=B, ...)
 */
function getColumnLetter(index) {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

/**
 * Check if markdown file exists for a slug
 */
function checkMarkdownExists(slug) {
  if (!slug) return false;
  const mdPath = path.join(process.cwd(), "content", "tools", `${slug}.md`);
  return fs.existsSync(mdPath);
}

/**
 * Main logic
 */
async function main() {
  const flags = parseFlags();

  if (!flags.dryRun && !flags.apply) {
    console.error("Usage:");
    console.error("  node scripts/sheet_fix_stuck_in_progress_4rows.mjs --dry-run");
    console.error("  node scripts/sheet_fix_stuck_in_progress_4rows.mjs --apply");
    console.error("");
    console.error("Flags:");
    console.error("  --dry-run   Show planned changes without writing to sheet");
    console.error("  --apply     Actually write changes to sheet");
    process.exit(1);
  }

  if (!fs.existsSync(SA_JSON_PATH)) {
    throw new Error(`Service account key not found: ${SA_JSON_PATH}`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: SA_JSON_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  // 1) Fetch header and all rows
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) {
    throw new Error("Sheet is empty or has no data rows");
  }

  const header = values[0].map((h) => String(h || "").trim());
  const rows = values.slice(1); // data rows (1-indexed as row 2, 3, ...)

  // 2) Find column indices
  const slugIdx = header.indexOf("slug");
  const statusIdx = header.indexOf("status");
  const notesIdx = header.indexOf("notes");

  if (slugIdx === -1) throw new Error('Column "slug" not found in header');
  if (statusIdx === -1) throw new Error('Column "status" not found in header');
  if (notesIdx === -1) throw new Error('Column "notes" not found in header');

  const statusCol = getColumnLetter(statusIdx);
  const notesCol = getColumnLetter(notesIdx);

  // 3) Process target rows
  const changes = [];

  for (const rowNumber of TARGET_ROWS) {
    const rowIndex = rowNumber - 2; // convert to 0-based array index (row 2 = index 0)
    if (rowIndex < 0 || rowIndex >= rows.length) {
      console.warn(`Warning: Row ${rowNumber} is out of range, skipping`);
      continue;
    }

    const row = rows[rowIndex];
    const slug = String(row[slugIdx] || "").trim();
    const currentStatus = String(row[statusIdx] || "").trim();
    const currentNotes = String(row[notesIdx] || "").trim();

    const mdExists = checkMarkdownExists(slug);

    let newStatus;
    let newNotes = currentNotes;

    if (mdExists) {
      newStatus = "DONE";
    } else {
      newStatus = "ERROR";
      // Append auto-fix note
      const fixNote = "AUTO_FIX: missing MD in repo";
      newNotes = currentNotes ? `${currentNotes} | ${fixNote}` : fixNote;
    }

    changes.push({
      rowNumber,
      slug,
      currentStatus,
      newStatus,
      mdExists,
      statusCell: `${SHEET_NAME}!${statusCol}${rowNumber}`,
      notesCell: `${SHEET_NAME}!${notesCol}${rowNumber}`,
      currentNotes,
      newNotes,
    });
  }

  // 4) Display planned changes
  console.log(JSON.stringify({ mode: flags.apply ? "APPLY" : "DRY-RUN", changes }, null, 2));

  // 5) Apply changes if --apply flag is set
  if (flags.apply) {
    console.log("\nApplying changes to Google Sheet...");

    for (const change of changes) {
      // Update status
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: change.statusCell,
        valueInputOption: "RAW",
        requestBody: {
          values: [[change.newStatus]],
        },
      });

      // Update notes
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: change.notesCell,
        valueInputOption: "RAW",
        requestBody: {
          values: [[change.newNotes]],
        },
      });

      console.log(`✓ Updated row ${change.rowNumber}: ${change.currentStatus} → ${change.newStatus}`);
    }

    console.log("\nAll changes applied successfully.");
  } else {
    console.log("\nDry-run mode: no changes were written to the sheet.");
    console.log("Run with --apply to actually update the sheet.");
  }
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});

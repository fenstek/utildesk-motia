#!/usr/bin/env node
/**
 * REBUILD pipeline: resolve official_url for rows with selected status.
 *
 * Default: dry-run (no writes).
 *
 * Usage:
 *   node scripts/sheet_rebuild_official_url.mjs [--status NAME] [--limit N] [--json]
 *   node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --apply [--limit N]
 *   node scripts/sheet_rebuild_official_url.mjs --help
 *
 * Notes:
 * - Reuses existing resolver CLI: scripts/resolve_official_url_ddg_v1.mjs
 * - Requires env: SPREADSHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY
 */

import process from "node:process";
import { execFileSync } from "node:child_process";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf("--limit") + 1] || 10);
const jsonOutput = args.includes("--json");
const applyMode = args.includes("--apply");
const statusArg = args.includes("--status") ? String(args[args.indexOf("--status") + 1] || "").trim() : "";
const targetStatus = (statusArg || "REBUILD").toUpperCase();

function printHelp() {
  console.log(`Usage:
  node scripts/sheet_rebuild_official_url.mjs [--status NAME] [--limit N] [--json]
  node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --apply [--limit N]
  node scripts/sheet_rebuild_official_url.mjs --help

Options:
  --status NAME   Row status to process (default: REBUILD)
  --limit N       Max rows to process (default: 10)
  --json          Print JSON output
  --apply         Write official_url and set status=NEW
  --help          Show this help and exit`);
}

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

function die(msg) {
  console.error(`\n[ERROR] ${msg}\n`);
  process.exit(1);
}

if (!SPREADSHEET_ID) die("SPREADSHEET_ID env var is missing");

function requireCreds() {
  const ce = process.env.GOOGLE_CLIENT_EMAIL || "";
  const pk = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!ce || !pk) die("Missing GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY env vars");
}

async function createSheetsClient() {
  requireCreds();
  const client_email = process.env.GOOGLE_CLIENT_EMAIL;
  let private_key = process.env.GOOGLE_PRIVATE_KEY;
  private_key = private_key.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: applyMode
      ? ["https://www.googleapis.com/auth/spreadsheets"]
      : ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
}

function readResolverJson() {
  // Resolver prints JSON to stdout. We run with apply=false (read-only suggestion).
  // If your resolver supports args, add them here; otherwise it will just scan candidates.
  const out = execFileSync("node", ["scripts/resolve_official_url_ddg_v1.mjs"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out);
}

function pickSuggestionFromResolver(resolverJson, topic) {
  // Minimal heuristic: try to find best candidate for the given topic if present.
  // We intentionally keep this thin; if resolver already returns per-topic mapping,
  // adapt this function later.
  if (!resolverJson || typeof resolverJson !== "object") return null;

  // Common shapes:
  // - { candidates: [...] }
  // - { results: [...] }
  const list =
    resolverJson.candidates ||
    resolverJson.results ||
    resolverJson.items ||
    [];

  if (!Array.isArray(list) || list.length === 0) return null;

  // Try to find by topic/name, else take first "best" item
  const norm = (s) => String(s || "").toLowerCase();
  const t = norm(topic);

  const byName = list.find((x) => norm(x.topic || x.name || x.query).includes(t));
  const best = byName || list[0];

  const url = best.official_url || best.url || best.best_url || best.href;
  if (!url) return null;

  return { official_url: String(url), reason: "resolver_candidate" };
}

async function main() {
  const sheets = await createSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) {
    console.log(jsonOutput ? "[]" : "No data");
    return;
  }

  const header = values[0].map((h) => String(h).trim());
  const rows = values.slice(1);
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  if (!("status" in idx)) die('Column "status" not found');
  for (const col of ["topic", "official_url"]) {
    if (!(col in idx)) die(`Column "${col}" not found`);
  }

  const rebuild = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const status = String(row[idx.status] || "").trim().toUpperCase();
    if (status === targetStatus) {
      rebuild.push({ rowNumber: i + 2, row });
      if (rebuild.length >= limit) break;
    }
  }

  if (rebuild.length === 0) {
    console.log(jsonOutput ? "[]" : `No ${targetStatus} rows found`);
    return;
  }

  // Run resolver once (global) and then pick suggestions per topic.
  let resolverJson = null;
  try {
    resolverJson = readResolverJson();
  } catch (e) {
    die(`Resolver failed: ${e.message}`);
  }

  const out = [];
  for (const it of rebuild) {
    const topic = String(it.row[idx.topic] || "").trim();
    const cur = String(it.row[idx.official_url] || "").trim();
    const sug = pickSuggestionFromResolver(resolverJson, topic);

    out.push({
      row: it.rowNumber,
      topic,
      current_official_url: cur,
      suggested_official_url: sug?.official_url || "",
      reason: sug?.reason || "no_suggestion",
      apply: applyMode && !!sug?.official_url,
    });
  }

  if (jsonOutput) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`Found ${out.length} ${targetStatus} rows (limit: ${limit}). apply=${applyMode}\n`);
    for (const r of out) {
      console.log(`- row ${r.row}: ${r.topic}`);
      console.log(`  current:   ${r.current_official_url || "(empty)"}`);
      console.log(`  suggested: ${r.suggested_official_url || "(none)"}`);
      console.log(`  reason:    ${r.reason}`);
      console.log();
    }
  }

  if (!applyMode) return;

  // Apply updates (official_url + set status NEW) for rows with suggestions
  const statusCol = "status";
  const urlCol = "official_url";

  for (const r of out) {
    if (!r.apply) continue;

    const urlCell = `${SHEET_NAME}!${String.fromCharCode("A".charCodeAt(0) + idx[urlCol])}${r.row}`;
    const statusCell = `${SHEET_NAME}!${String.fromCharCode("A".charCodeAt(0) + idx[statusCol])}${r.row}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: urlCell,
      valueInputOption: "RAW",
      requestBody: { values: [[r.suggested_official_url]] },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: statusCell,
      valueInputOption: "RAW",
      requestBody: { values: [["NEW"]] },
    });

    console.log(JSON.stringify({ ok: true, updated: { row: r.row, official_url: r.suggested_official_url, status: "NEW" } }, null, 2));
  }
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});

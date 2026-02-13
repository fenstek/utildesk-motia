#!/usr/bin/env node
/**
 * REBUILD pipeline: resolve official_url for rows with selected status.
 *
 * Default: dry-run (no writes).
 *
 * Usage:
 *   node scripts/sheet_rebuild_official_url.mjs [--status NAME] [--use-gpt] [--limit N] [--json]
 *   node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --use-gpt --apply [--limit N]
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
const useGpt = args.includes("--use-gpt");
const selectedStatus = String(args[args.indexOf("--status") + 1] || "REBUILD").trim();
const selectedStatusUpper = selectedStatus.toUpperCase();

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

function parseJsonFromText(text) {
  const src = String(text || "").trim();
  if (!src) return null;
  try {
    return JSON.parse(src);
  } catch {
    // continue
  }
  const start = src.search(/[\[{]/);
  if (start < 0) return null;
  const sliced = src.slice(start);
  try {
    return JSON.parse(sliced);
  } catch {
    return null;
  }
}

function normalizeUrl(u) {
  try {
    const url = new URL(String(u || "").trim());
    if (!/^https?:$/.test(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function extractCandidatesFromPayload(payload) {
  const bucket = [];
  const pushOne = (item) => {
    if (typeof item === "string") {
      const url = normalizeUrl(item);
      if (url) bucket.push({ url, source: "resolver" });
      return;
    }
    if (!item || typeof item !== "object") return;
    const url = normalizeUrl(item.official_url || item.url || item.best_url || item.href || item.u || "");
    if (!url) return;
    bucket.push({
      url,
      source: String(item.source || "resolver"),
      rank: Number(item.rank || 0) || 0,
      score: Number(item.score || 0) || 0,
      domain: String(item.domain || ""),
    });
  };

  if (Array.isArray(payload)) {
    for (const item of payload) pushOne(item);
  } else if (payload && typeof payload === "object") {
    pushOne(payload);
    const lists = [payload.candidates, payload.results, payload.items, payload.sample_report];
    for (const list of lists) {
      if (!Array.isArray(list)) continue;
      for (const item of list) pushOne(item);
    }
  }

  const out = [];
  const seen = new Set();
  for (const c of bucket) {
    if (!c.url || seen.has(c.url)) continue;
    seen.add(c.url);
    out.push(c);
  }
  return out;
}

function readResolverCandidates(topic) {
  let stdout = "";
  try {
    stdout = execFileSync("node", ["scripts/resolve_official_url_ddg_v1.mjs", String(topic || ""), "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    const raw = e?.stdout;
    stdout = typeof raw === "string" ? raw : Buffer.isBuffer(raw) ? raw.toString("utf8") : "";
  }
  const parsed = parseJsonFromText(stdout);
  return extractCandidatesFromPayload(parsed);
}

async function main() {
  const sheets = await createSheetsClient();
  let chooseOfficialUrlGpt = null;
  if (useGpt) {
    try {
      const mod = await import("./lib/official_url_chooser_gpt.mjs");
      if (typeof mod?.chooseOfficialUrlGpt === "function") {
        chooseOfficialUrlGpt = mod.chooseOfficialUrlGpt;
      }
    } catch {
      chooseOfficialUrlGpt = null;
    }
  }

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
    const statusNormalized = String(row[idx.status] || "").trim().toUpperCase();
    if (statusNormalized === selectedStatusUpper) {
      rebuild.push({ rowNumber: i + 2, row });
      if (rebuild.length >= limit) break;
    }
  }

  if (rebuild.length === 0) {
    console.log(jsonOutput ? "[]" : `No ${selectedStatusUpper} rows found`);
    return;
  }

  const out = [];
  for (const it of rebuild) {
    const topic = String(it.row[idx.topic] || "").trim();
    const cur = String(it.row[idx.official_url] || "").trim();
    const candidates = readResolverCandidates(topic);
    const curUrl = normalizeUrl(cur);
    if (curUrl && !candidates.some((c) => c.url === curUrl)) {
      candidates.push({ url: curUrl, source: "current_official_url", rank: 999, score: -1 });
    }

    let suggestedOfficialUrl = "";
    let reason = "no_suggestion";
    let chooserUsed = false;

    if (useGpt && candidates.length > 0) {
      chooserUsed = true;
      if (!chooseOfficialUrlGpt) {
        reason = "gpt_error";
      } else {
        try {
          const picked = await chooseOfficialUrlGpt({ topic, candidates });
          if (picked?.ok && picked?.official_url) {
            suggestedOfficialUrl = String(picked.official_url);
            reason = "gpt_choice";
          } else {
            reason = String(picked?.reason || "gpt_no_suggestion");
          }
        } catch {
          reason = "gpt_error";
          suggestedOfficialUrl = "";
        }
      }
    } else if (candidates.length > 0) {
      suggestedOfficialUrl = String(candidates[0].url || "");
      reason = suggestedOfficialUrl ? "resolver_candidate" : "no_suggestion";
    } else {
      reason = "no_candidates";
    }

    out.push({
      row: it.rowNumber,
      topic,
      current_official_url: cur,
      suggested_official_url: suggestedOfficialUrl,
      reason,
      candidates_count: candidates.length,
      chooser_used: chooserUsed,
      apply: applyMode && !!suggestedOfficialUrl,
    });
  }

  if (jsonOutput) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`Found ${out.length} ${selectedStatusUpper} rows (limit: ${limit}). apply=${applyMode}\n`);
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

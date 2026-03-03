#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { google } from "googleapis";
import {
  assertSafeStatusTransition,
  getPublishGuardDecision,
  REPO_DISABLE_SYNC_STATUSES,
} from "./lib/publish_status_guards.mjs";

const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID || "1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";
const SA_JSON_PATH = "/opt/utildesk-motia/secrets/google-service-account.json";

function die(msg) {
  console.error(`\n[FAIL] ${msg}\n`);
  process.exit(1);
}

function runInherit(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) {
    die(`${cmd} ${args.join(" ")}`);
  }
}

function requireSlug() {
  const slug = String(process.argv[2] || "").trim();
  if (!slug) {
    die("Usage: node scripts/publish_one_slug.mjs <slug> [--allow-needs-review]");
  }
  return slug;
}

function hasFlag(flag) {
  return process.argv.slice(3).includes(flag);
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

function colLetter(idx) {
  return String.fromCharCode("A".charCodeAt(0) + idx);
}

async function updateStatus(sheets, rowNumber, status, statusColIndex) {
  const cell = `${SHEET_NAME}!${colLetter(statusColIndex)}${rowNumber}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: cell,
    valueInputOption: "RAW",
    requestBody: { values: [[status]] },
  });
  return cell;
}

async function safeSetStatus(
  sheets,
  rowNumber,
  nextStatus,
  statusColIndex,
  currentStatus,
) {
  assertSafeStatusTransition(currentStatus, nextStatus);
  return updateStatus(sheets, rowNumber, nextStatus, statusColIndex);
}

function syncDisabledMarkdown(slug, cwd) {
  const contentDir = path.join(cwd, "content", "tools");
  const activePath = path.join(contentDir, `${slug}.md`);
  const disabledPath = path.join(contentDir, `_${slug}.md`);

  if (!fs.existsSync(activePath)) {
    return { changed: false, activePath, disabledPath, action: "noop" };
  }

  if (fs.existsSync(disabledPath)) {
    fs.unlinkSync(activePath);
    return { changed: true, activePath, disabledPath, action: "removed_active_duplicate" };
  }

  fs.renameSync(activePath, disabledPath);
  return { changed: true, activePath, disabledPath, action: "renamed_to_disabled" };
}

function readRow(values, rowIndex, idx) {
  const row = values[rowIndex] || [];
  return {
    row_number: rowIndex + 1,
    topic: String(row[idx.topic] || "").trim(),
    slug: String(row[idx.slug] || "").trim(),
    category: String(row[idx.category] || "").trim(),
    tags: String(row[idx.tags] || "").trim(),
    price_model: String(row[idx.price_model] || "").trim(),
    official_url: String(row[idx.official_url] || "").trim(),
    affiliate_url: String(row[idx.affiliate_url] || "").trim(),
    status: String(row[idx.status] || "").trim(),
    notes: String(row[idx.notes] || "").trim(),
  };
}

async function main() {
  const slug = requireSlug();
  const allowNeedsReview = hasFlag("--allow-needs-review");
  const sheets = await sheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) die("Sheet has no data rows");

  const header = values[0].map((h) => String(h || "").trim().toLowerCase());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  const required = [
    "topic",
    "slug",
    "category",
    "tags",
    "price_model",
    "official_url",
    "affiliate_url",
    "status",
    "notes",
  ];
  for (const key of required) {
    if (!(key in idx)) die(`Missing required column "${key}"`);
  }

  let targetRowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    const s = String(values[i]?.[idx.slug] || "").trim();
    if (s === slug) {
      targetRowIndex = i;
      break;
    }
  }
  if (targetRowIndex === -1) die(`Slug "${slug}" not found in sheet`);

  const tool = readRow(values, targetRowIndex, idx);
  const rowNumber = tool.row_number;
  const beforeStatus = tool.status || "";
  const tmpPath = `/tmp/utildesk_publish_one_${slug}.json`;
  const mdPath = path.join(process.cwd(), "content", "tools", `${slug}.md`);
  const guard = getPublishGuardDecision(beforeStatus, { allowNeedsReview });
  let currentStatus = beforeStatus;

  if (guard.action === "skip_disabled_sync" || guard.action === "skip_needs_review") {
    const syncResult = guard.syncDisabledRepo && REPO_DISABLE_SYNC_STATUSES.has(String(beforeStatus || "").trim().toUpperCase())
      ? syncDisabledMarkdown(slug, process.cwd())
      : { changed: false, action: "noop" };

    console.log(
      JSON.stringify(
        {
          ok: true,
          skipped: true,
          slug,
          row_number: rowNumber,
          status_before: beforeStatus,
          status_after: beforeStatus,
          guard_action: guard.action,
          sync_result: syncResult,
          message:
            guard.action === "skip_disabled_sync"
              ? "SKIP disabled/blacklist"
              : "SKIP needs_review",
        },
        null,
        2,
      ),
    );
    process.exit(guard.exitCode);
  }

  try {
    if (guard.action === "publish") {
      await safeSetStatus(
        sheets,
        rowNumber,
        "IN_PROGRESS",
        idx.status,
        currentStatus,
      );
      currentStatus = "IN_PROGRESS";
    }
    fs.writeFileSync(tmpPath, JSON.stringify(tool, null, 2) + "\n", "utf8");

    runInherit("node", ["scripts/generate_tool_md.mjs", tmpPath]);
    runInherit("node", ["scripts/finalize_md.mjs", tmpPath]);
    runInherit("node", ["scripts/check_duplicates.mjs"]);

    if (!fs.existsSync(mdPath)) {
      throw new Error(`Generated markdown not found: ${mdPath}`);
    }

    if (guard.action === "local_rebuild_only") {
      const syncResult = syncDisabledMarkdown(slug, process.cwd());
      console.log(
        JSON.stringify(
          {
            ok: true,
            slug,
            row_number: rowNumber,
            status_before: beforeStatus,
            status_after: beforeStatus,
            guard_action: guard.action,
            sync_result: syncResult,
            md_path: syncResult.disabledPath,
            message: "REBUILT needs_review locally without status transition",
          },
          null,
          2,
        ),
      );
      return;
    }

    await safeSetStatus(sheets, rowNumber, "DONE", idx.status, currentStatus);
    currentStatus = "DONE";
    runInherit("node", [
      "scripts/normalize_alternatives_links.mjs",
      "--changed-slug",
      slug,
      "--write",
    ]);

    console.log(
      JSON.stringify(
        {
          ok: true,
          slug,
          row_number: rowNumber,
          status_before: beforeStatus,
          status_after: "DONE",
          md_path: mdPath,
        },
        null,
        2,
      ),
    );
  } catch (e) {
    if (guard.allowStatusWrite) {
      await safeSetStatus(sheets, rowNumber, "ERROR", idx.status, currentStatus);
    }
    throw e;
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});

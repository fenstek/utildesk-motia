#!/usr/bin/env node
/**
 * postcheck_apply_actions.mjs
 *
 * Applies actions from postcheck_scan_suspicious.mjs output:
 *   - Updates Google Sheet status (BLACKLIST or NEEDS_REVIEW)
 *   - Deletes content/tools/<slug>.md for BLACKLIST entries
 *   - Commits, pushes to autobot, opens PR → master
 *
 * DRY-RUN by default — pass --apply to make real changes.
 *
 * Usage:
 *   node scripts/postcheck_apply_actions.mjs --from <json_path> [options]
 *
 * Options:
 *   --apply                 Execute changes (default: dry-run)
 *   --max-delete <n>        Max BLACKLIST deletions per run (default: 2)
 *   --max-total <n>         Max total candidates processed (default: 10)
 *   --only-status <s>       Filter: BLACKLIST or NEEDS_REVIEW
 *   --no-pr                 Skip PR creation after commit
 *   --pr-title "<text>"     Custom PR title
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import process from "node:process";
import { google } from "googleapis";

// ── Config ────────────────────────────────────────────────────────────────────
const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID || "1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";
const SA_JSON_PATH = "/opt/utildesk-motia/secrets/google-service-account.json";
const CONTENT_DIR = path.resolve(process.cwd(), "content/tools");
const REPO_ROOT   = path.resolve(process.cwd());

// ── CLI ───────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function arg(flag, def) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
}

const FROM_PATH   = arg("--from", null);
const APPLY       = args.includes("--apply");
const MAX_DELETE  = Number(arg("--max-delete", "2"));
const MAX_TOTAL   = Number(arg("--max-total", "10"));
const ONLY_STATUS = arg("--only-status", null)?.toUpperCase() ?? null;
const CREATE_PR   = !args.includes("--no-pr");
const PR_TITLE    = arg("--pr-title", "chore: post-check cleanup");

// ── Helpers ───────────────────────────────────────────────────────────────────
function die(msg) {
  process.stderr.write(`[apply] FATAL: ${msg}\n`);
  process.exit(1);
}
function log(msg) {
  process.stderr.write(`[apply] ${msg}\n`);
}

// ── Auth (read-write in apply mode) ──────────────────────────────────────────
async function sheetsClient(writeable) {
  const scope = writeable
    ? "https://www.googleapis.com/auth/spreadsheets"
    : "https://www.googleapis.com/auth/spreadsheets.readonly";

  const email  = process.env.GOOGLE_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (email && rawKey) {
    const auth = new google.auth.JWT({
      email,
      key: rawKey.replace(/\\n/g, "\n"),
      scopes: [scope],
    });
    return google.sheets({ version: "v4", auth });
  }
  const auth = new google.auth.GoogleAuth({ keyFile: SA_JSON_PATH, scopes: [scope] });
  return google.sheets({ version: "v4", auth });
}

// ── Sheet helpers ─────────────────────────────────────────────────────────────
let _statusColLetter = null; // cached after first lookup

async function getStatusColLetter(sheets) {
  if (_statusColLetter) return _statusColLetter;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z1`,
  });
  const header = (res.data.values?.[0] ?? []).map((h) =>
    String(h).trim().toLowerCase()
  );
  const idx = header.indexOf("status");
  if (idx === -1) die('Sheet: column "status" not found');
  _statusColLetter = String.fromCharCode("A".charCodeAt(0) + idx);
  return _statusColLetter;
}

async function setSheetStatus(sheets, rowNumber, status) {
  const col  = await getStatusColLetter(sheets);
  const cell = `${SHEET_NAME}!${col}${rowNumber}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: cell,
    valueInputOption: "RAW",
    requestBody: { values: [[status]] },
  });
  return cell;
}

// ── Git helpers ───────────────────────────────────────────────────────────────
function git(...gitArgs) {
  return execFileSync("git", gitArgs, { cwd: REPO_ROOT, encoding: "utf-8" });
}

function gitStatus() {
  // Returns lines that are NOT untracked (i.e., staged or modified tracked files)
  return git("status", "--porcelain")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("??"));
}

function gitRm(relPath) {
  git("rm", relPath);
}

function gitCommit(message) {
  git(
    "-c", "user.name=utildesk-postcheck",
    "-c", "user.email=utildesk-postcheck@local",
    "commit", "-m", message
  );
}

function gitPushAutobot() {
  git("push", "origin", "HEAD:autobot");
}

function ghExec(...ghArgs) {
  return execFileSync("gh", ghArgs, { cwd: REPO_ROOT, encoding: "utf-8" });
}

// ── PR helpers ────────────────────────────────────────────────────────────────
function prAlreadyExists() {
  try {
    ghExec("pr", "view", "--head", "autobot", "--json", "number");
    return true;
  } catch {
    return false;
  }
}

function createPr(title, body) {
  return ghExec(
    "pr", "create",
    "--base", "master",
    "--head", "autobot",
    "--title", title,
    "--body", body
  ).trim().split("\n").find((l) => l.startsWith("http")) ?? null;
}

function mergeWithRetry(retries = 5, delayMs = 8000) {
  for (let i = 1; i <= retries; i++) {
    try {
      ghExec("pr", "merge", "--merge", "--admin", "--delete-branch=false", "autobot");
      return true;
    } catch (err) {
      if (i < retries) {
        log(`merge attempt ${i}/${retries} failed, retrying in ${delayMs}ms...`);
        // synchronous sleep
        const until = Date.now() + delayMs;
        while (Date.now() < until) { /* spin */ }
      }
    }
  }
  return false;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!FROM_PATH) die("--from <json_path> is required");
  if (!fs.existsSync(FROM_PATH)) die(`File not found: ${FROM_PATH}`);

  let candidates;
  try {
    candidates = JSON.parse(fs.readFileSync(FROM_PATH, "utf-8"));
  } catch (e) {
    die(`Failed to parse JSON from ${FROM_PATH}: ${e.message}`);
  }
  if (!Array.isArray(candidates)) die("Input JSON must be an array");

  // Filter & slice
  if (ONLY_STATUS) {
    candidates = candidates.filter((c) => c.recommended_status === ONLY_STATUS);
  }
  candidates = candidates.slice(0, MAX_TOTAL);

  const blacklist = candidates.filter((c) => c.recommended_status === "BLACKLIST");
  const review   = candidates.filter((c) => c.recommended_status === "NEEDS_REVIEW");

  log(
    `candidates: ${candidates.length} total, ${blacklist.length} BLACKLIST, ${review.length} NEEDS_REVIEW`
  );
  log(`apply=${APPLY} max-delete=${MAX_DELETE} max-total=${MAX_TOTAL}`);

  // ── DRY-RUN ────────────────────────────────────────────────────────────────
  if (!APPLY) {
    log("DRY-RUN mode. Pass --apply to execute changes.");
    const report = {
      dry_run: true,
      candidates: candidates.map((c) => ({
        row:              c.row,
        slug:             c.slug,
        recommended_status: c.recommended_status,
        confidence:       c.confidence,
        reasons:          c.reasons,
        would_update_sheet: true,
        would_delete_md:  c.recommended_status === "BLACKLIST" && c.md_exists !== false,
      })),
    };
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    return;
  }

  // ── APPLY ──────────────────────────────────────────────────────────────────

  // Safety: BLACKLIST count guard
  if (blacklist.length > MAX_DELETE) {
    die(
      `Safety stop: ${blacklist.length} BLACKLIST candidates exceeds --max-delete ${MAX_DELETE}. ` +
      `Increase --max-delete or process manually.`
    );
  }

  // Safety: git working tree must be clean (ignoring untracked)
  const dirtyLines = gitStatus();
  if (dirtyLines.length > 0) {
    die(
      `Git working tree is not clean:\n${dirtyLines.join("\n")}\n` +
      `Resolve before running --apply.`
    );
  }

  const sheets  = await sheetsClient(true);
  const actions = [];
  const errors  = [];

  for (const c of candidates) {
    const { row, slug, recommended_status } = c;
    log(`processing row=${row} slug=${slug} target=${recommended_status}`);

    // Step 1: Update Sheet (always, for both BLACKLIST and NEEDS_REVIEW)
    let cell;
    try {
      cell = await setSheetStatus(sheets, row, recommended_status);
      log(`  sheet row ${row} → ${recommended_status} (${cell})`);
    } catch (err) {
      log(`  ERROR sheet update row ${row}: ${err.message}`);
      errors.push({ row, slug, phase: "sheet_update", error: err.message });
      continue; // Don't delete file if Sheet update failed
    }

    // Step 2: Delete MD file (BLACKLIST only)
    let deletedMd = false;
    if (recommended_status === "BLACKLIST") {
      const mdRel = `content/tools/${slug}.md`;
      const mdAbs = path.join(CONTENT_DIR, `${slug}.md`);
      if (fs.existsSync(mdAbs)) {
        try {
          gitRm(mdRel);
          log(`  git rm ${mdRel}`);
          deletedMd = true;
        } catch (err) {
          log(`  ERROR git rm ${mdRel}: ${err.message}`);
          errors.push({ row, slug, phase: "git_rm", error: err.message });
          // Don't push/commit if rm failed; but continue to next candidate
        }
      } else {
        log(`  note: ${mdRel} does not exist, skipping rm`);
      }
    }

    actions.push({ row, slug, recommended_status, cell, deleted_md: deletedMd });
  }

  if (errors.length > 0) {
    log(`${errors.length} error(s) occurred — aborting before commit.`);
    for (const e of errors) log(`  error: ${JSON.stringify(e)}`);
    die("Fix above errors and re-run.");
  }

  // Check for staged changes
  const stagedOut = git("diff", "--cached", "--name-only").trim();
  if (!stagedOut) {
    log("No staged file changes (Sheet-only updates). No commit or PR needed.");
    process.stdout.write(
      JSON.stringify({ applied: true, actions, committed: false, pr_url: null }, null, 2) + "\n"
    );
    return;
  }

  // Step 3: Commit
  const blacklistSlugs  = actions.filter((a) => a.recommended_status === "BLACKLIST").map((a) => a.slug);
  const reviewSlugs     = actions.filter((a) => a.recommended_status === "NEEDS_REVIEW").map((a) => a.slug);
  const commitMsg = [
    `chore: post-check cleanup (${actions.length} entries)`,
    "",
    `BLACKLIST: ${blacklistSlugs.join(", ") || "none"}`,
    `NEEDS_REVIEW: ${reviewSlugs.join(", ") || "none"}`,
  ].join("\n");
  gitCommit(commitMsg);
  const commitHash = git("rev-parse", "--short", "HEAD").trim();
  log(`committed: ${commitHash}`);

  // Step 4: Push to autobot
  log("pushing to origin autobot...");
  gitPushAutobot();

  // Step 5: PR
  let prUrl = null;
  if (CREATE_PR) {
    const prBody = [
      "## Post-check cleanup",
      "",
      `Applied by \`postcheck_apply_actions.mjs\` at ${new Date().toISOString()}`,
      "",
      "### Actions",
      ...actions.map(
        (a) =>
          `- Row ${a.row} \`${a.slug}\`: → **${a.recommended_status}**` +
          (a.deleted_md ? " (md deleted)" : "")
      ),
      "",
      "### Safety",
      `- max-delete: ${MAX_DELETE}, max-total: ${MAX_TOTAL}`,
    ].join("\n");

    try {
      if (prAlreadyExists()) {
        log("PR for autobot → master already exists; skipping create.");
        prUrl = ghExec("pr", "view", "--head", "autobot", "--json", "url", "--jq", ".url").trim();
      } else {
        prUrl = createPr(PR_TITLE, prBody);
        log(`PR created: ${prUrl}`);
      }
      // Auto-merge (project convention: gh pr merge --merge --admin)
      const merged = mergeWithRetry();
      if (merged) {
        log("PR merged successfully.");
      } else {
        log("WARNING: auto-merge failed. Merge manually: gh pr merge --merge --admin autobot");
      }
    } catch (err) {
      log(`WARNING: PR step failed: ${err.message}`);
      log("Create the PR manually: gh pr create --base master --head autobot");
    }
  }

  const report = { applied: true, commit: commitHash, actions, errors, pr_url: prUrl };
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
}

main().catch((err) => {
  process.stderr.write(`[apply] ERROR: ${err.message}\n`);
  process.exit(1);
});

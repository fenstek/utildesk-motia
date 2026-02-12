#!/usr/bin/env node
/**
 * Orchestrator: process N NEW tools end-to-end
 *
 * Usage:
 *   node scripts/test_run_9_full.mjs 9
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { existsSync } from 'node:fs';

const args = process.argv.slice(2);
const countArg = args.find((a) => /^\d+$/.test(String(a)));
const COUNT = Math.max(1, Math.min(50, Number(countArg || 9)));
const FINALIZE_DEFERRED = args.includes('--finalize-deferred');
const SELF_TEST_STATUS = args.includes('--self-test-status-logic');
const DRY = process.env.DRY_STATUS_LOGIC === '1' || SELF_TEST_STATUS;
const TOOL_JSON = '/tmp/utildesk_current_tool.json';
const DEFER_FILE = '/tmp/utildesk_deferred_publish_checks.json';
const DEFER_MARKER = 'PUBLISH_DEFERRED: pre-commit md missing/untracked';
const POST_COMMIT_ERROR = 'PUBLISH_ERROR: md missing/untracked post-commit';

function die(msg){
  console.error(`\n[FAIL] ${msg}\n`);
  process.exit(1);
}

function runCapture(cmd, args){
  const r = spawnSync(cmd, args, { encoding:'utf8' });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || '');
    die(`${cmd} ${args.join(' ')}`);
  }
  return (r.stdout || '').trim();
}

function runInherit(cmd, args){
  const r = spawnSync(cmd, args, { stdio:'inherit' });
  if (r.status !== 0) {
    die(`${cmd} ${args.join(' ')}`);
  }
}

function isTrackedByGit(path){
  try{
    execFileSync('git', ['ls-files', '--error-unmatch', path], { stdio: 'ignore' });
    return true;
  }catch{
    return false;
  }
}

function readRowNumber(toolJsonText){
  try{
    const j = JSON.parse(toolJsonText);
    const rn = j?.row_number ?? j?.item?.row_number;
if(!rn) return null;
    return Number(rn);
  }catch{
    return null;
  }
}

function markError(rowNum, message, updateCounts = null){
  try{
    if(rowNum){
      console.log(`[ERROR] Marking row ${rowNum} as ERROR: ${message}`);
      // Best-effort: set ERROR status in sheet (sheet_set_status.mjs must support ERROR)
      updateStatus(rowNum, 'ERROR', `mark_error:${message}`, updateCounts);
    }
  }catch(e){
    // Never throw from error handler
    console.log('[WARN] Failed to set ERROR status:', e?.message || e);
  }
}

function updateStatus(rowNum, status, reason = '', updateCounts = null){
  if(!rowNum) return;
  if (updateCounts) {
    const used = Number(updateCounts.get(rowNum) || 0);
    if (used >= 2) {
      console.log(`[WARN] Skip status update for row ${rowNum}: update limit reached (reason=${reason || 'n/a'})`);
      return;
    }
    updateCounts.set(rowNum, used + 1);
  }
  if (DRY) {
    console.log(`[DRY] would set status row=${rowNum} -> ${status}${reason ? ` (${reason})` : ''}`);
    return { ok: true, dry: true };
  }
  const statusArgs = ['scripts/sheet_set_status.mjs', String(rowNum), status];
  if (reason) statusArgs.push(reason);
  runInherit('node', statusArgs);
  return { ok: true, dry: false };
}

function saveDeferredChecks(items){
  const payload = {
    created_at: new Date().toISOString(),
    marker: DEFER_MARKER,
    items,
  };
  fs.writeFileSync(DEFER_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function loadDeferredChecks(){
  if (!existsSync(DEFER_FILE)) return [];
  try {
    const raw = fs.readFileSync(DEFER_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.items) ? parsed.items : [];
  } catch (e) {
    console.log(`[WARN] Failed to read ${DEFER_FILE}: ${e?.message || e}`);
    return [];
  }
}

function finalizeDeferredChecks(items, opts = {}){
  const updateCounts = new Map();
  let done = 0;
  let error = 0;
  let skipped = 0;
  for (const item of items) {
    const rowNumber = Number(item?.rowNumber || 0);
    const mdPath = String(item?.mdPath || '').trim();
    if (!rowNumber || !mdPath) {
      skipped += 1;
      continue;
    }
    const ok = typeof opts.pathOk === 'function'
      ? Boolean(opts.pathOk(item))
      : (existsSync(mdPath) && isTrackedByGit(mdPath));
    if (ok) {
      updateStatus(rowNumber, 'DONE', 'post_commit_finalize_done', updateCounts);
      done += 1;
    } else {
      console.error(`[GUARD] Post-commit missing/untracked: ${mdPath}`);
      console.error(`[GUARD] ${POST_COMMIT_ERROR}`);
      updateStatus(rowNumber, 'ERROR', 'post_commit_finalize_error', updateCounts);
      error += 1;
    }
  }
  return { done, error, skipped };
}

function runFinalizeMode(){
  const items = loadDeferredChecks();
  if (!items.length) {
    console.log(`[INFO] No deferred checks in ${DEFER_FILE}`);
    return;
  }
  console.log(`[INFO] Finalizing deferred checks: ${items.length}`);
  const summary = finalizeDeferredChecks(items);
  console.log(`[INFO] Deferred finalization complete: DONE=${summary.done}, ERROR=${summary.error}, SKIPPED=${summary.skipped}`);
}

function runSelfTestStatusLogic(){
  const sample = [
    { rowNumber: 1, mdPath: 'content/tools/sample-a.md', slug: 'sample-a' },
    { rowNumber: 2, mdPath: 'content/tools/sample-b.md', slug: 'sample-b' },
  ];
  const scenario1 = finalizeDeferredChecks(sample, {
    pathOk: (item) => item.slug === 'sample-a',
  });
  console.log('[SELF_TEST] scenario1 expected: row1=DONE row2=ERROR');
  console.log(JSON.stringify(scenario1, null, 2));
}

if (SELF_TEST_STATUS) {
  runSelfTestStatusLogic();
  process.exit(0);
}

if (FINALIZE_DEFERRED) {
  runFinalizeMode();
  process.exit(0);
}

if (DRY) {
  console.log('[DRY] Offline mode enabled. Skipping live NEW-tool processing to avoid external Google/network calls.');
  process.exit(0);
}

if (existsSync(DEFER_FILE)) {
  try { fs.unlinkSync(DEFER_FILE); } catch {}
}

console.log(`[INFO] Processing ${COUNT} NEW tools`);

const deferredFinalCheck = [];
const updateCounts = new Map();

for (let i = 0; i < COUNT; i++){
  console.log(`\n[STEP] ${i+1}/${COUNT}`);

  let rowNum = null;
  try {
    // 1) get next NEW tool (this script itself sets IN_PROGRESS)
    const out = runCapture('node', ['scripts/sheet_get_next_new.mjs']);
    if(!out) die('sheet_get_next_new.mjs returned empty output');
    if(!out.includes('"found": true')) die(`No NEW tools found or unexpected output:\n${out}`);

    // Normalize tool JSON so downstream scripts can read slug/title at top-level
    let parsed;
    try {
      parsed = JSON.parse(out);
    } catch (e) {
      die('sheet_get_next_new.mjs returned invalid JSON');
    }
    const item = parsed?.item ?? parsed;
    const norm = {
      ...item,
      title: item?.title ?? item?.topic ?? item?.slug
    };
    fs.writeFileSync(TOOL_JSON, JSON.stringify(norm, null, 2) + '\n', 'utf8');

    rowNum = readRowNumber(out);
    if(!rowNum) die('Could not parse row_number from sheet_get_next_new output');

    // 2) generate markdown (needs tool.json)
    runInherit('node', ['scripts/generate_tool_md.mjs', TOOL_JSON]);

    // 3) finalize md
    runInherit('node', ['scripts/finalize_md.mjs', TOOL_JSON]);

    // 4) duplicate protection + cleanup stray empty markdown files (may appear after failed runs)
    try {
      const stray = '/opt/utildesk-motia/content/tools/.md';
      if (fs.existsSync(stray)) fs.unlinkSync(stray);
    } catch {}

    runInherit('node', ['scripts/check_duplicates.mjs']);

    const mdPath = `content/tools/${norm.slug}.md`;
    const publishedOk = existsSync(mdPath) && isTrackedByGit(mdPath);
    if (!publishedOk) {
      console.error('[GUARD] Defer DONE: pre-commit md missing or not tracked:', mdPath);
      console.error(`[GUARD] ${DEFER_MARKER}`);
      deferredFinalCheck.push({
        rowNumber: rowNum,
        mdPath,
        slug: norm.slug,
        reason: 'pre_commit_missing_or_untracked',
      });
      continue;
    }

    // 5) set status DONE by row_number (real interface)
    updateStatus(rowNum, 'DONE', 'precommit_tracked_done', updateCounts);
  } catch (e) {
    const msg = (e && (e.message || String(e))) || 'unknown error';
    console.log('[FAIL]', msg);
    markError(rowNum, msg, updateCounts);
    throw e;
  }
}

saveDeferredChecks(deferredFinalCheck);
if (deferredFinalCheck.length) {
  console.log(`[INFO] Deferred checks saved: ${deferredFinalCheck.length} -> ${DEFER_FILE}`);
}

console.log('\n[SUCCESS] Finished processing tools');

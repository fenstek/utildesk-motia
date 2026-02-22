#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const SELF_TEST = args.includes('--self-test');

function safeString(v) {
  return String(v || '').replace(/[\r\n]+/g, ' ').trim();
}

function parseMoved(report) {
  const n = Number(report?.moved_to_needs_review);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 9999;
}

function emit(report, moved, errorMessage = '') {
  console.log(JSON.stringify(report));
  if (errorMessage) {
    console.log(`QC_ERROR=${safeString(errorMessage)}`);
  }
  console.log(`QC_MOVED_TO_NEEDS_REVIEW=${moved}`);
}

function runSelfTest() {
  const fake = {
    ok: true,
    mode: 'self-test',
    moved_to_needs_review: 0,
  };

  const moved = parseMoved(fake);
  const lines = [JSON.stringify(fake), `QC_MOVED_TO_NEEDS_REVIEW=${moved}`];
  const hasMarker = lines.some((line) => line.startsWith('QC_MOVED_TO_NEEDS_REVIEW='));

  if (!hasMarker) {
    emit({ ok: false, mode: 'self-test', reason: 'missing_qc_moved_line' }, 9999, 'self-test failed');
    return;
  }

  for (const line of lines) console.log(line);
  console.log('SELF_TEST_OK=1');
}

function runQcApply() {
  const timeoutMs = Math.max(10000, Number(process.env.QC_BEFORE_PUBLISH_TIMEOUT_MS || 180000));
  const proc = spawnSync('node', ['scripts/audit_new_inprogress_qc.mjs', '--apply=1', '--json'], {
    encoding: 'utf8',
    timeout: timeoutMs,
    cwd: process.cwd(),
    env: process.env,
  });

  if (proc.error) {
    emit({ ok: false, mode: 'qc-helper', reason: 'spawn_error' }, 9999, proc.error.message);
    return;
  }

  const stdout = String(proc.stdout || '').trim();
  const stderr = String(proc.stderr || '').trim();

  if (proc.status !== 0) {
    emit(
      {
        ok: false,
        mode: 'qc-helper',
        reason: 'qc_non_zero_exit',
        exit_code: proc.status,
      },
      9999,
      stderr || stdout || `qc exited with status ${proc.status}`,
    );
    return;
  }

  let report;
  try {
    report = JSON.parse(stdout);
  } catch (err) {
    emit(
      {
        ok: false,
        mode: 'qc-helper',
        reason: 'invalid_qc_json',
      },
      9999,
      `${err?.message || err}; raw=${safeString(stdout).slice(0, 300)}`,
    );
    return;
  }

  const moved = parseMoved(report);
  emit(report, moved);
}

try {
  if (SELF_TEST) {
    runSelfTest();
  } else {
    runQcApply();
  }
  process.exit(0);
} catch (err) {
  emit({ ok: false, mode: SELF_TEST ? 'self-test' : 'qc-helper', reason: 'unexpected_exception' }, 9999, err?.message || String(err));
  process.exit(0);
}

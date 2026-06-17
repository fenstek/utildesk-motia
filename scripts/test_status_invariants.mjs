#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  assertSafeStatusTransition,
  getPublishGuardDecision,
} from "./lib/publish_status_guards.mjs";

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error?.stack || String(error));
    process.exitCode = 1;
  }
}

test("DISABLED rows are skipped and repo-disabled", () => {
  const decision = getPublishGuardDecision("DISABLED");
  assert.equal(decision.action, "skip_disabled_sync");
  assert.equal(decision.allowStatusWrite, false);
  assert.equal(decision.syncDisabledRepo, true);
});

test("BLACKLIST rows are skipped and repo-disabled", () => {
  const decision = getPublishGuardDecision("BLACKLIST");
  assert.equal(decision.action, "skip_disabled_sync");
  assert.equal(decision.allowStatusWrite, false);
  assert.equal(decision.syncDisabledRepo, true);
});

test("NEEDS_REVIEW rows are blocked by default", () => {
  const decision = getPublishGuardDecision("NEEDS_REVIEW");
  assert.equal(decision.action, "skip_needs_review");
  assert.equal(decision.exitCode, 2);
  assert.equal(decision.allowStatusWrite, false);
});

test("NEEDS_REVIEW rows can only run local rebuild mode with flag", () => {
  const decision = getPublishGuardDecision("NEEDS_REVIEW", {
    allowNeedsReview: true,
  });
  assert.equal(decision.action, "local_rebuild_only");
  assert.equal(decision.exitCode, 0);
  assert.equal(decision.allowStatusWrite, false);
});

test("NEW rows remain publishable", () => {
  const decision = getPublishGuardDecision("NEW");
  assert.equal(decision.action, "publish");
  assert.equal(decision.allowStatusWrite, true);
});

test("safe transition allows normal publish lifecycle", () => {
  assert.doesNotThrow(() => assertSafeStatusTransition("NEW", "IN_PROGRESS"));
  assert.doesNotThrow(() => assertSafeStatusTransition("IN_PROGRESS", "DONE"));
});

test("safe transition blocks protected statuses", () => {
  assert.throws(() => assertSafeStatusTransition("DISABLED", "DONE"));
  assert.throws(() => assertSafeStatusTransition("BLACKLIST", "IN_PROGRESS"));
  assert.throws(() => assertSafeStatusTransition("NEEDS_REVIEW", "DONE"));
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

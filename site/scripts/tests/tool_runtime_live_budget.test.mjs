import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import {
  assertLocalOnlyUrl,
  assertProductionModeArgs,
  estimateProductionCanary,
  estimateProductionDelta,
  estimateProductionPublish,
  reserveLiveRequests,
} from "../lib/tool-runtime-live-budget.mjs";

const execFileAsync = promisify(execFile);
const afterReset = new Date("2026-07-16T00:05:01.000Z");
const slugs = Array.from({ length: 24 }, (_, index) => `tool-${index}`);

test("production canary is deterministically limited to 48 localized HTML requests", () => {
  assert.deepEqual(estimateProductionCanary({ slugs, performanceRoutes: 10 }), {
    html: 48,
    json: 0,
    markdown: 0,
    assets: 0,
    control: 0,
    indexNow: 0,
    total: 48,
  });
});

test("publisher estimate covers atomic D1 verification and content-addressed asset round trips", () => {
  assert.deepEqual(estimateProductionPublish({ assets: 10, assetMode: "r2" }), { d1: 4, r2: 21, pagesAssets: 0, total: 25 });
  assert.deepEqual(estimateProductionPublish({ assets: 10, assetMode: "pages-fallback" }), { d1: 4, r2: 0, pagesAssets: 10, total: 14 });
  assert.equal(estimateProductionPublish({ compareOnly: true }).total, 1);
});

test("ordinary ten-card delta stays near the 100-request target", () => {
  const estimate = estimateProductionDelta({
    slugs: slugs.slice(0, 10),
    assetPaths: slugs.slice(0, 10).map((slug) => `/tool-assets/hash/${slug}.webp`),
    includeControlRequest: true,
    includeIndexNow: true,
  });
  assert.equal(estimate.total, 72);
  assert.ok(estimate.total <= 100);
});

test("production contracts reject --all, oversized canaries and budgets above 500", () => {
  const base = { mode: "production-canary", baseUrl: "https://tools.utildesk.de", slugs, maxLiveRequests: 500, now: afterReset };
  assert.throws(() => assertProductionModeArgs({ ...base, argv: ["production-canary", "--all"] }), /refuses --all/);
  assert.throws(() => assertProductionModeArgs({ ...base, slugs: [...slugs, "tool-24"] }), /1-24/);
  assert.throws(() => assertProductionModeArgs({ ...base, maxLiveRequests: 501 }), /1 to 500/);
});

test("production execution is time-gated but a request-free preflight is allowed", () => {
  const base = {
    mode: "production-canary",
    argv: ["production-canary"],
    baseUrl: "https://tools.utildesk.de",
    slugs,
    maxLiveRequests: 500,
    now: new Date("2026-07-15T23:59:59.000Z"),
  };
  assert.doesNotThrow(() => assertProductionModeArgs({ ...base, execute: false }));
  assert.throws(() => assertProductionModeArgs({ ...base, execute: true }), /blocked until/);
});

test("local-full URL contract refuses every non-loopback host", () => {
  assert.doesNotThrow(() => assertLocalOnlyUrl("http://127.0.0.1:8791"));
  assert.throws(() => assertLocalOnlyUrl("https://tools.utildesk.de"), /localhost or loopback/);
});

test("ledger reserves worst-case requests before execution and never exceeds 500", async () => {
  const directory = await mkdtemp(join(tmpdir(), "utildesk-live-ledger-"));
  const ledgerPath = join(directory, "ledger.json");
  try {
    const first = await reserveLiveRequests({
      ledgerPath,
      mode: "production-canary",
      command: "first",
      estimate: { total: 400 },
      urls: ["https://tools.utildesk.de/tools/chatgpt/"],
      maxLiveRequests: 500,
      now: afterReset,
    });
    assert.equal(first.remaining, 100);
    await assert.rejects(reserveLiveRequests({
      ledgerPath,
      mode: "production-delta",
      command: "second",
      estimate: { total: 101 },
      maxLiveRequests: 500,
      now: afterReset,
    }), /budget exhausted/);
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
    assert.equal(ledger.entries.length, 1);
    assert.equal(ledger.entries[0].worstCaseRequests, 400);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("legacy capture command refuses live hosts before issuing a request", async () => {
  const script = resolve(import.meta.dirname, "../capture_tool_runtime_baseline.mjs");
  await assert.rejects(execFileAsync(process.execPath, [script, "--all", "--base-url", "https://tools.utildesk.de", "--out", join(tmpdir(), "forbidden-live-capture")]), /Direct live capture is forbidden/);
});

test("release and remote publisher entrypoints permanently reject --all", async () => {
  const release = await new Promise((resolveResult) => execFile(process.execPath, [
    resolve(import.meta.dirname, "../tool_runtime_release.mjs"), "--all", "--git-range", "HEAD~1..HEAD",
  ], (error, stdout, stderr) => resolveResult({ error, stdout, stderr })));
  assert.ok(release.error);
  assert.match(release.stderr, /refuses --all/);

  const publisher = await new Promise((resolveResult) => execFile(process.execPath, [
    resolve(import.meta.dirname, "../publish_runtime_content.mjs"), "--kind", "tool", "--operation", "reconcile", "--all", "--remote",
  ], { cwd: resolve(import.meta.dirname, "../..") }, (error, stdout, stderr) => resolveResult({ error, stdout, stderr })));
  assert.ok(publisher.error);
  assert.match(publisher.stderr, /refuses --all/);
});

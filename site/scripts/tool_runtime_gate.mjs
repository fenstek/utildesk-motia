#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";
import { inspectToolHtml } from "./capture_tool_runtime_baseline.mjs";
import { compareToolRuntimeManifests } from "./check_tool_runtime_parity.mjs";
import { changedToolSlugs, loadToolRelease, readSlugFile } from "./lib/tool-runtime-publisher.mjs";
import {
  DEFAULT_MAX_LIVE_REQUESTS,
  assertLocalOnlyUrl,
  assertProductionModeArgs,
  estimateProductionCanary,
  estimateProductionDelta,
  reserveLiveRequests,
} from "./lib/tool-runtime-live-budget.mjs";

const execFileAsync = promisify(execFile);
const DEFAULT_PRODUCTION_ORIGIN = "https://tools.utildesk.de";
export const DEFAULT_CANARY_SLUGS = [
  "10to8", "8x8", "abbyy-vantage", "ableton-live", "activecampaign", "adobe-firefly",
  "adobe-podcast", "aider", "airbyte", "anyconv", "autogen", "aws-textract",
  "base44", "browserbase", "chatgpt", "claude", "cohere", "crisp",
  "google-search-console", "hermes-agent", "playwright", "postgresql", "renpy", "reply-io",
];

const valueFor = (argv, flag) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
};
const has = (argv, flag) => argv.includes(flag);
const normalizedOrigin = (value) => String(value).replace(/\/+$/, "");
const uniqueSorted = (values) => [...new Set(values.map(String).filter(Boolean))].sort();
const safeSlug = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value));
const headerObject = (headers) => Object.fromEntries([...headers.entries()].map(([key, value]) => [key.toLowerCase(), value]));

export function parseGateArgs(argv) {
  const mode = argv[0];
  if (!new Set(["local-full", "production-canary", "production-delta"]).has(mode)) {
    throw new Error("Usage: tool_runtime_gate.mjs <local-full|production-canary|production-delta> [options]");
  }
  const maxLiveRequests = Number(valueFor(argv, "--max-live-requests") ?? DEFAULT_MAX_LIVE_REQUESTS);
  const performanceRoutes = Number(valueFor(argv, "--performance-routes") ?? 0);
  return {
    mode,
    argv,
    baseUrl: normalizedOrigin(valueFor(argv, "--base-url") || (mode === "local-full" ? "http://127.0.0.1:8791" : DEFAULT_PRODUCTION_ORIGIN)),
    canonicalOrigin: normalizedOrigin(valueFor(argv, "--canonical-origin") || DEFAULT_PRODUCTION_ORIGIN),
    outDir: valueFor(argv, "--out"),
    baselinePath: valueFor(argv, "--baseline"),
    slugsFile: valueFor(argv, "--slugs-file"),
    gitRange: valueFor(argv, "--git-range"),
    ledgerPath: valueFor(argv, "--ledger"),
    maxLiveRequests,
    performanceRoutes,
    operation: valueFor(argv, "--operation") || "upsert",
    execute: has(argv, "--execute"),
  };
}

async function selectedSlugs(options) {
  if (options.slugsFile) return readSlugFile(options.slugsFile);
  if (options.mode === "production-delta") {
    if (!options.gitRange) throw new Error("production-delta requires --git-range or --slugs-file");
    return changedToolSlugs(options.gitRange);
  }
  return DEFAULT_CANARY_SLUGS;
}

function plannedHtmlUrls(baseUrl, slugs) {
  return slugs.flatMap((slug) => [`${baseUrl}/tools/${slug}/`, `${baseUrl}/en/tools/${slug}/`]);
}

async function runLocalFull(options) {
  assertLocalOnlyUrl(options.baseUrl, "local-full --base-url");
  if (!options.outDir) throw new Error("local-full requires --out");
  const capture = resolve(import.meta.dirname, "capture_tool_runtime_baseline.mjs");
  const args = [capture, "--all", "--base-url", options.baseUrl, "--canonical-origin", options.canonicalOrigin, "--out", resolve(options.outDir), "--concurrency", "8"];
  await execFileAsync(process.execPath, args, { cwd: resolve(import.meta.dirname, "../.."), maxBuffer: 4 * 1024 * 1024 });
  if (options.baselinePath) {
    const [baseline, candidate] = await Promise.all([
      readFile(resolve(options.baselinePath), "utf8").then(JSON.parse),
      readFile(resolve(options.outDir, "manifest.json"), "utf8").then(JSON.parse),
    ]);
    const parity = compareToolRuntimeManifests(baseline, candidate);
    await writeFile(resolve(options.outDir, "parity.json"), `${JSON.stringify(parity, null, 2)}\n`);
    if (!parity.ok) throw new Error(`Local full parity failed with ${parity.errors.length} errors`);
  }
  return { mode: options.mode, liveRequests: 0, exhaustive: true, baseUrl: options.baseUrl };
}

async function fetchHtmlCanary(options, slugs, budget) {
  if (!options.baselinePath || !options.outDir) throw new Error("production-canary --execute requires --baseline and --out");
  const baseline = JSON.parse(await readFile(resolve(options.baselinePath), "utf8"));
  const selected = new Set(slugs);
  const baselineRecords = baseline.records.filter((record) => selected.has(record.slug));
  if (baselineRecords.length !== slugs.length * 2) throw new Error("Baseline does not contain every localized canary route");
  const records = [];
  for (const record of baselineRecords) {
    const started = performance.now();
    const response = await fetch(`${options.baseUrl}${record.path}`, {
      redirect: "manual",
      headers: { "User-Agent": "Utildesk-Quota-Safe-Production-Canary/1.0" },
    });
    const html = await response.text();
    records.push({
      ...record,
      url: `${options.baseUrl}${record.path}`,
      status: response.status,
      headers: headerObject(response.headers),
      bytes: Buffer.byteLength(html),
      durationMs: Math.round((performance.now() - started) * 10) / 10,
      html: inspectToolHtml(html),
    });
  }
  const candidate = { ...baseline, capturedAt: new Date().toISOString(), baseUrl: options.baseUrl, controlSlugs: slugs, recordCount: records.length, records };
  const parity = compareToolRuntimeManifests({ ...baseline, records: baselineRecords }, candidate);
  const headerErrors = records.filter((record) => record.headers["x-utildesk-content-runtime"] !== "tools-v1").map((record) => `${record.locale}:${record.slug}`);
  const result = { ok: parity.ok && headerErrors.length === 0, parity, headerErrors, budget, records };
  await mkdir(resolve(options.outDir), { recursive: true });
  await writeFile(resolve(options.outDir, "manifest.json"), `${JSON.stringify(candidate, null, 2)}\n`);
  await writeFile(resolve(options.outDir, "result.json"), `${JSON.stringify({ ...result, records: undefined }, null, 2)}\n`);
  if (!result.ok) throw new Error(`Production canary failed: parity=${parity.errors.length}, runtimeHeaders=${headerErrors.length}`);
  return { mode: options.mode, liveRequests: records.length, slugs: slugs.length, budget };
}

async function deltaAssetPaths(slugs) {
  const release = await loadToolRelease(slugs, null);
  return uniqueSorted(release.entries.flatMap((entry) => entry.assetHash && entry.illustrationPath
    ? [`/tool-assets/${entry.assetHash}/${basename(entry.illustrationPath)}`]
    : []));
}

async function runProductionDelta(options, slugs, budget) {
  if (!options.outDir) throw new Error("production-delta --execute requires --out");
  const assetPaths = options.operation === "upsert" ? await deltaAssetPaths(slugs) : [];
  const checks = [];
  for (const slug of slugs) {
    for (const locale of ["de", "en"]) {
      const prefix = locale === "en" ? "/en" : "";
      for (const [kind, path] of [
        ["html", `${prefix}/tools/${slug}/`],
        ["json", `${prefix}/api/tools/${slug}.json`],
        ["markdown", `${prefix}/markdown/tools/${slug}.md`],
      ]) {
        const response = await fetch(`${options.baseUrl}${path}`, { redirect: "manual", headers: { "User-Agent": "Utildesk-Quota-Safe-Production-Delta/1.0" } });
        const body = await response.text();
        const headers = headerObject(response.headers);
        const noindexOk = kind === "html" || /\bnoindex\b/i.test(headers["x-robots-tag"] || "");
        const expectedStatus = options.operation === "upsert" ? 200
          : options.operation === "redirect" && kind === "html" ? "redirect"
          : options.operation === "tombstone" ? 410
          : 404;
        const statusOk = expectedStatus === "redirect" ? [301, 302, 307, 308].includes(response.status) : response.status === expectedStatus;
        const routeStateOk = options.operation === "upsert" || kind === "html" && options.operation === "redirect"
          ? true
          : headers["x-utildesk-route-state"] === (options.operation === "deactivate" ? "disabled" : options.operation);
        checks.push({ path, kind, status: response.status, expectedStatus, statusOk, routeStateOk, bytes: Buffer.byteLength(body), noindexOk, contentType: headers["content-type"] || "" });
      }
    }
  }
  for (const path of assetPaths) {
    const response = await fetch(`${options.baseUrl}${path}`, { redirect: "manual", headers: { "User-Agent": "Utildesk-Quota-Safe-Production-Delta/1.0" } });
    checks.push({ path, kind: "asset", status: response.status, expectedStatus: 200, statusOk: response.status === 200, routeStateOk: true, bytes: Number(response.headers.get("content-length") || 0), noindexOk: true, contentType: response.headers.get("content-type") || "" });
    await response.body?.cancel();
  }
  const failures = checks.filter((check) => !check.statusOk || !check.routeStateOk || !check.noindexOk || (options.operation === "upsert" && check.kind === "json" && !check.contentType.includes("application/json")) || (options.operation === "upsert" && check.kind === "markdown" && !check.contentType.includes("text/markdown")) || (check.kind === "asset" && !check.contentType.startsWith("image/")));
  const result = { ok: failures.length === 0, slugs, assetPaths, budget, checks, failures };
  await mkdir(resolve(options.outDir), { recursive: true });
  await writeFile(resolve(options.outDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  if (failures.length) throw new Error(`Production delta validation failed for ${failures.length} routes`);
  return { mode: options.mode, liveRequests: checks.length, slugs: slugs.length, assets: assetPaths.length, budget };
}

export async function runGate(argv = process.argv.slice(2), { now = new Date() } = {}) {
  const options = parseGateArgs(argv);
  if (!new Set(["upsert", "deactivate", "redirect", "tombstone"]).has(options.operation)) throw new Error("--operation must be upsert, deactivate, redirect or tombstone");
  if (options.mode === "local-full") return runLocalFull(options);
  const slugs = uniqueSorted(await selectedSlugs(options));
  if (!slugs.length) throw new Error(`${options.mode} selected no changed slugs`);
  for (const slug of slugs) if (!safeSlug(slug)) throw new Error(`Unsafe slug: ${slug}`);
  assertProductionModeArgs({ ...options, slugs, now });
  const assetPaths = options.mode === "production-delta" && options.operation === "upsert" ? await deltaAssetPaths(slugs) : [];
  const estimate = options.mode === "production-canary"
    ? estimateProductionCanary({ slugs, performanceRoutes: options.performanceRoutes })
    : estimateProductionDelta({ slugs, assetPaths, includeControlRequest: false, includeIndexNow: false });
  const urls = options.mode === "production-canary"
    ? plannedHtmlUrls(options.baseUrl, slugs)
    : slugs.flatMap((slug) => ["", "/en"].flatMap((prefix) => [
      `${options.baseUrl}${prefix}/tools/${slug}/`,
      `${options.baseUrl}${prefix}/api/tools/${slug}.json`,
      `${options.baseUrl}${prefix}/markdown/tools/${slug}.md`,
    ])).concat(assetPaths.map((path) => `${options.baseUrl}${path}`));
  const preflight = { mode: options.mode, execute: options.execute, slugs, estimate, maxLiveRequests: options.maxLiveRequests, urls };
  if (!options.execute) return preflight;
  const budget = await reserveLiveRequests({ ledgerPath: options.ledgerPath, mode: options.mode, command: argv.join(" "), estimate, urls, maxLiveRequests: options.maxLiveRequests, now });
  return options.mode === "production-canary"
    ? fetchHtmlCanary(options, slugs, budget)
    : runProductionDelta(options, slugs, budget);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  runGate().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

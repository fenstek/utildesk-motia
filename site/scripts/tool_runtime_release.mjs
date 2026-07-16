#!/usr/bin/env node
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import {
  changedToolSlugs,
  loadToolRelease,
  readSlugFile,
  toolAssetsForEntries,
} from "./lib/tool-runtime-publisher.mjs";
import {
  DEFAULT_MAX_LIVE_REQUESTS,
  estimateProductionDelta,
  estimateProductionPublish,
  readLiveRequestLedger,
  reserveLiveRequests,
  usedLiveRequests,
} from "./lib/tool-runtime-live-budget.mjs";

const execFileAsync = promisify(execFile);
const argv = process.argv.slice(2);
const valueFor = (flag) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
};
const has = (flag) => argv.includes(flag);
const operation = valueFor("--operation") || "upsert";
if (!new Set(["upsert", "deactivate", "redirect", "tombstone"]).has(operation)) throw new Error("Invalid --operation");
if (has("--all")) throw new Error("tool-runtime-release permanently refuses --all");
if (Boolean(valueFor("--git-range")) === Boolean(valueFor("--slugs-file"))) throw new Error("Choose exactly one of --git-range or --slugs-file");

const siteDir = resolve(import.meta.dirname, "..");
const repoDir = resolve(siteDir, "..");
const ledgerPath = resolve(valueFor("--ledger") || join(repoDir, "docs/04_operations/tool_runtime_live_request_ledger_2026-07.json"));
const maxLiveRequests = Number(valueFor("--max-live-requests") ?? DEFAULT_MAX_LIVE_REQUESTS);
const slugs = valueFor("--git-range") ? changedToolSlugs(valueFor("--git-range"), repoDir) : readSlugFile(valueFor("--slugs-file"));
if (!slugs.length) throw new Error("Release contains no changed tool slugs");

const release = operation === "upsert" ? await loadToolRelease(slugs, null) : { entries: [] };
const assets = operation === "upsert" ? toolAssetsForEntries(release.entries, repoDir) : [];
const assetMode = valueFor("--asset-bucket") ? "r2" : has("--allow-pages-fallback-assets") ? "pages-fallback" : "none";
const publishEstimate = estimateProductionPublish({ assets: assets.length, assetMode });
const deltaEstimate = estimateProductionDelta({ slugs, assetPaths: assets.map((asset) => `/tool-assets/${asset.hash}/${asset.fallbackPath.split("/").pop()}`), includeIndexNow: false });
const indexNowEstimate = { indexNow: 2, total: 2 };
const totalEstimate = publishEstimate.total + deltaEstimate.total + indexNowEstimate.total;
const ledger = await readLiveRequestLedger(ledgerPath);
const usedBefore = usedLiveRequests(ledger);
if (usedBefore + totalEstimate > maxLiveRequests) throw new Error(`Complete release estimate ${totalEstimate} would exceed remaining budget ${maxLiveRequests - usedBefore}`);

const fingerprintDirectory = async (directory) => {
  try {
    const entries = await readdir(directory, { recursive: true, withFileTypes: true });
    const files = [];
    for (const entry of entries) if (entry.isFile()) {
      const path = join(entry.parentPath, entry.name);
      const details = await stat(path);
      files.push(`${path.slice(directory.length)}:${details.size}:${details.mtimeMs}`);
    }
    return createHash("sha256").update(files.sort().join("\n")).digest("hex");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
};
const distBefore = await fingerprintDirectory(join(siteDir, "dist"));
const canonicalUrls = slugs.flatMap((slug) => [`https://tools.utildesk.de/tools/${slug}/`, `https://tools.utildesk.de/en/tools/${slug}/`]);
const preflight = { operation, slugs, localeEntries: slugs.length * 2, assets: assets.length, canonicalUrls, estimates: { publish: publishEstimate, validation: deltaEstimate, indexNow: indexNowEstimate, total: totalEstimate }, ledger: { usedBefore, remainingAfterWorstCase: maxLiveRequests - usedBefore - totalEstimate }, astroBuild: false };

if (!has("--execute")) {
  console.log(JSON.stringify({ dryRun: true, ...preflight }, null, 2));
  process.exit(0);
}
if (!has("--production")) throw new Error("--execute requires --production");
if (!valueFor("--backup")) throw new Error("--execute requires --backup");
if (operation === "redirect" && !valueFor("--redirects-file")) throw new Error("redirect release requires --redirects-file");

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportDir = resolve(valueFor("--out") || join("/tmp", `utildesk-tool-runtime-release-${stamp}`));
if (reportDir === repoDir || reportDir.startsWith(`${repoDir}/`)) {
  throw new Error("--out must be outside the Git worktree during production execution; copy the completed report into docs afterwards");
}
const slugFile = join(reportDir, "slugs.json");
await import("node:fs/promises").then(({ mkdir }) => mkdir(reportDir, { recursive: true }));
await writeFile(slugFile, `${JSON.stringify(slugs, null, 2)}\n`);
const publisherArgs = [
  "scripts/publish_runtime_content.mjs", "--kind", "tool", "--operation", operation,
  "--slugs-file", slugFile, "--remote", "--production", "--confirm", "TOOL_RUNTIME_PRODUCTION",
  "--backup", resolve(valueFor("--backup")), "--ledger", ledgerPath, "--max-live-requests", String(maxLiveRequests),
  "--report", join(reportDir, "publisher.json"),
];
if (valueFor("--asset-bucket")) publisherArgs.push("--asset-bucket", valueFor("--asset-bucket"));
if (has("--allow-pages-fallback-assets")) publisherArgs.push("--allow-pages-fallback-assets");
if (valueFor("--redirects-file")) publisherArgs.push("--redirects-file", resolve(valueFor("--redirects-file")));
await execFileAsync(process.execPath, publisherArgs, { cwd: siteDir, maxBuffer: 8 * 1024 * 1024 });

const gateArgs = [
  "scripts/tool_runtime_gate.mjs", "production-delta", "--operation", operation,
  "--slugs-file", slugFile, "--out", join(reportDir, "live-delta"), "--ledger", ledgerPath,
  "--max-live-requests", String(maxLiveRequests), "--execute",
];
await execFileAsync(process.execPath, gateArgs, { cwd: siteDir, maxBuffer: 8 * 1024 * 1024 });

const indexNowBudget = await reserveLiveRequests({
  ledgerPath,
  mode: "production-indexnow-delta",
  command: "indexnow_submit.py submit-batch [changed canonical HTML only]",
  estimate: indexNowEstimate,
  urls: ["https://api.indexnow.org/indexnow", "https://www.bing.com/indexnow"],
  maxLiveRequests,
});
const indexNowArgs = [resolve(repoDir, "scripts/indexnow_submit.py"), "submit-batch"];
for (const url of canonicalUrls) indexNowArgs.push("--url", url);
const indexNow = await execFileAsync("python3", indexNowArgs, { cwd: repoDir, maxBuffer: 4 * 1024 * 1024 });

const distAfter = await fingerprintDirectory(join(siteDir, "dist"));
if (distAfter !== distBefore) throw new Error("Content-only release mutated site/dist; refusing completion");
const finalReport = { ...preflight, completedAt: new Date().toISOString(), publisherReport: join(reportDir, "publisher.json"), deltaReport: join(reportDir, "live-delta/result.json"), indexNow: JSON.parse(indexNow.stdout), indexNowBudget, distUnchanged: true };
await writeFile(join(reportDir, "release.json"), `${JSON.stringify(finalReport, null, 2)}\n`);
console.log(JSON.stringify(finalReport, null, 2));

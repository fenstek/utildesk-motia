#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { RUNTIME_PATHS } from "./runtime-content.mjs";
import {
  assertProductionSafety,
  executeD1Batch,
  getD1Database,
  gitReleaseState,
  queryD1,
  readRuntimeConfig,
} from "./lib/tool-runtime-publisher.mjs";
import { refreshToolCatalogs, TOOL_CATALOG_REFRESH_MAX_ATTEMPTS } from "./lib/tool-runtime-catalog-publisher.mjs";
import { estimateToolCatalogRefresh, reserveLiveRequests } from "./lib/tool-runtime-live-budget.mjs";

const args = process.argv.slice(2);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const has = (flag) => args.includes(flag);

if (!has("--execute") || !has("--remote")) {
  throw new Error("Catalog refresh is read/write; pass both --execute and --remote after reviewing the target");
}
if (has("--production") === has("--preview")) {
  throw new Error("Choose exactly one explicit target: --preview or --production");
}

const production = has("--production");
const productionDatabase = "utildesk-content-runtime-production";
const defaultPreviewDatabase = "utildesk-content-runtime-preview";
const configPath = valueFor("--config") || (production ? "wrangler.runtime.production.jsonc" : "wrangler.hybrid.jsonc");
const databaseName = valueFor("--database") || (production ? productionDatabase : defaultPreviewDatabase);
if (production && databaseName !== productionDatabase) throw new Error(`Refusing production target ${databaseName}; expected ${productionDatabase}`);
if (!production && databaseName === productionDatabase) throw new Error("Preview catalog refresh refuses the production database name");
const target = readRuntimeConfig(resolve(RUNTIME_PATHS.SITE_DIR, configPath), databaseName);
if (!production) {
  const productionTarget = readRuntimeConfig(
    resolve(RUNTIME_PATHS.SITE_DIR, "wrangler.runtime.production.jsonc"),
    productionDatabase,
  );
  if (target.databaseId === productionTarget.databaseId || target.workerName === productionTarget.workerName) {
    throw new Error("Preview catalog refresh refuses a config bound to the production database ID or Worker name");
  }
}
const catalogBucket = valueFor("--catalog-bucket") || target.catalogBucket;
if (target.catalogBucket && catalogBucket !== target.catalogBucket) {
  throw new Error(`--catalog-bucket must match configured TOOL_ASSETS binding (${target.catalogBucket})`);
}
if (!catalogBucket) throw new Error("No TOOL_ASSETS binding or --catalog-bucket was provided; no remote calls were sent");

if (production) {
  assertProductionSafety({
    production: true,
    remote: true,
    confirmation: valueFor("--confirm"),
    backupPath: valueFor("--backup"),
    releaseState: gitReleaseState(RUNTIME_PATHS.REPO_DIR),
    databaseName,
  });
} else if (valueFor("--confirm") !== "TOOL_RUNTIME_PREVIEW_CATALOGS") {
  throw new Error("Preview catalog refresh requires --confirm TOOL_RUNTIME_PREVIEW_CATALOGS");
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
if (!accountId || !token) throw new Error("Remote D1 access requires existing CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN");
const connection = { accountId, databaseId: target.databaseId, token };
const ledgerPath = resolve(valueFor("--ledger") || `${RUNTIME_PATHS.REPO_DIR}/docs/04_operations/tool_runtime_live_request_ledger_2026-07.json`);
const liveRequestBudget = await reserveLiveRequests({
  ledgerPath,
  mode: production ? "production-tool-catalog-refresh" : "preview-tool-catalog-refresh",
  command: "refresh_tool_catalogs.mjs --execute --remote [explicit database and existing R2 bucket]",
  estimate: estimateToolCatalogRefresh({ maxAttempts: TOOL_CATALOG_REFRESH_MAX_ATTEMPTS }),
  urls: [
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${target.databaseId}/query`,
    `wrangler r2 bucket info ${catalogBucket}`,
    `wrangler r2 object put/get ${catalogBucket}/catalogs/tool/{de,en}/{sha256}.json`,
  ],
  maxLiveRequests: Number(valueFor("--max-live-requests") ?? 10_000),
});

const liveTarget = await getD1Database(connection);
if (liveTarget.name !== databaseName || liveTarget.uuid !== target.databaseId) {
  throw new Error(`D1 target mismatch: config=${databaseName}/${target.databaseId}, API=${liveTarget.name}/${liveTarget.uuid}`);
}
const catalogSchema = await queryD1({ ...connection, sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'runtime_tool_catalogs'" });
if (!(catalogSchema[0]?.results ?? []).some((row) => row.name === "runtime_tool_catalogs")) {
  throw new Error("Apply D1 migration 0008_tool_catalog_objects.sql before refreshing catalogs");
}

const catalogRefresh = await refreshToolCatalogs({
  connection,
  queryD1,
  executeD1Batch,
  bucket: catalogBucket,
  siteDir: RUNTIME_PATHS.SITE_DIR,
  configPath: target.configPath,
  maxAttempts: TOOL_CATALOG_REFRESH_MAX_ATTEMPTS,
});
const report = { target: databaseName, worker: target.workerName, catalogRefresh, liveRequestBudget };
const reportPath = valueFor("--out");
if (reportPath) {
  const resolved = resolve(reportPath);
  await mkdir(dirname(resolved), { recursive: true });
  await writeFile(resolved, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify(report, null, 2));

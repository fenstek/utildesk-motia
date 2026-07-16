import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { spawn } from "node:child_process";
import { buildEntryUpsertSql, listRuntimeEntries, RUNTIME_PATHS } from "./runtime-content.mjs";
import {
  assertProductionSafety,
  buildRouteStateBatch,
  buildUpsertBatch,
  executeD1Batch,
  getD1Database,
  gitReleaseState,
  loadToolRelease,
  parseRedirects,
  queryD1,
  readRuntimeConfig,
  reconcileToolState,
  resolveRequestedSlugs,
  toolAssetsForEntries,
  uploadR2Assets,
  verifyPagesFallbackAssets,
} from "./lib/tool-runtime-publisher.mjs";
import {
  DEFAULT_MAX_LIVE_REQUESTS,
  estimateProductionPublish,
  reserveLiveRequests,
} from "./lib/tool-runtime-live-budget.mjs";

const args = process.argv.slice(2);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const has = (flag) => args.includes(flag);

const kind = valueFor("--kind");
if (!kind || !["tool", "ratgeber"].includes(kind)) throw new Error("--kind must be tool or ratgeber");

async function runLegacyRatgeber() {
  const locale = valueFor("--locale");
  const slug = valueFor("--slug");
  const publishAll = has("--all");
  const database = valueFor("--database") || "utildesk-content-runtime-preview";
  const configPath = valueFor("--config") || "wrangler.hybrid.jsonc";
  if (!locale || !["de", "en"].includes(locale) || (publishAll === Boolean(slug))) {
    throw new Error("Ratgeber usage: --kind ratgeber --locale <de|en> (--slug <slug> | --all) [--remote]");
  }
  const sourceEntries = await listRuntimeEntries({ kind, locale });
  const releaseState = gitReleaseState();
  const entries = (publishAll ? sourceEntries : sourceEntries.filter((entry) => entry.slug === slug))
    .map((entry) => ({ ...entry, sourceCommit: releaseState.commit }));
  if (!entries.length) throw new Error(`No ratgeber:${locale}:${slug ?? "all"} source entries exist.`);

  const outputDir = join(RUNTIME_PATHS.SITE_DIR, ".runtime", "upserts");
  const sqlName = publishAll ? `ratgeber-${locale}-all` : entries[0].contentKey.replace(/:/g, "-");
  const sqlPath = join(outputDir, `${sqlName}.sql`);
  await mkdir(outputDir, { recursive: true });
  await writeFile(sqlPath, entries.map(buildEntryUpsertSql).join("\n"), "utf8");
  if (!has("--remote")) {
    console.log(JSON.stringify({ dryRun: true, kind, locale, entries: entries.map((entry) => entry.contentKey), sqlPath }, null, 2));
    return;
  }
  const wranglerEntrypoint = join(RUNTIME_PATHS.SITE_DIR, "node_modules", "wrangler", "bin", "wrangler.js");
  const child = spawn(process.execPath, [wranglerEntrypoint, "d1", "execute", database, "--config", configPath, "--remote", "--file", sqlPath], {
    cwd: RUNTIME_PATHS.SITE_DIR,
    stdio: "inherit",
  });
  child.once("exit", (code) => process.exit(code ?? 1));
}

async function readActualRows({ remote, snapshotPath, connection }) {
  if (snapshotPath) {
    const parsed = JSON.parse(await readFile(resolve(snapshotPath), "utf8"));
    return Array.isArray(parsed) ? parsed : parsed.rows ?? [];
  }
  if (!remote) return null;
  const result = await queryD1({
    ...connection,
    sql: `SELECT locale, slug, is_active, route_state, source_hash, asset_hash, revision, canonical_path
          FROM content_entries WHERE kind = 'tool'`,
  });
  return result.flatMap((item) => item.results ?? []);
}

async function runToolPublisher() {
  const operation = valueFor("--operation") || "upsert";
  if (!["upsert", "deactivate", "redirect", "tombstone", "reconcile"].includes(operation)) {
    throw new Error("--operation must be upsert, deactivate, redirect, tombstone or reconcile");
  }
  const remote = has("--remote");
  const compareRemote = has("--compare-remote");
  const liveAccess = remote || compareRemote;
  const dryRun = has("--dry-run") || !remote || operation === "reconcile";
  const production = has("--production");
  const allowPagesFallbackAssets = has("--allow-pages-fallback-assets");
  const configPath = valueFor("--config") || (production ? "wrangler.runtime.production.jsonc" : "wrangler.hybrid.jsonc");
  const requestedDatabase = valueFor("--database") || (production ? "utildesk-content-runtime-production" : "utildesk-content-runtime-preview");
  const target = readRuntimeConfig(resolve(RUNTIME_PATHS.SITE_DIR, configPath), requestedDatabase);
  const ledgerPath = resolve(valueFor("--ledger") || join(RUNTIME_PATHS.REPO_DIR, "docs/04_operations/tool_runtime_live_request_ledger_2026-07.json"));
  const releaseState = gitReleaseState(RUNTIME_PATHS.REPO_DIR, {
    allowedDirtyPaths: [relative(RUNTIME_PATHS.REPO_DIR, ledgerPath)],
  });
  assertProductionSafety({
    production,
    remote,
    confirmation: valueFor("--confirm"),
    backupPath: valueFor("--backup"),
    releaseState,
    databaseName: target.databaseName,
  });

  if (liveAccess && has("--all")) throw new Error("Remote publisher refuses --all; use a bounded slug file or git range");
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
  const connection = { accountId, databaseId: target.databaseId, token };
  if (liveAccess && (!accountId || !token)) throw new Error("Remote D1 access requires existing CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN");

  let requestedSlugs = [];
  if (operation !== "reconcile" || !has("--all")) {
    requestedSlugs = resolveRequestedSlugs({
      slug: valueFor("--slug"),
      slugsFile: valueFor("--slugs-file"),
      gitRange: valueFor("--git-range"),
      all: has("--all"),
    });
  }

  const release = await loadToolRelease(
    operation === "upsert" && !has("--all") ? requestedSlugs : null,
    releaseState.commit,
  );
  if (has("--all")) requestedSlugs = [...release.activeSlugs].sort();

  if (operation === "reconcile") {
    const actualRows = await readActualRows({ remote, snapshotPath: valueFor("--d1-state"), connection });
    const result = actualRows ? reconcileToolState(release.entries, actualRows) : null;
    console.log(JSON.stringify({
      dryRun: true,
      operation,
      target: { database: target.databaseName, worker: target.workerName },
      expected: { localeEntries: release.entries.length, slugs: release.activeSlugs.size },
      compared: Boolean(actualRows),
      result,
    }, null, 2));
    if (result && !result.ok) process.exitCode = 2;
    return;
  }

  let statements;
  const assets = operation === "upsert" ? toolAssetsForEntries(release.entries) : [];
  if (operation === "upsert") {
    statements = buildUpsertBatch(release.entries);
  } else {
    const redirects = parseRedirects({ slug: valueFor("--slug"), toSlug: valueFor("--to-slug"), redirectsFile: valueFor("--redirects-file") });
    statements = buildRouteStateBatch(operation, requestedSlugs, { sourceCommit: releaseState.commit, redirects });
  }

  const summary = {
    dryRun,
    operation,
    production,
    target: { database: target.databaseName, worker: target.workerName },
    sourceCommit: releaseState.commit,
    cleanReleaseCommit: releaseState.clean,
    slugs: requestedSlugs,
    localeEntries: operation === "upsert" ? release.entries.length : requestedSlugs.length * 2,
    statements: statements.length,
    checks: {
      pairedLocales: operation !== "upsert" || release.entries.length === requestedSlugs.length * 2,
      activeSet: release.activeSlugs.size,
      secretsPrinted: false,
      physicalDeletes: false,
    },
    warnings: release.warnings,
    assets: {
      objects: assets.length,
      contentAddressed: true,
      source: valueFor("--asset-bucket") ? "r2" : allowPagesFallbackAssets ? "pages-fallback" : "unconfigured",
      bucket: valueFor("--asset-bucket") || null,
      pagesFallback: allowPagesFallbackAssets,
    },
  };

  if (liveAccess) {
    const assetMode = valueFor("--asset-bucket") ? "r2" : allowPagesFallbackAssets ? "pages-fallback" : "none";
    const estimate = estimateProductionPublish({ assets: assets.length, assetMode, compareOnly: !remote });
    summary.liveRequestBudget = await reserveLiveRequests({
      ledgerPath,
      mode: remote ? "production-publish" : "production-compare",
      command: `publish_runtime_content.mjs --kind tool --operation ${operation} [bounded release]`,
      estimate,
      urls: ["https://api.cloudflare.com/client/v4/accounts/{account}/d1/database/{database}"],
      maxLiveRequests: Number(valueFor("--max-live-requests") ?? DEFAULT_MAX_LIVE_REQUESTS),
    });
  }

  if (dryRun) {
    const actualRows = await readActualRows({ remote: compareRemote, snapshotPath: valueFor("--d1-state"), connection });
    if (operation === "upsert" && actualRows) {
      const actual = new Map(actualRows.map((row) => [`${row.locale}:${row.slug}`, row]));
      summary.operations = release.entries.map((entry) => {
        const row = actual.get(`${entry.locale}:${entry.slug}`);
        return { key: entry.contentKey, action: !row ? "insert" : row.source_hash === entry.sourceHash && (row.asset_hash ?? null) === (entry.assetHash ?? null) && row.route_state === "active" ? "noop" : "update" };
      });
    }
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const liveTarget = await getD1Database(connection);
  if (liveTarget.name !== target.databaseName || liveTarget.uuid !== target.databaseId) {
    throw new Error(`D1 target mismatch: config=${target.databaseName}/${target.databaseId}, API=${liveTarget.name}/${liveTarget.uuid}`);
  }
  const schemaCheck = await queryD1({ ...connection, sql: "SELECT name FROM pragma_table_info('content_entries')" });
  const columns = new Set((schemaCheck[0]?.results ?? []).map((row) => row.name));
  for (const required of ["is_active", "route_state", "canonical_path", "source_commit", "asset_key", "asset_hash"]) {
    if (!columns.has(required)) throw new Error(`D1 tool runtime schema is not applied: missing ${required}`);
  }
  if (operation === "upsert" && assets.length) {
    const assetBucket = valueFor("--asset-bucket");
    if (production && !assetBucket && !allowPagesFallbackAssets) {
      throw new Error("Production tool upsert with illustrations requires --asset-bucket or --allow-pages-fallback-assets");
    }
    if (assetBucket) {
      uploadR2Assets(assets, { bucket: assetBucket });
    } else if (allowPagesFallbackAssets) {
      await verifyPagesFallbackAssets(assets);
    }
  }
  const results = await executeD1Batch({ ...connection, statements });
  const placeholders = requestedSlugs.map(() => "?").join(", ");
  const verifiedRows = requestedSlugs.length ? await queryD1({
    ...connection,
    sql: `SELECT locale, slug, is_active, route_state, source_hash, asset_hash, redirect_target_path, revision
          FROM content_entries WHERE kind = 'tool' AND slug IN (${placeholders}) ORDER BY slug, locale`,
    params: requestedSlugs,
  }).then((items) => items.flatMap((item) => item.results ?? [])) : [];
  const expectedEntries = new Map(release.entries.map((entry) => [`${entry.locale}:${entry.slug}`, entry]));
  const verificationErrors = [];
  for (const slug of requestedSlugs) {
    const rows = verifiedRows.filter((row) => row.slug === slug);
    if (rows.length !== 2) verificationErrors.push(`${slug}: expected two localized D1 rows, got ${rows.length}`);
    for (const row of rows) {
      if (operation === "upsert") {
        const expected = expectedEntries.get(`${row.locale}:${row.slug}`);
        if (!expected || row.source_hash !== expected.sourceHash || (row.asset_hash ?? null) !== (expected.assetHash ?? null) || Number(row.is_active) !== 1 || row.route_state !== "active") {
          verificationErrors.push(`${row.locale}:${slug}: published source/asset/route state mismatch`);
        }
      } else {
        const expectedState = operation === "redirect" ? "redirect" : operation === "tombstone" ? "tombstone" : "disabled";
        if (Number(row.is_active) !== 0 || row.route_state !== expectedState) verificationErrors.push(`${row.locale}:${slug}: expected ${expectedState}`);
      }
    }
  }
  if (verificationErrors.length) throw new Error(`Post-publish D1 verification failed:\n- ${verificationErrors.join("\n- ")}`);
  const report = { ...summary, published: true, results: results.length, verifiedRows: verifiedRows.length, sourceHashVerified: operation === "upsert" };
  const reportPath = valueFor("--report");
  if (reportPath) {
    await mkdir(resolve(reportPath, ".."), { recursive: true });
    await writeFile(resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(JSON.stringify(report, null, 2));
}

if (kind === "ratgeber") await runLegacyRatgeber();
else await runToolPublisher();

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
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
} from "./lib/tool-runtime-publisher.mjs";

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
    sql: `SELECT locale, slug, is_active, route_state, source_hash, revision, canonical_path
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
  const dryRun = has("--dry-run") || !remote || operation === "reconcile";
  const production = has("--production");
  const configPath = valueFor("--config") || (production ? "wrangler.runtime.production.jsonc" : "wrangler.hybrid.jsonc");
  const requestedDatabase = valueFor("--database") || (production ? "utildesk-content-runtime-production" : "utildesk-content-runtime-preview");
  const target = readRuntimeConfig(resolve(RUNTIME_PATHS.SITE_DIR, configPath), requestedDatabase);
  const releaseState = gitReleaseState();
  assertProductionSafety({
    production,
    remote,
    confirmation: valueFor("--confirm"),
    backupPath: valueFor("--backup"),
    releaseState,
    databaseName: target.databaseName,
  });

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
  const connection = { accountId, databaseId: target.databaseId, token };
  if (remote && (!accountId || !token)) throw new Error("Remote D1 access requires existing CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN");

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
  };

  if (dryRun) {
    const actualRows = await readActualRows({ remote: has("--compare-remote"), snapshotPath: valueFor("--d1-state"), connection });
    if (operation === "upsert" && actualRows) {
      const actual = new Map(actualRows.map((row) => [`${row.locale}:${row.slug}`, row]));
      summary.operations = release.entries.map((entry) => {
        const row = actual.get(`${entry.locale}:${entry.slug}`);
        return { key: entry.contentKey, action: !row ? "insert" : row.source_hash === entry.sourceHash && row.route_state === "active" ? "noop" : "update" };
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
  for (const required of ["is_active", "route_state", "canonical_path", "source_commit"]) {
    if (!columns.has(required)) throw new Error(`D1 schema v2 is not applied: missing ${required}`);
  }
  const results = await executeD1Batch({ ...connection, statements });
  console.log(JSON.stringify({ ...summary, published: true, results: results.length }, null, 2));
}

if (kind === "ratgeber") await runLegacyRatgeber();
else await runToolPublisher();

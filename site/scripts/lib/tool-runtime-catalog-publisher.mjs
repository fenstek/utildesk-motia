import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "vite";
import { TOOL_CATALOG_REFRESH_MAX_ATTEMPTS } from "./tool-runtime-live-budget.mjs";
import { getToolRoutePolicyHash, TOOL_REDIRECTS, TOOL_TOMBSTONES } from "../../shared/toolRoutePolicy.mjs";

export const D1_MAX_ROW_BYTES = 2_000_000;
export { TOOL_CATALOG_REFRESH_MAX_ATTEMPTS };
export const TOOL_CATALOG_SNAPSHOT_SQL = `
SELECT revisions.revision AS collection_revision,
       revisions.updated_at AS collection_updated_at,
       entries.content_key, entries.kind, entries.locale, entries.slug,
       entries.title, entries.excerpt, entries.metadata_json, entries.markdown,
       entries.source_hash, entries.revision, entries.source_published_at,
       entries.source_updated_at, entries.is_active, entries.route_state,
       entries.canonical_path, entries.redirect_target_path, entries.robots_policy,
       entries.googlebot_policy, entries.editorial_reviewed, entries.illustration_path,
       entries.asset_key, entries.asset_hash, entries.source_commit, entries.deleted_at,
       entries.category, entries.price_model, entries.popularity
FROM runtime_collection_revisions AS revisions
LEFT JOIN content_entries AS entries
  ON entries.kind = revisions.kind
 AND entries.locale = revisions.locale
 AND entries.is_active = 1
 AND entries.route_state = 'active'
WHERE revisions.kind = 'tool' AND revisions.locale = ?
ORDER BY entries.slug`;

const retired = (slug) => TOOL_TOMBSTONES.has(slug) || Object.hasOwn(TOOL_REDIRECTS, slug);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function parseMetadata(value) {
  try {
    const parsed = JSON.parse(value ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function runtimeCatalogEntry(row) {
  return {
    kind: row.kind,
    locale: row.locale,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    metadata: parseMetadata(row.metadata_json),
    markdown: row.markdown,
    sourceHash: row.source_hash,
    revision: Number(row.revision ?? 1),
    sourcePublishedAt: row.source_published_at ?? null,
    sourceUpdatedAt: row.source_updated_at ?? null,
    isActive: Number(row.is_active) === 1,
    routeState: row.route_state,
    canonicalPath: row.canonical_path,
    redirectTargetPath: row.redirect_target_path ?? null,
    robotsPolicy: row.robots_policy,
    googlebotPolicy: row.googlebot_policy ?? null,
    editorialReviewed: Number(row.editorial_reviewed) === 1,
    illustrationPath: row.illustration_path ?? null,
    assetKey: row.asset_key ?? null,
    assetHash: row.asset_hash ?? null,
    sourceCommit: row.source_commit ?? null,
    deletedAt: row.deleted_at ?? null,
    category: row.category ?? null,
    priceModel: row.price_model ?? null,
    popularity: Number(row.popularity ?? 0),
  };
}

export function sortRuntimeCatalogEntries(entries, locale) {
  return [...entries].sort((left, right) => {
    const leftTime = left.sourcePublishedAt ? Date.parse(left.sourcePublishedAt) : 0;
    const rightTime = right.sourcePublishedAt ? Date.parse(right.sourcePublishedAt) : 0;
    const safeLeftTime = Number.isFinite(leftTime) ? leftTime : 0;
    const safeRightTime = Number.isFinite(rightTime) ? rightTime : 0;
    if (safeRightTime !== safeLeftTime) return safeRightTime - safeLeftTime;
    const orderDelta = Number(right.metadata.releaseOrder ?? 0) - Number(left.metadata.releaseOrder ?? 0);
    if (Number.isFinite(orderDelta) && orderDelta !== 0) return orderDelta;
    return left.title.localeCompare(right.title, locale);
  });
}

export function buildToolCatalogObjects({ snapshots, buildRuntimeToolCatalog, policyHash }) {
  const byLocale = {};
  for (const locale of ["de", "en"]) {
    const snapshot = snapshots[locale];
    if (!snapshot || !Number.isInteger(snapshot.revision) || !snapshot.updatedAt) {
      throw new Error(`Tool catalog snapshot is missing ${locale} collection metadata`);
    }
    byLocale[locale] = {
      ...snapshot,
      entries: sortRuntimeCatalogEntries(snapshot.rows
        .filter((row) => row.content_key != null)
        .map(runtimeCatalogEntry), locale),
    };
  }

  const deSlugs = new Set(byLocale.de.entries.map((entry) => entry.slug));
  const enSlugs = new Set(byLocale.en.entries.map((entry) => entry.slug));
  const missingEnglish = [...deSlugs].filter((slug) => !enSlugs.has(slug)).sort();
  const missingGerman = [...enSlugs].filter((slug) => !deSlugs.has(slug)).sort();
  if (missingEnglish.length || missingGerman.length) {
    throw new Error(`Active D1 tool catalog is not paired (missing EN: ${missingEnglish.join(",")}; missing DE: ${missingGerman.join(",")})`);
  }

  const activeDe = byLocale.de.entries.filter((entry) => !retired(entry.slug));
  const activeEn = byLocale.en.entries.filter((entry) => !retired(entry.slug));
  const result = {};
  for (const locale of ["de", "en"]) {
    const snapshot = byLocale[locale];
    const items = locale === "de"
      ? activeDe
      : activeEn;
    const payload = buildRuntimeToolCatalog(
      items,
      locale,
      snapshot.updatedAt,
      locale === "en" ? activeDe : items,
    );
    // Keep the legacy route's public shape and item order while applying the
    // same retire filter Pages uses for old/unverified catalogs.
    payload.count = payload.items.length;
    const body = JSON.stringify(payload, null, 2);
    const contentHash = sha256(body);
    result[locale] = {
      locale,
      revision: snapshot.revision,
      primaryCollectionRevision: byLocale.de.revision,
      generatedAt: snapshot.updatedAt,
      itemCount: payload.count,
      etag: `W/\"tool-${locale}-${snapshot.revision}${locale === "en" ? `-de-${byLocale.de.revision}` : ""}-${contentHash}\"`,
      policyHash,
      contentHash,
      objectKey: `catalogs/tool/${locale}/${contentHash}.json`,
      body,
      bytes: Buffer.byteLength(body),
      d1RowWouldOverflow: Buffer.byteLength(body) > D1_MAX_ROW_BYTES,
    };
  }
  return result;
}

export function buildToolCatalogManifestStatement(catalogs) {
  const de = catalogs.de;
  const en = catalogs.en;
  if (!de || !en) throw new Error("Catalog manifest requires both DE and EN objects");
  return {
    sql: `INSERT INTO runtime_tool_catalogs
  (locale, collection_revision, primary_collection_revision, object_key, etag, generated_at, item_count, policy_hash, content_hash, updated_at)
SELECT 'de', de.revision, de.revision, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
FROM runtime_collection_revisions AS de
WHERE de.kind = 'tool' AND de.locale = 'de' AND de.revision = ?
  AND EXISTS (
    SELECT 1 FROM runtime_collection_revisions AS en
    WHERE en.kind = 'tool' AND en.locale = 'en' AND en.revision = ?
  )
UNION ALL
SELECT 'en', en.revision, de.revision, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
FROM runtime_collection_revisions AS en
JOIN runtime_collection_revisions AS de
  ON de.kind = 'tool' AND de.locale = 'de'
WHERE en.kind = 'tool' AND en.locale = 'en' AND en.revision = ?
  AND de.revision = ?
ON CONFLICT(locale) DO UPDATE SET
  collection_revision = excluded.collection_revision,
  primary_collection_revision = excluded.primary_collection_revision,
  object_key = excluded.object_key,
  etag = excluded.etag,
  generated_at = excluded.generated_at,
  item_count = excluded.item_count,
  policy_hash = excluded.policy_hash,
  content_hash = excluded.content_hash,
  updated_at = CURRENT_TIMESTAMP;`,
    params: [
      de.objectKey, de.etag, de.generatedAt, de.itemCount, de.policyHash, de.contentHash,
      de.revision, en.revision,
      en.objectKey, en.etag, en.generatedAt, en.itemCount, en.policyHash, en.contentHash,
      en.revision, de.revision,
    ],
  };
}

export function uploadToolCatalogObjects(catalogs, { bucket, siteDir, configPath } = {}) {
  if (!bucket || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(bucket)) {
    throw new Error("Tool catalog publication requires the existing TOOL_ASSETS R2 bucket binding");
  }
  const wrangler = join(siteDir, "node_modules", "wrangler", "bin", "wrangler.js");
  const verifyDir = mkdtempSync(join(tmpdir(), "utildesk-tool-catalogs-"));
  try {
    execFileSync(process.execPath, [wrangler, "r2", "bucket", "info", bucket, ...(configPath ? ["--config", configPath] : [])], { cwd: siteDir, stdio: "pipe" });
    for (const catalog of Object.values(catalogs)) {
      const sourcePath = join(verifyDir, `${catalog.locale}.json`);
      writeFileSync(sourcePath, catalog.body, "utf8");
      execFileSync(process.execPath, [wrangler, "r2", "object", "put", `${bucket}/${catalog.objectKey}`, "--file", sourcePath, "--remote", "--content-type", "application/json; charset=utf-8", ...(configPath ? ["--config", configPath] : [])], { cwd: siteDir, stdio: "pipe" });
      const verifyPath = join(verifyDir, `${catalog.locale}-verified.json`);
      execFileSync(process.execPath, [wrangler, "r2", "object", "get", `${bucket}/${catalog.objectKey}`, "--file", verifyPath, "--remote", ...(configPath ? ["--config", configPath] : [])], { cwd: siteDir, stdio: "pipe" });
      const actualHash = sha256(readFileSync(verifyPath));
      if (actualHash !== catalog.contentHash) throw new Error(`${catalog.locale} tool catalog R2 object failed SHA-256 verification`);
    }
  } finally {
    rmSync(verifyDir, { recursive: true, force: true });
  }
  return Object.values(catalogs).map(({ locale, objectKey, contentHash, bytes }) => ({ locale, objectKey, contentHash, bytes }));
}

export async function refreshToolCatalogs({
  connection,
  queryD1,
  executeD1Batch,
  bucket,
  siteDir,
  configPath,
  uploadObjects = uploadToolCatalogObjects,
  maxAttempts = TOOL_CATALOG_REFRESH_MAX_ATTEMPTS,
}) {
  if (!bucket) throw new Error("No isolated TOOL_ASSETS R2 bucket is configured for tool catalog objects");
  const vite = await createServer({
    root: siteDir,
    configFile: false,
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
  });
  try {
    const { buildRuntimeToolCatalog } = await vite.ssrLoadModule("/runtime-src/lib/toolMachineRuntime.ts");
    const policyHash = await getToolRoutePolicyHash();
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const snapshots = {};
      for (const locale of ["de", "en"]) {
        const results = await queryD1({ ...connection, sql: TOOL_CATALOG_SNAPSHOT_SQL, params: [locale] });
        const rows = results.flatMap((result) => result.results ?? []);
        if (!rows.length) throw new Error(`Tool catalog query returned no collection row for ${locale}`);
        const revision = Number(rows[0].collection_revision);
        const updatedAt = rows[0].collection_updated_at ?? new Date(0).toISOString();
        if (rows.some((row) => Number(row.collection_revision) !== revision || row.collection_updated_at !== updatedAt)) {
          throw new Error(`Inconsistent ${locale} tool catalog snapshot metadata`);
        }
        snapshots[locale] = { revision, updatedAt, rows };
      }
      const catalogs = buildToolCatalogObjects({ snapshots, buildRuntimeToolCatalog, policyHash });
      const uploaded = await uploadObjects(catalogs, { bucket, siteDir, configPath });
      const write = buildToolCatalogManifestStatement(catalogs);
      const results = await executeD1Batch({ ...connection, statements: [write] });
      const changes = Number(results?.[0]?.meta?.changes ?? results?.[0]?.changes ?? 0);
      if (changes === 2) {
        return {
          published: true,
          attempts: attempt,
          policyHash,
          locales: Object.values(catalogs).map(({ locale, revision, etag, objectKey, contentHash, bytes, itemCount, d1RowWouldOverflow }) => ({
            locale, revision, etag, objectKey, contentHash, bytes, itemCount,
            storedOutsideD1BecauseCatalogExceedsD1RowLimit: d1RowWouldOverflow,
          })),
          uploaded,
          d1RowsWritten: changes,
        };
      }
      if (changes !== 0) throw new Error(`Tool catalog pointer batch changed ${changes} locale rows; expected both or neither`);
    }
    throw new Error(`Tool catalog pointer lost ${maxAttempts} D1 revision compare-and-swap attempts; rerun the publisher to rebuild from current D1`);
  } finally {
    await vite.close();
  }
}

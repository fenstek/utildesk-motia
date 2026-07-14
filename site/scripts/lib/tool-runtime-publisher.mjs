import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { buildEntriesUpsertStatement, listRuntimeEntries, RUNTIME_PATHS } from "../runtime-content.mjs";

export const PRODUCTION_CONFIRMATION = "TOOL_RUNTIME_PRODUCTION";
export const ROUTE_NOINDEX = "noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

const uniqueSorted = (values) => [...new Set(values.map((value) => String(value).trim()).filter(Boolean))].sort();
const safeSlug = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value));
const chunks = (values, size) => Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, (index + 1) * size));

export function readSlugFile(path) {
  const raw = readFileSync(resolve(path), "utf8").trim();
  if (!raw) return [];
  if (raw.startsWith("[")) return uniqueSorted(JSON.parse(raw));
  return uniqueSorted(raw.split(/\r?\n/).map((line) => line.replace(/\s+#.*$/, "").trim()));
}

export function changedToolSlugs(gitRange, repoDir = RUNTIME_PATHS.REPO_DIR) {
  const output = execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMRTD", gitRange, "--", "content/tools", "content/en/tools"], {
    cwd: repoDir,
    encoding: "utf8",
  });
  return uniqueSorted(output.split(/\r?\n/).map((path) => {
    const match = path.match(/^content\/(?:en\/)?tools\/(?:_)?([^/]+)\.md$/);
    return match?.[1] ?? "";
  }));
}

export function resolveRequestedSlugs({ slug, slugsFile, gitRange, all }, repoDir = RUNTIME_PATHS.REPO_DIR) {
  const modes = [Boolean(slug), Boolean(slugsFile), Boolean(gitRange), Boolean(all)].filter(Boolean).length;
  if (modes !== 1) throw new Error("Choose exactly one of --slug, --slugs-file, --git-range or --all");
  const values = slug ? [slug] : slugsFile ? readSlugFile(slugsFile) : gitRange ? changedToolSlugs(gitRange, repoDir) : [];
  for (const value of values) {
    if (!safeSlug(value)) throw new Error(`Unsafe tool slug: ${value}`);
  }
  return values;
}

const internalToolLinks = (markdown) => uniqueSorted(
  [...String(markdown).matchAll(/\]\(\/(?:en\/)?tools\/([a-z0-9-]+)\/?(?:[?#][^)]*)?\)/gi)].map((match) => match[1]),
);

const referencedToolImages = (markdown) => uniqueSorted([
  ...[...String(markdown).matchAll(/(?:src=["']|\]\()(\/images\/tools\/[^)"'\s]+\.webp)/gi)].map((match) => match[1]),
]);

const hasUnsafeMarkup = (markdown) => /<script\b|\bon[a-z]+\s*=|javascript\s*:/i.test(String(markdown));

export async function loadToolRelease(slugs = null, sourceCommit = null, { strictLinks = slugs !== null } = {}) {
  const [deEntries, enEntries] = await Promise.all([
    listRuntimeEntries({ kind: "tool", locale: "de" }),
    listRuntimeEntries({ kind: "tool", locale: "en" }),
  ]);
  const activeSlugs = new Set(deEntries.map((entry) => entry.slug));
  const selectedSlugs = slugs === null ? [...activeSlugs].sort() : uniqueSorted(slugs);
  const deBySlug = new Map(deEntries.map((entry) => [entry.slug, entry]));
  const enBySlug = new Map(enEntries.map((entry) => [entry.slug, entry]));
  const entries = [];
  const errors = [];
  const warnings = [];
  const canonicalPaths = new Set();

  for (const slug of selectedSlugs) {
    const pair = [deBySlug.get(slug), enBySlug.get(slug)];
    if (!pair[0] || !pair[1]) {
      errors.push(`${slug}: missing ${!pair[0] ? "DE" : "EN"} public sibling`);
      continue;
    }
    for (const entry of pair) {
      if (entry.slug !== slug) errors.push(`${slug}: ${entry.locale} slug mismatch (${entry.slug})`);
      if (canonicalPaths.has(entry.canonicalPath)) errors.push(`${slug}: duplicate canonical ${entry.canonicalPath}`);
      canonicalPaths.add(entry.canonicalPath);
      if (hasUnsafeMarkup(entry.markdown)) errors.push(`${slug}: ${entry.locale} contains unsafe HTML/URL markup`);
      for (const linkedSlug of internalToolLinks(entry.markdown)) {
        if (!activeSlugs.has(linkedSlug)) {
          const message = `${slug}: ${entry.locale} links inactive tool ${linkedSlug}`;
          (strictLinks ? errors : warnings).push(message);
        }
      }
      for (const imagePath of referencedToolImages(entry.markdown)) {
        const assetPath = join(RUNTIME_PATHS.REPO_DIR, "content", "images", "tools", basename(imagePath));
        if (!existsSync(assetPath)) errors.push(`${slug}: ${entry.locale} missing image ${imagePath}`);
      }
      entries.push({ ...entry, sourceCommit });
    }
    if (pair[0]?.robotsPolicy !== pair[1]?.robotsPolicy || pair[0]?.googlebotPolicy !== pair[1]?.googlebotPolicy) {
      errors.push(`${slug}: DE/EN robots policy mismatch`);
    }
  }

  if (errors.length) throw new Error(`Tool release validation failed:\n- ${uniqueSorted(errors).join("\n- ")}`);
  return { entries, selectedSlugs, activeSlugs, warnings: uniqueSorted(warnings), allEntries: { de: deEntries, en: enEntries } };
}

export function buildUpsertBatch(entries) {
  const bySlug = new Map();
  for (const entry of entries) bySlug.set(entry.slug, [...(bySlug.get(entry.slug) ?? []), entry]);
  const pairs = [...bySlug.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([slug, pair]) => {
    const sorted = pair.sort((left, right) => left.locale.localeCompare(right.locale));
    if (sorted.length !== 2 || sorted[0].locale !== "de" || sorted[1].locale !== "en") {
      throw new Error(`${slug}: upsert batch requires one DE and one EN entry`);
    }
    return sorted;
  });
  return chunks(pairs, 2).map((pairChunk) => buildEntriesUpsertStatement(pairChunk.flat()));
}

export function toolAssetsForEntries(entries, repoDir = RUNTIME_PATHS.REPO_DIR) {
  const assets = new Map();
  for (const entry of entries) {
    if (!entry.assetKey || !entry.assetHash || !entry.illustrationPath) continue;
    const sourcePath = join(repoDir, "content", "images", "tools", basename(entry.illustrationPath));
    if (!existsSync(sourcePath)) throw new Error(`${entry.contentKey}: asset source missing: ${entry.illustrationPath}`);
    const actualHash = createHash("sha256").update(readFileSync(sourcePath)).digest("hex");
    if (actualHash !== entry.assetHash) throw new Error(`${entry.contentKey}: asset hash drift before upload`);
    assets.set(entry.assetKey, { key: entry.assetKey, hash: entry.assetHash, sourcePath });
  }
  return [...assets.values()].sort((left, right) => left.key.localeCompare(right.key));
}

export function uploadR2Assets(assets, { bucket, siteDir = RUNTIME_PATHS.SITE_DIR } = {}) {
  if (!assets.length) return [];
  if (!bucket || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(bucket)) throw new Error("A valid --asset-bucket is required before publishing tool assets");
  const wrangler = join(siteDir, "node_modules", "wrangler", "bin", "wrangler.js");
  execFileSync(process.execPath, [wrangler, "r2", "bucket", "info", bucket], { cwd: siteDir, stdio: "pipe" });
  const verifyDir = mkdtempSync(join(tmpdir(), "utildesk-tool-assets-"));
  try {
    for (const asset of assets) {
      const objectPath = `${bucket}/${asset.key}`;
      execFileSync(process.execPath, [wrangler, "r2", "object", "put", objectPath, "--file", asset.sourcePath, "--remote"], { cwd: siteDir, stdio: "pipe" });
      const verifyPath = join(verifyDir, basename(asset.key));
      execFileSync(process.execPath, [wrangler, "r2", "object", "get", objectPath, "--file", verifyPath, "--remote"], { cwd: siteDir, stdio: "pipe" });
      const remoteHash = createHash("sha256").update(readFileSync(verifyPath)).digest("hex");
      if (remoteHash !== asset.hash) throw new Error(`${asset.key}: uploaded R2 object failed hash verification`);
    }
    return assets.map(({ key, hash }) => ({ key, hash }));
  } finally {
    rmSync(verifyDir, { recursive: true, force: true });
  }
}

export function buildRouteStateBatch(operation, slugs, { sourceCommit, redirects = new Map() } = {}) {
  return uniqueSorted(slugs).map((slug) => {
    if (!safeSlug(slug)) throw new Error(`Unsafe tool slug: ${slug}`);
    if (operation === "redirect") {
      const target = redirects.get(slug);
      if (!safeSlug(target)) throw new Error(`${slug}: redirect target is missing or unsafe`);
      return {
        sql: `UPDATE content_entries
SET is_active = 0, route_state = 'redirect',
    canonical_path = CASE locale WHEN 'en' THEN ? ELSE ? END,
    robots_policy = ?, googlebot_policy = NULL, source_commit = ?, deleted_at = NULL,
    revision = revision + 1, synced_at = CURRENT_TIMESTAMP
WHERE kind = 'tool' AND slug = ? AND (route_state <> 'redirect' OR canonical_path <> CASE locale WHEN 'en' THEN ? ELSE ? END);`,
        params: [`/en/tools/${target}/`, `/tools/${target}/`, ROUTE_NOINDEX, sourceCommit, slug, `/en/tools/${target}/`, `/tools/${target}/`],
      };
    }
    const routeState = operation === "tombstone" ? "tombstone" : "disabled";
    return {
      sql: `UPDATE content_entries
SET is_active = 0, route_state = ?, robots_policy = ?, googlebot_policy = NULL,
    source_commit = ?, deleted_at = ${operation === "tombstone" ? "COALESCE(deleted_at, CURRENT_TIMESTAMP)" : "NULL"},
    revision = revision + 1, synced_at = CURRENT_TIMESTAMP
WHERE kind = 'tool' AND slug = ? AND (is_active <> 0 OR route_state <> ?);`,
      params: [routeState, ROUTE_NOINDEX, sourceCommit, slug, routeState],
    };
  });
}

export function parseRedirects({ slug, toSlug, redirectsFile }) {
  if (redirectsFile) {
    const value = JSON.parse(readFileSync(resolve(redirectsFile), "utf8"));
    return new Map(Object.entries(value));
  }
  return slug && toSlug ? new Map([[slug, toSlug]]) : new Map();
}

export function reconcileToolState(expectedEntries, actualRows) {
  const expected = new Map(expectedEntries.map((entry) => [`${entry.locale}:${entry.slug}`, entry]));
  const actual = new Map(actualRows.map((row) => [`${row.locale}:${row.slug}`, row]));
  const missing = [...expected.keys()].filter((key) => !actual.has(key)).sort();
  const extraActive = [...actual].filter(([key, row]) => !expected.has(key) && Number(row.is_active) === 1).map(([key]) => key).sort();
  const inactiveExpected = [...expected.keys()].filter((key) => {
    const row = actual.get(key);
    return row && (Number(row.is_active) !== 1 || row.route_state !== "active");
  }).sort();
  const hashMismatch = [...expected].filter(([key, entry]) => {
    const row = actual.get(key);
    return row && row.source_hash !== entry.sourceHash;
  }).map(([key]) => key).sort();
  const assetHashMismatch = [...expected].filter(([key, entry]) => {
    const row = actual.get(key);
    return row && (row.asset_hash ?? null) !== (entry.assetHash ?? null);
  }).map(([key]) => key).sort();
  return { ok: !missing.length && !extraActive.length && !inactiveExpected.length && !hashMismatch.length && !assetHashMismatch.length, missing, extraActive, inactiveExpected, hashMismatch, assetHashMismatch };
}

export function readRuntimeConfig(configPath, databaseName = null) {
  const resolvedPath = resolve(configPath);
  const parsed = JSON.parse(readFileSync(resolvedPath, "utf8"));
  const binding = (parsed.d1_databases ?? []).find((candidate) => !databaseName || candidate.database_name === databaseName || candidate.binding === databaseName);
  if (!binding?.database_id || !binding?.database_name) throw new Error(`D1 binding not found in ${resolvedPath}`);
  return { configPath: resolvedPath, workerName: parsed.name, databaseId: binding.database_id, databaseName: binding.database_name };
}

const apiErrors = (payload) => (payload?.errors ?? []).map((error) => `${error.code ?? "api"}: ${error.message ?? "unknown error"}`).join("; ");

export async function queryD1({ accountId, databaseId, token, sql, params = [], fetchImpl = fetch }) {
  const response = await fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params }),
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false || !payload.result?.every((result) => result.success !== false)) {
    throw new Error(`D1 query failed (${response.status}): ${apiErrors(payload) || "unspecified API error"}`);
  }
  return payload.result;
}

export async function getD1Database({ accountId, databaseId, token, fetchImpl = fetch }) {
  const response = await fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false || !payload.result) {
    throw new Error(`D1 target lookup failed (${response.status}): ${apiErrors(payload) || "unspecified API error"}`);
  }
  return payload.result;
}

export async function executeD1Batch({ accountId, databaseId, token, statements, fetchImpl = fetch }) {
  if (!statements.length) return [];
  if (statements.length > 1000) throw new Error(`D1 transaction has ${statements.length} statements; platform limit is 1000`);
  const response = await fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ batch: statements }),
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false || !payload.result?.every((result) => result.success !== false)) {
    throw new Error(`D1 batch failed (${response.status}): ${apiErrors(payload) || "transaction rolled back"}`);
  }
  return payload.result;
}

export function gitReleaseState(repoDir = RUNTIME_PATHS.REPO_DIR) {
  const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoDir, encoding: "utf8" }).trim();
  const status = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repoDir, encoding: "utf8" }).trim();
  return { commit, clean: !status, dirtyPaths: status ? status.split(/\r?\n/).map((line) => line.slice(3)) : [] };
}

export function assertProductionSafety({ production, remote, confirmation, backupPath, releaseState, databaseName }) {
  if (!production) return;
  if (!remote) throw new Error("--production requires --remote");
  if (confirmation !== PRODUCTION_CONFIRMATION) throw new Error(`--production requires --confirm ${PRODUCTION_CONFIRMATION}`);
  if (!String(databaseName).includes("production")) throw new Error(`Production flag targets non-production database ${databaseName}`);
  if (!releaseState.clean) throw new Error(`Production requires a clean release commit; dirty paths: ${releaseState.dirtyPaths.join(", ")}`);
  if (!backupPath || !existsSync(resolve(backupPath))) throw new Error("Production requires --backup pointing to a completed D1 export");
  const backup = statSync(resolve(backupPath));
  if (!String(backupPath).endsWith(".sql") || backup.size === 0) throw new Error("Production D1 backup must be a non-empty .sql export");
  const ageMs = Date.now() - backup.mtimeMs;
  if (ageMs > 24 * 60 * 60 * 1000) throw new Error("Production D1 backup is older than 24 hours");
}

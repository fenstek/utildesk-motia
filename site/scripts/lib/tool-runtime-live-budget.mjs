import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const LIVE_REQUEST_RESET_AT = "2026-07-16T00:05:00.000Z";
export const DEFAULT_MAX_LIVE_REQUESTS = 10_000;
export const HARD_MAX_LIVE_REQUESTS = 10_000;
export const MAX_PRODUCTION_CANARY_SLUGS = 24;
export const MAX_PERFORMANCE_ROUTES = 10;
export const TOOL_CATALOG_REFRESH_MAX_ATTEMPTS = 4;
const UTC_DAY_MS = 24 * 60 * 60 * 1000;

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);
const CLOUDFLARE_HOST = /(?:^|\.)(?:tools\.utildesk\.de|workers\.dev|pages\.dev)$/i;

export function isLocalUrl(value) {
  try {
    return LOCAL_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function isCloudflareFacingUrl(value) {
  try {
    return CLOUDFLARE_HOST.test(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function assertLocalOnlyUrl(value, label = "URL") {
  if (!isLocalUrl(value)) throw new Error(`${label} must use localhost or loopback; got ${value}`);
}

export function assertProductionModeArgs({ mode, argv = [], baseUrl, slugs = [], maxLiveRequests, performanceRoutes = 0, execute = false, now = new Date() }) {
  if (!mode.startsWith("production-")) return;
  if (argv.includes("--all")) throw new Error(`${mode} refuses --all; exhaustive live scans are forbidden`);
  if (!isCloudflareFacingUrl(baseUrl)) throw new Error(`${mode} requires an approved Cloudflare-facing production URL`);
  if (!Number.isInteger(maxLiveRequests) || maxLiveRequests < 1 || maxLiveRequests > HARD_MAX_LIVE_REQUESTS) {
    throw new Error(`--max-live-requests must be an integer from 1 to ${HARD_MAX_LIVE_REQUESTS}`);
  }
  if (execute && now.getTime() < Date.parse(LIVE_REQUEST_RESET_AT)) {
    throw new Error(`Live requests are blocked until ${LIVE_REQUEST_RESET_AT}`);
  }
  if (mode === "production-canary" && (slugs.length < 1 || slugs.length > MAX_PRODUCTION_CANARY_SLUGS)) {
    throw new Error(`production-canary requires 1-${MAX_PRODUCTION_CANARY_SLUGS} deterministic slugs`);
  }
  if (!Number.isInteger(performanceRoutes) || performanceRoutes < 0 || performanceRoutes > MAX_PERFORMANCE_ROUTES) {
    throw new Error(`performance routes must be 0-${MAX_PERFORMANCE_ROUTES}`);
  }
}

export function estimateProductionCanary({ slugs, performanceRoutes = 0 }) {
  if (performanceRoutes > slugs.length * 2) throw new Error("performance routes must be part of the HTML canary, not extra requests");
  return {
    html: slugs.length * 2,
    json: 0,
    markdown: 0,
    assets: 0,
    control: 0,
    indexNow: 0,
    total: slugs.length * 2,
  };
}

export function estimateProductionDelta({ slugs, assetPaths = [], includeControlRequest = false, includeIndexNow = true }) {
  const uniqueAssets = new Set(assetPaths.filter(Boolean));
  const result = {
    html: slugs.length * 2,
    json: slugs.length * 2,
    markdown: slugs.length * 2,
    assets: uniqueAssets.size,
    control: includeControlRequest ? 1 : 0,
    indexNow: includeIndexNow && slugs.length ? 1 : 0,
  };
  return { ...result, total: Object.values(result).reduce((sum, value) => sum + value, 0) };
}

export function estimateToolCatalogRefresh({ maxAttempts = TOOL_CATALOG_REFRESH_MAX_ATTEMPTS } = {}) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new Error("maxAttempts must be a positive integer");
  const d1 = 2 + maxAttempts * 3; // database/schema preflight, then two snapshots and one CAS per attempt
  const r2 = maxAttempts * 5; // each attempt verifies the bucket and round-trips both locale objects
  return { d1, r2, pagesAssets: 0, total: d1 + r2 };
}

export function estimateProductionPublish({ assets = 0, assetMode = "none", compareOnly = false, includeToolCatalogs = false }) {
  if (!Number.isInteger(assets) || assets < 0) throw new Error("assets must be a non-negative integer");
  if (compareOnly) return { d1: 1, r2: 0, pagesAssets: 0, total: 1 };
  const catalog = includeToolCatalogs ? estimateToolCatalogRefresh() : { d1: 0, r2: 0 };
  const catalogD1 = catalog.d1;
  const d1 = 4 + catalogD1; // target identity, schema, one atomic batch, post-write source-state verification
  const assetR2 = assetMode === "r2" && assets ? 1 + assets * 2 : 0; // bucket identity plus put/get per object
  const catalogR2 = catalog.r2;
  const r2 = assetR2 + catalogR2;
  const pagesAssets = assetMode === "pages-fallback" ? assets : 0;
  return { d1, r2, pagesAssets, ...(includeToolCatalogs ? { catalogD1, catalogR2 } : {}), total: d1 + r2 + pagesAssets };
}

export function emptyLiveRequestLedger() {
  return {
    version: 1,
    resetAt: LIVE_REQUEST_RESET_AT,
    hardLimit: HARD_MAX_LIVE_REQUESTS,
    policy: "Worst-case reservations are charged to the UTC calendar day of reservedAt before execution and are never reclaimed automatically; older entries remain for history.",
    entries: [],
  };
}

export function validateLiveRequestLedger(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.entries)) throw new Error("Invalid live-request ledger");
  if (Number(value.hardLimit) !== HARD_MAX_LIVE_REQUESTS) throw new Error("Live-request ledger hard limit does not match code policy");
  return value;
}

export function usedLiveRequests(ledger, now = new Date()) {
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new Error("Invalid live-request budget time");
  const instant = new Date(nowMs);
  const dayStart = Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate());
  const dayEnd = dayStart + UTC_DAY_MS;

  return ledger.entries.reduce((sum, entry, index) => {
    const reservedAt = Date.parse(entry?.reservedAt ?? "");
    if (!Number.isFinite(reservedAt)) throw new Error(`Live-request ledger entry ${index + 1} has invalid reservedAt`);
    const requests = Number(entry?.worstCaseRequests);
    if (!Number.isInteger(requests) || requests < 0) {
      throw new Error(`Live-request ledger entry ${index + 1} has invalid worstCaseRequests`);
    }
    return reservedAt >= dayStart && reservedAt < dayEnd ? sum + requests : sum;
  }, 0);
}

export async function readLiveRequestLedger(path) {
  try {
    return validateLiveRequestLedger(JSON.parse(await readFile(resolve(path), "utf8")));
  } catch (error) {
    if (error?.code === "ENOENT") return emptyLiveRequestLedger();
    throw error;
  }
}

export async function reserveLiveRequests({ ledgerPath, mode, command, estimate, urls = [], maxLiveRequests = DEFAULT_MAX_LIVE_REQUESTS, now = new Date() }) {
  if (!ledgerPath) throw new Error("A committed --ledger path is required before every live command");
  if (now.getTime() < Date.parse(LIVE_REQUEST_RESET_AT)) throw new Error(`Live requests are blocked until ${LIVE_REQUEST_RESET_AT}`);
  if (!estimate || !Number.isInteger(estimate.total) || estimate.total < 1) throw new Error("Live request estimate must be a positive integer");
  if (estimate.total > maxLiveRequests) throw new Error(`Preflight estimate ${estimate.total} exceeds --max-live-requests ${maxLiveRequests}`);

  const resolved = resolve(ledgerPath);
  const ledger = await readLiveRequestLedger(resolved);
  const used = usedLiveRequests(ledger, now);
  const effectiveLimit = Math.min(HARD_MAX_LIVE_REQUESTS, maxLiveRequests);
  if (used + estimate.total > effectiveLimit) {
    throw new Error(`Live request budget exhausted: used ${used}, requested ${estimate.total}, limit ${effectiveLimit}`);
  }
  const entry = {
    reservedAt: now.toISOString(),
    mode,
    command,
    estimate,
    worstCaseRequests: estimate.total,
    plannedUrls: urls,
    retryPolicy: "No automatic retry; one manually ledgered retry is allowed only for a genuine transient network failure.",
  };
  ledger.entries.push(entry);
  await mkdir(dirname(resolved), { recursive: true });
  const temporary = `${resolved}.tmp-${process.pid}`;
  await writeFile(temporary, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
  await rename(temporary, resolved);
  return { entry, usedBefore: used, usedAfter: used + estimate.total, remaining: effectiveLimit - used - estimate.total };
}

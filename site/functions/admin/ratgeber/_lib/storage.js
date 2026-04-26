export const INDEX_KEY = "ratgeber-review:index";
export const CANDIDATE_PREFIX = "ratgeber-review:candidates:";
export const PUBLISH_QUEUE_PREFIX = "ratgeber-review:publish-queue:";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...(init.headers || {}),
    },
  });
}

export function requireKv(env) {
  if (!env.RATGEBER_REVIEW) {
    throw new HttpError(503, "RATGEBER_REVIEW KV binding is not configured");
  }
  return env.RATGEBER_REVIEW;
}

export function normalizeJobId(raw) {
  const jobId = String(raw || "").trim();
  if (!/^[a-zA-Z0-9._-]{8,180}$/.test(jobId)) {
    throw new HttpError(400, "Invalid candidate id");
  }
  return jobId;
}

export function normalizeAssetName(raw) {
  const name = String(raw || "").trim();
  if (!/^[a-zA-Z0-9._-]{1,120}$/.test(name)) {
    throw new HttpError(400, "Invalid asset name");
  }
  return name;
}

export function candidateKey(jobId) {
  return `${CANDIDATE_PREFIX}${normalizeJobId(jobId)}:candidate.json`;
}

export function assetKey(jobId, name) {
  return `${CANDIDATE_PREFIX}${normalizeJobId(jobId)}:assets:${normalizeAssetName(name)}`;
}

export function publishQueueKey(requestId) {
  return `${PUBLISH_QUEUE_PREFIX}${normalizeAssetName(requestId)}.json`;
}

export async function readIndex(env) {
  const kv = requireKv(env);
  const index = await kv.get(INDEX_KEY, "json");
  if (!index || typeof index !== "object") {
    return { updatedAt: null, candidates: [] };
  }
  if (!Array.isArray(index.candidates)) {
    index.candidates = [];
  }
  return index;
}

export async function writeIndex(env, index) {
  const kv = requireKv(env);
  await kv.put(
    INDEX_KEY,
    JSON.stringify(
      {
        ...index,
        updatedAt: new Date().toISOString(),
        candidates: Array.isArray(index.candidates) ? index.candidates.slice(0, 250) : [],
      },
      null,
      2,
    ),
  );
}

export function isPublishedCandidate(candidate) {
  const status = String(candidate?.status || "").toLowerCase();
  const publishStatus = String(candidate?.publish?.status || "").toLowerCase();
  return status === "published" || publishStatus === "published";
}

export function isVisibleReviewCandidate(candidate) {
  const jobId = String(candidate?.jobId || "");
  return Boolean(jobId) && !jobId.startsWith("test-") && !isPublishedCandidate(candidate);
}

export async function readCandidate(env, rawJobId) {
  const kv = requireKv(env);
  const jobId = normalizeJobId(rawJobId);
  return kv.get(candidateKey(jobId), "json");
}

export async function writeCandidate(env, candidate) {
  const kv = requireKv(env);
  const jobId = normalizeJobId(candidate.jobId);
  const now = new Date().toISOString();
  const nextCandidate = {
    ...candidate,
    updatedAt: now,
  };
  await kv.put(candidateKey(jobId), JSON.stringify(nextCandidate, null, 2));
  return nextCandidate;
}

export async function updateIndexCandidate(env, candidate) {
  const index = await readIndex(env);
  const withoutCurrent = index.candidates.filter((item) => item && item.jobId !== candidate.jobId);
  const summary = {
    jobId: candidate.jobId,
    title: candidate.title || candidate.jobId,
    slug: candidate.slug || "",
    excerpt: candidate.excerpt || "",
    status: candidate.status || "review_ready",
    reviewStatus: candidate.reviewStatus || "",
    score: candidate.score ?? null,
    visualStatus: candidate.visualStatus || "",
    createdAt: candidate.createdAt || null,
    updatedAt: candidate.updatedAt || new Date().toISOString(),
    publish: candidate.publish || null,
  };
  index.candidates = isPublishedCandidate(summary) ? withoutCurrent : [summary, ...withoutCurrent];
  await writeIndex(env, index);
}

export function contentTypeForAsset(name, fallback = "application/octet-stream") {
  const lower = String(name || "").toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".html")) return "text/html; charset=utf-8";
  if (lower.endsWith(".md") || lower.endsWith(".mdx")) return "text/markdown; charset=utf-8";
  if (lower.endsWith(".json")) return "application/json; charset=utf-8";
  return fallback;
}

export async function readAsset(env, rawJobId, rawName) {
  const kv = requireKv(env);
  const jobId = normalizeJobId(rawJobId);
  const name = normalizeAssetName(rawName);
  const result = await kv.getWithMetadata(assetKey(jobId, name), "arrayBuffer");
  if (!result || !result.value) {
    return null;
  }
  return {
    body: result.value,
    contentType: result.metadata?.contentType || contentTypeForAsset(name),
  };
}

export async function listPublishRequests(env) {
  const kv = requireKv(env);
  const listed = await kv.list({ prefix: PUBLISH_QUEUE_PREFIX, limit: 1000 });
  const requests = [];
  for (const key of listed.keys) {
    const request = await kv.get(key.name, "json");
    if (request && typeof request === "object") {
      requests.push({ ...request, key: key.name });
    }
  }
  return requests.sort((a, b) => String(b.requestedAt || "").localeCompare(String(a.requestedAt || "")));
}

import {
  assetKey,
  candidateKey,
  contentTypeForAsset,
  HttpError,
  jsonResponse,
  isActiveReworkCandidate,
  normalizeAssetName,
  normalizeJobId,
  readCandidate,
  readIndex,
  requireKv,
  updateIndexCandidate,
  writeIndex,
  writeCandidate,
} from "../_lib/storage.js";

function stableForSignature(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stableForSignature(item));
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        if (["uploadedAt", "updatedAt", "publish", "uploadSignature"].includes(key)) {
          return result;
        }
        result[key] = stableForSignature(value[key]);
        return result;
      }, {});
  }
  return value;
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function uploadSignature(candidate, assets) {
  return sha256Hex(
    JSON.stringify(
      stableForSignature({
        candidate,
        assets,
      }),
    ),
  );
}

function decodeBase64(base64) {
  const binary = atob(String(base64 || ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function requireImageAsset(name, contentType) {
  const lower = String(name || "").toLowerCase();
  if (!/\.(png|jpe?g|webp)$/.test(lower)) {
    throw new HttpError(400, `Image asset must be PNG/JPEG/WebP, got ${name}`);
  }
  if (!/^image\/(png|jpeg|webp)$/.test(contentType)) {
    throw new HttpError(400, `Unsupported image content type for ${name}`);
  }
}

export async function handlePost({ env, request }) {
  try {
    const kv = requireKv(env);
    const payload = await request.json();
    if (Array.isArray(payload?.removeJobIds)) {
      const removed = [];
      for (const rawJobId of payload.removeJobIds) {
        const jobId = normalizeJobId(rawJobId);
        const candidate = await readCandidate(env, jobId);
        await kv.delete(candidateKey(jobId));
        if (candidate?.assets && typeof candidate.assets === "object") {
          for (const asset of Object.values(candidate.assets)) {
            if (asset?.name) {
              await kv.delete(assetKey(jobId, asset.name));
            }
          }
        }
        removed.push(jobId);
      }
      const index = await readIndex(env);
      index.candidates = (index.candidates || []).filter((item) => !removed.includes(item?.jobId));
      await writeIndex(env, index);
      return jsonResponse({ ok: true, removed });
    }

    const candidate = payload?.candidate && typeof payload.candidate === "object" ? payload.candidate : null;
    if (!candidate) {
      throw new HttpError(400, "candidate object is required");
    }

    const jobId = normalizeJobId(candidate.jobId);
    const existingCandidate = await readCandidate(env, jobId);
    const existingActiveRework = isActiveReworkCandidate(existingCandidate);
    const incomingPublish =
      candidate.publish && typeof candidate.publish === "object" && candidate.publish.status ? candidate.publish : null;
    const uploadedAssets = {};
    const assets = Array.isArray(payload.assets) ? payload.assets : [];
    const signature = await uploadSignature(candidate, assets);
    if (!payload.force && existingCandidate?.uploadSignature === signature) {
      return jsonResponse({
        ok: true,
        skipped: true,
        reason: "unchanged",
        jobId,
        url: `/admin/ratgeber/candidate/${encodeURIComponent(jobId)}`,
        uploadedAt: existingCandidate.uploadedAt || existingCandidate.updatedAt || null,
        uploadSignature: signature,
      });
    }

    for (const asset of assets) {
      const role = String(asset.role || "").trim();
      const name = normalizeAssetName(asset.name);
      const contentType = String(asset.contentType || contentTypeForAsset(name)).trim();
      if (role === "cover" || role === "workflow") {
        requireImageAsset(name, contentType);
      }
      const body = decodeBase64(asset.base64);
      await kv.put(assetKey(jobId, name), body, { metadata: { contentType, role } });
      if (role) {
        uploadedAssets[role] = { name, contentType };
      }
    }

    const nextCandidate = await writeCandidate(env, {
      ...candidate,
      jobId,
      publish: incomingPublish || existingCandidate?.publish || null,
      rework: existingActiveRework ? existingCandidate.rework : candidate.rework || existingCandidate?.rework || null,
      assets: {
        ...(candidate.assets || {}),
        ...uploadedAssets,
      },
      status: existingActiveRework ? "rework_requested" : candidate.status || "review_ready",
      uploadSignature: signature,
      uploadedAt: new Date().toISOString(),
    });
    await updateIndexCandidate(env, nextCandidate);

    return jsonResponse({
      ok: true,
      jobId,
      url: `/admin/ratgeber/candidate/${encodeURIComponent(jobId)}`,
      assets: uploadedAssets,
      uploadedAt: nextCandidate.uploadedAt,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse({ ok: false, error: error.message }, { status: error.status });
    }
    return jsonResponse({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") {
    return handlePost(context);
  }
  return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
}

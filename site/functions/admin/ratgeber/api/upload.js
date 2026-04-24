import {
  assetKey,
  contentTypeForAsset,
  HttpError,
  jsonResponse,
  normalizeAssetName,
  normalizeJobId,
  requireKv,
  updateIndexCandidate,
  writeCandidate,
} from "../_lib/storage.js";

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

export async function onRequestPost({ env, request }) {
  try {
    const kv = requireKv(env);
    const payload = await request.json();
    const candidate = payload?.candidate && typeof payload.candidate === "object" ? payload.candidate : null;
    if (!candidate) {
      throw new HttpError(400, "candidate object is required");
    }

    const jobId = normalizeJobId(candidate.jobId);
    const uploadedAssets = {};
    const assets = Array.isArray(payload.assets) ? payload.assets : [];
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
      assets: {
        ...(candidate.assets || {}),
        ...uploadedAssets,
      },
      status: candidate.status || "review_ready",
      uploadedAt: new Date().toISOString(),
    });
    await updateIndexCandidate(env, nextCandidate);

    return jsonResponse({
      ok: true,
      jobId,
      url: `/admin/ratgeber/candidate/${encodeURIComponent(jobId)}`,
      assets: uploadedAssets,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse({ ok: false, error: error.message }, { status: error.status });
    }
    return jsonResponse({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
}

export function onRequest() {
  return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
}

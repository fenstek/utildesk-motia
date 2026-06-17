import {
  assetKey,
  candidateKey,
  HttpError,
  jsonResponse,
  normalizeJobId,
  readCandidate,
  readIndex,
  requireKv,
  writeIndex,
} from "../_lib/storage.js";

async function readJobId(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    const payload = await request.json();
    return payload.jobId;
  }
  const form = await request.formData();
  return form.get("jobId");
}

async function handlePost({ env, request }) {
  try {
    const kv = requireKv(env);
    const jobId = normalizeJobId(await readJobId(request));
    const candidate = await readCandidate(env, jobId);
    await kv.delete(candidateKey(jobId));
    if (candidate?.assets && typeof candidate.assets === "object") {
      for (const asset of Object.values(candidate.assets)) {
        if (asset?.name) {
          await kv.delete(assetKey(jobId, asset.name));
        }
      }
    }

    const index = await readIndex(env);
    index.candidates = (index.candidates || []).filter((item) => item?.jobId !== jobId);
    await writeIndex(env, index);
    return jsonResponse({ ok: true, jobId });
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

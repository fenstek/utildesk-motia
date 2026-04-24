import {
  HttpError,
  jsonResponse,
  listPublishRequests,
  publishQueueKey,
  readCandidate,
  requireKv,
  updateIndexCandidate,
  writeCandidate,
} from "../_lib/storage.js";

export async function onRequestGet({ env }) {
  try {
    const requests = await listPublishRequests(env);
    return jsonResponse({
      ok: true,
      requests: requests.filter((request) => request.status === "pending"),
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
}

export async function onRequestPost({ env, request }) {
  try {
    const kv = requireKv(env);
    const payload = await request.json();
    const requestId = String(payload.requestId || "").trim();
    const status = String(payload.status || "").trim();
    if (!requestId || !/^(publishing|published|failed|cancelled)$/.test(status)) {
      throw new HttpError(400, "requestId and valid status are required");
    }

    const requestKey = publishQueueKey(requestId);
    const publishRequest = await kv.get(requestKey, "json");
    if (!publishRequest) {
      throw new HttpError(404, "Publish request not found");
    }

    const updatedRequest = {
      ...publishRequest,
      status,
      message: payload.message || "",
      publishedUrl: payload.publishedUrl || publishRequest.publishedUrl || "",
      updatedAt: new Date().toISOString(),
    };
    await kv.put(requestKey, JSON.stringify(updatedRequest, null, 2));

    const candidate = await readCandidate(env, publishRequest.jobId);
    if (candidate) {
      const nextCandidate = await writeCandidate(env, {
        ...candidate,
        publish: {
          ...(candidate.publish || {}),
          status,
          requestId,
          message: updatedRequest.message,
          publishedUrl: updatedRequest.publishedUrl,
          updatedAt: updatedRequest.updatedAt,
        },
      });
      await updateIndexCandidate(env, nextCandidate);
    }

    return jsonResponse({ ok: true, request: updatedRequest });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse({ ok: false, error: error.message }, { status: error.status });
    }
    return jsonResponse({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
}

import {
  HttpError,
  jsonResponse,
  listReworkRequests,
  readCandidate,
  requireKv,
  reworkQueueKey,
  updateIndexCandidate,
  writeCandidate,
} from "../_lib/storage.js";

export async function onRequestGet({ env }) {
  try {
    const requests = await listReworkRequests(env);
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
    if (!requestId || !/^(processing|completed|failed|cancelled)$/.test(status)) {
      throw new HttpError(400, "requestId and valid status are required");
    }

    const requestKey = reworkQueueKey(requestId);
    const reworkRequest = await kv.get(requestKey, "json");
    if (!reworkRequest) {
      throw new HttpError(404, "Rework request not found");
    }

    const updatedRequest = {
      ...reworkRequest,
      status,
      message: payload.message || "",
      updatedAt: new Date().toISOString(),
    };
    await kv.put(requestKey, JSON.stringify(updatedRequest, null, 2));

    const candidate = await readCandidate(env, reworkRequest.jobId);
    if (candidate) {
      const nextCandidate = await writeCandidate(env, {
        ...candidate,
        status: status === "completed" ? "review_ready" : "rework_requested",
        rework: {
          ...(candidate.rework || {}),
          status,
          requestId,
          message: updatedRequest.message,
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

import {
  HttpError,
  jsonResponse,
  publishQueueKey,
  readCandidate,
  requireKv,
  updateIndexCandidate,
  writeCandidate,
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

export async function onRequestPost({ env, request }) {
  try {
    const kv = requireKv(env);
    const jobId = String(await readJobId(request) || "").trim();
    const candidate = await readCandidate(env, jobId);
    if (!candidate) {
      throw new HttpError(404, "Candidate not found");
    }

    const timestamp = new Date().toISOString();
    const requestId = `${Date.now()}-${candidate.jobId}`;
    const publishRequest = {
      id: requestId,
      jobId: candidate.jobId,
      title: candidate.title || candidate.jobId,
      slug: candidate.slug || "",
      status: "pending",
      requestedAt: timestamp,
    };
    await kv.put(publishQueueKey(requestId), JSON.stringify(publishRequest, null, 2));
    const nextCandidate = await writeCandidate(env, {
      ...candidate,
      publish: {
        status: "pending",
        requestedAt: timestamp,
        requestId,
      },
    });
    await updateIndexCandidate(env, nextCandidate);

    const acceptsHtml = (request.headers.get("Accept") || "").includes("text/html");
    if (acceptsHtml) {
      return Response.redirect(new URL(`/admin/ratgeber/candidate/${encodeURIComponent(candidate.jobId)}?publish=queued`, request.url), 303);
    }
    return jsonResponse({ ok: true, request: publishRequest });
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

import {
  HttpError,
  jsonResponse,
  readCandidate,
  requireKv,
  reworkQueueKey,
  updateIndexCandidate,
  writeCandidate,
} from "../_lib/storage.js";

async function readPayload(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }
  const form = await request.formData();
  return {
    jobId: form.get("jobId"),
    notes: form.get("notes"),
    scope: form.getAll("scope"),
  };
}

function cleanNotes(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, 2000);
}

function normalizeScope(value) {
  const raw = Array.isArray(value) ? value : [value];
  const allowed = new Set(["text", "visual"]);
  const scope = raw.map((item) => String(item || "").trim()).filter((item) => allowed.has(item));
  return scope.length ? [...new Set(scope)] : ["text", "visual"];
}

export async function handlePost({ env, request }) {
  try {
    const kv = requireKv(env);
    const payload = await readPayload(request);
    const jobId = String(payload.jobId || "").trim();
    const candidate = await readCandidate(env, jobId);
    if (!candidate) {
      throw new HttpError(404, "Candidate not found");
    }

    const timestamp = new Date().toISOString();
    const requestId = `${Date.now()}-${candidate.jobId}`;
    const reworkRequest = {
      id: requestId,
      jobId: candidate.jobId,
      title: candidate.title || candidate.jobId,
      slug: candidate.slug || "",
      status: "pending",
      scope: normalizeScope(payload.scope),
      notes: cleanNotes(payload.notes),
      requestedAt: timestamp,
    };

    await kv.put(reworkQueueKey(requestId), JSON.stringify(reworkRequest, null, 2));
    const nextCandidate = await writeCandidate(env, {
      ...candidate,
      status: "rework_requested",
      rework: {
        status: "pending",
        scope: reworkRequest.scope,
        notes: reworkRequest.notes,
        requestedAt: timestamp,
        requestId,
      },
    });
    await updateIndexCandidate(env, nextCandidate);

    const acceptsHtml = (request.headers.get("Accept") || "").includes("text/html");
    if (acceptsHtml) {
      return Response.redirect(
        new URL(`/admin/ratgeber/candidate/${encodeURIComponent(candidate.jobId)}?rework=queued`, request.url).toString(),
        303,
      );
    }
    return jsonResponse({ ok: true, request: reworkRequest });
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

import { escapeHtml, pageShell, renderFinalArticle } from "../_lib/html.js";
import { readCandidate } from "../_lib/storage.js";

export async function onRequest({ env, params, request }) {
  const candidate = await readCandidate(env, params.jobId);
  if (!candidate) {
    return new Response("Candidate not found", { status: 404 });
  }

  const url = new URL(request.url);
  const queued = url.searchParams.get("publish") === "queued";
  const publishNotice = queued
    ? `<div class="review-action-panel"><strong>Publikation ist in der Queue.</strong><span>Der VPS-Publisher kann diesen Auftrag abholen und sicher in das Repository importieren.</span></div>`
    : "";

  const actions = `<section class="review-action-panel">
    <div>
      <p>Candidate ID</p>
      <strong>${escapeHtml(candidate.jobId)}</strong>
    </div>
    <form method="post" action="/admin/ratgeber/api/publish" onsubmit="return confirm('Diese Story in die Publikations-Queue stellen?');">
      <input type="hidden" name="jobId" value="${escapeHtml(candidate.jobId)}">
      <button class="button" type="submit">Publizieren</button>
    </form>
  </section>`;

  return new Response(
    pageShell(candidate.title || candidate.jobId, `${publishNotice}${actions}${renderFinalArticle(candidate)}`, { wide: true }),
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

import { pageShell, renderFinalArticle, escapeHtml } from "../_lib/html.js";
import { readCandidate } from "../_lib/storage.js";

export async function onRequest({ env, params, request }) {
  const candidate = await readCandidate(env, params.jobId);
  if (!candidate) {
    return new Response("Candidate not found", { status: 404 });
  }

  const url = new URL(request.url);
  const queued = url.searchParams.get("publish") === "queued";
  const publishNotice = queued
    ? `<div class="hero-panel" style="border-color: rgba(13,91,83,.28);"><strong>Публикация поставлена в очередь.</strong> VPS-публикатор сможет забрать этот запрос и выполнить безопасный импорт в репозиторий.</div>`
    : "";

  const actions = `<section class="hero-panel" style="display:flex;justify-content:space-between;gap:18px;align-items:center;flex-wrap:wrap;">
    <div>
      <p style="margin:0 0 6px;color:var(--muted);">Candidate ID</p>
      <strong>${escapeHtml(candidate.jobId)}</strong>
    </div>
    <form method="post" action="/admin/ratgeber/api/publish" onsubmit="return confirm('Поставить эту статью в очередь публикации?');">
      <input type="hidden" name="jobId" value="${escapeHtml(candidate.jobId)}">
      <button class="button" type="submit">Publizieren</button>
    </form>
  </section>`;

  return new Response(pageShell(candidate.title || candidate.jobId, `${publishNotice}${actions}${renderFinalArticle(candidate)}`, { wide: true }), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

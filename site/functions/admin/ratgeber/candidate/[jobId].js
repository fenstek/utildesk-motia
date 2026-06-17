import { escapeHtml, pageShell, renderFinalArticle } from "../_lib/html.js";
import { isActiveReworkCandidate, readCandidate } from "../_lib/storage.js";

export async function onRequest({ env, params, request }) {
  const candidate = await readCandidate(env, params.jobId);
  if (!candidate) {
    return new Response("Candidate not found", { status: 404 });
  }

  const url = new URL(request.url);
  const queued = url.searchParams.get("publish") === "queued";
  const reworkQueued = url.searchParams.get("rework") === "queued";
  const activeRework = isActiveReworkCandidate(candidate);
  const reworkStatus = candidate.rework?.status || (activeRework ? "pending" : "");
  const publishNotice = queued
    ? `<div class="review-action-panel"><strong>Publikation ist in der Queue.</strong><span>Der VPS-Publisher kann diesen Auftrag abholen und sicher in das Repository importieren.</span></div>`
    : "";
  const reworkNotice = reworkQueued
    ? `<div class="review-action-panel"><strong>Ueberarbeitung ist in der Queue.</strong><span>Der VPS-Workflow poliert Text und Bilder und laedt danach eine neue finale Vorschau hoch.</span></div>`
    : "";
  const activeReworkNotice = activeRework
    ? `<div class="review-action-panel"><strong>Ueberarbeitung laeuft: ${escapeHtml(reworkStatus)}</strong><span>Diese alte Vorschau ist bis zum Abschluss gesperrt. Danach erscheint die neue finale Vorschau wieder in der Kandidatenliste.</span></div>`
    : "";

  const actions = `<section class="review-action-panel">
    <div>
      <p>Candidate ID</p>
      <strong>${escapeHtml(candidate.jobId)}</strong>
    </div>
    ${activeRework ? `<a class="button button--ghost" href="/admin/ratgeber">Zur Kandidatenliste</a>` : `<form method="post" action="/admin/ratgeber/api/publish" onsubmit="return confirm('Diese Story in die Publikations-Queue stellen?');">
      <input type="hidden" name="jobId" value="${escapeHtml(candidate.jobId)}">
      <button class="button" type="submit">Publizieren</button>
    </form>`}
  </section>`;

  const reworkActions = activeRework ? "" : `<section class="review-action-panel review-action-panel--stacked">
    <div>
      <p>Zur Ueberarbeitung schicken</p>
      <strong>Textpolitur und visuelle Politur werden gemeinsam angestossen.</strong>
    </div>
    <form class="review-rework-form" method="post" action="/admin/ratgeber/api/rework" onsubmit="return confirm('Diese Story fuer Text- und Bildpolitur zurueck in die Werkstatt schicken?');">
      <input type="hidden" name="jobId" value="${escapeHtml(candidate.jobId)}">
      <input type="hidden" name="scope" value="text">
      <input type="hidden" name="scope" value="visual">
      <label class="review-rework-label" for="rework-notes">Was soll besser werden?</label>
      <textarea id="rework-notes" name="notes" rows="4" placeholder="Beispiel: Einstieg menschlicher, weniger PR-Ton, zweite Illustration konkreter und weniger generisch."></textarea>
      <button class="button button--ghost" type="submit">Text + Bilder ueberarbeiten</button>
    </form>
  </section>`;

  return new Response(
    pageShell(candidate.title || candidate.jobId, `${publishNotice}${reworkNotice}${activeReworkNotice}${actions}${reworkActions}${renderFinalArticle(candidate)}`, { wide: true }),
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

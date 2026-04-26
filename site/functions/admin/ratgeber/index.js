import { pageShell, renderCandidateCard } from "./_lib/html.js";
import { isPublishedCandidate, isVisibleReviewCandidate, readIndex, writeIndex } from "./_lib/storage.js";

export async function onRequest({ env }) {
  const index = await readIndex(env);
  const allCandidates = Array.isArray(index.candidates) ? index.candidates : [];
  const candidates = allCandidates.filter(isVisibleReviewCandidate);
  const hiddenPublishedCount = allCandidates.filter(isPublishedCandidate).length;
  if (candidates.length !== allCandidates.length) {
    await writeIndex(env, { ...index, candidates });
  }
  const cards = candidates.length
    ? `<div class="grid">${candidates.map(renderCandidateCard).join("")}</div>`
    : `<div class="empty">Im geschlossenen Cloudflare-Speicher liegt gerade kein offener Kandidat. Veroeffentlichte Artikel werden automatisch ausgeblendet, neue review-ready Artefakte kann der VPS-Sync hierher hochladen.</div>`;
  const cleanupNote = hiddenPublishedCount
    ? `<div class="empty">Aufgeraeumt: ${hiddenPublishedCount} bereits veroeffentlichte ${hiddenPublishedCount === 1 ? "Story wurde" : "Storys wurden"} aus dieser Review-Liste entfernt.</div>`
    : "";

  const body = `<section class="hero-panel">
    <h1>Ratgeber Kandidaten</h1>
    <p>Geschlossene Review-Paneele fuer die finale Kontrolle vor der Publikation. Bereits veroeffentlichte Artikel verschwinden automatisch aus dieser Liste, damit hier nur echte offene Kandidaten bleiben.</p>
  </section>${cleanupNote}${cards}`;

  return new Response(pageShell("Kandidaten", body), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

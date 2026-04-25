import { pageShell, renderCandidateCard } from "./_lib/html.js";
import { readIndex } from "./_lib/storage.js";

export async function onRequest({ env }) {
  const index = await readIndex(env);
  const candidates = (Array.isArray(index.candidates) ? index.candidates : [])
    .filter((candidate) => !String(candidate?.jobId || "").startsWith("test-"));
  const cards = candidates.length
    ? `<div class="grid">${candidates.map(renderCandidateCard).join("")}</div>`
    : `<div class="empty">Im geschlossenen Cloudflare-Speicher liegt noch kein Kandidat. Der VPS-Sync kann review-ready Artefakte automatisch hierher hochladen.</div>`;

  const body = `<section class="hero-panel">
    <h1>Ratgeber Kandidaten</h1>
    <p>Geschlossene Review-Paneele fuer die finale Kontrolle vor der Publikation. Die Detailseiten verwenden dieselbe visuelle Sprache wie der aktuelle Utildesk-Ratgeber: terminal editorial layout, PNG-Illustrationen, Lightbox und manueller Publish-Gate.</p>
  </section>${cards}`;

  return new Response(pageShell("Kandidaten", body), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

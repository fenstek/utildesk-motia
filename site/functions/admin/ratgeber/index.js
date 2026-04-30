import { pageShell, renderCandidateCard } from "./_lib/html.js";
import { isActiveReworkCandidate, isPublishedCandidate, isVisibleReviewCandidate, readIndex, writeIndex } from "./_lib/storage.js";

function normalizeComparable(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeSlug(value) {
  return normalizeComparable(value).replaceAll(" ", "-");
}

function candidateSlugHints(candidate) {
  const hints = new Set();
  for (const value of [candidate?.slug, candidate?.meta?.slug, candidate?.jobId]) {
    const normalized = normalizeSlug(value);
    if (normalized) {
      hints.add(normalized);
    }
  }
  const jobId = String(candidate?.jobId || "");
  const withoutDate = jobId.replace(/^\d{8}-/, "");
  const withoutSuffix = withoutDate.replace(
    /-(?:workflow-article|workflow_article|how-to|how_to|tool-spotlight|article|guide)-[a-f0-9]{6,}$/i,
    "",
  );
  const jobSlug = normalizeSlug(withoutSuffix);
  if (jobSlug) {
    hints.add(jobSlug);
  }
  return hints;
}

async function readPublishedManifest(request) {
  try {
    const manifestUrl = new URL("/data/ratgeber-published.json", request.url);
    const response = await fetch(manifestUrl.toString(), {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 60, cacheEverything: true },
    });
    if (!response.ok) {
      return { slugSet: new Set(), titleSet: new Set() };
    }
    const manifest = await response.json();
    const items = Array.isArray(manifest?.items) ? manifest.items : [];
    return {
      slugSet: new Set(items.map((item) => normalizeSlug(item.slug)).filter(Boolean)),
      titleSet: new Set(items.map((item) => normalizeComparable(item.title)).filter(Boolean)),
    };
  } catch {
    return { slugSet: new Set(), titleSet: new Set() };
  }
}

function isAlreadyLiveCandidate(candidate, manifest) {
  if (isPublishedCandidate(candidate)) {
    return true;
  }
  const title = normalizeComparable(candidate?.title);
  if (title && manifest.titleSet.has(title)) {
    return true;
  }
  for (const hint of candidateSlugHints(candidate)) {
    if (manifest.slugSet.has(hint)) {
      return true;
    }
  }
  return false;
}

export async function onRequest({ env, request }) {
  const url = new URL(request.url);
  const index = await readIndex(env);
  const publishedManifest = await readPublishedManifest(request);
  const allCandidates = Array.isArray(index.candidates) ? index.candidates : [];
  const publishedCandidates = allCandidates.filter((candidate) =>
    isPublishedCandidate(candidate) || isAlreadyLiveCandidate(candidate, publishedManifest)
  );
  const activeReworkCount = allCandidates.filter((candidate) =>
    isActiveReworkCandidate(candidate) && !publishedCandidates.some((item) => item?.jobId === candidate?.jobId)
  ).length;
  const cleanCandidates = allCandidates.filter((candidate) =>
    !publishedCandidates.some((item) => item?.jobId === candidate?.jobId)
  );
  const candidates = cleanCandidates.filter((candidate) => isVisibleReviewCandidate(candidate));
  const hiddenPublishedCount = publishedCandidates.length;
  if (cleanCandidates.length !== allCandidates.length) {
    await writeIndex(env, { ...index, candidates: cleanCandidates });
  }
  const cards = candidates.length
    ? `<div class="grid">${candidates.map(renderCandidateCard).join("")}</div>`
    : `<div class="empty">Im geschlossenen Cloudflare-Speicher liegt gerade kein offener Kandidat. Veroeffentlichte Artikel werden automatisch ausgeblendet, neue review-ready Artefakte kann der VPS-Sync hierher hochladen.</div>`;
  const cleanupNote = hiddenPublishedCount
    ? `<div class="empty">Aufgeraeumt: ${hiddenPublishedCount} bereits veroeffentlichte ${hiddenPublishedCount === 1 ? "Story wurde" : "Storys wurden"} aus dieser Review-Liste entfernt.</div>`
    : "";
  const reworkNote = activeReworkCount
    ? `<div class="empty">In Ueberarbeitung: ${activeReworkCount} ${activeReworkCount === 1 ? "Story wird" : "Storys werden"} gerade ausserhalb der Publikationsliste poliert und erscheinen nach der frischen Vorschau wieder hier.</div>`
    : "";
  const queuedNote = url.searchParams.get("rework") === "queued"
    ? `<div class="empty">Ueberarbeitung angenommen: Die Story wurde aus der Publikationsliste genommen, bis Text und Bilder frisch poliert sind.</div>`
    : "";

  const body = `<section class="hero-panel">
    <h1>Ratgeber Kandidaten</h1>
    <p>Geschlossene Review-Paneele fuer die finale Kontrolle vor der Publikation. Bereits veroeffentlichte Artikel verschwinden automatisch aus dieser Liste, damit hier nur echte offene Kandidaten bleiben.</p>
  </section>${queuedNote}${cleanupNote}${reworkNote}${cards}`;

  return new Response(pageShell("Kandidaten", body), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

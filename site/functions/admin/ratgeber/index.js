import { pageShell, renderCandidateCard } from "./_lib/html.js";
import { readIndex } from "./_lib/storage.js";

export async function onRequest({ env }) {
  const index = await readIndex(env);
  const candidates = (Array.isArray(index.candidates) ? index.candidates : [])
    .filter((candidate) => !String(candidate?.jobId || "").startsWith("test-"));
  const cards = candidates.length
    ? `<div class="grid">${candidates.map(renderCandidateCard).join("")}</div>`
    : `<div class="empty">Пока в закрытое Cloudflare-хранилище не загружен ни один кандидат. Следующий шаг: VPS-синхронизатор отправит review-ready артефакты сюда автоматически.</div>`;

  const body = `<section class="hero-panel">
    <h1>Ratgeber Kandidaten</h1>
    <p>Закрытая панель для финальной проверки статей перед публикацией. Здесь должны лежать уже не полуфабрикаты, а финальный вид статьи с PNG-иллюстрациями и кнопкой публикации.</p>
  </section>${cards}`;

  return new Response(pageShell("Kandidaten", body), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

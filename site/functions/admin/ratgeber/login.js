import { sessionCookie, timingSafeEqual } from "./_lib/auth.js";
import { escapeHtml, pageShell } from "./_lib/html.js";

function loginPage(request, error = "") {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/admin/ratgeber/";
  const message = error
    ? `<div class="empty" style="border-color: color-mix(in srgb, var(--err) 38%, var(--line)); color: var(--err);">${escapeHtml(error)}</div>`
    : "";
  const body = `<section class="hero-panel" style="max-width: 680px; margin: 54px auto;">
    <h1>Login</h1>
    <p>Geschlossene Pruefung der Ratgeber-Kandidaten. Passwort einmal eingeben, danach arbeitet der Browser ueber ein sicheres Cookie.</p>
    ${message}
    <form method="post" action="/admin/ratgeber/login" style="display: grid; gap: 14px; margin-top: 24px;">
      <input type="hidden" name="next" value="${escapeHtml(next)}">
      <label style="display: grid; gap: 8px; font-weight: 850;">
        Passwort
        <input name="password" type="password" autocomplete="current-password" autofocus style="width: 100%; border: 1px solid var(--line); background: var(--bg-2); color: var(--fg); padding: 14px 16px; font: inherit;">
      </label>
      <button class="button" type="submit">Einloggen</button>
    </form>
  </section>`;
  return new Response(pageShell("Login", body), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function handleGet({ request }) {
  return loginPage(request);
}

async function handlePost({ request, env }) {
  const form = await request.formData();
  const password = String(form.get("password") || "");
  const expected = env.RATGEBER_REVIEW_PASSWORD || "";
  if (!expected || !timingSafeEqual(password, expected)) {
    return loginPage(request, "Passwort passt nicht.");
  }

  const next = String(form.get("next") || "/admin/ratgeber/");
  const target = next.startsWith("/admin/ratgeber/") ? next : "/admin/ratgeber/";
  return new Response(null, {
    status: 303,
    headers: {
      "Location": target,
      "Set-Cookie": await sessionCookie(env),
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export function onRequest(context) {
  if (context.request.method === "GET") {
    return handleGet(context);
  }
  if (context.request.method === "POST") {
    return handlePost(context);
  }
  return new Response("Method not allowed", { status: 405 });
}

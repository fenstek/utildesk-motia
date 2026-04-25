import { sessionCookie, timingSafeEqual } from "./_lib/auth.js";
import { escapeHtml, pageShell } from "./_lib/html.js";

function loginPage(request, error = "") {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/admin/ratgeber/";
  const message = error
    ? `<div class="empty" style="border-color: rgba(180, 64, 42, .32); color: #8f2f1f;">${escapeHtml(error)}</div>`
    : "";
  const body = `<section class="hero-panel" style="max-width: 680px; margin: 54px auto;">
    <h1>Login</h1>
    <p>Закрытая проверка Ratgeber-кандидатов. Вводишь пароль один раз, дальше браузер работает через безопасный cookie без Basic Auth retry-ада.</p>
    ${message}
    <form method="post" action="/admin/ratgeber/login" style="display: grid; gap: 14px; margin-top: 24px;">
      <input type="hidden" name="next" value="${escapeHtml(next)}">
      <label style="display: grid; gap: 8px; font-weight: 850;">
        Passwort
        <input name="password" type="password" autocomplete="current-password" autofocus style="width: 100%; border: 1px solid var(--line); border-radius: 18px; padding: 14px 16px; font: inherit;">
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
    return loginPage(request, "Пароль не подошёл.");
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

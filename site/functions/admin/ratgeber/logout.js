import { clearSessionCookie } from "./_lib/auth.js";

export function onRequest() {
  return new Response(null, {
    status: 303,
    headers: {
      "Location": "/admin/ratgeber/login",
      "Set-Cookie": clearSessionCookie(),
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

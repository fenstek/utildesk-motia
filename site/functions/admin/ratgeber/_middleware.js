import {
  forbiddenOriginResponse,
  hasTrustedOrigin,
  hasValidBasicAuth,
  hasValidSessionCookie,
  hasValidUploadToken,
  isStateChangingRequest,
  withSecurityHeaders,
} from "./_lib/auth.js";

function redirectToLogin(request) {
  const url = new URL(request.url);
  const loginUrl = new URL("/admin/ratgeber/login", url.origin);
  loginUrl.searchParams.set("next", `${url.pathname}${url.search}`);
  return withSecurityHeaders(Response.redirect(loginUrl.toString(), 302));
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const isMachineEndpoint = url.pathname.startsWith("/admin/ratgeber/api/upload") ||
    url.pathname.startsWith("/admin/ratgeber/api/publish-queue") ||
    url.pathname.startsWith("/admin/ratgeber/api/rework-queue");

  if (isMachineEndpoint && hasValidUploadToken(request, env)) {
    const response = await context.next();
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return withSecurityHeaders(response);
  }

  if (isStateChangingRequest(request) && !isMachineEndpoint && !hasTrustedOrigin(request)) {
    return forbiddenOriginResponse();
  }

  if (url.pathname === "/admin/ratgeber/login" || url.pathname === "/admin/ratgeber/logout") {
    const response = await context.next();
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return withSecurityHeaders(response);
  }

  if (!await hasValidSessionCookie(request, env) && !hasValidBasicAuth(request, env)) {
    if (url.pathname.startsWith("/admin/ratgeber/api/")) {
      return withSecurityHeaders(new Response("Authentication required", {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      }));
    }
    return redirectToLogin(request);
  }

  const response = await context.next();
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return withSecurityHeaders(response);
}

function unauthorized(message = "Authentication required") {
  return new Response(message, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Utildesk Ratgeber Review", charset="UTF-8"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function timingSafeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (!left || !right || left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function parseBasicAuth(header) {
  if (!header || !header.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = atob(header.slice("Basic ".length).trim());
    const splitAt = decoded.indexOf(":");
    if (splitAt < 0) {
      return null;
    }
    return {
      user: decoded.slice(0, splitAt),
      password: decoded.slice(splitAt + 1),
    };
  } catch {
    return null;
  }
}

function hasValidBasicAuth(request, env) {
  const expectedUser = env.RATGEBER_REVIEW_USER || "admin";
  const expectedPassword = env.RATGEBER_REVIEW_PASSWORD;
  if (!expectedPassword) {
    return false;
  }

  const auth = parseBasicAuth(request.headers.get("Authorization"));
  return Boolean(
    auth &&
      timingSafeEqual(auth.user, expectedUser) &&
      timingSafeEqual(auth.password, expectedPassword),
  );
}

function hasValidUploadToken(request, env) {
  const expectedToken = env.RATGEBER_UPLOAD_TOKEN;
  const header = request.headers.get("Authorization") || "";
  const actualToken = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  return Boolean(expectedToken && timingSafeEqual(actualToken, expectedToken));
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const isMachineEndpoint = url.pathname.startsWith("/admin/ratgeber/api/upload") ||
    url.pathname.startsWith("/admin/ratgeber/api/publish-queue");

  if (isMachineEndpoint && hasValidUploadToken(request, env)) {
    const response = await context.next();
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (!hasValidBasicAuth(request, env)) {
    return unauthorized();
  }

  const response = await context.next();
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

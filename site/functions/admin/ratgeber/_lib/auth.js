export const REVIEW_COOKIE = "utildesk_ratgeber_review";
const LOGIN_ATTEMPT_PREFIX = "ratgeber-review:login-attempts:";
const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_BLOCK_SECONDS = 15 * 60;
const LOGIN_MAX_FAILED_ATTEMPTS = 8;

export function timingSafeEqual(a, b) {
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

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value) {
  const encoder = new TextEncoder();
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(String(value || ""))));
}

export async function sessionToken(env) {
  const password = env.RATGEBER_REVIEW_PASSWORD || "";
  if (!password) {
    return "";
  }

  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`utildesk-ratgeber-review-v1:${password}`),
  );
  return toHex(digest);
}

export function parseCookies(request) {
  const result = {};
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) {
      continue;
    }
    result[rawKey] = decodeURIComponent(rawValue.join("=") || "");
  }
  return result;
}

export async function hasValidSessionCookie(request, env) {
  const expected = await sessionToken(env);
  const actual = parseCookies(request)[REVIEW_COOKIE];
  return Boolean(expected && timingSafeEqual(actual, expected));
}

export function parseBasicAuth(header) {
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

export function hasValidBasicAuth(request, env) {
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

export function hasValidUploadToken(request, env) {
  const expectedToken = env.RATGEBER_UPLOAD_TOKEN;
  const header = request.headers.get("Authorization") || "";
  const actualToken = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  return Boolean(expectedToken && timingSafeEqual(actualToken, expectedToken));
}

export function isStateChangingRequest(request) {
  const method = String(request.method || "GET").toUpperCase();
  return !["GET", "HEAD", "OPTIONS"].includes(method);
}

export function hasTrustedOrigin(request) {
  if (!isStateChangingRequest(request)) {
    return true;
  }

  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("Origin");
  if (origin) {
    return timingSafeEqual(origin, expectedOrigin);
  }

  const referer = request.headers.get("Referer");
  if (!referer) {
    // Some non-browser clients omit both headers. Auth still applies, but browsers
    // with cross-site forms will send at least one of them.
    return true;
  }

  try {
    return timingSafeEqual(new URL(referer).origin, expectedOrigin);
  } catch {
    return false;
  }
}

export function forbiddenOriginResponse() {
  return new Response("Forbidden origin", {
    status: 403,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function getClientIp(request) {
  const forwarded = request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "";
  return forwarded.split(",")[0].trim() || "unknown";
}

async function loginAttemptKey(request) {
  return `${LOGIN_ATTEMPT_PREFIX}${await sha256Hex(getClientIp(request))}`;
}

export async function getLoginThrottle(env, request) {
  const kv = env.RATGEBER_REVIEW;
  if (!kv) {
    return { blocked: false };
  }

  const key = await loginAttemptKey(request);
  const record = await kv.get(key, "json");
  const now = Date.now();
  const blockedUntil = Number(record?.blockedUntil || 0);
  if (blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((blockedUntil - now) / 1000)),
    };
  }

  return { blocked: false, key, record };
}

export async function recordFailedLogin(env, request) {
  const kv = env.RATGEBER_REVIEW;
  if (!kv) {
    return;
  }

  const key = await loginAttemptKey(request);
  const now = Date.now();
  const current = await kv.get(key, "json");
  const windowStartedAt = Number(current?.windowStartedAt || 0);
  const inWindow = windowStartedAt && now - windowStartedAt < LOGIN_WINDOW_SECONDS * 1000;
  const failedCount = (inWindow ? Number(current?.failedCount || 0) : 0) + 1;
  const blockedUntil = failedCount >= LOGIN_MAX_FAILED_ATTEMPTS
    ? now + LOGIN_BLOCK_SECONDS * 1000
    : 0;

  await kv.put(
    key,
    JSON.stringify({
      failedCount,
      windowStartedAt: inWindow ? windowStartedAt : now,
      blockedUntil,
      updatedAt: new Date(now).toISOString(),
    }),
    { expirationTtl: LOGIN_WINDOW_SECONDS + LOGIN_BLOCK_SECONDS },
  );
}

export async function clearLoginAttempts(env, request) {
  const kv = env.RATGEBER_REVIEW;
  if (!kv) {
    return;
  }
  await kv.delete(await loginAttemptKey(request));
}

export async function sessionCookie(env) {
  const token = await sessionToken(env);
  return `${REVIEW_COOKIE}=${encodeURIComponent(token)}; Path=/admin/ratgeber; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`;
}

export function clearSessionCookie() {
  return `${REVIEW_COOKIE}=; Path=/admin/ratgeber; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export const REVIEW_COOKIE = "utildesk_ratgeber_review";

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

export async function sessionCookie(env) {
  const token = await sessionToken(env);
  return `${REVIEW_COOKIE}=${encodeURIComponent(token)}; Path=/admin/ratgeber; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`;
}

export function clearSessionCookie() {
  return `${REVIEW_COOKIE}=; Path=/admin/ratgeber; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

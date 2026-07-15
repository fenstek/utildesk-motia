import { HttpError, jsonResponse, requireKv } from "../_lib/storage.js";

const MODE_KEY = "content-runtime:tools";
const ALLOWLIST_KEY = "content-runtime:tools:allowlist";
const VALID_MODES = new Set(["off", "allowlist", "on"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_ALLOWLIST_SIZE = 1500;

export function normalizeToolRuntimeConfig(payload) {
  const mode = String(payload?.mode || "").trim().toLowerCase();
  if (!VALID_MODES.has(mode)) {
    throw new HttpError(400, "Invalid tool runtime mode");
  }

  const rawSlugs = payload?.slugs;
  if (mode === "allowlist" && !Array.isArray(rawSlugs)) {
    throw new HttpError(400, "Allowlist mode requires a slug array");
  }

  const slugs = Array.isArray(rawSlugs)
    ? [...new Set(rawSlugs.map((slug) => String(slug || "").trim().toLowerCase()))]
    : [];

  if (slugs.length > MAX_ALLOWLIST_SIZE || slugs.some((slug) => !SLUG_PATTERN.test(slug))) {
    throw new HttpError(400, "Invalid tool runtime allowlist");
  }
  if (mode === "allowlist" && slugs.length === 0) {
    throw new HttpError(400, "Tool runtime allowlist must not be empty");
  }

  return { mode, slugs };
}

async function readConfig(env) {
  const kv = requireKv(env);
  const [mode, rawAllowlist] = await Promise.all([
    kv.get(MODE_KEY),
    kv.get(ALLOWLIST_KEY),
  ]);
  let slugs = [];
  try {
    const parsed = JSON.parse(rawAllowlist || "[]");
    if (Array.isArray(parsed)) slugs = parsed;
  } catch {
    // Report malformed stored state without making the public middleware fail open.
  }
  return { mode: mode || "off", slugs };
}

async function writeConfig(env, payload) {
  const kv = requireKv(env);
  const config = normalizeToolRuntimeConfig(payload);

  // Publish the cohort before switching the mode so no request can observe an
  // allowlist mode without its corresponding validated slug set.
  if (config.mode === "allowlist") {
    await kv.put(ALLOWLIST_KEY, JSON.stringify(config.slugs));
  }
  await kv.put(MODE_KEY, config.mode);
  return config;
}

export async function onRequest(context) {
  try {
    if (context.request.method === "GET") {
      return jsonResponse({ ok: true, config: await readConfig(context.env) });
    }
    if (context.request.method === "POST") {
      const payload = await context.request.json();
      return jsonResponse({ ok: true, config: await writeConfig(context.env, payload) });
    }
    return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse({ ok: false, error: error.message }, { status: error.status });
    }
    return jsonResponse({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
}

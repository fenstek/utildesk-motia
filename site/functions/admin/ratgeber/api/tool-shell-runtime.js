import { HttpError, jsonResponse, requireKv } from "../_lib/storage.js";

const MODE_KEY = "content-runtime:tool-shell";
const VALID_MODES = new Set(["off", "on"]);

export function normalizeToolShellRuntimeConfig(payload) {
  const mode = String(payload?.mode || "").trim().toLowerCase();
  if (!VALID_MODES.has(mode)) throw new HttpError(400, "Invalid tool shell runtime mode");
  return { mode };
}

async function readConfig(env) {
  const kv = requireKv(env);
  return { mode: (await kv.get(MODE_KEY)) === "on" ? "on" : "off" };
}

async function writeConfig(env, payload) {
  const kv = requireKv(env);
  const config = normalizeToolShellRuntimeConfig(payload);
  await kv.put(MODE_KEY, config.mode);
  return config;
}

export async function onRequest(context) {
  try {
    if (context.request.method === "GET") return jsonResponse({ ok: true, config: await readConfig(context.env) });
    if (context.request.method === "POST") return jsonResponse({ ok: true, config: await writeConfig(context.env, await context.request.json()) });
    return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    if (error instanceof HttpError) return jsonResponse({ ok: false, error: error.message }, { status: error.status });
    return jsonResponse({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
}

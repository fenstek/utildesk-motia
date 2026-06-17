import OpenAI from "openai";

function asBool(v) {
  return /^(1|true|yes|on)$/i.test(String(v || "").trim());
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function canonicalizeUrl(input) {
  try {
    const u = new URL(String(input || "").trim());
    if (!/^https?:$/.test(u.protocol)) return "";
    u.hash = "";
    u.username = "";
    u.password = "";
    u.hostname = u.hostname.toLowerCase();
    if ((u.protocol === "https:" && u.port === "443") || (u.protocol === "http:" && u.port === "80")) {
      u.port = "";
    }
    const kept = [];
    for (const [k, v] of u.searchParams.entries()) {
      const key = String(k || "").toLowerCase();
      if (key.startsWith("utm_")) continue;
      if (key === "gclid" || key === "fbclid" || key === "msclkid") continue;
      kept.push([k, v]);
    }
    u.search = "";
    for (const [k, v] of kept) u.searchParams.append(k, v);
    u.pathname = u.pathname.replace(/\/{2,}/g, "/");
    if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, "");
    return u.toString();
  } catch {
    return "";
  }
}

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("gpt_timeout")), timeoutMs);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function extractFirstJsonObject(text) {
  const src = String(text || "");
  const start = src.indexOf("{");
  if (start < 0) return "";

  let depth = 0;
  let inStr = false;
  let esc = false;

  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];

    if (inStr) {
      if (esc) {
        esc = false;
      } else if (ch === "\\") {
        esc = true;
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }

    if (ch === '"') {
      inStr = true;
      esc = false;
      continue;
    }
    if (ch === "{") {
      depth += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }

  return "";
}

export function isGptUrlEnabled() {
  return asBool(process.env.USE_GPT_URL);
}

export async function chooseOfficialUrlGpt(args = {}) {
  const candidatesInput = Array.isArray(args.candidates) ? args.candidates : [];
  const normalizedCandidates = [];
  const seen = new Set();
  for (const item of candidatesInput) {
    const url = canonicalizeUrl(item?.url || item);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    normalizedCandidates.push({
      url,
      domain: String(item?.domain || "").trim(),
      source: String(item?.source || "").trim(),
      rank: Number(item?.rank || 0) || 0,
      score: Number(item?.score || 0) || 0,
    });
  }

  if (!isGptUrlEnabled()) {
    return { ok: false, official_url: "", confidence: 0, reason: "gpt_disabled", decision: { used_gpt: false } };
  }
  if (!normalizedCandidates.length) {
    return { ok: false, official_url: "", confidence: 0, reason: "no_candidates", decision: { used_gpt: false } };
  }
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    return { ok: false, official_url: "", confidence: 0, reason: "missing_openai_api_key", decision: { used_gpt: false } };
  }

  const model = String(process.env.GPT_URL_MODEL || "gpt-4o-mini").trim() || "gpt-4o-mini";
  const timeoutMs = Math.max(1000, Number(args.timeoutMs || process.env.GPT_URL_TIMEOUT_MS || 20000));
  const retries = Math.max(0, Math.trunc(Number(process.env.GPT_URL_RETRIES || 1)));
  const maxAttempts = 1 + retries;
  const defaultUrl = canonicalizeUrl(args.defaultUrl || "");
  const allowSet = new Set(normalizedCandidates.map((c) => c.url));
  const client = new OpenAI({ apiKey });

  const promptPayload = {
    topic: String(args.topic || "").trim(),
    token: String(args.token || "").trim().toLowerCase(),
    candidates: normalizedCandidates.map((c) => ({
      url: c.url,
      domain: c.domain,
      rank: c.rank,
      score: c.score,
      source: c.source,
    })),
    constraints: [
      "choose only one url from candidates",
      "if unsure return empty url and low confidence",
      "respond as strict JSON object only",
    ],
    output_schema: {
      url: "string",
      confidence: "number_between_0_and_1",
      reason: "short_string",
    },
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const completion = await withTimeout(
        client.chat.completions.create({
          model,
          temperature: 0,
          max_tokens: 250,
          messages: [
            {
              role: "system",
              content:
                "You choose official product URLs. Return strict JSON object only: {\"url\":\"...\",\"confidence\":0-1,\"reason\":\"...\"}.",
            },
            { role: "user", content: JSON.stringify(promptPayload) },
          ],
        }),
        timeoutMs
      );

      const content = String(completion?.choices?.[0]?.message?.content || "").trim();
      const jsonText = extractFirstJsonObject(content);
      if (!jsonText) {
        return {
          ok: false,
          official_url: "",
          confidence: 0,
          reason: "no_json",
          decision: { used_gpt: true, model, attempts: attempt },
        };
      }
      const parsed = JSON.parse(jsonText);
      const rawUrl = canonicalizeUrl(parsed?.url || "");
      const conf = clamp(Number(parsed?.confidence || 0), 0, 1);
      const reason = String(parsed?.reason || "").trim().slice(0, 160) || "gpt_selected";
      const allowed = rawUrl && allowSet.has(rawUrl);
      if (!allowed) {
        return {
          ok: false,
          official_url: "",
          confidence: 0,
          reason: "not_in_allowlist",
          decision: { used_gpt: true, model, attempts: attempt },
        };
      }

      return {
        ok: true,
        official_url: rawUrl,
        confidence: conf,
        reason,
        decision: { used_gpt: true, model, attempts: attempt, default_url: defaultUrl || "" },
      };
    } catch (err) {
      if (attempt >= maxAttempts) {
        return {
          ok: false,
          official_url: "",
          confidence: 0,
          reason: String(err?.message || "gpt_error").slice(0, 160),
          decision: { used_gpt: true, model, attempts: attempt, default_url: defaultUrl || "" },
        };
      }
    }
  }

  return { ok: false, official_url: "", confidence: 0, reason: "gpt_unavailable", decision: { used_gpt: true } };
}

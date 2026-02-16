import OpenAI from "openai";

/**
 * Tag enrichment via GPT for tools with generic/missing tags
 *
 * Prevents tools from being published without proper category matching
 * by adding specific tags from allowlist based on tool description.
 */

const TAG_ALLOWLIST = [
  "chatbot", "assistant", "writing", "content", "marketing", "seo", "social-media",
  "design", "image", "video", "audio", "transcription",
  "productivity", "automation", "workflow", "no-code",
  "data", "analytics", "spreadsheet", "crm",
  "coding", "developer-tools", "api",
  "translation", "education", "customer-support", "meeting"
];

const GENERIC_TAGS = new Set(["ai"]);

function asBool(v) {
  return /^(1|true|yes|on)$/i.test(String(v || "").trim());
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

function extractFirstJsonArray(text) {
  const src = String(text || "");
  const start = src.indexOf("[");
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
    if (ch === "[") {
      depth += 1;
      continue;
    }
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }

  return "";
}

export function isTagEnrichmentEnabled() {
  return asBool(process.env.USE_GPT_TAG_ENRICH);
}

export function hasGenericTags(tags = []) {
  const tagArray = Array.isArray(tags) ? tags : [];
  if (tagArray.length === 0) return true;

  const nonGeneric = tagArray.filter(t => !GENERIC_TAGS.has(String(t).toLowerCase()));
  return nonGeneric.length === 0;
}

/**
 * Enrich tags using GPT if tags are too generic
 *
 * @param {Object} args
 * @param {string} args.title - Tool title
 * @param {string} args.short_hint - Short description
 * @param {string} args.description - Full description
 * @param {string[]} args.tags - Current tags
 * @param {string} args.official_url - Official URL (for context)
 * @returns {Promise<{ok: boolean, tags: string[], reason: string}>}
 */
export async function enrichTagsIfGeneric(args = {}) {
  const currentTags = Array.isArray(args.tags) ? args.tags : [];

  // Check if enrichment is needed
  if (!hasGenericTags(currentTags)) {
    return {
      ok: true,
      tags: currentTags,
      reason: "tags_already_specific",
      enriched: false
    };
  }

  // Check if GPT enrichment is enabled
  if (!isTagEnrichmentEnabled()) {
    return {
      ok: true,
      tags: currentTags,
      reason: "gpt_enrichment_disabled",
      enriched: false
    };
  }

  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    return {
      ok: false,
      tags: currentTags,
      reason: "missing_openai_api_key",
      enriched: false
    };
  }

  const model = String(process.env.GPT_TAG_MODEL || "gpt-4o-mini").trim() || "gpt-4o-mini";
  const timeoutMs = Math.max(1000, Number(process.env.GPT_TAG_TIMEOUT_MS || 15000));
  const client = new OpenAI({ apiKey });

  const title = String(args.title || "").trim();
  const shortHint = String(args.short_hint || "").trim();
  const description = String(args.description || "").trim();
  const officialUrl = String(args.official_url || "").trim();

  const promptPayload = {
    title,
    short_hint: shortHint,
    description: description.slice(0, 1000), // Limit description length
    official_url: officialUrl,
    current_tags: currentTags,
    task: "Add 1-4 specific tags from allowlist that best describe this tool's functionality",
    allowlist: TAG_ALLOWLIST,
    constraints: [
      "return only tags from allowlist",
      "max 4 new tags",
      "respond as JSON array of strings only",
      "no explanation, no markdown, just the array"
    ]
  };

  try {
    const completion = await withTimeout(
      client.chat.completions.create({
        model,
        temperature: 0.3,
        max_tokens: 150,
        messages: [
          {
            role: "system",
            content: "You analyze tool descriptions and return relevant tags. Respond ONLY with a JSON array of tag strings from the allowlist. Example: [\"video\",\"content\",\"marketing\"]"
          },
          {
            role: "user",
            content: JSON.stringify(promptPayload)
          }
        ]
      }),
      timeoutMs
    );

    const content = String(completion?.choices?.[0]?.message?.content || "").trim();
    const jsonText = extractFirstJsonArray(content);

    if (!jsonText) {
      return {
        ok: false,
        tags: currentTags,
        reason: "no_json_array",
        enriched: false
      };
    }

    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed)) {
      return {
        ok: false,
        tags: currentTags,
        reason: "invalid_json_format",
        enriched: false
      };
    }

    // Validate and filter tags
    const newTags = parsed
      .map(t => String(t).toLowerCase().trim())
      .filter(t => TAG_ALLOWLIST.includes(t))
      .slice(0, 4); // Max 4 new tags

    if (newTags.length === 0) {
      return {
        ok: false,
        tags: currentTags,
        reason: "no_valid_tags_from_gpt",
        enriched: false
      };
    }

    // Merge with existing tags, preserve "ai", remove duplicates
    const seen = new Set();
    const merged = [];

    for (const tag of currentTags) {
      const t = String(tag).toLowerCase().trim();
      if (!seen.has(t)) {
        seen.add(t);
        merged.push(t);
      }
    }

    for (const tag of newTags) {
      if (!seen.has(tag)) {
        seen.add(tag);
        merged.push(tag);
      }
    }

    // Limit to 5 total tags
    const finalTags = merged.slice(0, 5);

    return {
      ok: true,
      tags: finalTags,
      reason: `added_${newTags.length}_tags`,
      enriched: true,
      added_tags: newTags
    };

  } catch (err) {
    return {
      ok: false,
      tags: currentTags,
      reason: String(err?.message || "gpt_error").slice(0, 160),
      enriched: false
    };
  }
}

import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeToolRuntimeConfig,
  onRequest,
} from "../../functions/admin/ratgeber/api/tool-runtime.js";

function contextFor({ method = "GET", payload, values = {} } = {}) {
  const puts = [];
  return {
    puts,
    context: {
      request: new Request("https://tools.utildesk.de/admin/ratgeber/api/tool-runtime", {
        method,
        headers: payload ? { "Content-Type": "application/json" } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      }),
      env: {
        RATGEBER_REVIEW: {
          get: async (key) => Object.hasOwn(values, key) ? values[key] : null,
          put: async (key, value) => { puts.push([key, value]); },
        },
      },
    },
  };
}

test("normalizes and deduplicates a valid tool runtime cohort", () => {
  assert.deepEqual(normalizeToolRuntimeConfig({
    mode: "ALLOWLIST",
    slugs: [" ChatGPT ", "chatgpt", "hugging-face"],
  }), {
    mode: "allowlist",
    slugs: ["chatgpt", "hugging-face"],
  });
});

test("rejects malformed or empty allowlists", () => {
  assert.throws(() => normalizeToolRuntimeConfig({ mode: "allowlist", slugs: [] }));
  assert.throws(() => normalizeToolRuntimeConfig({ mode: "allowlist", slugs: ["../bad"] }));
  assert.throws(() => normalizeToolRuntimeConfig({ mode: "unknown", slugs: [] }));
});

test("writes the allowlist before enabling allowlist mode", async () => {
  const fixture = contextFor({
    method: "POST",
    payload: { mode: "allowlist", slugs: ["chatgpt", "hugging-face"] },
  });
  const response = await onRequest(fixture.context);
  assert.equal(response.status, 200);
  assert.deepEqual(fixture.puts, [
    ["content-runtime:tools:allowlist", JSON.stringify(["chatgpt", "hugging-face"])],
    ["content-runtime:tools", "allowlist"],
  ]);
});

test("off mode changes only the tool runtime switch", async () => {
  const fixture = contextFor({ method: "POST", payload: { mode: "off" } });
  const response = await onRequest(fixture.context);
  assert.equal(response.status, 200);
  assert.deepEqual(fixture.puts, [["content-runtime:tools", "off"]]);
});

test("reads the current tool runtime state", async () => {
  const fixture = contextFor({ values: {
    "content-runtime:tools": "allowlist",
    "content-runtime:tools:allowlist": JSON.stringify(["chatgpt"]),
  } });
  const response = await onRequest(fixture.context);
  assert.deepEqual((await response.json()).config, { mode: "allowlist", slugs: ["chatgpt"] });
});

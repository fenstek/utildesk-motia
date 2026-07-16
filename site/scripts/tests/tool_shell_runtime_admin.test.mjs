import assert from "node:assert/strict";
import test from "node:test";
import { normalizeToolShellRuntimeConfig, onRequest } from "../../functions/admin/ratgeber/api/tool-shell-runtime.js";

function contextFor({ method = "GET", payload, value = null } = {}) {
  const puts = [];
  return {
    puts,
    context: {
      request: new Request("https://tools.utildesk.de/admin/ratgeber/api/tool-shell-runtime", {
        method,
        headers: payload ? { "Content-Type": "application/json" } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      }),
      env: { RATGEBER_REVIEW: { get: async () => value, put: async (key, stored) => puts.push([key, stored]) } },
    },
  };
}

test("tool shell admin accepts only explicit on/off modes", () => {
  assert.deepEqual(normalizeToolShellRuntimeConfig({ mode: " ON " }), { mode: "on" });
  assert.throws(() => normalizeToolShellRuntimeConfig({ mode: "allowlist" }));
});

test("tool shell admin reads and writes only its independent key", async () => {
  const write = contextFor({ method: "POST", payload: { mode: "on" } });
  assert.equal((await write.context.request.clone().json()).mode, "on");
  assert.equal((await onRequest(write.context)).status, 200);
  assert.deepEqual(write.puts, [["content-runtime:tool-shell", "on"]]);
  const read = contextFor({ value: "on" });
  assert.deepEqual((await (await onRequest(read.context)).json()).config, { mode: "on" });
});

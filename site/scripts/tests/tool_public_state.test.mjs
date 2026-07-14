import assert from "node:assert/strict";
import test from "node:test";
import { getToolPublicState, isPublishableTool } from "../../shared/toolPublicState.mjs";

test("normal published tool is active", () => {
  assert.equal(isPublishableTool({ filename: "chatgpt.md", data: { slug: "chatgpt" } }), true);
});

for (const [label, input, reason] of [
  ["underscore file", { filename: "_alias.md", data: { slug: "alias" } }, "underscore_file"],
  ["disabled", { filename: "tool.md", data: { disabled: "true" } }, "disabled"],
  ["draft", { filename: "tool.md", data: { draft: true } }, "draft"],
  ["active false", { filename: "tool.md", data: { active: "false" } }, "inactive"],
  ["blacklist", { filename: "tool.md", data: { status: "BLACKLIST" } }, "status_blacklist"],
  ["duplicate", { filename: "tool.md", data: { sheet_status: "duplicate" } }, "status_duplicate"],
  ["rejected", { filename: "tool.md", data: { sheetStatus: "REJECTED" } }, "status_rejected"],
  ["reserved route", { filename: "tag.md", data: { slug: "tag" } }, "reserved_slug"],
  ["alias only", { filename: "legacy.md", data: { alias_only: true } }, "alias_only"],
  ["redirect", { filename: "old.md", data: { route_state: "redirect" } }, "route_redirect"],
  ["alias target", { filename: "old.md", data: { alias_of: "new" } }, "alias_target"],
  ["EN orphan", { filename: "tool.md", data: {}, primaryPublishable: false }, "primary_inactive"],
]) {
  test(`excludes ${label}`, () => {
    const state = getToolPublicState(input);
    assert.equal(state.isPublishable, false);
    assert.equal(state.reason, reason);
  });
}

test("self canonical slug does not turn an entry into an alias", () => {
  assert.equal(isPublishableTool({ filename: "tool.md", data: { canonical_slug: "tool" } }), true);
});

import assert from "node:assert/strict";
import test from "node:test";
import { runtimeGuideBacklinks } from "../../runtime-src/lib/toolRuntime.ts";

const guide = (slug) => ({
  slug,
  title: slug,
  excerpt: slug,
  metadata: { relatedTools: [{ href: "/tools/example/", title: "Example" }] },
});

test("runtime guide backlinks preserve the generated manifest slug order", () => {
  const result = runtimeGuideBacklinks([guide("z-guide"), guide("a-guide"), guide("m-guide")], "example", "de");
  assert.deepEqual(result.map(({ slug }) => slug), ["a-guide", "m-guide", "z-guide"]);
});

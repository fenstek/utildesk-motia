import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { inspectBuiltToolRoutes } from "../../../scripts/check_built_tool_routes.mjs";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "utildesk-tool-build-contract-"));
  const toolsDir = join(root, "content", "tools");
  const distDir = join(root, "dist");
  await mkdir(toolsDir, { recursive: true });
  await mkdir(distDir, { recursive: true });
  await writeFile(join(toolsDir, "alpha.md"), "---\nslug: alpha\n---\nAlpha\n");
  await writeFile(join(toolsDir, "beta.md"), "---\nslug: beta\n---\nBeta\n");
  await writeFile(join(toolsDir, "disabled.md"), "---\nslug: disabled\ndisabled: true\n---\nDisabled\n");
  return { root, toolsDir, distDir };
}

async function emit(file) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, "fixture\n");
}

test("normal shell builds reject every static tool-detail or machine artifact", async () => {
  const files = await fixture();
  try {
    const clean = inspectBuiltToolRoutes({ ...files, frozenBuild: false });
    assert.deepEqual(clean.activeSlugs.sort(), ["alpha", "beta"]);
    assert.match(clean.message, /zero static detail pages or detail mirrors/);

    const detail = join(files.distDir, "tools", "alpha", "index.html");
    await emit(detail);
    assert.throws(() => inspectBuiltToolRoutes({ ...files, frozenBuild: false }), /detail route sets were emitted/);
    await unlink(detail);

    await emit(join(files.distDir, "en", "api", "tools", "beta.json"));
    assert.throws(() => inspectBuiltToolRoutes({ ...files, frozenBuild: false }), /machine mirror sets were emitted/);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("frozen fallback builds require all six localized artifacts per active slug", async () => {
  const files = await fixture();
  try {
    for (const slug of ["alpha", "beta"]) {
      await emit(join(files.distDir, "tools", slug, "index.html"));
      await emit(join(files.distDir, "en", "tools", slug, "index.html"));
      await emit(join(files.distDir, "api", "tools", `${slug}.json`));
      await emit(join(files.distDir, "en", "api", "tools", `${slug}.json`));
      await emit(join(files.distDir, "markdown", "tools", `${slug}.md`));
      await emit(join(files.distDir, "en", "markdown", "tools", `${slug}.md`));
    }
    assert.match(inspectBuiltToolRoutes({ ...files, frozenBuild: true }).message, /4 DE\/EN detail pages/);
    await unlink(join(files.distDir, "en", "markdown", "tools", "beta.md"));
    assert.throws(() => inspectBuiltToolRoutes({ ...files, frozenBuild: true }), /mirror sets are incomplete/);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

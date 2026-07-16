import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { inspectRuntimeDeployBundle } from "../check_runtime_deploy_bundle.mjs";

async function fixture({ withAssets = true } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "utildesk-runtime-deploy-"));
  const serverDir = path.join(root, "server");
  const clientDir = path.join(root, "client", "runtime-assets");
  await mkdir(serverDir, { recursive: true });
  if (withAssets) {
    await mkdir(clientDir, { recursive: true });
    await writeFile(path.join(clientDir, "BaseLayout.hash.css"), "x".repeat(100_001));
    await writeFile(path.join(clientDir, "index-de.js"), "de");
    await writeFile(path.join(clientDir, "index-en.js"), "en");
  }
  const configPath = path.join(serverDir, "wrangler.json");
  await writeFile(configPath, JSON.stringify({
    main: "entry.mjs",
    assets: { binding: "ASSETS", directory: "../client" },
  }));
  return { root, configPath };
}

test("accepts an Astro runtime deployment with its shared CSS and client scripts", async () => {
  const files = await fixture();
  try {
    const result = await inspectRuntimeDeployBundle({ configPath: files.configPath });
    assert.equal(result.stylesheet, "runtime-assets/BaseLayout.hash.css");
    assert.equal(result.scriptCount, 2);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

test("rejects deployment through a bare Worker entry without generated assets", async () => {
  const files = await fixture({ withAssets: false });
  try {
    await assert.rejects(
      inspectRuntimeDeployBundle({ configPath: files.configPath }),
      /ENOENT|assets/i,
    );
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
});

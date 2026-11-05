import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { inspectRuntimeDeployBundle } from "../check_runtime_deploy_bundle.mjs";

async function fixture({
  withAssets = true,
  stylesheets = ["BaseLayout.hash.css"],
  scriptNames = ["index-de.js", "index-en.js"],
  sharedStylesheetBytes = 100_001,
  config = {
    main: "entry.mjs",
    assets: { binding: "ASSETS", directory: "../client" },
  },
} = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "utildesk-runtime-deploy-"));
  const serverDir = path.join(root, "server");
  const assetsDir = path.join(root, "client");
  const runtimeAssetsDir = path.join(assetsDir, "runtime-assets");
  await mkdir(serverDir, { recursive: true });
  if (withAssets) {
    await mkdir(runtimeAssetsDir, { recursive: true });
    for (const stylesheet of stylesheets) {
      const stylesheetPath = path.join(runtimeAssetsDir, stylesheet);
      await mkdir(path.dirname(stylesheetPath), { recursive: true });
      const filename = path.basename(stylesheet);
      const isSharedStylesheet = filename === "BaseLayout.css" || filename.startsWith("BaseLayout.");
      const size = isSharedStylesheet ? sharedStylesheetBytes : 4;
      await writeFile(stylesheetPath, "x".repeat(size));
    }
    for (const scriptName of scriptNames) {
      await writeFile(path.join(runtimeAssetsDir, scriptName), "script");
    }
  }
  const configPath = path.join(serverDir, "wrangler.json");
  await writeFile(configPath, JSON.stringify(config));
  return { root, configPath };
}

async function withFixture(options, callback) {
  const files = await fixture(options);
  try {
    await callback(files);
  } finally {
    await rm(files.root, { recursive: true, force: true });
  }
}

test("accepts a runtime bundle with one shared stylesheet and client scripts", async () => {
  await withFixture({}, async ({ configPath }) => {
    const result = await inspectRuntimeDeployBundle({ configPath });
    assert.equal(result.stylesheet, "runtime-assets/BaseLayout.hash.css");
    assert.equal(result.stylesheetBytes, 100_001);
    assert.equal(result.scriptCount, 2);
    assert.deepEqual(result.stylesheets, ["runtime-assets/BaseLayout.hash.css"]);
    assert.equal(result.stylesheetCount, 1);
  });
});

test("selects the shared stylesheet when shared and component CSS are enumerated in either order", async () => {
  const stylesheets = ["BaseLayout.hash.css", "DecisionTemplateHome.hash.css"];
  const expectedStylesheets = [
    "runtime-assets/BaseLayout.hash.css",
    "runtime-assets/DecisionTemplateHome.hash.css",
  ];

  for (const orderedStylesheets of [stylesheets, [...stylesheets].reverse()]) {
    await withFixture({ stylesheets }, async ({ configPath }) => {
      const files = [
        ...orderedStylesheets.map((stylesheet) => `runtime-assets/${stylesheet}`),
        "runtime-assets/index-de.js",
        "runtime-assets/index-en.js",
      ];
      const result = await inspectRuntimeDeployBundle({
        configPath,
        readAssetFiles: async () => files,
      });
      assert.equal(result.stylesheet, "runtime-assets/BaseLayout.hash.css");
      assert.deepEqual(result.stylesheets, expectedStylesheets);
      assert.equal(result.stylesheetCount, 2);
    });
  }
});

test("rejects component CSS when the shared BaseLayout stylesheet is missing", async () => {
  await withFixture({ stylesheets: ["DecisionTemplateHome.hash.css"] }, async ({ configPath }) => {
    await assert.rejects(
      inspectRuntimeDeployBundle({ configPath }),
      /exactly one shared stylesheet named BaseLayout, found 0/,
    );
  });
});

test("rejects ambiguous duplicate shared BaseLayout stylesheets", async () => {
  await withFixture({ stylesheets: ["BaseLayout.one.css", "nested/BaseLayout.two.css"] }, async ({ configPath }) => {
    await assert.rejects(
      inspectRuntimeDeployBundle({ configPath }),
      /exactly one shared stylesheet named BaseLayout, found 2/,
    );
  });
});

test("rejects an undersized shared BaseLayout stylesheet", async () => {
  await withFixture({ sharedStylesheetBytes: 99_999 }, async ({ configPath }) => {
    await assert.rejects(inspectRuntimeDeployBundle({ configPath }), /unexpectedly small: 99999 bytes/);
  });
});

test("rejects a bundle missing one of the localized inventory scripts", async () => {
  await withFixture({ scriptNames: ["index-de.js"] }, async ({ configPath }) => {
    await assert.rejects(inspectRuntimeDeployBundle({ configPath }), /localized inventory scripts, found 1/);
  });
});

test("rejects a config that does not target the generated entry.mjs", async () => {
  await withFixture(
    { config: { main: "worker.mjs", assets: { binding: "ASSETS", directory: "../client" } } },
    async ({ configPath }) => {
      await assert.rejects(inspectRuntimeDeployBundle({ configPath }), /must target entry\.mjs/);
    },
  );
});

test("rejects a config without the generated ASSETS binding and directory", async () => {
  for (const assets of [
    { binding: "STATIC", directory: "../client" },
    { binding: "ASSETS" },
  ]) {
    await withFixture({ config: { main: "entry.mjs", assets } }, async ({ configPath }) => {
      await assert.rejects(inspectRuntimeDeployBundle({ configPath }), /generated ASSETS binding and directory/);
    });
  }
});

test("rejects deployment through a bare Worker entry without generated assets", async () => {
  await withFixture({ withAssets: false }, async ({ configPath }) => {
    await assert.rejects(
      inspectRuntimeDeployBundle({ configPath }),
      /ENOENT|assets/i,
    );
  });
});

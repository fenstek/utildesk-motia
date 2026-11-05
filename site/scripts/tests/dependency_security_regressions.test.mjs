import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { createServer } from "vite";

const requireFromSite = createRequire(import.meta.url);
const grayMatterPath = requireFromSite.resolve("gray-matter");
const requireFromGrayMatter = createRequire(grayMatterPath);
const grayMatter = requireFromSite("gray-matter");
const yaml3 = requireFromGrayMatter("js-yaml");
const yaml4 = requireFromSite("js-yaml");

const getPackageVersion = (requireFrom, name) => {
  let directory = path.dirname(requireFrom.resolve(name));
  while (true) {
    const packageJson = path.resolve(directory, "package.json");
    if (fs.existsSync(packageJson)) {
      const metadata = JSON.parse(readFileSync(packageJson, "utf8"));
      if (metadata.name === name) return metadata.version;
    }
    const parent = path.dirname(directory);
    if (parent === directory) throw new Error(`Could not find package metadata for ${name}`);
    directory = parent;
  }
};

const yamlBranches = [
  { label: "gray-matter js-yaml 3.x", parse: yaml3.safeLoad },
  { label: "site js-yaml 4.x", parse: yaml4.load },
];

const normalFrontmatter = [
  "defaults: &defaults",
  "  title: A normal editorial entry",
  "  tags: [security, markdown]",
  "entry:",
  "  before: first",
  "  <<: *defaults",
  "  slug: merge-alias-check",
].join("\n");

const repeatedTinyMergeDocument = [
  "base: &tiny {value: x}",
  "target:",
  `  <<: [${Array(12_000).fill("*tiny").join(", ")}]`,
].join("\n");

const emptyMapMergeDocument = [
  "base: &many",
  ...Array.from({ length: 200 }, (_, index) => `  key${index}: {}`),
  `target:\n  <<: [${Array(100).fill("*many").join(", ")}]`,
].join("\n");

test("patched YAML branches retain supported versions and normal merge/alias frontmatter", () => {
  assert.equal(getPackageVersion(requireFromGrayMatter, "js-yaml"), "3.15.2");
  assert.equal(getPackageVersion(requireFromSite, "js-yaml"), "4.3.2");
  assert.equal(typeof yaml3.safeLoad, "function", "gray-matter's js-yaml 3.x safeLoad API remains available");
  assert.equal(typeof yaml3.safeDump, "function", "gray-matter's js-yaml 3.x safeDump API remains available");

  const grayMatterResult = grayMatter(`---\n${normalFrontmatter}\n---\nEditorial body.\n`);
  assert.equal(grayMatterResult.data.entry.title, "A normal editorial entry");
  assert.equal(grayMatterResult.data.entry.slug, "merge-alias-check");
  assert.equal(grayMatterResult.data.entry.before, "first");
  assert.deepEqual(Object.keys(grayMatterResult.data.entry), ["before", "title", "tags", "slug"]);

  for (const { label, parse } of yamlBranches) {
    const parsed = parse(normalFrontmatter);
    assert.equal(parsed.entry.title, "A normal editorial entry", `${label} merge was not applied`);
    assert.equal(parsed.entry.slug, "merge-alias-check", `${label} alias/explicit key was not parsed`);
    assert.deepEqual(Object.keys(parsed.entry), ["before", "title", "tags", "slug"], `${label} mapping order changed`);
  }

  const roundTrip = yaml3.safeLoad(yaml3.safeDump({ title: "safe API" }));
  assert.deepEqual(roundTrip, { title: "safe API" });
});

test("patched YAML branches reject oversized merge workloads within bounded inputs", () => {
  for (const { label, parse } of yamlBranches) {
    assert.throws(
      () => parse(repeatedTinyMergeDocument),
      /(?:abnormal merge sequence size|maxTotalMergeKeys|merge[^\n]*(?:limit|size|exceed))/i,
      `${label} accepted 12,000 repeated tiny-anchor merges or failed for an unrelated reason`,
    );
    assert.throws(
      () => parse(emptyMapMergeDocument),
      /(?:abnormal merge sequence size|maxTotalMergeKeys|merge[^\n]*(?:limit|size|exceed))/i,
      `${label} accepted 100 merges of a 200-key empty-map anchor or failed for an unrelated reason`,
    );
  }
});

test("Vite blocks Windows UNC paths and editor command metacharacters", async (t) => {
  assert.equal(getPackageVersion(requireFromSite, "vite"), "7.3.7");

  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    plugins: [],
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true, watch: { ignored: ["**"] } },
  });
  t.after(() => server.close());

  const route = server.middlewares.stack.find((entry) => entry.route === "/__open-in-editor")?.handle;
  assert.equal(typeof route, "function", "Vite's real editor middleware was not registered");

  const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
  const originalResolve = path.resolve;
  const originalExistsSync = fs.existsSync;
  const originalExec = childProcess.exec;
  const originalExecSync = childProcess.execSync;
  const originalSpawn = childProcess.spawn;
  const originalLog = console.log;
  const originalLaunchEditor = process.env.LAUNCH_EDITOR;
  let existsCalls = 0;
  let launchCalls = 0;
  let capturedOutput = "";
  const invokeEditorRoute = (file) => {
    const response = { statusCode: 200, ended: false, end() { this.ended = true; } };
    route({ url: `/?file=${encodeURIComponent(file)}` }, response);
    return response;
  };
  let uncResponse;
  let injectionResponse;

  try {
    Object.defineProperty(process, "platform", { ...originalPlatform, value: "win32" });
    path.resolve = path.win32.resolve;
    fs.existsSync = () => { existsCalls += 1; return true; };
    childProcess.exec = () => { launchCalls += 1; throw new Error("blocked test stub: exec must not run"); };
    childProcess.execSync = () => { launchCalls += 1; throw new Error("blocked test stub: execSync must not run"); };
    childProcess.spawn = () => { launchCalls += 1; throw new Error("blocked test stub: spawn must not run"); };
    process.env.LAUNCH_EDITOR = "code";
    console.log = (...args) => { capturedOutput += `${args.join(" ")}\n`; };

    uncResponse = invokeEditorRoute("\\\\server\\share\\document.js");
    injectionResponse = invokeEditorRoute("editor%PATH%.js");
  } finally {
    Object.defineProperty(process, "platform", originalPlatform);
    path.resolve = originalResolve;
    fs.existsSync = originalExistsSync;
    childProcess.exec = originalExec;
    childProcess.execSync = originalExecSync;
    childProcess.spawn = originalSpawn;
    console.log = originalLog;
    if (originalLaunchEditor === undefined) delete process.env.LAUNCH_EDITOR;
    else process.env.LAUNCH_EDITOR = originalLaunchEditor;
  }

  assert.equal(uncResponse.ended, true, "Vite editor middleware did not complete the UNC request");
  assert.equal(injectionResponse.ended, true, "Vite editor middleware did not complete the metacharacter request");
  assert.match(capturedOutput, /UNC paths are not supported on Windows/i);
  assert.match(capturedOutput, /argument containing "%"/i);
  assert.equal(existsCalls, 1, "UNC path reached filesystem access instead of only checking the ordinary metacharacter path");
  assert.equal(launchCalls, 0, "editor path attempted to launch a process");
});

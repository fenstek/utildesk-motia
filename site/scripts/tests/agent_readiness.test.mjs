import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { toolMachineRoute } from "../../functions/_middleware.js";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const projectRoot = resolve(siteRoot, "..");
const siteFile = (...parts) => join(siteRoot, ...parts);
const projectFile = (...parts) => join(projectRoot, ...parts);
const readSite = (...parts) => readFileSync(siteFile(...parts), "utf8");

function parseRobotsGroups(contents) {
  const groups = [];
  let current = null;

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      current = { agent: value, directives: new Map() };
      groups.push(current);
      continue;
    }

    if (!current) continue;
    const values = current.directives.get(field) ?? [];
    values.push(value);
    current.directives.set(field, values);
  }

  return groups;
}

function parseHeaders(contents) {
  const blocks = new Map();
  let current = null;

  for (const line of contents.split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) {
      current = line.trim();
      blocks.set(current, new Map());
      continue;
    }

    const separator = line.indexOf(":");
    if (!current || separator === -1) continue;
    const name = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    blocks.get(current).set(name, value);
  }

  return blocks;
}

test("robots groups keep the chosen Content-Signal in every independent group", () => {
  const contents = readSite("public", "robots.txt");
  const groups = parseRobotsGroups(contents);
  const namedAgents = [
    "OAI-SearchBot",
    "GPTBot",
    "ClaudeBot",
    "Claude-SearchBot",
    "Claude-User",
    "ChatGPT-User",
    "PerplexityBot",
    "Perplexity-User",
    "Bingbot",
    "Applebot",
    "Google-Extended",
  ];

  assert.deepEqual(groups.map(({ agent }) => agent), [...namedAgents, "__usage_ai-training", "*"]);
  assert.ok(groups.every(({ agent }) => agent && !agent.includes(",")));

  for (const group of groups.filter(({ agent }) => agent !== "__usage_ai-training")) {
    const signals = group.directives.get("content-signal") ?? [];
    assert.equal(signals.length, 1, `${group.agent} has exactly one Content-Signal`);
    const parsedSignals = Object.fromEntries(signals[0].split(",").map((part) => {
      const [key, value] = part.trim().split("=");
      return [key, value];
    }));
    assert.deepEqual(parsedSignals, {
      search: "yes",
      "ai-input": "yes",
      "ai-train": "no",
    });
  }

  const groupFor = (agent) => groups.find((group) => group.agent.toLowerCase() === agent.toLowerCase())
    ?? groups.find((group) => group.agent === "*");
  const gptBot = groupFor("GPTBot");
  assert.equal(gptBot.agent, "GPTBot", "GPTBot uses its named group instead of wildcard rules");
  assert.deepEqual(gptBot.directives.get("disallow"), ["/"]);
  assert.equal(gptBot.directives.has("allow"), false);

  for (const agent of ["OAI-SearchBot", "ChatGPT-User"]) {
    assert.deepEqual(groupFor(agent).directives.get("allow"), ["/"], `${agent} stays accessible`);
    assert.equal(groupFor(agent).directives.has("disallow"), false);
  }

  const googleExtended = groupFor("Google-Extended");
  assert.deepEqual(googleExtended.directives.get("allow"), ["/"], "Google-Extended access stays unchanged");
  assert.equal(googleExtended.directives.has("disallow"), false);
  assert.deepEqual(groupFor("*").directives.get("allow"), ["/"]);

  const trainingPreference = groupFor("__usage_ai-training");
  assert.equal(trainingPreference.agent, "__usage_ai-training");
  assert.deepEqual(trainingPreference.directives.get("disallow"), ["/"]);
  assert.equal(trainingPreference.directives.has("allow"), false);
  assert.equal(trainingPreference.directives.has("content-signal"), false);
});

test("RFC 9727 API catalog links only to real JSON catalogs and their documentation", () => {
  const catalog = JSON.parse(readSite("public", ".well-known", "api-catalog"));
  const siteUrl = "https://tools.utildesk.de";
  assert.deepEqual(Object.keys(catalog), ["linkset"]);
  assert.ok(Array.isArray(catalog.linkset));

  const collection = catalog.linkset.find((entry) => entry.anchor === `${siteUrl}/.well-known/api-catalog`);
  assert.ok(Array.isArray(collection?.item));
  const expectedEndpoints = [
    `${siteUrl}/api/tools.json`,
    `${siteUrl}/api/ratgeber.json`,
  ];
  const items = collection.item;
  assert.deepEqual(items.map(({ href }) => href), expectedEndpoints);
  assert.ok(items.every(({ type }) => type === "application/json"));

  assert.ok(existsSync(siteFile("src", "pages", "api", "tools.json.ts")));
  assert.ok(existsSync(siteFile("src", "pages", "api", "ratgeber.json.ts")));
  assert.deepEqual(toolMachineRoute("/api/tools.json"), { slug: null, kind: "catalog" });
  assert.deepEqual(toolMachineRoute("/api/tools/chatgpt.json"), { slug: "chatgpt", kind: "json" });

  const docs = readSite("public", "api", "README.md");
  for (const endpoint of [
    "GET /api/tools.json",
    "GET /api/ratgeber.json",
    "/api/tools/<slug>.json",
    "/api/ratgeber/<slug>.json",
    "/feed.xml",
    "/feed.json",
    "/markdown/tools/<slug>.md",
    "/markdown/ratgeber/<slug>.md",
  ]) {
    assert.ok(docs.includes(endpoint), `API docs describe ${endpoint}`);
  }

  assert.ok(existsSync(siteFile("src", "pages", "api", "tools", "[slug].json.ts")));
  assert.ok(existsSync(siteFile("src", "pages", "api", "ratgeber", "[slug].json.ts")));
  assert.ok(existsSync(siteFile("src", "pages", "feed.xml.ts")));
  assert.ok(existsSync(siteFile("src", "pages", "feed.json.ts")));
  assert.ok(existsSync(projectFile("content", "tools", "chatgpt.md")));
  assert.ok(existsSync(projectFile("content", "ratgeber", "ist-deine-website-bereit-fur-ki-agenten-so-gelingt-der-einsatz-in-der-praxis.md")));
  assert.ok(docs.includes("when the tool runtime is enabled"));
  assert.ok(docs.includes("frozen tool artifacts"));
  assert.ok(docs.includes("generated from published content during the static site build"));

  const serviceDocs = catalog.linkset.filter((entry) => entry["service-doc"]);
  assert.equal(serviceDocs.length, 2);
  assert.deepEqual(new Set(serviceDocs.map(({ anchor }) => anchor)), new Set(expectedEndpoints));
  const expectedFragments = new Map([
    [`${siteUrl}/api/tools.json`, "#tool-catalog"],
    [`${siteUrl}/api/ratgeber.json`, "#ratgeber-catalog"],
  ]);
  for (const entry of serviceDocs) {
    const [link] = entry["service-doc"];
    const linkedUrl = new URL(link.href);
    assert.equal(link.type, "text/markdown");
    assert.equal(linkedUrl.origin, siteUrl);
    assert.equal(linkedUrl.pathname, "/api/README.md");
    assert.equal(linkedUrl.hash, expectedFragments.get(entry.anchor));
  }

  const serviceDescriptions = catalog.linkset.filter((entry) => entry["service-desc"]);
  assert.equal(serviceDescriptions.length, 2);
  assert.deepEqual(new Set(serviceDescriptions.map(({ anchor }) => anchor)), new Set(expectedEndpoints));
  const openApi = JSON.parse(readSite("public", "api", "openapi.json"));
  assert.equal(openApi.openapi, "3.1.0");
  assert.deepEqual(Object.keys(openApi.paths).sort(), ["/api/ratgeber.json", "/api/tools.json"]);
  for (const endpoint of expectedEndpoints) {
    const entry = serviceDescriptions.find(({ anchor }) => anchor === endpoint);
    assert.ok(entry, `${endpoint} has a service-desc link`);
    const [link] = entry["service-desc"];
    assert.equal(link.href, `${siteUrl}/api/openapi.json`);
    assert.equal(link.type, "application/vnd.oai.openapi+json");
    const path = new URL(endpoint).pathname;
    assert.deepEqual(Object.keys(openApi.paths[path]), ["get"]);
    assert.equal(openApi.paths[path].get.responses["200"].content["application/json"].schema.$ref, "#/components/schemas/Catalog");
  }
  assert.deepEqual(openApi.components.schemas.Catalog.required, [
    "version", "site", "siteUrl", "generatedAt", "count", "items",
  ]);
  assert.deepEqual(Object.keys(openApi.components.schemas.Catalog.properties), [
    "version", "site", "siteUrl", "generatedAt", "count", "items",
  ]);
  assert.deepEqual(openApi.components.schemas.Catalog.properties.items.items, {
    type: "object",
    additionalProperties: true,
  });
});

test("Agent Skills discovery index matches proposal v0.2.0 and verifies its artifact digest", () => {
  const index = JSON.parse(readSite("public", ".well-known", "agent-skills", "index.json"));
  const skillPath = siteFile("public", ".well-known", "agent-skills", "utildesk-research", "SKILL.md");
  const skillBytes = readFileSync(skillPath);
  const skillText = skillBytes.toString("utf8");
  assert.equal(index.$schema, "https://schemas.agentskills.io/discovery/0.2.0/schema.json");
  assert.ok(Array.isArray(index.skills));
  assert.equal(index.skills.length, 1);

  const [skill] = index.skills;
  assert.deepEqual(new Set(Object.keys(skill)), new Set(["name", "type", "description", "url", "digest"]));
  assert.equal(skill.name, "utildesk-research");
  assert.match(skill.name, /^(?!-)(?!.*--)[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(skill.name.length <= 64);
  assert.equal(skill.type, "skill-md");
  assert.ok(skill.description.length > 0 && skill.description.length <= 1024);
  assert.match(skill.url, /^\/.well-known\/agent-skills\/utildesk-research\/SKILL\.md$/);
  assert.match(skill.digest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(skill.digest, `sha256:${createHash("sha256").update(skillBytes).digest("hex")}`);

  const url = new URL(skill.url, "https://tools.utildesk.de");
  assert.equal(url.pathname, "/.well-known/agent-skills/utildesk-research/SKILL.md");
  assert.match(skillText, /^---\n([\s\S]*?)\n---\n/);
  const [, frontmatter, body] = skillText.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const properties = Object.fromEntries(frontmatter.split(/\r?\n/).map((line) => {
    const separator = line.indexOf(":");
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));
  assert.deepEqual(Object.keys(properties).sort(), ["description", "name"]);
  assert.equal(properties.name, skill.name);
  assert.equal(properties.description, skill.description);
  assert.ok(body.trim().length > 0);
  assert.ok(skillText.split(/\r?\n/).length < 500);
  assert.ok(skillText.includes("read-only content endpoints"));
  assert.ok(skillText.includes("do not enforce access restrictions"));
});

test("static discovery MIME types and noindex headers preserve normal HTML indexing", () => {
  const headers = parseHeaders(readSite("public", "_headers"));
  const apiCatalog = headers.get("/.well-known/api-catalog");
  assert.equal(
    apiCatalog.get("Content-Type"),
    'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
  );
  assert.equal(apiCatalog.get("X-Robots-Tag"), "noindex");
  assert.match(apiCatalog.get("Link"), /rel="api-catalog"/);
  const rootLink = headers.get("/").get("Link");
  assert.match(rootLink, /<https:\/\/fonts\.googleapis\.com>; rel="preconnect"/);
  assert.match(rootLink, /<https:\/\/tools\.utildesk\.de\/.well-known\/api-catalog>; rel="api-catalog"/);

  const skillIndex = headers.get("/.well-known/agent-skills/index.json");
  assert.equal(skillIndex.get("Content-Type"), "application/json; charset=utf-8");
  assert.equal(skillIndex.get("X-Robots-Tag"), "noindex");
  const skillFile = headers.get("/.well-known/agent-skills/utildesk-research/SKILL.md");
  assert.equal(skillFile.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.equal(skillFile.get("X-Robots-Tag"), "noindex");
  assert.equal(headers.get("/api/README.md").get("X-Robots-Tag"), "noindex");
  assert.equal(headers.get("/api/openapi.json").get("Content-Type"), "application/vnd.oai.openapi+json");
  assert.equal(headers.get("/api/openapi.json").get("X-Robots-Tag"), "noindex");

  assert.equal(headers.get("/api/*").get("X-Robots-Tag"), "noindex");
  assert.equal(headers.get("/markdown/*").get("X-Robots-Tag"), "noindex");
  assert.equal(headers.get("/feed.json").get("X-Robots-Tag"), "noindex");
  assert.equal(headers.get("/").has("X-Robots-Tag"), false);
  assert.equal(headers.get("/*").get("X-Frame-Options"), "DENY");

  const siteMeta = readSite("src", "lib", "siteMeta.ts");
  assert.match(siteMeta, /DEFAULT_ROBOTS_CONTENT\s*=\s*\n?\s*"index,follow/);
});

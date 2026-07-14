#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";
import { listRuntimeEntries } from "./runtime-content.mjs";

const execFileAsync = promisify(execFile);
const DEFAULT_BASE_URL = "https://tools.utildesk.de";
const DEFAULT_CONTROL_SLUGS = [
  "chatgpt",
  "claude",
  "aider",
  "abbyy-vantage",
  "anyconv",
  "aws-textract",
  "airbyte",
  "browserbase",
  "base44",
  "cohere",
  "8x8",
  "ableton-live",
  "adobe-firefly",
  "hermes-agent",
  "10to8",
  "autogen",
  "crisp",
  "google-search-console",
  "renpy",
  "playwright",
  "postgresql",
  "reply-io",
  "activecampaign",
  "adobe-podcast",
];

const parseArgs = (argv) => {
  const options = { baseUrl: DEFAULT_BASE_URL, outDir: null, slugsFile: null, screenshots: false, cdpUrl: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-url") options.baseUrl = argv[++index];
    else if (arg === "--out") options.outDir = argv[++index];
    else if (arg === "--slugs-file") options.slugsFile = argv[++index];
    else if (arg === "--screenshots") options.screenshots = true;
    else if (arg === "--cdp-url") options.cdpUrl = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.outDir) throw new Error("--out is required");
  return options;
};

const safeSlug = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const normalizedBaseUrl = (value) => String(value).replace(/\/+$/, "");
const decodeEntities = (value) => String(value)
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'")
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">");

const parseAttributes = (tag) => {
  const attributes = {};
  for (const match of String(tag).matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attributes[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
};

const tags = (html, name) => [...String(html).matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => ({
  raw: match[0],
  attributes: parseAttributes(match[0]),
}));

const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort();

export function inspectToolHtml(html) {
  const linkTags = tags(html, "link");
  const metaTags = tags(html, "meta");
  const anchorTags = tags(html, "a");
  const imageTags = tags(html, "img");
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "");
  const jsonLd = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => {
    try {
      const value = JSON.parse(match[1]);
      return {
        valid: true,
        types: uniqueSorted([value?.["@type"], ...(value?.["@graph"] ?? []).map((node) => node?.["@type"])].flat()),
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  });
  const alternates = linkTags.filter(({ attributes }) => attributes.rel?.split(/\s+/).includes("alternate"));
  const canonical = linkTags.find(({ attributes }) => attributes.rel?.split(/\s+/).includes("canonical"))?.attributes.href ?? null;
  const hreflang = Object.fromEntries(alternates
    .filter(({ attributes }) => attributes.hreflang)
    .map(({ attributes }) => [attributes.hreflang, attributes.href]));
  const machineAlternates = alternates
    .filter(({ attributes }) => ["application/json", "text/markdown"].includes(attributes.type))
    .map(({ attributes }) => ({ type: attributes.type, href: attributes.href }));
  const robots = metaTags.find(({ attributes }) => attributes.name?.toLowerCase() === "robots")?.attributes.content ?? null;
  const googlebot = metaTags.find(({ attributes }) => attributes.name?.toLowerCase() === "googlebot")?.attributes.content ?? null;
  const description = metaTags.find(({ attributes }) => attributes.name?.toLowerCase() === "description")?.attributes.content ?? null;
  const hrefs = uniqueSorted(anchorTags.map(({ attributes }) => attributes.href));
  const images = uniqueSorted(imageTags.map(({ attributes }) => attributes.src));

  return {
    title,
    description,
    canonical,
    hreflang,
    robots,
    googlebot,
    machineAlternates,
    jsonLd,
    headingCounts: {
      h1: (html.match(/<h1\b/gi) ?? []).length,
      h2: (html.match(/<h2\b/gi) ?? []).length,
      h3: (html.match(/<h3\b/gi) ?? []).length,
    },
    featureCounts: {
      editorialFigures: (html.match(/\btool-editorial-figure\b/g) ?? []).length,
      alternatives: anchorTags.filter(({ attributes }) =>
        attributes.class?.split(/\s+/).includes("akte-alt-card") && /^\/(?:en\/)?tools\/[a-z0-9-]+\/$/.test(attributes.href ?? ""),
      ).length,
      guideBacklinks: anchorTags.filter(({ attributes }) =>
        attributes.class?.split(/\s+/).includes("akte-alt-card") && /^\/(?:en\/)?ratgeber\/[a-z0-9-]+\/$/.test(attributes.href ?? ""),
      ).length,
      faqNodes: jsonLd.flatMap((item) => item.types ?? []).filter((type) => type === "FAQPage").length,
    },
    internalToolHrefs: hrefs.filter((href) => /^\/(?:en\/)?tools\//.test(href)),
    guideHrefs: hrefs.filter((href) => /^\/(?:en\/)?ratgeber\/[a-z0-9-]+\/$/.test(href)),
    images,
  };
}

const readSlugs = async (path) => {
  if (!path) return DEFAULT_CONTROL_SLUGS;
  const raw = (await readFile(resolve(path), "utf8")).trim();
  return raw.startsWith("[") ? JSON.parse(raw) : raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
};

const toHeaderObject = (headers) => Object.fromEntries([...headers.entries()].sort(([left], [right]) => left.localeCompare(right)));

const screenshot = async (url, destination) => {
  await execFileAsync("google-chrome", [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=390,844",
    `--screenshot=${destination}`,
    url,
  ], { timeout: 60_000, maxBuffer: 1024 * 1024 });
};

const cdpCommand = (socket, pending, method, params = {}) => new Promise((resolveCommand, rejectCommand) => {
  const id = pending.nextId++;
  pending.commands.set(id, { resolve: resolveCommand, reject: rejectCommand });
  socket.send(JSON.stringify({ id, method, params }));
});

const waitForSocket = (socket) => new Promise((resolveSocket, rejectSocket) => {
  socket.addEventListener("open", resolveSocket, { once: true });
  socket.addEventListener("error", () => rejectSocket(new Error("CDP WebSocket connection failed")), { once: true });
});

const screenshotViaCdp = async (cdpUrl, url, destination) => {
  const endpoint = String(cdpUrl).replace(/\/+$/, "");
  const targetResponse = await fetch(`${endpoint}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
  if (!targetResponse.ok) throw new Error(`CDP target creation failed (${targetResponse.status})`);
  const target = await targetResponse.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = { nextId: 1, commands: new Map() };
  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (!payload.id) return;
    const command = pending.commands.get(payload.id);
    if (!command) return;
    pending.commands.delete(payload.id);
    if (payload.error) command.reject(new Error(payload.error.message));
    else command.resolve(payload.result);
  });

  try {
    await waitForSocket(socket);
    await cdpCommand(socket, pending, "Page.enable");
    await cdpCommand(socket, pending, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
      screenWidth: 390,
      screenHeight: 844,
    });
    await cdpCommand(socket, pending, "Page.navigate", { url });
    await cdpCommand(socket, pending, "Runtime.evaluate", {
      expression: `new Promise((resolve) => {
        const done = () => setTimeout(resolve, 500);
        if (document.readyState === "complete") done();
        else window.addEventListener("load", done, { once: true });
        setTimeout(resolve, 10000);
      })`,
      awaitPromise: true,
      returnByValue: true,
    });
    const metricsResult = await cdpCommand(socket, pending, "Runtime.evaluate", {
      expression: `({
        viewportWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body?.scrollWidth ?? 0,
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
      })`,
      returnByValue: true,
    });
    const capture = await cdpCommand(socket, pending, "Page.captureScreenshot", { format: "png", fromSurface: true });
    await writeFile(destination, Buffer.from(capture.data, "base64"));
    return metricsResult.result.value;
  } finally {
    socket.close();
    await fetch(`${endpoint}/json/close/${target.id}`).catch(() => {});
  }
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const baseUrl = normalizedBaseUrl(options.baseUrl);
  const outDir = resolve(options.outDir);
  const htmlDir = join(outDir, "html");
  const screenshotDir = join(outDir, "screenshots-390x844");
  await mkdir(htmlDir, { recursive: true });
  if (options.screenshots) await mkdir(screenshotDir, { recursive: true });

  const slugs = uniqueSorted(await readSlugs(options.slugsFile));
  if (slugs.length < 24) throw new Error(`Control set must contain at least 24 slugs; got ${slugs.length}`);
  for (const slug of slugs) if (!safeSlug(slug)) throw new Error(`Unsafe slug: ${slug}`);

  const [deEntries, enEntries] = await Promise.all([
    listRuntimeEntries({ kind: "tool", locale: "de" }),
    listRuntimeEntries({ kind: "tool", locale: "en" }),
  ]);
  const active = {
    de: deEntries.map((entry) => entry.slug).sort(),
    en: enEntries.map((entry) => entry.slug).sort(),
  };
  await writeFile(join(outDir, "active-slugs-de.json"), `${JSON.stringify(active.de, null, 2)}\n`);
  await writeFile(join(outDir, "active-slugs-en.json"), `${JSON.stringify(active.en, null, 2)}\n`);
  const deBySlug = new Map(deEntries.map((entry) => [entry.slug, entry]));
  const enBySlug = new Map(enEntries.map((entry) => [entry.slug, entry]));
  const records = [];

  for (const slug of slugs) {
    if (!deBySlug.has(slug) || !enBySlug.has(slug)) throw new Error(`${slug}: not active in both locales`);
    for (const locale of ["de", "en"]) {
      const path = `${locale === "en" ? "/en" : ""}/tools/${slug}/`;
      const url = `${baseUrl}${path}`;
      const response = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Utildesk-Runtime-Migration-Baseline/1.0" } });
      const html = await response.text();
      const fileStem = `${locale}-${slug}`;
      await writeFile(join(htmlDir, `${fileStem}.html`), html);
      const viewport = options.screenshots && response.status === 200
        ? options.cdpUrl
          ? await screenshotViaCdp(options.cdpUrl, url, join(screenshotDir, `${fileStem}.png`))
          : await screenshot(url, join(screenshotDir, `${fileStem}.png`)).then(() => null)
        : null;
      const entry = locale === "de" ? deBySlug.get(slug) : enBySlug.get(slug);
      records.push({
        slug,
        locale,
        url,
        path,
        status: response.status,
        headers: toHeaderObject(response.headers),
        bytes: Buffer.byteLength(html),
        htmlSha256: sha256(html),
        sourceHash: entry.sourceHash,
        sourceCommit: entry.sourceCommit,
        editorialReviewed: Boolean(entry.editorialReviewed),
        illustrationPath: entry.illustrationPath,
        searchPolicy: { robots: entry.robotsPolicy, googlebot: entry.googlebotPolicy },
        viewport,
        html: inspectToolHtml(html),
      });
      process.stdout.write(`${response.status} ${locale} ${slug}\n`);
    }
  }

  const invalid = records.filter((record) => record.status !== 200 || record.html.canonical !== record.url || record.html.jsonLd.some((item) => !item.valid));
  const summary = {
    capturedAt: new Date().toISOString(),
    baseUrl,
    viewport: options.screenshots ? { width: 390, height: 844, deviceScaleFactor: 1 } : null,
    controlSlugs: slugs,
    activeCounts: { de: active.de.length, en: active.en.length },
    activeSetParity: JSON.stringify(active.de) === JSON.stringify(active.en),
    recordCount: records.length,
    invalidCount: invalid.length,
    records,
  };
  await writeFile(join(outDir, "manifest.json"), `${JSON.stringify(summary, null, 2)}\n`);
  if (invalid.length) throw new Error(`Baseline failed for ${invalid.length} records; inspect ${join(outDir, "manifest.json")}`);
  process.stdout.write(`Captured ${records.length} records; active DE/EN ${active.de.length}/${active.en.length}; parity ${summary.activeSetParity}\n`);
}

const invokedDirectly = process.argv[1] && basename(process.argv[1]) === basename(new URL(import.meta.url).pathname);
if (invokedDirectly) main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

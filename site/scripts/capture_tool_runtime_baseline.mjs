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
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    canonicalOrigin: null,
    outDir: null,
    slugsFile: null,
    screenshots: false,
    cdpUrl: null,
    all: false,
    runtimePreview: false,
    concurrency: 1,
    viewport: { width: 390, height: 844 },
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-url") options.baseUrl = argv[++index];
    else if (arg === "--canonical-origin") options.canonicalOrigin = argv[++index];
    else if (arg === "--out") options.outDir = argv[++index];
    else if (arg === "--slugs-file") options.slugsFile = argv[++index];
    else if (arg === "--screenshots") options.screenshots = true;
    else if (arg === "--all") options.all = true;
    else if (arg === "--runtime-preview") options.runtimePreview = true;
    else if (arg === "--concurrency") options.concurrency = Number(argv[++index]);
    else if (arg === "--viewport") {
      const match = String(argv[++index] ?? "").match(/^(\d+)x(\d+)$/);
      if (!match) throw new Error("--viewport must be WIDTHxHEIGHT");
      options.viewport = { width: Number(match[1]), height: Number(match[2]) };
    }
    else if (arg === "--cdp-url") options.cdpUrl = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.outDir) throw new Error("--out is required");
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 24) {
    throw new Error("--concurrency must be an integer from 1 to 24");
  }
  return options;
};

const safeSlug = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const normalizedBaseUrl = (value) => String(value).replace(/\/+$/, "");
const fetchWithRetry = async (url, init, attempts = 4) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolveRetry) => setTimeout(resolveRetry, attempt * 250));
    }
  }
  throw lastError;
};
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

const screenshot = async (url, destination, viewport) => {
  await execFileAsync("google-chrome", [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${viewport.width},${viewport.height}`,
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

export const screenshotViaCdp = async (cdpUrl, url, destination, viewport = { width: 390, height: 844 }) => {
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
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width <= 600,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
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
  const canonicalOrigin = normalizedBaseUrl(options.canonicalOrigin || options.baseUrl);
  const outDir = resolve(options.outDir);
  const htmlDir = join(outDir, "html");
  const screenshotDir = join(outDir, `screenshots-${options.viewport.width}x${options.viewport.height}`);
  await mkdir(htmlDir, { recursive: true });
  if (options.screenshots) await mkdir(screenshotDir, { recursive: true });

  const [deEntries, enEntries] = await Promise.all([
    listRuntimeEntries({ kind: "tool", locale: "de" }),
    listRuntimeEntries({ kind: "tool", locale: "en" }),
  ]);
  const active = {
    de: deEntries.map((entry) => entry.slug).sort(),
    en: enEntries.map((entry) => entry.slug).sort(),
  };
  const slugs = uniqueSorted(options.all ? active.de : await readSlugs(options.slugsFile));
  if (slugs.length < 24) throw new Error(`Control set must contain at least 24 slugs; got ${slugs.length}`);
  for (const slug of slugs) if (!safeSlug(slug)) throw new Error(`Unsafe slug: ${slug}`);
  await writeFile(join(outDir, "active-slugs-de.json"), `${JSON.stringify(active.de, null, 2)}\n`);
  await writeFile(join(outDir, "active-slugs-en.json"), `${JSON.stringify(active.en, null, 2)}\n`);
  const deBySlug = new Map(deEntries.map((entry) => [entry.slug, entry]));
  const enBySlug = new Map(enEntries.map((entry) => [entry.slug, entry]));
  const records = [];

  for (const slug of slugs) if (!deBySlug.has(slug) || !enBySlug.has(slug)) throw new Error(`${slug}: not active in both locales`);
  const work = slugs.flatMap((slug) => ["de", "en"].map((locale) => ({ slug, locale })));
  let cursor = 0;
  const captureWorker = async () => {
    while (cursor < work.length) {
      const { slug, locale } = work[cursor++];
      const path = `${locale === "en" ? "/en" : ""}/tools/${slug}/`;
      const requestPath = options.runtimePreview ? `/runtime-preview/${locale}/tools/${slug}/` : path;
      const url = `${baseUrl}${requestPath}`;
      const response = await fetchWithRetry(url, { redirect: "manual", headers: { "User-Agent": "Utildesk-Runtime-Migration-Baseline/1.0" } });
      const html = await response.text();
      const fileStem = `${locale}-${slug}`;
      await writeFile(join(htmlDir, `${fileStem}.html`), html);
      const viewport = options.screenshots && response.status === 200
        ? options.cdpUrl
          ? await screenshotViaCdp(options.cdpUrl, url, join(screenshotDir, `${fileStem}.png`), options.viewport)
          : await screenshot(url, join(screenshotDir, `${fileStem}.png`), options.viewport).then(() => null)
        : null;
      const entry = locale === "de" ? deBySlug.get(slug) : enBySlug.get(slug);
      records.push({
        slug,
        locale,
        url,
        path,
        requestPath,
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
  };
  const concurrency = options.screenshots ? 1 : options.concurrency;
  await Promise.all(Array.from({ length: Math.min(concurrency, work.length) }, captureWorker));
  records.sort((left, right) => left.slug.localeCompare(right.slug) || left.locale.localeCompare(right.locale));

  const invalid = records.filter((record) =>
    record.status !== 200
    || record.html.canonical !== `${canonicalOrigin}${record.path}`
    || record.html.jsonLd.some((item) => !item.valid),
  );
  const summary = {
    capturedAt: new Date().toISOString(),
    baseUrl,
    canonicalOrigin,
    runtimePreview: options.runtimePreview,
    viewport: options.screenshots ? { ...options.viewport, deviceScaleFactor: 1 } : null,
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

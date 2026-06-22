#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");
const DEFAULT_SITE_URL = "https://tools.utildesk.de";
const DEFAULT_CF_ACCOUNT_ID = "f95e0a354dedfcd2eb4f6213e8af207d";
const MAX_OUTPUT_CHARS = 18000;

const MEMORY_FILES = [
  "memory/project_state.md",
  "memory/decisions.md",
  "memory/recent_changes.md",
  "NEXT_STEPS.md",
  "HANDOFF.md",
];

function relPath(...parts) {
  return path.join(ROOT_DIR, ...parts);
}

function toPosix(value) {
  return value.replaceAll(path.sep, "/");
}

function jsonResponse(payload) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function truncate(text, maxChars = MAX_OUTPUT_CHARS) {
  const value = String(text || "");
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n...[truncated ${value.length - maxChars} chars]`;
}

function loadEnvFile(filePath) {
  const loaded = [];
  if (!fs.existsSync(filePath)) return { ok: false, file: filePath, loaded };
  const text = fs.readFileSync(filePath, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!key) continue;
    process.env[key] = value;
    loaded.push(key);
  }
  return { ok: true, file: filePath, loaded };
}

function run(command, args = [], options = {}) {
  const startedAt = new Date().toISOString();
  const executable = process.platform === "win32" && ["npm", "npx"].includes(command)
    ? `${command}.cmd`
    : command;
  const result = spawnSync(executable, args, {
    cwd: options.cwd || ROOT_DIR,
    env: options.env || process.env,
    encoding: "utf8",
    timeout: options.timeoutMs || 120000,
    windowsHide: true,
  });

  return {
    command: executable,
    args,
    cwd: options.cwd || ROOT_DIR,
    startedAt,
    status: result.status,
    signal: result.signal,
    timedOut: result.error?.code === "ETIMEDOUT",
    ok: result.status === 0,
    stdout: truncate(result.stdout || "", options.maxOutputChars),
    stderr: truncate(result.stderr || "", options.maxOutputChars),
    error: result.error ? String(result.error.message || result.error) : null,
  };
}

function git(args, fallback = "") {
  const result = run("git", args, { timeoutMs: 30000, maxOutputChars: 12000 });
  return result.ok ? result.stdout.trim() : fallback;
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, body: markdown };
  const data = {};
  for (const raw of match[1].split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes(":")) continue;
    const idx = line.indexOf(":");
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body: markdown.slice(match[0].length) };
}

function imagePathToFile(imagePath, root = ROOT_DIR) {
  const clean = String(imagePath || "").trim().replace(/^\/+/, "");
  if (!clean) return null;
  if (clean.startsWith("images/")) return path.join(root, "content", clean);
  if (clean.startsWith("content/")) return path.join(root, clean);
  return path.join(root, clean);
}

function distImagePath(imagePath) {
  const clean = String(imagePath || "").trim().replace(/^\/+/, "");
  if (!clean) return null;
  return path.join(ROOT_DIR, "site", "dist", clean);
}

function articleMarkdownCheck(slug, locale) {
  const parts = locale === "en"
    ? ["content", "en", "ratgeber", `${slug}.md`]
    : ["content", "ratgeber", `${slug}.md`];
  const file = relPath(...parts);
  if (!fs.existsSync(file)) {
    return { locale, file: toPosix(path.relative(ROOT_DIR, file)), exists: false, ok: false, issues: ["missing markdown file"] };
  }

  const text = fs.readFileSync(file, "utf8");
  const { data, body } = parseFrontmatter(text);
  const coverImage = data.coverImage || "";
  const secondaryImage = data.secondaryImage || "";
  const imageMatches = [...body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
  const issues = [];
  const warnings = [];

  if (!coverImage) issues.push("missing coverImage frontmatter");
  if (!secondaryImage) warnings.push("missing secondaryImage frontmatter");
  if (coverImage && secondaryImage && coverImage === secondaryImage) issues.push("coverImage and secondaryImage are identical");
  if (coverImage && imageMatches.includes(coverImage)) issues.push("coverImage is also embedded inline in the body");

  const imageRefs = [coverImage, secondaryImage, ...imageMatches].filter(Boolean);
  const imageFiles = imageRefs.map((ref) => {
    const filePath = imagePathToFile(ref);
    return {
      ref,
      file: filePath ? toPosix(path.relative(ROOT_DIR, filePath)) : null,
      exists: filePath ? fs.existsSync(filePath) : false,
    };
  });
  for (const image of imageFiles) {
    if (!image.exists) issues.push(`missing image file: ${image.ref}`);
  }

  return {
    locale,
    file: toPosix(path.relative(ROOT_DIR, file)),
    exists: true,
    ok: issues.length === 0,
    issues,
    warnings,
    frontmatter: {
      title: data.title || null,
      date: data.date || null,
      coverImage: coverImage || null,
      secondaryImage: secondaryImage || null,
    },
    inlineImages: imageMatches,
    imageFiles,
  };
}

function distArticleCheck(slug, locale) {
  const file = locale === "en"
    ? relPath("site", "dist", "en", "ratgeber", slug, "index.html")
    : relPath("site", "dist", "ratgeber", slug, "index.html");
  if (!fs.existsSync(file)) {
    return { locale, file: toPosix(path.relative(ROOT_DIR, file)), exists: false, ok: false, issues: ["missing dist html; run build first"] };
  }

  const html = fs.readFileSync(file, "utf8");
  const imageRefs = [...html.matchAll(/\/images\/ratgeber\/[^"' )<]+/g)].map((match) => match[0]);
  const counts = Object.fromEntries([...new Set(imageRefs)].map((ref) => [ref, imageRefs.filter((item) => item === ref).length]));
  const missingDistImages = Object.keys(counts)
    .map((ref) => ({ ref, file: distImagePath(ref) }))
    .filter((item) => !item.file || !fs.existsSync(item.file))
    .map((item) => item.ref);
  const issues = [];
  if (missingDistImages.length) issues.push(`missing dist images: ${missingDistImages.join(", ")}`);

  return {
    locale,
    file: toPosix(path.relative(ROOT_DIR, file)),
    exists: true,
    ok: issues.length === 0,
    issues,
    imageReferenceCounts: counts,
  };
}

async function fetchCheck(url, options = {}) {
  const startedAt = new Date().toISOString();
  const result = {
    url,
    startedAt,
    ok: false,
    status: null,
    redirectedTo: null,
    contentType: null,
    xRobotsTag: null,
    contains: {},
    mustNotContain: {},
    error: null,
  };
  try {
    const response = await fetch(url, {
      redirect: options.redirect || "manual",
      headers: {
        "user-agent": "utildesk-mcp/1.0",
        "cache-control": "no-cache",
      },
    });
    result.status = response.status;
    result.redirectedTo = response.headers.get("location");
    result.contentType = response.headers.get("content-type");
    result.xRobotsTag = response.headers.get("x-robots-tag");
    const shouldRead = options.readBody !== false && response.status >= 200 && response.status < 400;
    const text = shouldRead ? await response.text() : "";
    for (const needle of options.mustContain || []) {
      result.contains[needle] = text.includes(needle);
    }
    for (const needle of options.mustNotContain || []) {
      result.mustNotContain[needle] = !text.includes(needle);
    }
    const containsOk = Object.values(result.contains).every(Boolean);
    const mustNotOk = Object.values(result.mustNotContain).every(Boolean);
    result.ok = response.status >= 200 && response.status < 400 && containsOk && mustNotOk;
  } catch (error) {
    result.error = String(error?.message || error);
  }
  return result;
}

const server = new McpServer({
  name: "utildesk-mcp",
  version: "0.1.0",
});

server.registerTool("memory_read", {
  title: "Read Utildesk Project Memory",
  description: "Read the standard Utildesk memory files in one compact MCP call.",
  inputSchema: {
    files: z.array(z.enum(MEMORY_FILES)).optional().describe("Specific memory files to read. Defaults to the standard handoff set."),
    maxCharsPerFile: z.number().int().min(1000).max(50000).default(12000),
  },
}, async ({ files, maxCharsPerFile }) => {
  const selected = files?.length ? files : MEMORY_FILES;
  return jsonResponse({
    root: ROOT_DIR,
    files: selected.map((file) => {
      const abs = relPath(file);
      if (!fs.existsSync(abs)) return { file, exists: false };
      const content = fs.readFileSync(abs, "utf8");
      return {
        file,
        exists: true,
        size: content.length,
        truncated: content.length > maxCharsPerFile,
        content: truncate(content, maxCharsPerFile),
      };
    }),
  });
});

server.registerTool("git_preflight", {
  title: "Git Preflight",
  description: "Return branch, remotes, dirty state, ahead/behind, and latest commit for the Utildesk checkout.",
  inputSchema: {},
}, async () => {
  const status = git(["status", "--short", "--branch"]);
  const porcelain = git(["status", "--porcelain=v1"]);
  return jsonResponse({
    root: ROOT_DIR,
    branch: git(["rev-parse", "--abbrev-ref", "HEAD"]),
    head: git(["rev-parse", "--short", "HEAD"]),
    headFull: git(["rev-parse", "HEAD"]),
    upstream: git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], null),
    latestCommit: git(["log", "-1", "--oneline", "--decorate"]),
    dirty: Boolean(porcelain.trim()),
    status,
    remotes: git(["remote", "-v"]),
  });
});

server.registerTool("ratgeber_article_check", {
  title: "Ratgeber Article Image/Build Check",
  description: "Check DE/EN Ratgeber markdown and optional dist HTML for duplicated cover images, missing assets, and image references.",
  inputSchema: {
    slug: z.string().min(1).describe("Ratgeber slug without .md"),
    checkDist: z.boolean().default(true).describe("Also check built site/dist HTML and image assets."),
  },
}, async ({ slug, checkDist }) => {
  const markdown = [articleMarkdownCheck(slug, "de"), articleMarkdownCheck(slug, "en")];
  const dist = checkDist ? [distArticleCheck(slug, "de"), distArticleCheck(slug, "en")] : [];
  const ok = [...markdown, ...dist].every((item) => item.ok);
  return jsonResponse({ slug, ok, markdown, dist });
});

server.registerTool("build_site", {
  title: "Run Utildesk Build Or Checks",
  description: "Run standard local validation commands. Full build can be long; output is truncated.",
  inputSchema: {
    target: z.enum(["full-build", "editorial", "english-tools", "tool-quality", "vendor-audit"]).default("full-build"),
    timeoutSeconds: z.number().int().min(30).max(1200).default(900),
  },
}, async ({ target, timeoutSeconds }) => {
  const commands = {
    "full-build": ["npm", ["--prefix", "site", "run", "build"]],
    editorial: ["npm", ["run", "check:editorial"]],
    "english-tools": ["npm", ["run", "check:tools:en"]],
    "tool-quality": ["npm", ["run", "check:tool-quality"]],
    "vendor-audit": ["npm", ["run", "audit:vendor"]],
  };
  const [cmd, args] = commands[target];
  const result = run(cmd, args, { timeoutMs: timeoutSeconds * 1000, maxOutputChars: 22000 });
  return jsonResponse({ target, result });
});

server.registerTool("live_check_urls", {
  title: "Live URL Check",
  description: "Fetch live URLs with no-cache headers and optional contain / must-not-contain checks.",
  inputSchema: {
    urls: z.array(z.string().url()).min(1).max(30),
    mustContain: z.array(z.string()).default([]),
    mustNotContain: z.array(z.string()).default([]),
    readBody: z.boolean().default(true),
  },
}, async ({ urls, mustContain, mustNotContain, readBody }) => {
  const checks = [];
  for (const url of urls) {
    checks.push(await fetchCheck(url, { mustContain, mustNotContain, readBody }));
  }
  return jsonResponse({
    ok: checks.every((check) => check.ok),
    checks,
  });
});

server.registerTool("sitemap_contract_check", {
  title: "Search Sitemap Contract Check",
  description: "Check live robots.txt and compact sitemap counts for the current Utildesk search contract.",
  inputSchema: {
    baseUrl: z.string().url().default(DEFAULT_SITE_URL),
  },
}, async ({ baseUrl }) => {
  const base = baseUrl.replace(/\/+$/, "");
  const urls = {
    robots: `${base}/robots.txt`,
    sitemap: `${base}/sitemap.xml`,
    sitemapBing: `${base}/sitemap-bing.xml`,
    sitemapFocus: `${base}/sitemap-focus.xml`,
  };
  const checks = {};
  for (const [key, url] of Object.entries(urls)) {
    const response = await fetchCheck(url, { readBody: true });
    let locCount = null;
    let sitemapLines = null;
    if (response.status && response.status >= 200 && response.status < 400) {
      const text = await (await fetch(url, { headers: { "user-agent": "utildesk-mcp/1.0" } })).text();
      locCount = (text.match(/<loc>/g) || []).length;
      sitemapLines = key === "robots"
        ? text.split(/\r?\n/).filter((line) => /^sitemap:/i.test(line.trim()))
        : null;
    }
    checks[key] = { ...response, locCount, sitemapLines };
  }
  const robotsSitemaps = checks.robots.sitemapLines || [];
  const ok = checks.robots.ok
    && checks.sitemap.ok
    && checks.sitemapBing.ok
    && checks.sitemapFocus.ok
    && robotsSitemaps.length === 1
    && /\/sitemap\.xml\s*$/i.test(robotsSitemaps[0] || "");
  return jsonResponse({
    ok,
    base,
    expectedRobotsSitemapOnly: `${base}/sitemap.xml`,
    checks,
  });
});

server.registerTool("deploy_pages", {
  title: "Deploy Cloudflare Pages",
  description: "Deploy site/dist to Cloudflare Pages using the repo .env token and the known fenstek account id. Requires explicit confirmation.",
  inputSchema: {
    confirm: z.literal("deploy utildesk").describe("Required exact confirmation string."),
    projectName: z.string().default("utildesk-motia"),
    branch: z.string().default("master"),
    commitHash: z.string().optional(),
    commitMessage: z.string().optional(),
    accountId: z.string().default(DEFAULT_CF_ACCOUNT_ID),
    timeoutSeconds: z.number().int().min(60).max(900).default(300),
  },
}, async ({ projectName, branch, commitHash, commitMessage, accountId, timeoutSeconds }) => {
  const envLoad = loadEnvFile(relPath(".env"));
  if (!process.env.CLOUDFLARE_API_TOKEN) {
    return jsonResponse({ ok: false, error: "CLOUDFLARE_API_TOKEN missing after loading .env", envLoad });
  }
  process.env.CLOUDFLARE_ACCOUNT_ID = accountId;
  const head = commitHash || git(["rev-parse", "--short", "HEAD"]);
  const message = commitMessage || git(["log", "-1", "--pretty=%s"]);
  const args = [
    "wrangler",
    "pages",
    "deploy",
    "dist",
    "--project-name",
    projectName,
    "--branch",
    branch,
    "--commit-hash",
    head,
    "--commit-message",
    message,
    "--commit-dirty=false",
  ];
  const result = run("npx", args, {
    cwd: relPath("site"),
    timeoutMs: timeoutSeconds * 1000,
    maxOutputChars: 22000,
  });
  return jsonResponse({
    ok: result.ok,
    envLoadedKeys: envLoad.loaded,
    projectName,
    branch,
    commitHash: head,
    result,
  });
});

server.registerTool("indexnow_submit_range", {
  title: "Submit Changed Canonical URLs To IndexNow",
  description: "Run scripts/indexnow_submit.py submit-git-range after live deploy. Requires explicit confirmation.",
  inputSchema: {
    confirm: z.literal("submit indexnow"),
    revRange: z.string().default("HEAD~1..HEAD"),
    waitLive: z.boolean().default(true),
    timeoutSeconds: z.number().int().min(30).max(600).default(240),
  },
}, async ({ revRange, waitLive, timeoutSeconds }) => {
  const args = ["scripts/indexnow_submit.py", "submit-git-range", "--rev-range", revRange];
  if (waitLive) args.push("--wait-live");
  const result = run("python", args, {
    timeoutMs: timeoutSeconds * 1000,
    maxOutputChars: 22000,
  });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    // Keep raw stdout for older helper output.
  }
  return jsonResponse({ ok: result.ok, revRange, waitLive, parsed, result });
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(`[utildesk-mcp] ${error?.stack || error?.message || String(error)}`);
  process.exit(1);
});

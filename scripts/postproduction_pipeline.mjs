#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(__filename), "..");
const DEFAULT_SITE_URL = "https://tools.utildesk.de";
const DEFAULT_REPORT_DIR = path.join(ROOT_DIR, "reports", "postproduction");
const DEFAULT_STATE_FILE = path.join(ROOT_DIR, "tmp", "postproduction-state.json");
const DEFAULT_REV_RANGE = "HEAD~1..HEAD";
const DEFAULT_TIMEOUT_SECONDS = 600;
const DEFAULT_POLL_INTERVAL_SECONDS = 15;
const DEFAULT_RESUBMIT_WINDOW_HOURS = 20;
const DEFAULT_MAX_SUBMIT_URLS = 90;

function die(message) {
  console.error(`[postproduction] ERROR: ${message}`);
  process.exit(1);
}

function log(message) {
  console.log(`[postproduction] ${message}`);
}

function parseArgs(argv) {
  const opts = {
    revRange: DEFAULT_REV_RANGE,
    siteUrl: DEFAULT_SITE_URL,
    reportDir: DEFAULT_REPORT_DIR,
    stateFile: DEFAULT_STATE_FILE,
    urls: [],
    urlFiles: [],
    envFiles: [],
    dryRun: false,
    waitLive: false,
    includeHubs: true,
    submitIndexNow: true,
    submitBing: true,
    submitBingFeeds: false,
    umamiSnapshot: true,
    timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
    pollIntervalSeconds: DEFAULT_POLL_INTERVAL_SECONDS,
    resubmitWindowHours: DEFAULT_RESUBMIT_WINDOW_HOURS,
    maxSubmitUrls: DEFAULT_MAX_SUBMIT_URLS,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) die(`Missing value for ${arg}`);
      return argv[i];
    };

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg === "--rev-range") {
      opts.revRange = next();
    } else if (arg === "--site-url") {
      opts.siteUrl = next();
    } else if (arg === "--report-dir") {
      opts.reportDir = path.resolve(next());
    } else if (arg === "--state-file") {
      opts.stateFile = path.resolve(next());
    } else if (arg === "--url") {
      opts.urls.push(next());
    } else if (arg === "--url-file") {
      opts.urlFiles.push(path.resolve(next()));
    } else if (arg === "--env-file") {
      opts.envFiles.push(path.resolve(next()));
    } else if (arg === "--bing-env-file") {
      opts.bingEnvFile = path.resolve(next());
    } else if (arg === "--timeout-seconds") {
      opts.timeoutSeconds = parsePositiveInt(next(), arg);
    } else if (arg === "--poll-interval") {
      opts.pollIntervalSeconds = parsePositiveInt(next(), arg);
    } else if (arg === "--resubmit-window-hours") {
      opts.resubmitWindowHours = parsePositiveInt(next(), arg);
    } else if (arg === "--max-submit-urls") {
      opts.maxSubmitUrls = parsePositiveInt(next(), arg);
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--wait-live") {
      opts.waitLive = true;
    } else if (arg === "--no-hubs") {
      opts.includeHubs = false;
    } else if (arg === "--no-indexnow") {
      opts.submitIndexNow = false;
    } else if (arg === "--indexnow") {
      opts.submitIndexNow = true;
    } else if (arg === "--no-bing") {
      opts.submitBing = false;
    } else if (arg === "--bing") {
      opts.submitBing = true;
    } else if (arg === "--submit-bing-feeds") {
      opts.submitBingFeeds = true;
    } else if (arg === "--no-submit-bing-feeds") {
      opts.submitBingFeeds = false;
    } else if (arg === "--no-umami") {
      opts.umamiSnapshot = false;
    } else if (arg === "--umami") {
      opts.umamiSnapshot = true;
    } else if (arg === "--json") {
      opts.json = true;
    } else {
      die(`Unknown argument: ${arg}`);
    }
  }

  opts.siteUrl = normalizeSiteUrl(opts.siteUrl);
  return opts;
}

function printHelp() {
  console.log(`Usage: node scripts/postproduction_pipeline.mjs [options]\n\n` +
`Post-production distribution pipeline for tools.utildesk.de.\n\n` +
`Options:\n` +
`  --rev-range <range>          Git range to inspect (default: ${DEFAULT_REV_RANGE})\n` +
`  --url <url>                  Explicit canonical URL, repeatable\n` +
`  --url-file <path>            File with one canonical URL per line, repeatable\n` +
`  --site-url <url>             Public site base URL (default: ${DEFAULT_SITE_URL})\n` +
`  --report-dir <path>          Generated report directory (default: reports/postproduction)\n` +
`  --state-file <path>          Idempotency state file (default: tmp/postproduction-state.json)\n` +
`  --env-file <path>            Extra dotenv file for Umami/Bing env, repeatable\n` +
`  --bing-env-file <path>       Bing helper env file (default: secrets/bing-webmaster.env)\n` +
`  --dry-run                    Do not submit to external services\n` +
`  --wait-live                  Check/wait that canonical URLs are live before submission\n` +
`  --no-indexnow                Do not call scripts/indexnow_submit.py\n` +
`  --no-bing                    Do not call scripts/bing_webmaster_api.py submit-batch\n` +
`  --submit-bing-feeds          Also submit the compact focus sitemap to Bing\n` +
`  --no-umami                  Skip Umami snapshot\n` +
`  --resubmit-window-hours <n>  Skip URLs submitted recently (default: ${DEFAULT_RESUBMIT_WINDOW_HOURS})\n` +
`  --max-submit-urls <n>        Cap external URL submissions per run (default: ${DEFAULT_MAX_SUBMIT_URLS})\n` +
`  --json                       Print final report JSON path/result\n`);
}

function parsePositiveInt(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) die(`${label} must be a positive integer`);
  return parsed;
}

function normalizeSiteUrl(raw) {
  const siteUrl = String(raw || "").trim().replace(/\/+$/, "");
  if (!siteUrl) die("Missing --site-url");
  const parsed = new URL(siteUrl);
  if (!parsed.protocol.startsWith("http") || !parsed.host) die(`Invalid --site-url: ${raw}`);
  return siteUrl;
}

function loadEnvFile(file) {
  if (!file || !fs.existsSync(file)) return { loaded: false, file };
  const text = fs.readFileSync(file, "utf8");
  let count = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
      count += 1;
    }
  }
  return { loaded: true, file, count };
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: options.cwd || ROOT_DIR,
    env: options.env || process.env,
    encoding: "utf8",
    stdio: options.stdio || "pipe",
  });
  return {
    cmd,
    args,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    ok: result.status === 0,
  };
}

function git(args, fallback = "") {
  const result = run("git", args);
  if (!result.ok) return fallback;
  return result.stdout.trim();
}

function readUrlFiles(files) {
  const urls = [];
  for (const file of files) {
    if (!fs.existsSync(file)) die(`URL file does not exist: ${file}`);
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const value = line.trim();
      if (!value || value.startsWith("#")) continue;
      urls.push(value);
    }
  }
  return urls;
}

function urlForPath(siteUrl, urlPath) {
  return `${siteUrl}${urlPath.startsWith("/") ? urlPath : `/${urlPath}`}`;
}

function normalizeAbsoluteUrl(raw, siteUrl) {
  const value = String(raw || "").trim();
  if (!value) return null;
  const url = value.startsWith("/") ? new URL(value, `${siteUrl}/`) : new URL(value);
  const site = new URL(siteUrl);
  if (url.host !== site.host) die(`URL does not belong to ${site.host}: ${value}`);
  url.hash = "";
  return url.toString();
}

function dedupe(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function slugToTitle(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(" ");
}

function parseFrontmatter(file) {
  if (!fs.existsSync(file)) return {};
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const raw of match[1].split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("-") || !line.includes(":")) continue;
    const idx = line.indexOf(":");
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fm[key] = value;
  }
  return fm;
}

function changedFilesFromGit(revRange) {
  const output = git(["diff", "--name-only", revRange], "");
  if (!output) return [];
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function deriveItemsFromFiles(files, siteUrl) {
  const items = [];
  const addTool = (locale, slug, sourcePath) => {
    const file = locale === "en"
      ? path.join(ROOT_DIR, "content", "en", "tools", `${slug}.md`)
      : path.join(ROOT_DIR, "content", "tools", `${slug}.md`);
    const fm = parseFrontmatter(file);
    items.push({
      kind: "tool",
      locale,
      slug,
      sourcePath,
      file,
      title: fm.title || slugToTitle(slug),
      description: fm.description || "",
      officialUrl: fm.official_url || "",
      affiliateUrl: fm.affiliate_url || "",
      category: fm.category || "",
      url: urlForPath(siteUrl, locale === "en" ? `/en/tools/${slug}/` : `/tools/${slug}/`),
    });
  };
  const addRatgeber = (locale, slug, sourcePath) => {
    const file = locale === "en"
      ? path.join(ROOT_DIR, "content", "en", "ratgeber", `${slug}.md`)
      : path.join(ROOT_DIR, "content", "ratgeber", `${slug}.md`);
    const fm = parseFrontmatter(file);
    items.push({
      kind: "ratgeber",
      locale,
      slug,
      sourcePath,
      file,
      title: fm.title || slugToTitle(slug),
      description: fm.excerpt || fm.description || "",
      category: fm.category || "",
      url: urlForPath(siteUrl, locale === "en" ? `/en/ratgeber/${slug}/` : `/ratgeber/${slug}/`),
    });
  };

  for (const sourcePath of files) {
    let match = sourcePath.match(/^content\/tools\/([^/_][^/]*)\.md$/);
    if (match) {
      const slug = match[1];
      addTool("de", slug, sourcePath);
      const enFile = path.join(ROOT_DIR, "content", "en", "tools", `${slug}.md`);
      if (fs.existsSync(enFile)) addTool("en", slug, sourcePath);
      continue;
    }
    match = sourcePath.match(/^content\/en\/tools\/([^/_][^/]*)\.md$/);
    if (match) {
      addTool("en", match[1], sourcePath);
      continue;
    }
    match = sourcePath.match(/^content\/ratgeber\/([^/_][^/]*)\.md$/);
    if (match) {
      const slug = match[1];
      addRatgeber("de", slug, sourcePath);
      const enFile = path.join(ROOT_DIR, "content", "en", "ratgeber", `${slug}.md`);
      if (fs.existsSync(enFile)) addRatgeber("en", slug, sourcePath);
      continue;
    }
    match = sourcePath.match(/^content\/en\/ratgeber\/([^/_][^/]*)\.md$/);
    if (match) {
      addRatgeber("en", match[1], sourcePath);
    }
  }

  return dedupe(items, (item) => `${item.kind}:${item.locale}:${item.slug}`);
}

function buildHubUrls(items, siteUrl) {
  const hubs = [];
  if (items.some((item) => item.kind === "tool")) {
    hubs.push(urlForPath(siteUrl, "/tools/"), urlForPath(siteUrl, "/en/tools/"));
  }
  if (items.some((item) => item.kind === "ratgeber")) {
    hubs.push(urlForPath(siteUrl, "/ratgeber/"), urlForPath(siteUrl, "/en/ratgeber/"));
  }
  if (items.length > 0) hubs.push(urlForPath(siteUrl, "/"));
  return dedupe(hubs, (url) => url);
}

function loadState(file) {
  if (!fs.existsSync(file)) return { version: 1, urls: {}, outreach: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return {
      version: 1,
      urls: parsed.urls && typeof parsed.urls === "object" ? parsed.urls : {},
      outreach: parsed.outreach && typeof parsed.outreach === "object" ? parsed.outreach : {},
    };
  } catch {
    return { version: 1, urls: {}, outreach: {} };
  }
}

function saveState(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function filterRecentUrls(urls, state, windowHours, nowMs) {
  const cutoff = nowMs - windowHours * 60 * 60 * 1000;
  return urls.map((url) => {
    const last = state.urls[url]?.lastSubmittedAt ? Date.parse(state.urls[url].lastSubmittedAt) : 0;
    return {
      url,
      recentlySubmitted: Number.isFinite(last) && last > cutoff,
      lastSubmittedAt: state.urls[url]?.lastSubmittedAt || null,
    };
  });
}

async function fetchLiveStatus(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "utildesk-postproduction/1.0" },
    });
    return { url, ok: response.status >= 200 && response.status < 400, status: response.status };
  } catch (error) {
    return { url, ok: false, status: null, error: String(error.message || error) };
  }
}

async function waitForLiveUrls(urls, timeoutSeconds, pollIntervalSeconds) {
  const deadline = Date.now() + timeoutSeconds * 1000;
  const pending = new Set(urls);
  const results = new Map();
  while (pending.size > 0 && Date.now() <= deadline) {
    for (const url of [...pending]) {
      const status = await fetchLiveStatus(url);
      results.set(url, status);
      if (status.ok) pending.delete(url);
    }
    if (pending.size === 0) break;
    await new Promise((resolve) => setTimeout(resolve, pollIntervalSeconds * 1000));
  }
  return urls.map((url) => results.get(url) || { url, ok: false, status: null, error: "not checked" });
}

function resolvePython() {
  if (process.env.POSTPRODUCTION_PYTHON) return process.env.POSTPRODUCTION_PYTHON;
  const candidates = process.platform === "win32" ? ["python", "py"] : ["python3", "python"];
  for (const candidate of candidates) {
    const result = run(candidate, ["--version"]);
    if (result.ok) return candidate;
  }
  return null;
}

function commandSummary(result) {
  return {
    command: [result.cmd, ...result.args.map((arg) => arg.includes(" ") ? JSON.stringify(arg) : arg)].join(" "),
    ok: result.ok,
    status: result.status,
    stdout: result.stdout.trim().slice(0, 4000),
    stderr: result.stderr.trim().slice(0, 4000),
  };
}

function submitIndexNow(urls, opts) {
  if (!opts.submitIndexNow) return { skipped: true, reason: "disabled" };
  const python = resolvePython();
  if (!python) return { skipped: true, reason: "no Python interpreter" };
  const args = ["scripts/indexnow_submit.py", "submit-batch"];
  for (const url of urls) args.push("--url", url);
  if (opts.waitLive) {
    args.push("--wait-live", "--timeout-seconds", String(opts.timeoutSeconds), "--poll-interval", String(opts.pollIntervalSeconds));
  }
  if (opts.dryRun) args.push("--dry-run");
  const result = run(python, args);
  return commandSummary(result);
}

function hasBingSettings(bingEnvFile) {
  return Boolean(process.env.BING_WEBMASTER_API_KEY) || (bingEnvFile && fs.existsSync(bingEnvFile));
}

function submitBing(urls, opts) {
  if (!opts.submitBing) return { skipped: true, reason: "disabled" };
  if (opts.dryRun) return { skipped: true, reason: "dry-run" };
  const python = resolvePython();
  if (!python) return { skipped: true, reason: "no Python interpreter" };
  const bingEnvFile = opts.bingEnvFile || process.env.BING_ENV_FILE || path.join(ROOT_DIR, "secrets", "bing-webmaster.env");
  if (!hasBingSettings(bingEnvFile)) return { skipped: true, reason: "missing Bing env" };
  const args = ["scripts/bing_webmaster_api.py", "submit-batch"];
  if (bingEnvFile) args.push("--env-file", bingEnvFile);
  for (const url of urls) args.push("--url", url);
  const result = run(python, args);
  return commandSummary(result);
}

function submitBingFeeds(opts) {
  if (!opts.submitBingFeeds) return { skipped: true, reason: "disabled" };
  if (opts.dryRun) return { skipped: true, reason: "dry-run" };
  const python = resolvePython();
  if (!python) return { skipped: true, reason: "no Python interpreter" };
  const bingEnvFile = opts.bingEnvFile || process.env.BING_ENV_FILE || path.join(ROOT_DIR, "secrets", "bing-webmaster.env");
  if (!hasBingSettings(bingEnvFile)) return { skipped: true, reason: "missing Bing env" };
  const feeds = [
    urlForPath(opts.siteUrl, "/sitemap-focus.xml"),
  ];
  const results = [];
  for (const feed of feeds) {
    const args = ["scripts/bing_webmaster_api.py", "submit-feed"];
    if (bingEnvFile) args.push("--env-file", bingEnvFile);
    args.push("--feed-url", feed);
    results.push({ feed, ...commandSummary(run(python, args)) });
  }
  return { feeds, results, ok: results.every((item) => item.ok) };
}

function domainFromUrl(raw) {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function contactGuesses(domain) {
  if (!domain) return [];
  return [`press@${domain}`, `marketing@${domain}`, `hello@${domain}`];
}

function buildOutreachQueue(items, state, nowIso) {
  return items
    .filter((item) => item.kind === "tool" && item.locale === "de")
    .map((item) => {
      const domain = domainFromUrl(item.officialUrl || item.affiliateUrl);
      const key = `${item.kind}:${item.slug}`;
      const alreadyQueuedAt = state.outreach[key]?.queuedAt || null;
      return {
        type: "vendor_outreach",
        status: alreadyQueuedAt ? "already_queued" : "draft",
        queuedAt: alreadyQueuedAt || nowIso,
        slug: item.slug,
        title: item.title,
        canonicalUrl: item.url,
        officialUrl: item.officialUrl || item.affiliateUrl || "",
        domain,
        suggestedTargets: contactGuesses(domain),
        subject: `Utildesk hat ${item.title} aufgenommen`,
        body_de: `Hallo ${item.title}-Team,\n\nwir haben ${item.title} in den Utildesk-Katalog für KI- und Workflow-Tools aufgenommen:\n${item.url}\n\nWenn die Einordnung passt, freuen wir uns über Feedback, Korrekturen oder einen Hinweis auf eurer Website/LinkedIn.\n\nViele Grüße\nUtildesk Redaktion`,
        body_en: `Hi ${item.title} team,\n\nwe added ${item.title} to the Utildesk catalog for AI and workflow tools:\n${item.url}\n\nIf the profile looks useful, we would appreciate feedback, corrections, or a small mention from your website/LinkedIn.\n\nBest\nUtildesk Editorial Team`,
      };
    });
}

function buildLinkedInDrafts(items, siteUrl) {
  const lines = [];
  lines.push("# LinkedIn-Drafts");
  lines.push("");
  for (const item of items.filter((entry) => entry.locale === "de")) {
    if (item.kind === "tool") {
      lines.push(`## Neu im Katalog: ${item.title}`);
      lines.push("");
      lines.push(`Neu bei Utildesk: ${item.title}.`);
      if (item.description) lines.push("");
      if (item.description) lines.push(item.description);
      lines.push("");
      lines.push(`Einordnung, Einsatzszenarien, Grenzen und Alternativen: ${item.url}`);
      lines.push("");
      lines.push("#KITools #Workflow #SaaS #Automation");
      lines.push("");
    } else if (item.kind === "ratgeber") {
      lines.push(`## Ratgeber: ${item.title}`);
      lines.push("");
      lines.push(item.description || "Neuer Praxisbeitrag im Utildesk Ratgeber.");
      lines.push("");
      lines.push(`Zum Beitrag: ${item.url}`);
      lines.push("");
      lines.push("#KI #Automation #Digitalisierung #Workflows");
      lines.push("");
    }
  }
  if (items.length === 0) {
    lines.push(`Keine neuen Content-Items im gewählten Lauf. Site: ${siteUrl}`);
  }
  return `${lines.join("\n")}\n`;
}

function buildNewsletterDraft(items) {
  const deItems = items.filter((item) => item.locale === "de");
  const lines = [];
  lines.push("# Newsletter-Draft: Neue Utildesk-Veröffentlichungen");
  lines.push("");
  if (deItems.length === 0) {
    lines.push("Keine neuen Veröffentlichungen im gewählten Lauf.");
    return `${lines.join("\n")}\n`;
  }
  const tools = deItems.filter((item) => item.kind === "tool");
  const ratgeber = deItems.filter((item) => item.kind === "ratgeber");
  if (tools.length) {
    lines.push("## Neue Tool-Karten");
    lines.push("");
    for (const item of tools) {
      lines.push(`- [${item.title}](${item.url})${item.description ? ` — ${item.description}` : ""}`);
    }
    lines.push("");
  }
  if (ratgeber.length) {
    lines.push("## Neue Ratgeber");
    lines.push("");
    for (const item of ratgeber) {
      lines.push(`- [${item.title}](${item.url})${item.description ? ` — ${item.description}` : ""}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function buildCommunityDrafts(items, siteUrl) {
  const deItems = items.filter((item) => item.locale === "de");
  const tools = deItems.filter((item) => item.kind === "tool");
  const ratgeber = deItems.filter((item) => item.kind === "ratgeber");
  const lines = [];
  lines.push("# Community- und Launch-Drafts");
  lines.push("");
  lines.push("> Nicht stumpf überall posten. Diese Entwürfe sind Vorlagen für wertbasierte Posts mit Kontext.");
  lines.push("");

  lines.push("## Makerhunt / Product-Hunt-Update");
  lines.push("");
  if (tools.length) {
    lines.push(`Utildesk update: ${tools.length} neue KI- und Workflow-Toolprofile sind live.`);
    lines.push("");
    for (const item of tools.slice(0, 12)) {
      lines.push(`- ${item.title}: ${item.url}`);
    }
  } else if (ratgeber.length) {
    lines.push("Utildesk update: neuer Praxisbeitrag im Ratgeber ist live.");
    lines.push("");
    for (const item of ratgeber.slice(0, 5)) {
      lines.push(`- ${item.title}: ${item.url}`);
    }
  } else {
    lines.push(`Utildesk update: ${siteUrl}`);
  }
  lines.push("");

  lines.push("## Reddit / Indie-Hackers Ansatz");
  lines.push("");
  if (tools.length) {
    lines.push("Titelidee: I compared a batch of AI workflow tools — here are the patterns I noticed");
    lines.push("");
    lines.push("Postidee:");
    lines.push("");
    lines.push("I am building a German/English catalog of AI and workflow tools. In this batch I noticed a few recurring patterns:");
    lines.push("");
    lines.push("- teams need clearer limits, not just feature lists;");
    lines.push("- pricing and data handling are often harder to compare than model quality;");
    lines.push("- good tools explain the workflow they fit into.");
    lines.push("");
    lines.push("The current batch:");
    for (const item of tools.slice(0, 8)) {
      lines.push(`- ${item.title} — ${item.url}`);
    }
    lines.push("");
    lines.push("Feedback on missing tools or weak comparisons is welcome.");
  } else if (ratgeber.length) {
    const first = ratgeber[0];
    lines.push(`Titelidee: ${first.title}`);
    lines.push("");
    lines.push(first.description || "I wrote a practical note about AI workflows and where automation helps or becomes risky.");
    lines.push("");
    lines.push(`Source: ${first.url}`);
  }
  lines.push("");

  lines.push("## Hacker News Guardrail");
  lines.push("");
  lines.push("Nur posten, wenn es einen echten technischen/produktiven Erkenntniswert gibt. Kein reiner Linkdrop.");
  lines.push("Geeignet sind: Datenanalyse, öffentliches Dataset, Tool-Methodik, Architektur- oder Crawling-Learnings.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function umamiRequest(baseUrl, token, pathPart) {
  const response = await fetch(`${baseUrl}${pathPart}`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/json" },
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return data;
}

function compactStats(stats) {
  if (!stats || typeof stats !== "object") return stats;
  const out = {};
  for (const [key, value] of Object.entries(stats)) {
    out[key] = value && typeof value === "object" && "value" in value ? value.value : value;
  }
  return out;
}

async function getUmamiSnapshot() {
  const baseUrl = (process.env.UMAMI_BASE_URL || "https://stats.utildesk.de").replace(/\/+$/, "");
  const websiteId = process.env.UMAMI_WEBSITE_ID || process.env.PUBLIC_UMAMI_WEBSITE_ID;
  const username = process.env.UMAMI_USERNAME;
  const password = process.env.UMAMI_PASSWORD;
  if (!websiteId || !username || !password) return { skipped: true, reason: "missing Umami env" };

  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!loginResponse.ok) return { skipped: true, reason: `login failed: ${loginResponse.status}` };
  const login = await loginResponse.json();
  const token = login.token;
  const now = Date.now();
  const ranges = { "7d": 7, "30d": 30 };
  const snapshot = { baseUrl, websiteId: websiteId.replace(/^(.{8}).+(.{6})$/, "$1…$2"), ranges: {} };
  for (const [label, days] of Object.entries(ranges)) {
    const startAt = now - days * 86400000;
    const qs = `startAt=${startAt}&endAt=${now}`;
    const stats = await umamiRequest(baseUrl, token, `/api/websites/${websiteId}/stats?${qs}`).catch((error) => ({ error: error.message }));
    const metrics = {};
    for (const type of ["path", "referrer", "country"]) {
      const data = await umamiRequest(baseUrl, token, `/api/websites/${websiteId}/metrics?${qs}&type=${type}`).catch((error) => ({ error: error.message }));
      metrics[type] = Array.isArray(data) ? data.slice(0, 12) : data;
    }
    snapshot.ranges[label] = { stats: compactStats(stats), metrics };
  }
  return snapshot;
}

function writeArtifacts(reportDir, report, outreachQueue, linkedInDrafts, newsletterDraft, communityDrafts, urls) {
  const runDir = path.join(reportDir, report.runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, "urls.txt"), `${urls.join("\n")}\n`, "utf8");
  fs.writeFileSync(path.join(runDir, "outreach.jsonl"), outreachQueue.map((item) => JSON.stringify(item)).join("\n") + (outreachQueue.length ? "\n" : ""), "utf8");
  fs.writeFileSync(path.join(runDir, "linkedin-drafts.md"), linkedInDrafts, "utf8");
  fs.writeFileSync(path.join(runDir, "newsletter-draft.md"), newsletterDraft, "utf8");
  fs.writeFileSync(path.join(runDir, "community-drafts.md"), communityDrafts, "utf8");
  fs.writeFileSync(path.join(runDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return runDir;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  for (const file of [path.join(ROOT_DIR, ".env"), path.join(ROOT_DIR, "site", ".env"), ...opts.envFiles]) {
    loadEnvFile(file);
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const runId = nowIso.replace(/[:.]/g, "-");
  const state = loadState(opts.stateFile);

  const changedFiles = changedFilesFromGit(opts.revRange);
  const derivedItems = deriveItemsFromFiles(changedFiles, opts.siteUrl);
  const explicitUrls = [...opts.urls, ...readUrlFiles(opts.urlFiles)].map((url) => normalizeAbsoluteUrl(url, opts.siteUrl)).filter(Boolean);
  const contentUrls = derivedItems.map((item) => item.url);
  const hubUrls = opts.includeHubs ? buildHubUrls(derivedItems, opts.siteUrl) : [];
  const allUrls = dedupe([...contentUrls, ...explicitUrls, ...hubUrls], (url) => url);

  const recentInfo = filterRecentUrls(allUrls, state, opts.resubmitWindowHours, now.getTime());
  const eligibleSubmitUrls = recentInfo.filter((item) => !item.recentlySubmitted).map((item) => item.url);
  const submitUrls = eligibleSubmitUrls.slice(0, opts.maxSubmitUrls);
  const deferredSubmitUrls = eligibleSubmitUrls.slice(opts.maxSubmitUrls);

  log(`rev_range=${opts.revRange}`);
  log(`changed_files=${changedFiles.length} content_items=${derivedItems.length} urls=${allUrls.length} submit_urls=${submitUrls.length}`);
  if (deferredSubmitUrls.length) {
    log(`deferred_urls=${deferredSubmitUrls.length} because max_submit_urls=${opts.maxSubmitUrls}`);
  }
  if (opts.dryRun) log("dry-run enabled: external submissions are skipped or simulated");

  const liveCheck = opts.waitLive && allUrls.length
    ? await waitForLiveUrls(allUrls, opts.timeoutSeconds, opts.pollIntervalSeconds)
    : { skipped: true, reason: "disabled" };

  const submissionResults = {
    indexnow: submitUrls.length ? submitIndexNow(submitUrls, opts) : { skipped: true, reason: "no eligible URLs" },
    bing: submitUrls.length ? submitBing(submitUrls, opts) : { skipped: true, reason: "no eligible URLs" },
    bingFeeds: submitBingFeeds(opts),
  };

  const umamiSnapshot = opts.umamiSnapshot ? await getUmamiSnapshot().catch((error) => ({ skipped: true, reason: error.message })) : { skipped: true, reason: "disabled" };
  const outreachQueue = buildOutreachQueue(derivedItems, state, nowIso);
  const linkedInDrafts = buildLinkedInDrafts(derivedItems, opts.siteUrl);
  const newsletterDraft = buildNewsletterDraft(derivedItems);
  const communityDrafts = buildCommunityDrafts(derivedItems, opts.siteUrl);

  if (!opts.dryRun) {
    for (const url of submitUrls) {
      state.urls[url] = { lastSubmittedAt: nowIso, revRange: opts.revRange };
    }
    for (const item of outreachQueue) {
      const key = `tool:${item.slug}`;
      if (!state.outreach[key]) state.outreach[key] = { queuedAt: nowIso, canonicalUrl: item.canonicalUrl };
    }
    saveState(opts.stateFile, state);
  }

  const report = {
    ok: true,
    runId,
    generatedAt: nowIso,
    hostname: os.hostname(),
    cwd: ROOT_DIR,
    dryRun: opts.dryRun,
    revRange: opts.revRange,
    siteUrl: opts.siteUrl,
    changedFiles,
    items: derivedItems,
    urls: allUrls,
    submitUrls,
    deferredSubmitUrls,
    recentlySubmitted: recentInfo.filter((item) => item.recentlySubmitted),
    liveCheck,
    submissions: submissionResults,
    outreach: {
      count: outreachQueue.length,
      draftCount: outreachQueue.filter((item) => item.status === "draft").length,
      alreadyQueuedCount: outreachQueue.filter((item) => item.status === "already_queued").length,
    },
    communityDrafts: true,
    umami: umamiSnapshot,
  };

  const runDir = writeArtifacts(opts.reportDir, report, outreachQueue, linkedInDrafts, newsletterDraft, communityDrafts, allUrls);
  report.reportDir = runDir;
  fs.writeFileSync(path.join(runDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(opts.reportDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (opts.json) {
    console.log(JSON.stringify({ ok: true, reportDir: runDir, urls: allUrls.length, submitUrls: submitUrls.length, outreach: report.outreach, umamiSkipped: Boolean(umamiSnapshot?.skipped) }, null, 2));
  } else {
    log(`report: ${runDir}`);
    log(`outreach_drafts=${report.outreach.draftCount} linkedin/newsletter drafts generated`);
  }
}

main().catch((error) => die(error.stack || error.message || String(error)));

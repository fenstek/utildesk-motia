#!/usr/bin/env node
import process from "node:process";

function parseArgs(argv) {
  const opts = {
    base: process.env.PROD_BASE_URL || "https://tools.utildesk.de",
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = String(argv[i] || "");
    if (arg === "--base") {
      opts.base = String(argv[i + 1] || "").trim();
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!opts.base) throw new Error("Missing --base or PROD_BASE_URL");
  opts.base = opts.base.replace(/\/+$/, "");
  return opts;
}

async function fetchPage(url) {
  const res = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": "utildesk-prod-check/1.0" },
  });
  const text = res.status === 200 ? await res.text() : "";
  return { status: res.status, location: res.headers.get("location") || "", text };
}

function has(text, pattern) {
  return pattern.test(text);
}

async function main() {
  const opts = parseArgs(process.argv);
  const base = opts.base;
  const failures = [];
  const checks = [];

  const required = [
    {
      slug: "hugging-face",
      mustContain: /https:\/\/huggingface\.co\/?/i,
      mustNotContain: /https:\/\/hugging-face\.com\/?/i,
    },
    {
      slug: "spacy",
      mustContain: /https:\/\/spacy\.io\/?/i,
      mustNotContain: /https:\/\/spacy\.com\/?/i,
    },
  ];

  const forbidden = ["explainable-ai", "transformers"];

  for (const item of required) {
    const url = `${base}/tools/${item.slug}/`;
    const page = await fetchPage(url);
    checks.push({ slug: item.slug, url, status: page.status, location: page.location || null });
    if (page.status !== 200) {
      failures.push(`${item.slug}: expected 200, got ${page.status}`);
      continue;
    }
    if (!has(page.text, item.mustContain)) {
      failures.push(`${item.slug}: missing expected domain`);
    }
    if (has(page.text, item.mustNotContain)) {
      failures.push(`${item.slug}: old domain still present`);
    }
  }

  for (const slug of forbidden) {
    const url = `${base}/tools/${slug}/`;
    const page = await fetchPage(url);
    checks.push({ slug, url, status: page.status, location: page.location || null });
    if (page.status === 200) {
      failures.push(`${slug}: expected non-200, got 200`);
    }
  }

  const payload = {
    ok: failures.length === 0,
    base,
    checks,
    failures,
  };

  console.log(JSON.stringify(payload, null, 2));
  process.exit(failures.length === 0 ? 0 : 2);
}

main().catch((error) => {
  console.error(`ERROR: ${error?.message || String(error)}`);
  process.exit(1);
});

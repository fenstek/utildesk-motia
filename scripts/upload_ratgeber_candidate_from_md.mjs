#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "../site/node_modules/gray-matter/index.js";
import { marked } from "../site/node_modules/marked/lib/marked.esm.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback = "") {
  const prefix = `--${name}=`;
  return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length) || fallback;
}

function readEnvFile(filePath) {
  const values = new Map();
  if (!filePath) return values;
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    values.set(key.trim(), rest.join("=").trim().replace(/^["']|["']$/g, ""));
  }
  return values;
}

function stripTopHeading(markdown) {
  return String(markdown || "").replace(/^\s*# .+?\r?\n+/, "").trim();
}

function imageAsset(role, filePath) {
  const body = readFileSync(filePath);
  const lower = filePath.toLowerCase();
  const contentType = lower.endsWith(".webp")
    ? "image/webp"
    : lower.endsWith(".jpg") || lower.endsWith(".jpeg")
      ? "image/jpeg"
      : "image/png";
  return {
    role,
    name: role === "cover" ? "cover.png" : "workflow.png",
    contentType,
    base64: body.toString("base64"),
  };
}

function toIsoDate(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const articlePath = path.resolve(ROOT, arg("article"));
  const coverPath = path.resolve(ROOT, arg("cover"));
  const workflowPath = path.resolve(ROOT, arg("workflow"));
  const jobId = arg("job-id");
  if (!articlePath || !coverPath || !workflowPath || !jobId) {
    throw new Error("Usage: node scripts/upload_ratgeber_candidate_from_md.mjs --article=... --cover=... --workflow=... --job-id=...");
  }

  const endpoint = arg("endpoint", "https://tools.utildesk.de/admin/ratgeber/api/upload");
  const envFile = path.resolve(ROOT, arg("token-env", "secrets/ratgeber_review_backend.env"));
  const env = readEnvFile(envFile);
  const token = process.env.RATGEBER_UPLOAD_TOKEN || env.get("RATGEBER_UPLOAD_TOKEN");
  if (!token) throw new Error(`Missing RATGEBER_UPLOAD_TOKEN in env or ${envFile}`);

  const parsed = matter(readFileSync(articlePath, "utf8"));
  const bodyMarkdown = stripTopHeading(parsed.content);
  const articleHtml = String(marked.parse(bodyMarkdown.replaceAll(parsed.data.secondaryImage || "", "__WORKFLOW_IMAGE_URL__")));
  const tags = Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [];
  const candidate = {
    jobId,
    title: String(parsed.data.title || jobId),
    slug: String(parsed.data.slug || jobId),
    excerpt: String(parsed.data.excerpt || ""),
    status: "review_ready",
    reviewStatus: "review_ready",
    score: null,
    visualStatus: "png_ready",
    createdAt: new Date().toISOString(),
    articleHtml,
    meta: {
      published: toIsoDate(parsed.data.date),
      readTime: Number(parsed.data.readTime || 0),
      category: String(parsed.data.category || ""),
      eyebrow: String(parsed.data.eyebrow || "Ratgeber"),
      tags,
      relatedTools: Array.isArray(parsed.data.relatedTools) ? parsed.data.relatedTools : [],
      sidebarTitle: String(parsed.data.sidebarTitle || "Kurzfazit"),
      sidebarPoints: Array.isArray(parsed.data.sidebarPoints) ? parsed.data.sidebarPoints.map(String) : [],
    },
    audit: {
      source: path.relative(ROOT, articlePath),
      uploadTool: "upload_ratgeber_candidate_from_md.mjs",
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      candidate,
      assets: [imageAsset("cover", coverPath), imageAsset("workflow", workflowPath)],
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Upload failed HTTP ${response.status}: ${text.slice(0, 1000)}`);
  }
  console.log(text);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

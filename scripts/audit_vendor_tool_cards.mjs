#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const toolsDir = path.join(repoRoot, 'content', 'tools');
const enToolsDir = path.join(repoRoot, 'content', 'en', 'tools');
const searchPolicyPath = path.join(repoRoot, 'site', 'src', 'lib', 'searchIndexPolicy.mjs');

const EXACT_DUPLICATE_GROUPS = [
  {
    canonical: 'aws-sagemaker',
    duplicates: ['amazon-sagemaker'],
    reason: 'Amazon SageMaker should have one canonical active page; keep aws-sagemaker.',
  },
  {
    canonical: 'amazon-emr',
    duplicates: ['aws-emr'],
    reason: 'Amazon EMR should have one canonical active page; keep amazon-emr.',
  },
  {
    canonical: 'google-cloud-translation',
    duplicates: ['google-cloud-translation-api'],
    reason: 'Cloud Translation product/API split is duplicate for this catalogue; keep google-cloud-translation.',
  },
  {
    canonical: 'azure-synapse-analytics',
    duplicates: ['microsoft-azure-synapse-analytics'],
    reason: 'Azure Synapse should have one canonical active page; keep azure-synapse-analytics.',
  },
];

const DISALLOW_FORCE_INDEX = new Set([
  'amazon-sagemaker',
  'aws-emr',
  'copilot',
  'google-cloud-translation-api',
  'microsoft-azure-synapse-analytics',
]);

const KNOWN_OFFICIAL_URL_RULES = [
  {
    slug: 'amazon-sagemaker',
    test: (url) => /openai\.com/i.test(url),
    message: 'amazon-sagemaker must not point to the OpenAI/Amazon partnership article; use the AWS SageMaker product URL or disable the duplicate.',
  },
  {
    slug: 'google-tasks',
    test: (url) => /accounts\.google\.com/i.test(url),
    message: 'google-tasks must not point to a transient Google login URL; use the Workspace Tasks product URL.',
  },
  {
    slug: 'google-ai',
    test: (url) => /^http:\/\/ai\.google\/?$/i.test(url),
    message: 'google-ai should use https://ai.google/.',
  },
  {
    slug: 'copilot',
    test: (url, data) => /assembly\.com\/?$/i.test(url) && !/Assembly/i.test(String(data.title || '')),
    message: 'copilot is ambiguous; if this is the Assembly client portal, title it as Assembly and keep it out of forced Google indexing.',
  },
  {
    slug: 'google-cloud-translation-api',
    test: (url) => /docs\.cloud\.google\.com\/translate\/docs/i.test(url),
    message: 'google-cloud-translation-api should not be an active duplicate pointing at docs; keep the product page canonical instead.',
  },
];

function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { data: {}, body: text };
  const data = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const kv = /^(?<key>[A-Za-z0-9_-]+)\s*:\s*(?<value>.*)$/.exec(line);
    if (!kv) continue;
    const key = kv.groups.key;
    let value = kv.groups.value.trim();
    value = value.replace(/^['"]|['"]$/g, '');
    data[key] = value;
  }
  return { data, body: text.slice(match[0].length) };
}

function readEntry(dir, slug) {
  const file = path.join(dir, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8');
  const parsed = parseFrontmatter(text);
  const disabled = parsed.data.disabled === true || String(parsed.data.disabled || '').toLowerCase() === 'true';
  return { file, slug, disabled, ...parsed };
}

function listEntries(dir) {
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
    .map((file) => {
      const slug = file.replace(/\.md$/i, '');
      return readEntry(dir, slug);
    })
    .filter(Boolean);
}

function extractForceIndexSlugs() {
  const text = fs.readFileSync(searchPolicyPath, 'utf8');
  const match = /const FORCE_INDEX_TOOL_SLUGS = new Set\(\[([\s\S]*?)\]\);/.exec(text);
  if (!match) return new Set();
  return new Set([...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]));
}

const entries = listEntries(toolsDir);
const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
const enBySlug = new Map(listEntries(enToolsDir).map((entry) => [entry.slug, entry]));
const forceIndexSlugs = extractForceIndexSlugs();
const issues = [];

for (const group of EXACT_DUPLICATE_GROUPS) {
  const canonical = bySlug.get(group.canonical);
  if (!canonical || canonical.disabled) {
    issues.push({ severity: 'error', slug: group.canonical, reason: `canonical page is missing or disabled: ${group.reason}` });
  }
  for (const duplicateSlug of group.duplicates) {
    const duplicate = bySlug.get(duplicateSlug);
    if (duplicate && !duplicate.disabled) {
      issues.push({ severity: 'error', slug: duplicateSlug, reason: `duplicate active page: ${group.reason}` });
    }
    const enDuplicate = enBySlug.get(duplicateSlug);
    if (enDuplicate && !enDuplicate.disabled) {
      issues.push({ severity: 'error', slug: `en/${duplicateSlug}`, reason: `duplicate active English page: ${group.reason}` });
    }
  }
}

for (const rule of KNOWN_OFFICIAL_URL_RULES) {
  const entry = bySlug.get(rule.slug);
  if (!entry || entry.disabled) continue;
  const url = String(entry.data.official_url || '');
  if (rule.test(url, entry.data)) {
    issues.push({ severity: 'error', slug: rule.slug, reason: rule.message, official_url: url });
  }
  const enEntry = enBySlug.get(rule.slug);
  if (enEntry && !enEntry.disabled) {
    const enUrl = String(enEntry.data.official_url || '');
    if (rule.test(enUrl, enEntry.data)) {
      issues.push({ severity: 'error', slug: `en/${rule.slug}`, reason: rule.message, official_url: enUrl });
    }
  }
}

for (const slug of DISALLOW_FORCE_INDEX) {
  if (forceIndexSlugs.has(slug)) {
    issues.push({ severity: 'error', slug, reason: 'ambiguous/duplicate vendor page must not be in FORCE_INDEX_TOOL_SLUGS' });
  }
}

const vendorMatchers = {
  amazon_aws: /(^|[-\s])(amazon|aws)([-\s]|$)|amazon|aws/i,
  google: /google|gemini|firebase|vertex|document-ai|cloud-vision|bigquery|colab|looker|youtube|notebooklm/i,
  microsoft: /microsoft|azure|copilot|power\s*bi|powerpoint|excel|teams|onedrive|sharepoint|bing|github-copilot/i,
};
const summary = Object.fromEntries(Object.keys(vendorMatchers).map((key) => [key, { active: 0, disabled: 0 }]));
for (const entry of entries) {
  const haystack = `${entry.slug} ${entry.data.title || ''} ${entry.data.official_url || ''}`;
  for (const [key, matcher] of Object.entries(vendorMatchers)) {
    if (!matcher.test(haystack)) continue;
    summary[key][entry.disabled ? 'disabled' : 'active'] += 1;
  }
}

const result = {
  ok: issues.length === 0,
  issue_count: issues.length,
  issues,
  summary,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else if (issues.length) {
  console.error(`Vendor tool-card audit failed with ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.error(`- [${issue.severity}] ${issue.slug}: ${issue.reason}${issue.official_url ? ` (${issue.official_url})` : ''}`);
  }
} else {
  console.log('Vendor tool-card audit passed.');
  console.log(JSON.stringify({ summary }, null, 2));
}

if (issues.length) process.exit(1);
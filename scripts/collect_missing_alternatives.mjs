#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';

const DEFAULT_SOURCE = '/tmp/audit_alternatives_render_v2.json';

function parseArgs(argv) {
  const opts = {
    source: DEFAULT_SOURCE,
    top: 50,
    minCount: 2,
    json: true,
    pretty: false,
    out: '',
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = String(argv[i] || '');

    if (arg === '--top') {
      const n = Number(argv[i + 1] || '');
      if (!Number.isFinite(n) || n < 1) throw new Error('--top requires a positive integer');
      opts.top = Math.floor(n);
      i += 1;
      continue;
    }

    if (arg === '--min-count') {
      const n = Number(argv[i + 1] || '');
      if (!Number.isFinite(n) || n < 1) throw new Error('--min-count requires a positive integer');
      opts.minCount = Math.floor(n);
      i += 1;
      continue;
    }

    if (arg === '--json') {
      opts.json = true;
      continue;
    }

    if (arg === '--pretty') {
      opts.pretty = true;
      continue;
    }

    if (arg === '--out') {
      const p = String(argv[i + 1] || '').trim();
      if (!p) throw new Error('--out requires <path>');
      opts.out = p;
      i += 1;
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    opts.source = arg;
  }

  return opts;
}

function toStringValue(v) {
  return String(v ?? '').trim();
}

async function main() {
  const opts = parseArgs(process.argv);

  const raw = await readFile(opts.source, 'utf8');
  const audit = JSON.parse(raw);
  const pages = Array.isArray(audit.items) ? audit.items : [];

  const freq = new Map();
  let totalMissingTitleNotFound = 0;

  for (const page of pages) {
    const missing = Array.isArray(page?.missingMatches) ? page.missingMatches : [];
    for (const mm of missing) {
      if (!mm || mm.reason !== 'title_not_found') continue;
      totalMissingTitleNotFound += 1;

      const name = toStringValue(mm.detail);
      if (!name) continue;
      freq.set(name, (freq.get(name) || 0) + 1);
    }
  }

  const items = [...freq.entries()]
    .map(([name, count]) => ({ name, count }))
    .filter((x) => x.count >= opts.minCount)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, opts.top);

  const result = {
    sourceFile: opts.source,
    totals: {
      pages: pages.length,
      missingTitleNotFound: totalMissingTitleNotFound,
      uniqueNames: freq.size,
      returnedItems: items.length,
      top: opts.top,
      minCount: opts.minCount,
    },
    items,
  };

  const outText = opts.pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);

  if (opts.out) {
    await writeFile(opts.out, outText + '\n', 'utf8');
    process.stderr.write(`[info] wrote output to ${opts.out}\n`);
  }

  if (opts.json) {
    process.stdout.write(outText + '\n');
    return;
  }

  process.stdout.write(outText + '\n');
}

main().catch((err) => {
  process.stderr.write(`${err.message || String(err)}\n`);
  process.exit(1);
});

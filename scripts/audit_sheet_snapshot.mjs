#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const proc = spawnSync('node', ['scripts/audit_publish_preflight.mjs', ...args], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env,
});

if (proc.error) {
  console.error(proc.error.message);
  process.exit(1);
}

process.exit(proc.status ?? 1);

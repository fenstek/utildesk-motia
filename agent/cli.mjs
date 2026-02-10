#!/usr/bin/env node
/**
 * Autonomous Engineering Agent CLI
 *
 * Usage:
 *   node agent/cli.mjs --task "run validation" --check "node scripts/sheet_ai_autogen_9_strict_v2.mjs 5 --dry-run --json"
 *   node agent/cli.mjs --task "fix linter" --check "npm run lint" --mode local
 *   node agent/cli.mjs --task "pass tests" --check "npm test" --max-iterations 5
 */

import 'dotenv/config';
import { AgentCore } from './core.mjs';
import { loadConfig } from './config.mjs';

function parseArgs(argv) {
  const args = {
    task: '',
    check: '',
    mode: 'local', // local | ssh
    maxIterations: 10,
    branch: '',
    verbose: false,
    dryRun: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case '--task':
        args.task = next;
        i++;
        break;
      case '--check':
        args.check = next;
        i++;
        break;
      case '--mode':
        args.mode = next;
        i++;
        break;
      case '--max-iterations':
        args.maxIterations = parseInt(next, 10);
        i++;
        break;
      case '--branch':
        args.branch = next;
        i++;
        break;
      case '--verbose':
        args.verbose = true;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return args;
}

function showHelp() {
  console.log(`
Autonomous Engineering Agent CLI

Usage:
  node agent/cli.mjs [options]

Options:
  --task <description>       Task description for LLM context
  --check <command>          Command to run for validation
  --mode <local|ssh>         Execution mode (default: local)
  --max-iterations <n>       Max iterations before giving up (default: 10)
  --branch <name>            Git branch to work on (auto-created if missing)
  --verbose                  Enable verbose logging
  --dry-run                  Simulate without applying patches
  --help                     Show this help

Examples:
  # Run local validation and auto-fix
  node agent/cli.mjs --task "validate AI tools" \\
    --check "node scripts/sheet_ai_autogen_9_strict_v2.mjs 5 --dry-run --json"

  # Fix linter errors
  node agent/cli.mjs --task "fix ESLint errors" \\
    --check "npm run lint" --max-iterations 5

  # Run tests until pass
  node agent/cli.mjs --task "pass all tests" \\
    --check "npm test" --branch agent/test-fixes
`);
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.task || !args.check) {
    console.error('[ERROR] --task and --check are required\n');
    showHelp();
    process.exit(1);
  }

  const config = loadConfig();
  const agent = new AgentCore({
    ...config,
    ...args,
  });

  try {
    const result = await agent.run();

    console.log('\n' + '='.repeat(60));
    console.log('AGENT EXECUTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Status:     ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
    console.log(`Iterations: ${result.iterations}`);
    console.log(`Duration:   ${result.duration}ms`);

    if (result.patches && result.patches.length > 0) {
      console.log(`Patches:    ${result.patches.length} applied`);
    }

    if (result.finalOutput) {
      console.log(`\nFinal check output:`);
      console.log(result.finalOutput.substring(0, 500));
    }

    console.log('='.repeat(60) + '\n');

    process.exit(result.success ? 0 : 1);
  } catch (err) {
    console.error('\n[FATAL ERROR]', err.message);
    if (args.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();

/**
 * Agent Core - Main autonomous loop (until-pass)
 */

import { Executor } from './executor.mjs';
import { Analyzer } from './analyzer.mjs';
import { LLMClient } from './llm.mjs';
import { Patcher } from './patcher.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Helper: Ensure run directory exists and return path
 */
function ensureRunDir(iteration) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const runDir = join(process.cwd(), '.agent-runs', `run-${ts}-iter${iteration}`);
  mkdirSync(runDir, { recursive: true });
  return runDir;
}

/**
 * Helper: Write text file safely
 */
function writeTextSafe(filePath, content) {
  try {
    writeFileSync(filePath, content || '', 'utf8');
  } catch (err) {
    console.error(`[WRITE ERROR] ${filePath}: ${err.message}`);
  }
}

/**
 * Helper: Write JSON file safely
 */
function writeJsonSafe(filePath, data) {
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`[WRITE ERROR] ${filePath}: ${err.message}`);
  }
}

export class AgentCore {
  constructor(config) {
    this.config = config;
    this.executor = new Executor(config);
    this.analyzer = new Analyzer(config);
    this.llm = new LLMClient(config);
    this.patcher = new Patcher(config);

    this.iterations = 0;
    this.maxIterations = config.maxIterations || 10;
    this.task = config.task || 'Fix all issues';
    this.checkCommand = config.check;
    this.verbose = config.verbose || false;
    this.dryRun = config.dryRun || false;
    this.patches = [];
  }

  log(msg, level = 'info') {
    const prefix = {
      info: '[AGENT]',
      verbose: '[VERBOSE]',
      error: '[ERROR]',
      success: '[SUCCESS]',
    }[level] || '[AGENT]';

    if (level === 'verbose' && !this.verbose) return;

    console.log(`${prefix} ${msg}`);
  }

  async run() {
    const startTime = Date.now();
    this.log(`Starting autonomous loop: "${this.task}"`);
    this.log(`Check command: ${this.checkCommand}`);
    this.log(`Max iterations: ${this.maxIterations}`);

    if (this.dryRun) {
      this.log('DRY RUN MODE - No patches will be applied', 'info');
    }

    // Setup git branch if specified
    if (this.config.branch) {
      await this.patcher.ensureBranch(this.config.branch);
    }

    let lastOutput = null;
    let success = false;

    // Main autonomous loop
    while (this.iterations < this.maxIterations) {
      this.iterations++;
      this.log(`\n${'─'.repeat(60)}`);
      this.log(`Iteration ${this.iterations}/${this.maxIterations}`);
      this.log('─'.repeat(60));

      // Create run directory and save metadata
      const runDir = ensureRunDir(this.iterations);
      writeJsonSafe(join(runDir, 'meta.json'), {
        task: this.task,
        command: this.checkCommand,
        iteration: this.iterations,
        branch: this.config.branch || null,
        ts: new Date().toISOString(),
      });

      // Step 1: Execute check command
      this.log(`Running check: ${this.checkCommand}`, 'verbose');
      const execResult = await this.executor.execute(this.checkCommand);

      this.log(`Exit code: ${execResult.exitCode}`, 'verbose');

      // Save check results
      writeTextSafe(join(runDir, 'check.stdout.txt'), execResult.stdout);
      writeTextSafe(join(runDir, 'check.stderr.txt'), execResult.stderr);
      writeJsonSafe(join(runDir, 'check.meta.json'), {
        exitCode: execResult.exitCode,
        durationMs: execResult.duration,
        signal: execResult.signal,
        error: execResult.error,
      });

      // Step 2: Analyze results
      const analysis = this.analyzer.analyze(execResult);

      this.log(`Analysis: ${analysis.status}`, 'info');
      if (analysis.issuesFound > 0) {
        this.log(`Issues found: ${analysis.issuesFound}`, 'info');
      }

      // Save analysis
      writeJsonSafe(join(runDir, 'analysis.json'), analysis);

      // Step 3: Check if success
      if (analysis.status === 'success') {
        this.log('✓ Check passed! Task completed.', 'success');
        success = true;
        lastOutput = execResult.stdout || execResult.stderr;
        break;
      }

      // Step 4: If failed, generate patch via LLM
      this.log('Generating patch via LLM...', 'info');
      const patch = await this.llm.generatePatch({
        task: this.task,
        command: this.checkCommand,
        analysis,
        iteration: this.iterations,
        previousPatches: this.patches,
      });

      // Save raw LLM response
      writeJsonSafe(join(runDir, 'llm.raw.json'), patch);

      if (!patch || !patch.changes || patch.changes.length === 0) {
        this.log('LLM could not generate a valid patch. Stopping.', 'error');
        lastOutput = execResult.stdout || execResult.stderr;
        break;
      }

      this.log(`Patch generated: ${patch.changes.length} file(s) to modify`, 'info');

      // Step 5: Apply patch (unless dry-run)
      if (this.dryRun) {
        this.log('DRY RUN: Skipping patch application', 'info');
        this.log(JSON.stringify(patch, null, 2), 'verbose');
      } else {
        this.log('Applying patch...', 'info');
        const patchResult = await this.patcher.applyPatch(patch);

        if (patchResult.success) {
          this.log(`✓ Patch applied successfully`, 'success');
          this.patches.push({
            iteration: this.iterations,
            patch,
            commit: patchResult.commit,
          });
        } else {
          this.log(`✗ Patch application failed: ${patchResult.error}`, 'error');
          lastOutput = patchResult.error;
          break;
        }
      }

      lastOutput = execResult.stdout || execResult.stderr;
    }

    // Final summary
    const duration = Date.now() - startTime;

    if (!success && this.iterations >= this.maxIterations) {
      this.log(`Max iterations (${this.maxIterations}) reached without success`, 'error');
    }

    return {
      success,
      iterations: this.iterations,
      duration,
      patches: this.patches,
      finalOutput: lastOutput,
    };
  }
}

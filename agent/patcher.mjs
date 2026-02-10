/**
 * Patcher - Applies patches via git
 */

import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

export class Patcher {
  constructor(config) {
    this.config = config;
    this.cwd = config.cwd || process.cwd();
    this.autoCommit = config.autoCommit !== false; // default true
    this.commitPrefix = config.commitPrefix || '[agent]';
  }

  /**
   * Ensure git branch exists and is checked out
   */
  async ensureBranch(branchName) {
    if (!branchName) return;

    // Check if branch exists
    const checkBranch = this.git(['rev-parse', '--verify', branchName]);

    if (checkBranch.status !== 0) {
      // Branch doesn't exist, create it
      console.log(`[PATCHER] Creating branch: ${branchName}`);
      const create = this.git(['checkout', '-b', branchName]);
      if (create.status !== 0) {
        throw new Error(`Failed to create branch: ${create.stderr}`);
      }
    } else {
      // Branch exists, checkout
      console.log(`[PATCHER] Checking out branch: ${branchName}`);
      const checkout = this.git(['checkout', branchName]);
      if (checkout.status !== 0) {
        throw new Error(`Failed to checkout branch: ${checkout.stderr}`);
      }
    }
  }

  /**
   * Apply patch (write files + git commit)
   */
  async applyPatch(patch) {
    if (!patch || !patch.changes || patch.changes.length === 0) {
      return {
        success: false,
        error: 'Empty patch',
      };
    }

    const modifiedFiles = [];

    try {
      // Apply all file changes
      for (const change of patch.changes) {
        const result = this.applyFileChange(change);
        if (result.success) {
          modifiedFiles.push(change.file);
        } else {
          throw new Error(`Failed to apply change to ${change.file}: ${result.error}`);
        }
      }

      // Git add + commit
      let commit = null;
      if (this.autoCommit && modifiedFiles.length > 0) {
        commit = this.gitCommit(modifiedFiles, patch);
      }

      return {
        success: true,
        modifiedFiles,
        commit,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        modifiedFiles,
      };
    }
  }

  /**
   * Apply single file change
   */
  applyFileChange(change) {
    const { file, action, content } = change;
    const fullPath = join(this.cwd, file);

    try {
      switch (action) {
        case 'edit':
        case 'create':
          // Ensure directory exists
          mkdirSync(dirname(fullPath), { recursive: true });
          // Write file
          writeFileSync(fullPath, content, 'utf8');
          return { success: true };

        case 'delete':
          if (existsSync(fullPath)) {
            unlinkSync(fullPath);
          }
          return { success: true };

        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Git commit changes
   */
  gitCommit(files, patch) {
    try {
      // Add files
      const add = this.git(['add', ...files]);
      if (add.status !== 0) {
        throw new Error(`git add failed: ${add.stderr}`);
      }

      // Create commit message
      const message = this.buildCommitMessage(patch);

      // Commit
      const commit = this.git(['commit', '-m', message]);
      if (commit.status !== 0) {
        throw new Error(`git commit failed: ${commit.stderr}`);
      }

      // Get commit hash
      const hash = this.git(['rev-parse', 'HEAD']);
      const commitHash = hash.stdout?.trim() || '';

      return {
        hash: commitHash,
        message,
        files,
      };
    } catch (error) {
      console.error('[PATCHER] Git commit failed:', error.message);
      return null;
    }
  }

  /**
   * Build commit message
   */
  buildCommitMessage(patch) {
    const changes = patch.changes || [];
    const fileCount = changes.length;

    let msg = `${this.commitPrefix} Auto-fix: ${fileCount} file${fileCount !== 1 ? 's' : ''} modified`;

    if (patch.reason) {
      msg += `\n\n${patch.reason}`;
    }

    // List files
    if (changes.length > 0 && changes.length <= 5) {
      msg += '\n\nFiles:';
      changes.forEach(c => {
        msg += `\n- ${c.action}: ${c.file}`;
      });
    }

    return msg;
  }

  /**
   * Execute git command
   */
  git(args) {
    return spawnSync('git', args, {
      cwd: this.cwd,
      encoding: 'utf8',
    });
  }

  /**
   * Get current git status
   */
  getStatus() {
    const result = this.git(['status', '--porcelain']);
    return result.stdout || '';
  }

  /**
   * Get current branch
   */
  getCurrentBranch() {
    const result = this.git(['rev-parse', '--abbrev-ref', 'HEAD']);
    return result.stdout?.trim() || '';
  }
}

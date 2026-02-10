/**
 * Executor - Runs commands (local or SSH)
 */

import { spawnSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

export class Executor {
  constructor(config) {
    this.config = config;
    this.mode = config.mode || 'local';
    this.sshHost = config.sshHost || '';
    this.sshUser = config.sshUser || '';
    this.timeout = config.timeout || 120000; // 2 minutes default
  }

  /**
   * Execute command locally or via SSH
   */
  async execute(command) {
    if (this.mode === 'ssh') {
      return this.executeSSH(command);
    }
    return this.executeLocal(command);
  }

  /**
   * Execute command locally
   */
  async executeLocal(command) {
    const startTime = Date.now();

    const result = spawnSync(command, {
      shell: true,
      encoding: 'utf8',
      timeout: this.timeout,
      cwd: this.config.cwd || process.cwd(),
      env: { ...process.env },
    });

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.status ?? -1,
      signal: result.signal || null,
      duration: Date.now() - startTime,
      error: result.error ? result.error.message : null,
    };
  }

  /**
   * Execute command via SSH
   */
  async executeSSH(command) {
    if (!this.sshHost || !this.sshUser) {
      throw new Error('SSH mode requires sshHost and sshUser in config');
    }

    const sshCommand = `ssh ${this.sshUser}@${this.sshHost} "${command.replace(/"/g, '\\"')}"`;
    return this.executeLocal(sshCommand);
  }

  /**
   * Check if a file exists
   */
  fileExists(path) {
    return existsSync(path);
  }

  /**
   * Get file list matching pattern
   */
  getFiles(pattern) {
    const result = spawnSync('find', ['.', '-name', pattern], {
      encoding: 'utf8',
      cwd: this.config.cwd || process.cwd(),
    });

    if (result.status !== 0) {
      return [];
    }

    return (result.stdout || '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  }
}

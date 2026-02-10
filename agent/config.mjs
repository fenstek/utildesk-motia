/**
 * Agent Configuration
 */

import 'dotenv/config';
import { join } from 'node:path';

export function loadConfig(overrides = {}) {
  const config = {
    // LLM settings
    openaiApiKey: process.env.OPENAI_API_KEY,
    llmModel: process.env.AGENT_LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.AGENT_MAX_TOKENS || '4000', 10),
    temperature: parseFloat(process.env.AGENT_TEMPERATURE || '0.1'),

    // Execution settings
    mode: process.env.AGENT_MODE || 'local', // local | ssh
    sshHost: process.env.AGENT_SSH_HOST || '',
    sshUser: process.env.AGENT_SSH_USER || '',
    timeout: parseInt(process.env.AGENT_TIMEOUT || '120000', 10), // 2 min
    cwd: process.env.AGENT_CWD || process.cwd(),

    // Iteration settings
    maxIterations: parseInt(process.env.AGENT_MAX_ITERATIONS || '10', 10),

    // Git settings
    autoCommit: process.env.AGENT_AUTO_COMMIT !== 'false',
    commitPrefix: process.env.AGENT_COMMIT_PREFIX || '[agent]',
    branch: process.env.AGENT_BRANCH || '',

    // Logging
    verbose: process.env.AGENT_VERBOSE === 'true',
    dryRun: process.env.AGENT_DRY_RUN === 'true',

    // Override with passed config
    ...overrides,
  };

  return config;
}

export const DEFAULT_CONFIG = loadConfig();

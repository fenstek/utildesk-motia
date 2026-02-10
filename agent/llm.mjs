/**
 * LLM Client - Generates patches using OpenAI/Anthropic
 */

import OpenAI from 'openai';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export class LLMClient {
  constructor(config) {
    this.config = config;
    this.apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
    this.model = config.llmModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.maxTokens = config.maxTokens || 4000;
    this.temperature = config.temperature || 0.1;

    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.client = new OpenAI({ apiKey: this.apiKey });
  }

  /**
   * Generate patch based on analysis
   */
  async generatePatch(context) {
    const { task, command, analysis, iteration, previousPatches } = context;

    // Build context for LLM
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(task, command, analysis, iteration, previousPatches);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const content = response.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('Empty LLM response');
      }

      return this.parsePatchResponse(content);
    } catch (error) {
      console.error('[LLM ERROR]', error.message);
      return null;
    }
  }

  /**
   * Build system prompt
   */
  buildSystemPrompt() {
    return `You are an autonomous code repair agent. Your job is to analyze errors and generate precise file patches.

RULES:
1. Output ONLY valid JSON (no markdown, no explanation)
2. JSON format: {"changes": [{"file": "path/to/file.js", "action": "edit|create", "content": "full file content"}]}
3. Always provide COMPLETE file content (not diffs)
4. Focus on minimal changes to fix the specific error
5. Preserve existing code style and structure
6. Do not add comments explaining your changes
7. If you cannot fix the issue, return {"changes": [], "reason": "explanation"}

OUTPUT ONLY JSON. NO MARKDOWN. NO TEXT BEFORE OR AFTER JSON.`;
  }

  /**
   * Build user prompt with context
   */
  buildUserPrompt(task, command, analysis, iteration, previousPatches) {
    let prompt = `TASK: ${task}\n\n`;
    prompt += `COMMAND: ${command}\n\n`;
    prompt += `ITERATION: ${iteration}\n\n`;

    // Add analysis
    prompt += `ANALYSIS:\n`;
    prompt += `Status: ${analysis.status}\n`;
    prompt += `Issues: ${analysis.issuesFound}\n\n`;

    if (analysis.issues && analysis.issues.length > 0) {
      prompt += `ERRORS:\n`;
      analysis.issues.slice(0, 10).forEach((issue, idx) => {
        prompt += `${idx + 1}. [${issue.type}] ${issue.message}\n`;
        if (issue.context) {
          prompt += `   Context: ${JSON.stringify(issue.context).substring(0, 200)}\n`;
        }
      });
      prompt += `\n`;
    }

    // Add stdout/stderr snippets
    if (analysis.stdout) {
      prompt += `STDOUT (last 1000 chars):\n${analysis.stdout.substring(analysis.stdout.length - 1000)}\n\n`;
    }
    if (analysis.stderr) {
      prompt += `STDERR (last 1000 chars):\n${analysis.stderr.substring(analysis.stderr.length - 1000)}\n\n`;
    }

    // Add file context if we can identify files
    const filePaths = this.extractFilePaths(analysis);
    if (filePaths.length > 0) {
      prompt += `RELEVANT FILES:\n`;
      for (const path of filePaths.slice(0, 3)) {
        const content = this.readFileContent(path);
        if (content) {
          prompt += `\n--- ${path} ---\n${content}\n`;
        }
      }
    }

    // Add previous patches context (avoid repeating same mistakes)
    if (previousPatches && previousPatches.length > 0) {
      prompt += `\nPREVIOUS ATTEMPTS (${previousPatches.length}):\n`;
      previousPatches.slice(-3).forEach((p, idx) => {
        prompt += `Attempt ${idx + 1}: Modified ${p.patch?.changes?.length || 0} file(s)\n`;
      });
      prompt += `\nThese attempts did not resolve the issue. Try a different approach.\n`;
    }

    prompt += `\nGenerate patch as JSON: {"changes": [...]}\n`;

    return prompt;
  }

  /**
   * Parse LLM response to extract patch
   */
  parsePatchResponse(content) {
    // Remove markdown code blocks if present
    let cleaned = content.trim();
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);

      if (!parsed.changes) {
        return null;
      }

      // Validate patch structure
      if (!Array.isArray(parsed.changes)) {
        return null;
      }

      for (const change of parsed.changes) {
        if (!change.file || !change.action) {
          return null;
        }
        if (!['edit', 'create', 'delete'].includes(change.action)) {
          return null;
        }
      }

      return parsed;
    } catch (error) {
      console.error('[LLM PARSE ERROR]', error.message);
      console.error('Response:', content.substring(0, 500));
      return null;
    }
  }

  /**
   * Extract file paths from analysis
   */
  extractFilePaths(analysis) {
    const paths = new Set();
    const pathPattern = /(?:^|\s)(\.?\/[\w\/\-\.]+\.(?:js|mjs|ts|tsx|jsx|json|md))/gi;

    const text = JSON.stringify(analysis);
    const matches = text.match(pathPattern);

    if (matches) {
      matches.forEach(m => {
        const clean = m.trim().replace(/^\.\//, '');
        if (this.fileExists(clean)) {
          paths.add(clean);
        }
      });
    }

    return Array.from(paths);
  }

  /**
   * Read file content
   */
  readFileContent(path) {
    try {
      const fullPath = join(this.config.cwd || process.cwd(), path);
      if (!existsSync(fullPath)) {
        return null;
      }
      const content = readFileSync(fullPath, 'utf8');
      // Limit to 5000 chars to avoid token limits
      return content.length > 5000 ? content.substring(0, 5000) + '\n... (truncated)' : content;
    } catch {
      return null;
    }
  }

  /**
   * Check if file exists
   */
  fileExists(path) {
    try {
      const fullPath = join(this.config.cwd || process.cwd(), path);
      return existsSync(fullPath);
    } catch {
      return false;
    }
  }
}

/**
 * Analyzer - Analyzes stdout/stderr/JSON to determine success/failure
 */

export class Analyzer {
  constructor(config) {
    this.config = config;
  }

  /**
   * Analyze execution result and extract issues
   */
  analyze(execResult) {
    const { stdout, stderr, exitCode } = execResult;

    // Try to parse as JSON first
    const jsonData = this.tryParseJSON(stdout) || this.tryParseJSON(stderr);

    if (jsonData) {
      return this.analyzeJSON(jsonData, exitCode);
    }

    // Fallback to text analysis
    return this.analyzeText(stdout, stderr, exitCode);
  }

  /**
   * Try to parse JSON from output
   */
  tryParseJSON(text) {
    if (!text || typeof text !== 'string') return null;

    // Try direct parse
    try {
      return JSON.parse(text.trim());
    } catch {}

    // Try to extract JSON object/array
    const matches = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (matches) {
      try {
        return JSON.parse(matches[0]);
      } catch {}
    }

    return null;
  }

  /**
   * Analyze JSON output
   */
  analyzeJSON(data, exitCode) {
    const analysis = {
      status: 'unknown',
      issuesFound: 0,
      issues: [],
      data,
      exitCode,
    };

    // Common JSON success patterns
    if (data.ok === true || data.success === true || data.status === 'success') {
      analysis.status = 'success';
      return analysis;
    }

    // Common JSON error patterns
    if (data.ok === false || data.success === false || data.error) {
      analysis.status = 'failed';
      analysis.issuesFound = 1;
      analysis.issues.push({
        type: 'json_error',
        message: data.error || data.message || 'Unknown error',
        details: data,
      });
      return analysis;
    }

    // Check for errors array
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      analysis.status = 'failed';
      analysis.issuesFound = data.errors.length;
      analysis.issues = data.errors.map(err => ({
        type: 'error',
        message: typeof err === 'string' ? err : (err.message || JSON.stringify(err)),
        details: err,
      }));
      return analysis;
    }

    // Exit code fallback
    if (exitCode === 0) {
      analysis.status = 'success';
    } else {
      analysis.status = 'failed';
      analysis.issuesFound = 1;
      analysis.issues.push({
        type: 'exit_code',
        message: `Exit code ${exitCode}`,
        details: data,
      });
    }

    return analysis;
  }

  /**
   * Analyze text output (stdout/stderr)
   */
  analyzeText(stdout, stderr, exitCode) {
    const analysis = {
      status: 'unknown',
      issuesFound: 0,
      issues: [],
      stdout,
      stderr,
      exitCode,
    };

    const fullText = `${stdout}\n${stderr}`.toLowerCase();

    // Success patterns
    const successPatterns = [
      /all tests passed/i,
      /0 errors/i,
      /build successful/i,
      /no issues found/i,
      /✓/,
      /success/i,
    ];

    for (const pattern of successPatterns) {
      if (pattern.test(fullText) && exitCode === 0) {
        analysis.status = 'success';
        return analysis;
      }
    }

    // Error patterns
    const errorPatterns = [
      { pattern: /error:/gi, type: 'error' },
      { pattern: /failed:/gi, type: 'failed' },
      { pattern: /exception:/gi, type: 'exception' },
      { pattern: /syntax error/gi, type: 'syntax' },
      { pattern: /type error/gi, type: 'type' },
      { pattern: /reference error/gi, type: 'reference' },
      { pattern: /timeout/gi, type: 'timeout' },
      { pattern: /not found/gi, type: 'not_found' },
    ];

    for (const { pattern, type } of errorPatterns) {
      const matches = fullText.match(pattern);
      if (matches) {
        analysis.issuesFound += matches.length;

        // Extract context around errors
        const lines = (stdout + '\n' + stderr).split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i])) {
            analysis.issues.push({
              type,
              line: i + 1,
              message: lines[i].trim(),
              context: lines.slice(Math.max(0, i - 2), i + 3),
            });
          }
        }
      }
    }

    // Exit code check
    if (exitCode !== 0) {
      analysis.status = 'failed';
      if (analysis.issuesFound === 0) {
        analysis.issuesFound = 1;
        analysis.issues.push({
          type: 'exit_code',
          message: `Command exited with code ${exitCode}`,
          stderr: stderr.substring(0, 500),
        });
      }
    } else if (analysis.issuesFound === 0) {
      analysis.status = 'success';
    } else {
      analysis.status = 'failed';
    }

    return analysis;
  }

  /**
   * Extract file paths from error messages
   */
  extractFilePaths(issues) {
    const paths = new Set();
    const pathPattern = /(?:^|\s)(\.?\/[\w\/\-\.]+\.(?:js|mjs|ts|tsx|jsx|json|md|css|html))/gi;

    for (const issue of issues) {
      const text = JSON.stringify(issue);
      const matches = text.match(pathPattern);
      if (matches) {
        matches.forEach(m => paths.add(m.trim()));
      }
    }

    return Array.from(paths);
  }
}

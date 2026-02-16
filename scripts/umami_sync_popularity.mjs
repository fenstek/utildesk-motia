#!/usr/bin/env node

/**
 * Umami Popularity Sync Script
 *
 * Syncs pageview statistics from Umami Analytics to tool frontmatter popularity field.
 * Runs in dry-run mode by default for safety.
 *
 * Usage:
 *   node scripts/umami_sync_popularity.mjs [options]
 *
 * Options:
 *   --days N          Number of days to fetch stats for (default: 30)
 *   --dry-run         Show what would be updated without writing (default: true)
 *   --apply           Actually write changes to files
 *   --zero-missing    Set popularity=0 for tools without stats (default: keep existing)
 *   --max-updates N   Maximum number of files to update (default: 200, safety limit)
 *   --json            Output machine-readable JSON
 *   --help            Show this help
 *
 * Environment variables required:
 *   UMAMI_WEBSITE_ID   - Umami website ID
 *   UMAMI_USERNAME     - Umami login username
 *   UMAMI_PASSWORD     - Umami login password
 *   UMAMI_BASE_URL     - Umami base URL (default: https://stats.utildesk.de)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  baseUrl: process.env.UMAMI_BASE_URL || 'https://stats.utildesk.de',
  websiteId: process.env.UMAMI_WEBSITE_ID,
  username: process.env.UMAMI_USERNAME,
  password: process.env.UMAMI_PASSWORD,
  contentDir: path.join(__dirname, '..', 'content', 'tools'),
  days: 30,
  dryRun: true,
  zeroMissing: false,
  maxUpdates: 200,
  jsonOutput: false,
};

// Parse command line arguments
function parseArgs(args) {
  const options = { ...CONFIG };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help') {
      console.log(`
Umami Popularity Sync Script

Usage: node scripts/umami_sync_popularity.mjs [options]

Options:
  --days N          Number of days to fetch stats for (default: 30)
  --dry-run         Show what would be updated without writing (default)
  --apply           Actually write changes to files
  --zero-missing    Set popularity=0 for tools without stats
  --max-updates N   Maximum number of files to update (default: 200)
  --json            Output machine-readable JSON
  --help            Show this help

Environment variables required:
  UMAMI_WEBSITE_ID   - Umami website ID
  UMAMI_USERNAME     - Umami login username
  UMAMI_PASSWORD     - Umami login password
  UMAMI_BASE_URL     - Umami base URL (default: https://stats.utildesk.de)

Examples:
  # Dry run (safe, shows what would change)
  node scripts/umami_sync_popularity.mjs --days 30

  # Apply changes for real
  node scripts/umami_sync_popularity.mjs --days 30 --apply

  # Set missing tools to 0 views
  node scripts/umami_sync_popularity.mjs --apply --zero-missing

  # Output JSON for automation
  node scripts/umami_sync_popularity.mjs --json
`);
      process.exit(0);
    } else if (arg === '--days') {
      options.days = parseInt(args[++i], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--apply') {
      options.dryRun = false;
    } else if (arg === '--zero-missing') {
      options.zeroMissing = true;
    } else if (arg === '--max-updates') {
      options.maxUpdates = parseInt(args[++i], 10);
    } else if (arg === '--json') {
      options.jsonOutput = true;
    }
  }

  return options;
}

// Validate configuration
function validateConfig(config) {
  const errors = [];

  if (!config.websiteId) {
    errors.push('UMAMI_WEBSITE_ID environment variable is required');
  }
  if (!config.username) {
    errors.push('UMAMI_USERNAME environment variable is required');
  }
  if (!config.password) {
    errors.push('UMAMI_PASSWORD environment variable is required');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    console.error('\nPlease set the required environment variables.');
    console.error('See --help for more information.');
    process.exit(1);
  }
}

// Umami API client
class UmamiClient {
  constructor(baseUrl, username, password) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
    this.token = null;
  }

  async login() {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        password: this.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Umami login failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.token = data.token;
    return data;
  }

  async getMetrics(websiteId, { days = 30, type = 'url' }) {
    if (!this.token) {
      await this.login();
    }

    const endAt = Date.now();
    const startAt = endAt - (days * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      type,
      startAt: startAt.toString(),
      endAt: endAt.toString(),
    });

    const response = await fetch(
      `${this.baseUrl}/api/websites/${websiteId}/metrics?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Umami metrics request failed (${response.status} ${response.statusText}): ${errorText}`);
    }

    const data = await response.json();

    // Handle empty or error response
    if (data.error) {
      throw new Error(`Umami API error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    // Return empty array if no data
    return Array.isArray(data) ? data : [];
  }
}

// Parse frontmatter from markdown file
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error('No frontmatter found');
  }

  const [, frontmatterText, body] = match;

  // Parse YAML manually (simple key: value pairs)
  const frontmatter = {};
  const lines = frontmatterText.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Parse numbers
    if (/^\d+$/.test(value)) {
      value = parseInt(value, 10);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

// Serialize frontmatter back to YAML
function serializeFrontmatter(frontmatter, body) {
  const lines = ['---'];

  for (const [key, value] of Object.entries(frontmatter)) {
    if (typeof value === 'string' && (value.includes(':') || value.includes('#'))) {
      lines.push(`${key}: "${value}"`);
    } else if (typeof value === 'number') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push('---');
  lines.push(body);

  return lines.join('\n');
}

// Extract slug from URL path
function extractSlugFromUrl(url) {
  const match = url.match(/^\/tools\/([^\/]+)\/?$/);
  return match ? match[1] : null;
}

// Main sync function
async function syncPopularity(options) {
  validateConfig(options);

  const log = options.jsonOutput ? () => {} : console.log;
  const changes = [];

  try {
    // Step 1: Fetch metrics from Umami
    log(`Fetching metrics from Umami for the last ${options.days} days...`);

    const client = new UmamiClient(
      options.baseUrl,
      options.username,
      options.password
    );

    const metrics = await client.getMetrics(options.websiteId, {
      days: options.days,
      type: 'url',
    });

    log(`Received ${metrics.length} URL metrics from Umami`);

    // Step 2: Extract /tools/* pageviews
    const toolStats = {};

    for (const item of metrics) {
      const url = item.x;
      const views = item.y;
      const slug = extractSlugFromUrl(url);

      if (slug) {
        toolStats[slug] = (toolStats[slug] || 0) + views;
      }
    }

    log(`Matched ${Object.keys(toolStats).length} tool slugs with pageviews`);

    // Step 3: Read all tool markdown files
    const files = await fs.readdir(options.contentDir);
    const mdFiles = files.filter(f => f.endsWith('.md') && f !== '_TEMPLATE.md');

    log(`Found ${mdFiles.length} tool files in ${options.contentDir}`);

    // Step 4: Update popularity in frontmatter
    let updateCount = 0;

    for (const file of mdFiles) {
      const filePath = path.join(options.contentDir, file);
      const fileSlug = file.replace('.md', '');

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { frontmatter, body } = parseFrontmatter(content);

        // Use frontmatter slug if available, otherwise use filename
        const slug = frontmatter.slug || fileSlug;
        const newPopularity = toolStats[slug];
        const oldPopularity = frontmatter.popularity;

        // Determine if we should update
        let shouldUpdate = false;
        let finalPopularity = oldPopularity;

        if (newPopularity !== undefined) {
          // We have stats for this tool
          finalPopularity = newPopularity;
          shouldUpdate = oldPopularity !== newPopularity;
        } else if (options.zeroMissing && oldPopularity !== 0) {
          // No stats, but --zero-missing is set
          finalPopularity = 0;
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          if (updateCount >= options.maxUpdates) {
            log(`\nWARNING: Reached max-updates limit (${options.maxUpdates})`);
            log('Stopping to prevent accidental mass changes.');
            break;
          }

          changes.push({
            slug,
            file,
            old: oldPopularity,
            new: finalPopularity,
          });

          if (!options.dryRun) {
            frontmatter.popularity = finalPopularity;
            const newContent = serializeFrontmatter(frontmatter, body);
            await fs.writeFile(filePath, newContent, 'utf-8');
          }

          updateCount++;
        }
      } catch (error) {
        if (!options.jsonOutput) {
          console.error(`Error processing ${file}: ${error.message}`);
        }
      }
    }

    // Step 5: Report results
    if (options.jsonOutput) {
      console.log(JSON.stringify({
        success: true,
        totalMetrics: metrics.length,
        matchedSlugs: Object.keys(toolStats).length,
        totalFiles: mdFiles.length,
        updatedFiles: updateCount,
        dryRun: options.dryRun,
        changes,
      }, null, 2));
    } else {
      log(`\n${'='.repeat(60)}`);
      log(`Summary:`);
      log(`  - URL metrics received: ${metrics.length}`);
      log(`  - Tool slugs matched: ${Object.keys(toolStats).length}`);
      log(`  - Files scanned: ${mdFiles.length}`);
      log(`  - Files to update: ${updateCount}`);
      log(`  - Mode: ${options.dryRun ? 'DRY RUN (no changes written)' : 'APPLY (changes written)'}`);

      if (changes.length > 0 && changes.length <= 10) {
        log(`\nChanges:`);
        changes.forEach(c => {
          log(`  ${c.slug}: ${c.old} → ${c.new}`);
        });
      } else if (changes.length > 10) {
        log(`\nTop 10 changes:`);
        changes.slice(0, 10).forEach(c => {
          log(`  ${c.slug}: ${c.old} → ${c.new}`);
        });
        log(`  ... and ${changes.length - 10} more`);
      }

      log(`${'='.repeat(60)}`);

      if (options.dryRun && updateCount > 0) {
        log(`\nℹ️  This was a dry run. Use --apply to write changes.`);
      } else if (!options.dryRun && updateCount > 0) {
        log(`\n✓ Successfully updated ${updateCount} files.`);
      } else {
        log(`\nℹ️  No changes needed.`);
      }
    }

    return { success: true, changesCount: updateCount };

  } catch (error) {
    if (options.jsonOutput) {
      console.log(JSON.stringify({
        success: false,
        error: error.message,
      }, null, 2));
    } else {
      console.error(`\n❌ Error: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    }

    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv.slice(2));
  syncPopularity(options);
}

export { syncPopularity, UmamiClient };

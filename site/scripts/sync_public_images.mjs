#!/usr/bin/env node
/**
 * Copy shared content images into dist after Astro builds.
 *
 * The repo keeps site/public/images as a symlink to ../../content/images.
 * On Windows checkouts that symlink can materialize as a tiny text file, so
 * Astro copies a file named "images" instead of the image directory. This
 * postbuild step makes manual Windows deploys safe and keeps Linux builds
 * idempotent.
 */

import { cp, lstat, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOURCE_DIR = join(__dirname, "../../content/images");
const TARGET_DIR = join(__dirname, "../dist/images");

async function exists(path) {
  try {
    return await lstat(path);
  } catch {
    return null;
  }
}

const sourceStats = await exists(SOURCE_DIR);
if (!sourceStats?.isDirectory()) {
  throw new Error(`Image source directory is missing: ${SOURCE_DIR}`);
}

const targetStats = await exists(TARGET_DIR);
if (targetStats && !targetStats.isDirectory()) {
  await rm(TARGET_DIR, { force: true, recursive: true });
}

await cp(SOURCE_DIR, TARGET_DIR, { recursive: true });
console.log(`✅ Images synced: ${TARGET_DIR}`);

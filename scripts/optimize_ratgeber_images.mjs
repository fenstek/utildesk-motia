import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "../site/node_modules/sharp/lib/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMAGE_DIR = path.join(ROOT, "content", "images", "ratgeber");
const ARTICLE_DIRS = [
  path.join(ROOT, "content", "ratgeber"),
  path.join(ROOT, "content", "en", "ratgeber"),
];

const MIN_BYTES = 40 * 1024;
const MIN_SAVING_RATIO = 0.1;
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 82;

const IMAGE_REF_PATTERN = /\/images\/ratgeber\/[^)\s"']+\.(?:png|jpe?g|webp|svg)/gi;

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listMarkdownFiles() {
  const files = [];
  for (const dir of ARTICLE_DIRS) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(path.join(dir, entry.name));
      }
    }
  }
  return files;
}

async function collectReferencedImages(markdownFiles) {
  const refs = new Set();
  for (const file of markdownFiles) {
    const text = await fs.readFile(file, "utf8");
    for (const match of text.matchAll(IMAGE_REF_PATTERN)) {
      refs.add(match[0]);
    }
  }
  return refs;
}

async function replaceFile(sourcePath, targetPath) {
  try {
    await fs.rename(sourcePath, targetPath);
  } catch {
    await fs.copyFile(sourcePath, targetPath);
    await fs.rm(sourcePath, { force: true });
  }
}

async function optimizeImage(publicRef) {
  if (!/\.(?:png|jpe?g|webp)$/i.test(publicRef)) return null;

  const inputPath = path.join(ROOT, "content", publicRef.replace(/^\//, ""));
  if (!(await exists(inputPath))) {
    return { publicRef, skipped: "missing source file" };
  }

  const inputStat = await fs.stat(inputPath);
  if (inputStat.size < MIN_BYTES) {
    return { publicRef, skipped: "already small" };
  }

  const parsed = path.parse(inputPath);
  const isWebp = /\.webp$/i.test(inputPath);
  const outputPath = isWebp
    ? path.join(parsed.dir, `${parsed.name}.tmp.webp`)
    : path.join(parsed.dir, `${parsed.name}.webp`);
  const outputRef = isWebp ? publicRef : publicRef.replace(/\.(?:png|jpe?g)$/i, ".webp");
  const metadata = await sharp(inputPath).metadata();

  await sharp(inputPath)
    .resize({
      width: Math.min(metadata.width || MAX_WIDTH, MAX_WIDTH),
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toFile(outputPath);

  const outputStat = await fs.stat(outputPath);
  const savingRatio = 1 - outputStat.size / inputStat.size;
  if (savingRatio < MIN_SAVING_RATIO) {
    await fs.rm(outputPath, { force: true });
    return {
      publicRef,
      skipped: `saving below threshold (${Math.round(savingRatio * 100)}%)`,
    };
  }

  if (isWebp) {
    await replaceFile(outputPath, inputPath);
  }

  return {
    publicRef,
    outputRef,
    before: inputStat.size,
    after: outputStat.size,
    savingRatio,
  };
}

async function updateMarkdownReferences(markdownFiles, replacements) {
  for (const file of markdownFiles) {
    let text = await fs.readFile(file, "utf8");
    let next = text;
    for (const [from, to] of replacements) {
      next = next.split(from).join(to);
    }
    if (next !== text) {
      await fs.writeFile(file, next, "utf8");
    }
  }
}

async function main() {
  const markdownFiles = await listMarkdownFiles();
  const refs = await collectReferencedImages(markdownFiles);
  const replacements = new Map();
  const report = [];

  for (const ref of [...refs].sort()) {
    const result = await optimizeImage(ref);
    if (!result) continue;
    report.push(result);
    if (result.outputRef) {
      replacements.set(result.publicRef, result.outputRef);
    }
  }

  await updateMarkdownReferences(markdownFiles, replacements);

  for (const item of report) {
    if (item.outputRef) {
      const beforeKb = Math.round(item.before / 1024);
      const afterKb = Math.round(item.after / 1024);
      const savingPct = Math.round(item.savingRatio * 100);
      console.log(`${item.publicRef} -> ${item.outputRef}: ${beforeKb}KB -> ${afterKb}KB (${savingPct}% saved)`);
    } else {
      console.log(`${item.publicRef}: skipped (${item.skipped})`);
    }
  }

  console.log(`Ratgeber image refs checked: ${refs.size}`);
  console.log(`Markdown refs updated: ${replacements.size}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

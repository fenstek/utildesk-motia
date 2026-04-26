import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ROOT = fileURLToPath(new URL("../../", import.meta.url));

function resolveContentPointer(baseDir) {
  const pointerPath = join(baseDir, "content");
  try {
    const stat = lstatSync(pointerPath);

    if (stat.isSymbolicLink()) {
      return realpathSync(pointerPath);
    }

    if (stat.isDirectory()) {
      return pointerPath;
    }

    if (stat.isFile()) {
      const pointer = readFileSync(pointerPath, "utf8").trim();
      if (pointer) {
        return resolve(baseDir, pointer);
      }
    }
  } catch {
    return null;
  }

  return null;
}

function resolveContentRoot() {
  const cwd = process.cwd();
  const candidates = [
    cwd,
    resolve(cwd, "site"),
    SITE_ROOT,
  ];

  for (const candidate of candidates) {
    const resolved = resolveContentPointer(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return resolve(cwd, "content");
}

export const CONTENT_ROOT = resolveContentRoot();

export function fromContent(...segments) {
  return join(CONTENT_ROOT, ...segments);
}

import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CONTENT_POINTER_PATH = join(SITE_ROOT, "content");

function resolveContentRoot() {
  try {
    const stat = lstatSync(CONTENT_POINTER_PATH);

    if (stat.isSymbolicLink()) {
      return realpathSync(CONTENT_POINTER_PATH);
    }

    if (stat.isDirectory()) {
      return CONTENT_POINTER_PATH;
    }

    if (stat.isFile()) {
      const pointer = readFileSync(CONTENT_POINTER_PATH, "utf8").trim();
      if (pointer) {
        return resolve(SITE_ROOT, pointer);
      }
    }
  } catch {
    // fall through to default
  }

  return resolve(SITE_ROOT, "../content");
}

export const CONTENT_ROOT = resolveContentRoot();

export function fromContent(...segments) {
  return join(CONTENT_ROOT, ...segments);
}

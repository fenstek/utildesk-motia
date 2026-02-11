import fs from "node:fs";
import path from "node:path";

const MAX_BYTES = 5 * 1024 * 1024;

function findInText(text, slug) {
  const a = `/tools/${slug}/`;
  const b = `tools/${slug}`;
  return text.includes(a) || text.includes(b);
}

function readFileSafe(p) {
  const st = fs.statSync(p);
  if (st.size > MAX_BYTES) return null;
  return fs.readFileSync(p, "utf8");
}

function walk(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) {
        stack.push(p);
      } else {
        out.push(p);
      }
    }
  }
  return out;
}

export function checkDisabledTools(cfg) {
  const reasons = [];
  const slugs = cfg.disabledSlugs || [];
  const checkedDirs = [];
  const skippedDirs = [];

  if (!fs.existsSync(cfg.sitemapPath)) {
    return { ok: false, reasons: [`Missing sitemap: ${cfg.sitemapPath}`], checkedDirs, skippedDirs };
  }

  const sitemapText = fs.readFileSync(cfg.sitemapPath, "utf8");
  for (const slug of slugs) {
    if (findInText(sitemapText, slug)) {
      reasons.push(`FOUND in ${cfg.sitemapPath}: /tools/${slug}/`);
    }
  }

  for (const dir of cfg.distDirs || []) {
    if (!dir) continue;
    if (!fs.existsSync(dir)) {
      skippedDirs.push(dir);
      continue;
    }

    checkedDirs.push(dir);
    const files = walk(dir).filter((p) => /\.(html|xml|txt|json)$/i.test(p));
    for (const file of files) {
      const text = readFileSafe(file);
      if (text === null) continue;
      for (const slug of slugs) {
        if (findInText(text, slug)) {
          reasons.push(`FOUND in ${file}: /tools/${slug}/`);
        }
      }
    }
  }

  if (reasons.length) return { ok: false, reasons, checkedDirs, skippedDirs };
  return { ok: true, checkedDirs, skippedDirs };
}

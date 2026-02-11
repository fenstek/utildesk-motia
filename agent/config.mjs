export function loadConfig() {
  const env = process.env;
  const csv = (v) =>
    String(v || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  return {
    disabledSlugs: csv(env.CHECK_DISABLED_SLUGS || "kreator,suno"),
    sitemapPath: env.SITEMAP_PATH || "site/public/sitemap.xml",
    distDirs: csv(env.DIST_DIRS || "site/dist,dist"),
    maxIters: Number(env.MAX_ITERS || 5),
    codexBin: env.CODEX_BIN || "codex",
    codexMode: env.CODEX_MODE || "exec",
    codexPrompt:
      env.CODEX_PROMPT ||
      "Fix the project so disabled:true tools are not shown in catalog/index/pages and are not generated; do not break the pipeline.",
    backupEachIter: String(env.BACKUP_EACH_ITER || "0") === "1",
  };
}

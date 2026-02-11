import { createBackupPoint } from "./backup.mjs";
import { run } from "./executor.mjs";
import { checkDisabledTools } from "./checks/disabled_tools.mjs";

async function getGitStatusPorcelain(cwd) {
  const res = await run("git", ["status", "--porcelain"], { cwd });
  if (res.code !== 0) {
    console.error("Failed to read git status for codex change detection");
    return null;
  }
  return (res.stdout || "").trim();
}

export async function runLoop(cfg) {
  await createBackupPoint({ tagPrefix: "backup" });

  if (cfg.buildCmd) {
    const build = await run("bash", ["-lc", cfg.buildCmd], { cwd: process.cwd() });
    if (build.code !== 0) {
      console.error(`BUILD FAIL: ${cfg.buildCmd}`);
    }
  }

  const initialCheck = await checkDisabledTools(cfg);
  if (initialCheck.ok) {
    console.log("CHECK PASS (no fix needed)");
    return 0;
  }

  console.error("INITIAL CHECK FAIL");
  console.error(`REASONS: ${JSON.stringify(initialCheck.reasons || [])}`);
  console.error(`CHECKED DIRS: ${JSON.stringify(initialCheck.checkedDirs || [])}`);
  console.error(`SKIPPED DIRS: ${JSON.stringify(initialCheck.skippedDirs || [])}`);

  for (let iter = 1; iter <= cfg.maxIters; iter += 1) {
    if (cfg.backupEachIter) {
      await createBackupPoint({ tagPrefix: "backup" });
    }

    console.log(`ITERATION ${iter}/${cfg.maxIters}`);

    const statusBeforeCodex = await getGitStatusPorcelain(process.cwd());

    const codexArgs = [cfg.codexMode, cfg.codexPrompt];
    const exec = await run(cfg.codexBin, codexArgs, { cwd: process.cwd() });
    if (exec.code !== 0) {
      console.error(`Codex run failed with code ${exec.code}`);
    }

    const statusAfterCodex = await getGitStatusPorcelain(process.cwd());
    if (
      statusBeforeCodex !== null &&
      statusAfterCodex !== null &&
      statusBeforeCodex === statusAfterCodex
    ) {
      console.error("No changes produced by codex");
      return 2;
    }

    let precheckFailed = false;
    for (const cmd of cfg.precheckCmds || []) {
      const res = await run("bash", ["-lc", cmd], { cwd: process.cwd() });
      if (res.code !== 0) {
        console.error(`PRECHECK FAIL: ${cmd}`);
        precheckFailed = true;
        break;
      }
    }
    if (precheckFailed) {
      continue;
    }

    if (cfg.buildCmd) {
      const build = await run("bash", ["-lc", cfg.buildCmd], { cwd: process.cwd() });
      if (build.code !== 0) {
        console.error(`BUILD FAIL: ${cfg.buildCmd}`);
        continue;
      }
    }

    const check = await checkDisabledTools(cfg);
    if (check.ok) {
      console.log("CHECK PASS");
      return 0;
    }

    console.error("CHECK FAIL");
    console.error(`REASONS: ${JSON.stringify(check.reasons || [])}`);
    console.error(`CHECKED DIRS: ${JSON.stringify(check.checkedDirs || [])}`);
    console.error(`SKIPPED DIRS: ${JSON.stringify(check.skippedDirs || [])}`);
  }

  return 2;
}

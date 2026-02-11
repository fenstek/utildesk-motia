import { createBackupPoint } from "./backup.mjs";
import { run } from "./executor.mjs";
import { checkDisabledTools } from "./checks/disabled_tools.mjs";

export async function runLoop(cfg) {
  await createBackupPoint({ tagPrefix: "backup" });

  for (let iter = 1; iter <= cfg.maxIters; iter += 1) {
    if (cfg.backupEachIter) {
      await createBackupPoint({ tagPrefix: "backup" });
    }

    console.log(`ITERATION ${iter}/${cfg.maxIters}`);

    const codexArgs = [cfg.codexMode, cfg.codexPrompt];
    const exec = await run(cfg.codexBin, codexArgs, { cwd: process.cwd() });
    if (exec.code !== 0) {
      console.error(`Codex run failed with code ${exec.code}`);
    }

    const check = checkDisabledTools(cfg);
    if (check.ok) {
      console.log("CHECK PASS");
      return 0;
    }

    console.error("CHECK FAIL");
    for (const r of check.reasons || []) {
      console.error(`- ${r}`);
    }
  }

  return 2;
}

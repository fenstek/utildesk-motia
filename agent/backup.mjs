import { run } from "./executor.mjs";

function nowStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}-${hh}${mi}${ss}`;
}

export async function createBackupPoint({ tagPrefix = "backup" } = {}) {
  const status = await run("git", ["status", "--porcelain"], { cwd: process.cwd() });
  if (status.code !== 0) {
    throw new Error("git status failed");
  }
  if (status.stdout.trim()) {
    throw new Error("working tree not clean");
  }

  const sha = await run("git", ["rev-parse", "--short", "HEAD"], { cwd: process.cwd() });
  if (sha.code !== 0) {
    throw new Error("git rev-parse failed");
  }

  const base = `${tagPrefix}/${nowStamp()}-${sha.stdout.trim()}`;
  let name = base;
  let i = 0;

  while (true) {
    const tag = await run("git", ["tag", name], { cwd: process.cwd() });
    if (tag.code === 0) break;
    i += 1;
    name = `${base}-${i}`;
  }

  console.log(`BACKUP TAG: ${name}`);
  console.log(`ROLLBACK: git reset --hard ${name}`);

  return name;
}

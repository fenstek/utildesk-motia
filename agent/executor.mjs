import { spawn } from "node:child_process";

export function run(cmd, args = [], opts = {}) {
  const { cwd } = opts;

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";

    let proc;
    try {
      proc = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      return resolve({ code: 1, stdout: "", stderr: msg });
    }

    proc.stdout.on("data", (d) => {
      const s = d.toString();
      stdout += s;
      process.stdout.write(s);
    });

    proc.stderr.on("data", (d) => {
      const s = d.toString();
      stderr += s;
      process.stderr.write(s);
    });

    proc.on("error", (err) => {
      const msg = err && err.message ? err.message : String(err);
      resolve({ code: 1, stdout, stderr: stderr + msg });
    });

    proc.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

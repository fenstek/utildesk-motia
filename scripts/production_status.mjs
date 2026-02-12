#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import process from 'node:process';

function parseArgs(argv) {
  const opts = {
    noFetch: false,
    noGh: false,
    noCf: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = String(argv[i] || '');
    if (arg === '--no-fetch') {
      opts.noFetch = true;
      continue;
    }
    if (arg === '--no-gh') {
      opts.noGh = true;
      continue;
    }
    if (arg === '--no-cf') {
      opts.noCf = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function runGit(args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch (err) {
    if (allowFail) return '';
    const stderr = String(err?.stderr || '').trim();
    const msg = stderr || String(err?.message || err);
    throw new Error(`git ${args.join(' ')} failed: ${msg}`);
  }
}

function runCmd(bin, args, { allowFail = false } = {}) {
  try {
    return execFileSync(bin, args, { encoding: 'utf8' }).trim();
  } catch (err) {
    if (allowFail) return '';
    const stderr = String(err?.stderr || '').trim();
    const msg = stderr || String(err?.message || err);
    throw new Error(`${bin} ${args.join(' ')} failed: ${msg}`);
  }
}

function gitExitCode(args) {
  try {
    execFileSync('git', args, { stdio: 'ignore' });
    return 0;
  } catch (err) {
    return Number.isInteger(err?.status) ? err.status : 1;
  }
}

function shortHash(hash) {
  const h = String(hash || '').trim();
  return h ? h.slice(0, 7) : 'unknown';
}

function yesNoUnknown(v) {
  if (v === true) return 'YES';
  if (v === false) return 'NO';
  return 'UNKNOWN';
}

function hasBin(bin) {
  try {
    execFileSync('which', [bin], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function parseStatusPorcelain(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter(Boolean);

  return {
    clean: lines.length === 0,
    lines,
  };
}

function getAheadBehind(upstreamRef) {
  if (!upstreamRef) return { ahead: null, behind: null };
  const out = runGit(['rev-list', '--left-right', '--count', `${upstreamRef}...HEAD`], { allowFail: true });
  if (!out) return { ahead: null, behind: null };
  const m = out.match(/^(\d+)\s+(\d+)$/);
  if (!m) return { ahead: null, behind: null };
  return {
    behind: Number(m[1]),
    ahead: Number(m[2]),
  };
}

async function getCloudflareStatus(originMasterHead, opts) {
  if (opts.noCf) {
    return { skipped: true, message: 'skipped (--no-cf)' };
  }

  const token = process.env.CF_API_TOKEN || '';
  const accountId = process.env.CF_ACCOUNT_ID || '';
  const project = process.env.CF_PROJECT_NAME || '';

  if (!token || !accountId || !project) {
    return { skipped: true, message: 'skipped (no env)' };
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project}/deployments`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return {
        skipped: false,
        unknown: true,
        message: `unknown (HTTP ${res.status})`,
      };
    }

    const body = await res.json();
    const arr = Array.isArray(body?.result) ? body.result : [];
    if (arr.length === 0) {
      return {
        skipped: false,
        unknown: true,
        message: 'unknown (no deployments)',
      };
    }

    const prod = arr.find((d) => {
      const env = String(d?.environment || '').toLowerCase();
      const branch = String(d?.deployment_trigger?.metadata?.branch || '').toLowerCase();
      return env === 'production' || branch === 'master';
    }) || arr[0];

    const deploymentId = String(prod?.id || 'unknown');
    const createdOn = String(prod?.created_on || prod?.modified_on || 'unknown');
    const deployUrl = String(prod?.url || prod?.aliases?.[0] || 'unknown');

    const commit = String(
      prod?.deployment_trigger?.metadata?.commit_hash ||
      prod?.deployment_trigger?.metadata?.commitHash ||
      prod?.latest_stage?.deployment_trigger?.metadata?.commit_hash ||
      ''
    ).trim();

    let deployedToProd = null;
    if (commit && originMasterHead) {
      deployedToProd = commit.startsWith(originMasterHead) || originMasterHead.startsWith(commit);
    }

    return {
      skipped: false,
      unknown: commit ? false : true,
      message: commit ? null : 'deployed commit: unknown',
      deploymentId,
      createdOn,
      deployUrl,
      commit: commit || 'unknown',
      deployedToProd,
    };
  } catch (err) {
    return {
      skipped: false,
      unknown: true,
      message: `unknown (${String(err?.message || err)})`,
    };
  }
}

async function main() {
  const opts = parseArgs(process.argv);
  const cwd = process.cwd();

  const statusRaw = runGit(['status', '--porcelain']);
  const wt = parseStatusPorcelain(statusRaw);

  const branch = runGit(['branch', '--show-current']);
  const localHead = runGit(['rev-parse', 'HEAD']);
  const localSubject = runGit(['log', '-1', '--pretty=%s']);

  if (!opts.noFetch) {
    runGit(['fetch', 'origin', '--quiet'], { allowFail: true });
  }

  const originMasterHead = runGit(['rev-parse', 'origin/master'], { allowFail: true });
  const inMaster = originMasterHead
    ? (() => {
      const code = gitExitCode(['merge-base', '--is-ancestor', localHead, 'origin/master']);
      if (code === 0) return true;
      if (code === 1) return false;
      return null;
    })()
    : null;

  const upstream = runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { allowFail: true });
  const { ahead, behind } = getAheadBehind(upstream || null);
  const notPushed = typeof ahead === 'number' ? ahead > 0 : null;

  let prLine = 'unknown (gh not available)';
  if (!opts.noGh && hasBin('gh')) {
    const out = runCmd(
      'gh',
      ['pr', 'list', '--head', branch, '--base', 'master', '--state', 'open', '--json', 'number,title,url'],
      { allowFail: true }
    );

    if (!out) {
      prLine = 'unknown (gh unavailable or auth failed)';
    } else {
      try {
        const list = JSON.parse(out);
        if (!Array.isArray(list) || list.length === 0) {
          prLine = 'none';
        } else {
          const pr = list[0];
          prLine = `#${pr.number} ${pr.title} ${pr.url}`;
        }
      } catch {
        prLine = 'unknown (gh output parse failed)';
      }
    }
  } else if (opts.noGh) {
    prLine = 'skipped (--no-gh)';
  }

  const cf = await getCloudflareStatus(originMasterHead, opts);

  const report = [];
  report.push('=== Production status ===');
  report.push(`Repo: ${cwd}`);
  report.push(`Branch: ${branch || 'unknown'}`);
  report.push(`Working tree: ${wt.clean ? 'CLEAN' : `DIRTY (${wt.lines.length} files)`}`);
  if (!wt.clean) {
    for (const line of wt.lines) report.push(`  ${line}`);
  }
  report.push(`Local HEAD: ${shortHash(localHead)} "${localSubject || ''}"`);
  report.push(`origin/master: ${shortHash(originMasterHead)}`);
  report.push(`In master: ${yesNoUnknown(inMaster)}`);
  report.push(`Open PR: ${prLine}`);

  if (cf.skipped) {
    report.push(`Cloudflare Production: ${cf.message}`);
  } else if (cf.unknown) {
    report.push(`Cloudflare Production: UNKNOWN (${cf.message})`);
  } else {
    report.push(
      `Cloudflare Production: deployed ${yesNoUnknown(cf.deployedToProd)} (commit ${shortHash(cf.commit)}, time ${cf.createdOn}, id ${cf.deploymentId}, url ${cf.deployUrl})`
    );
  }

  report.push('');
  report.push('Next actions:');

  if (!wt.clean) {
    report.push('- commit changes');
  }
  if (notPushed === true) {
    report.push('- push branch');
  }
  if (branch && branch !== 'master') {
    if (prLine === 'none') report.push('- create PR');
    else if (prLine.startsWith('#')) report.push('- merge PR');
  }
  if (inMaster === true && (cf.unknown || cf.deployedToProd === false)) {
    report.push('- check Cloudflare deployments UI');
  }

  process.stdout.write(report.join('\n') + '\n');
}

main().catch((err) => {
  process.stdout.write('=== Production status ===\n');
  process.stdout.write(`Error: ${String(err?.message || err)}\n`);
  process.exit(1);
});

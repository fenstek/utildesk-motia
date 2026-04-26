#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_QUEUE_ENDPOINT = "https://tools.utildesk.de/admin/ratgeber/api/publish-queue"
DEFAULT_REPO_URL = "https://github.com/fenstek/utildesk-motia.git"
DEFAULT_BRANCH = "master"
DEFAULT_ARTICLE_WORKSPACE = Path("/opt/openclaw/workspace/agent-newsman")
DEFAULT_PUBLISH_ROOT = Path("/opt/openclaw/workspace/ratgeber-publisher")
ALLOWED_CHANGE_RE = re.compile(
    r"^(?:content/ratgeber/[a-z0-9-]+\.md|content/en/ratgeber/[a-z0-9-]+\.md|content/images/ratgeber/[a-z0-9-]+\.(?:png|jpe?g|webp))$"
)


class PublishError(RuntimeError):
    pass


def read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def safe_id(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip(".-")
    return cleaned[:160] or "request"


def run(
    args: list[str | Path],
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
    timeout: int = 300,
) -> subprocess.CompletedProcess[str]:
    process = subprocess.run(
        [str(item) for item in args],
        cwd=str(cwd) if cwd else None,
        env=env,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        timeout=timeout,
    )
    if process.returncode != 0:
        command = " ".join(str(item) for item in args)
        output = "\n".join(part for part in [process.stdout.strip(), process.stderr.strip()] if part)
        raise PublishError(f"Command failed ({process.returncode}): {command}\n{output[-4000:]}")
    return process


def request_json(url: str, token: str, payload: dict[str, Any] | None = None, method: str | None = None) -> dict[str, Any]:
    body = None
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; UtildeskRatgeberPublisher/1.0; +https://tools.utildesk.de/)",
    }
    if payload is not None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    request = urllib.request.Request(url, data=body, headers=headers, method=method or ("POST" if payload else "GET"))
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")
        raise PublishError(f"Cloudflare API failed with HTTP {error.code}: {error_body}") from error


def get_pending_requests(endpoint: str, token: str) -> list[dict[str, Any]]:
    data = request_json(endpoint, token)
    if not data.get("ok"):
        raise PublishError(f"Cloudflare queue response is not ok: {data}")
    return [item for item in data.get("requests") or [] if item.get("status") == "pending"]


def update_request(endpoint: str, token: str, request_id: str, status: str, message: str, published_url: str = "") -> None:
    payload = {
        "requestId": request_id,
        "status": status,
        "message": message[:1400],
        "publishedUrl": published_url,
    }
    data = request_json(endpoint, token, payload=payload, method="POST")
    if not data.get("ok"):
        raise PublishError(f"Could not update publish request {request_id}: {data}")


def article_python(article_workspace: Path) -> Path:
    candidates = [
        article_workspace / ".venv" / "bin" / "python",
        article_workspace / ".venv" / "Scripts" / "python.exe",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return Path(sys.executable)


def approve_and_export_package(article_workspace: Path, request: dict[str, Any]) -> Path:
    job_id = str(request.get("jobId") or "").strip()
    slug = str(request.get("slug") or "").strip()
    if not job_id or not slug:
        raise PublishError("Publish request has no jobId or slug.")

    artifact_dir = article_workspace / "artifacts" / "article_jobs" / job_id
    if not artifact_dir.exists():
        raise PublishError(f"Artifact directory is missing: {artifact_dir}")

    py = article_python(article_workspace)
    run(
        [
            py,
            "scripts/article_review_decision.py",
            "--artifact-dir",
            artifact_dir,
            "--decision",
            "approve",
            "--reviewer",
            "cloudflare-review-button",
            "--notes",
            "Approved via Utildesk Ratgeber Review publish button.",
        ],
        cwd=article_workspace,
        timeout=120,
    )
    run(
        [
            py,
            "scripts/export_ratgeber_package.py",
            "--artifact-dir",
            artifact_dir,
            "--output-root",
            "publish_ready/ratgeber",
        ],
        cwd=article_workspace,
        timeout=120,
    )

    package_dir = article_workspace / "publish_ready" / "ratgeber" / slug
    if not package_dir.exists():
        raise PublishError(f"Exported package is missing: {package_dir}")
    return package_dir


def write_askpass(run_dir: Path) -> Path:
    askpass = run_dir / "git-askpass.sh"
    askpass.write_text(
        "#!/bin/sh\n"
        "case \"$1\" in\n"
        "  *Username*) printf '%s\\n' \"${GITHUB_USER:-x-access-token}\" ;;\n"
        "  *) printf '%s\\n' \"$GITHUB_TOKEN\" ;;\n"
        "esac\n",
        encoding="utf-8",
    )
    askpass.chmod(0o700)
    return askpass


def git_env(base_env: dict[str, str], run_dir: Path) -> dict[str, str]:
    env = os.environ.copy()
    env.update(base_env)
    env["GIT_TERMINAL_PROMPT"] = "0"
    if env.get("GITHUB_TOKEN"):
        env["GIT_ASKPASS"] = str(write_askpass(run_dir))
    return env


def clone_repo(repo_url: str, branch: str, run_dir: Path, env: dict[str, str]) -> Path:
    repo_dir = run_dir / "repo"
    run(["git", "clone", "--depth", "1", "--branch", branch, repo_url, repo_dir], cwd=run_dir, env=env, timeout=300)
    run(["git", "config", "user.name", env.get("GIT_AUTHOR_NAME", "Utildesk Ratgeber Publisher")], cwd=repo_dir, env=env)
    run(["git", "config", "user.email", env.get("GIT_AUTHOR_EMAIL", "ratgeber-publisher@utildesk.de")], cwd=repo_dir, env=env)
    return repo_dir


def assert_push_access(repo_dir: Path, branch: str, env: dict[str, str]) -> None:
    run(["git", "push", "--dry-run", "origin", f"HEAD:{branch}"], cwd=repo_dir, env=env, timeout=120)


def status_paths(repo_dir: Path, env: dict[str, str]) -> list[str]:
    status = run(["git", "status", "--porcelain=v1", "--untracked-files=all"], cwd=repo_dir, env=env).stdout
    paths: list[str] = []
    for raw_line in status.splitlines():
        if not raw_line:
            continue
        path = raw_line[3:].strip()
        if " -> " in path:
            path = path.split(" -> ", 1)[1].strip()
        paths.append(path.replace("\\", "/"))
    return paths


def assert_allowed_changes(paths: list[str]) -> None:
    bad = [path for path in paths if not ALLOWED_CHANGE_RE.fullmatch(path)]
    if bad:
        raise PublishError(f"Refusing to publish because diff contains non-Ratgeber files: {bad}")


def import_package(repo_dir: Path, package_dir: Path, env: dict[str, str]) -> None:
    importer = repo_dir / "scripts" / "import_ratgeber_package.py"
    run(
        [sys.executable, importer, "--package-dir", package_dir, "--preflight-only", "--strict-warnings", "--require-english"],
        cwd=repo_dir,
        env=env,
    )
    run([sys.executable, importer, "--package-dir", package_dir, "--require-english"], cwd=repo_dir, env=env)
    paths = status_paths(repo_dir, env)
    if not paths:
        raise PublishError("Import produced no repository changes.")
    assert_allowed_changes(paths)
    run(["git", "add", "--", "content/ratgeber", "content/en/ratgeber", "content/images/ratgeber"], cwd=repo_dir, env=env)
    staged = run(["git", "diff", "--cached", "--name-only"], cwd=repo_dir, env=env).stdout.splitlines()
    assert_allowed_changes([path.strip() for path in staged if path.strip()])
    run(["git", "diff", "--cached", "--check"], cwd=repo_dir, env=env)


def commit_and_push(repo_dir: Path, request: dict[str, Any], branch: str, env: dict[str, str]) -> str:
    title = re.sub(r"\s+", " ", str(request.get("title") or request.get("slug") or "Ratgeber article")).strip()
    if len(title) > 90:
        title = title[:87].rstrip() + "..."
    run(["git", "commit", "-m", f"Publish Ratgeber: {title}"], cwd=repo_dir, env=env)
    run(["git", "push", "origin", f"HEAD:{branch}"], cwd=repo_dir, env=env, timeout=300)
    return run(["git", "rev-parse", "HEAD"], cwd=repo_dir, env=env).stdout.strip()


def wait_live(url: str, timeout_seconds: int) -> int:
    deadline = time.monotonic() + timeout_seconds
    headers = {"User-Agent": "Mozilla/5.0 (compatible; UtildeskRatgeberPublisher/1.0; +https://tools.utildesk.de/)"}
    last_status = 0
    while time.monotonic() < deadline:
        request = urllib.request.Request(url, headers=headers, method="HEAD")
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                last_status = int(response.status)
                if 200 <= last_status < 300:
                    return last_status
        except urllib.error.HTTPError as error:
            last_status = int(error.code)
        except Exception:
            last_status = 0
        time.sleep(15)
    raise PublishError(f"URL did not become live in time: {url} (last status {last_status})")


def submit_indexnow(repo_dir: Path, url: str, env: dict[str, str]) -> None:
    helper = repo_dir / "scripts" / "indexnow_submit.py"
    if helper.exists():
        run([sys.executable, helper, "submit-batch", "--url", url, "--wait-live"], cwd=repo_dir, env=env, timeout=180)


def process_request(args: argparse.Namespace, request: dict[str, Any], env_values: dict[str, str]) -> dict[str, Any]:
    request_id = str(request.get("id") or "").strip()
    slug = str(request.get("slug") or "").strip()
    if not request_id or not slug:
        raise PublishError(f"Invalid publish request: {request}")

    run_dir = args.publish_root / "runs" / safe_id(request_id)
    if run_dir.exists():
        shutil.rmtree(run_dir)
    run_dir.mkdir(parents=True, exist_ok=True)
    env = git_env(env_values, run_dir)
    repo_dir = clone_repo(args.repo_url, args.branch, run_dir, env)
    assert_push_access(repo_dir, args.branch, env)

    if not args.dry_run:
        update_request(args.queue_endpoint, args.token, request_id, "publishing", "Publisher picked up the request.")

    package_dir = approve_and_export_package(args.article_workspace, request)
    import_package(repo_dir, package_dir, env)
    commit_sha = "dry-run"
    if not args.dry_run:
        commit_sha = commit_and_push(repo_dir, request, args.branch, env)

    published_url = f"https://tools.utildesk.de/ratgeber/{slug}/"
    published_en_url = f"https://tools.utildesk.de/en/ratgeber/{slug}/"
    if not args.dry_run:
        wait_live(published_url, args.live_timeout)
        wait_live(published_en_url, args.live_timeout)
        if not args.skip_indexnow:
            submit_indexnow(repo_dir, published_url, env)
            submit_indexnow(repo_dir, published_en_url, env)
        update_request(
            args.queue_endpoint,
            args.token,
            request_id,
            "published",
            f"Published DE/EN by Ratgeber consumer from commit {commit_sha}.",
            published_url,
        )
    return {"requestId": request_id, "slug": slug, "commit": commit_sha, "url": published_url}


def main() -> int:
    parser = argparse.ArgumentParser(description="Publish approved Ratgeber Cloudflare review requests safely.")
    parser.add_argument("--queue-endpoint", default=os.getenv("RATGEBER_PUBLISH_QUEUE_ENDPOINT") or DEFAULT_QUEUE_ENDPOINT)
    parser.add_argument("--token", default=os.getenv("RATGEBER_UPLOAD_TOKEN") or "")
    parser.add_argument("--token-env", type=Path, default=Path(os.getenv("RATGEBER_REVIEW_ENV") or "auth/utildesk_ratgeber_review.env"))
    parser.add_argument("--article-workspace", type=Path, default=Path(os.getenv("RATGEBER_ARTICLE_WORKSPACE") or DEFAULT_ARTICLE_WORKSPACE))
    parser.add_argument("--publish-root", type=Path, default=Path(os.getenv("RATGEBER_PUBLISH_ROOT") or DEFAULT_PUBLISH_ROOT))
    parser.add_argument("--repo-url", default=os.getenv("RATGEBER_PUBLISH_REPO_URL") or DEFAULT_REPO_URL)
    parser.add_argument("--branch", default=os.getenv("RATGEBER_PUBLISH_BRANCH") or DEFAULT_BRANCH)
    parser.add_argument("--limit", type=int, default=int(os.getenv("RATGEBER_PUBLISH_LIMIT") or "1"))
    parser.add_argument("--live-timeout", type=int, default=int(os.getenv("RATGEBER_PUBLISH_LIVE_TIMEOUT") or "900"))
    parser.add_argument("--skip-indexnow", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    env_values = read_env_file(args.token_env)
    for key, value in env_values.items():
        os.environ.setdefault(key, value)
    args.token = args.token or env_values.get("RATGEBER_UPLOAD_TOKEN") or ""
    args.repo_url = env_values.get("RATGEBER_PUBLISH_REPO_URL") or args.repo_url
    args.branch = env_values.get("RATGEBER_PUBLISH_BRANCH") or args.branch
    args.publish_root = Path(env_values.get("RATGEBER_PUBLISH_ROOT") or args.publish_root).resolve()
    args.article_workspace = Path(env_values.get("RATGEBER_ARTICLE_WORKSPACE") or args.article_workspace).resolve()

    if not args.token:
        raise SystemExit(f"RATGEBER_UPLOAD_TOKEN is required (env or {args.token_env}).")

    args.publish_root.mkdir(parents=True, exist_ok=True)
    requests = get_pending_requests(args.queue_endpoint, args.token)[: max(1, args.limit)]
    if not requests:
        print(json.dumps({"ok": True, "processed": 0, "message": "no pending publish requests"}, ensure_ascii=False, indent=2))
        return 0

    results: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []
    for request in requests:
        request_id = str(request.get("id") or "")
        try:
            results.append(process_request(args, request, env_values))
        except Exception as exc:
            message = str(exc)
            failures.append({"requestId": request_id, "error": message[-1400:]})
            if request_id and "git push --dry-run" not in message:
                try:
                    update_request(args.queue_endpoint, args.token, request_id, "failed", message)
                except Exception as update_exc:
                    failures.append({"requestId": request_id, "error": f"status update failed: {update_exc}"})

    ok = not failures
    print(json.dumps({"ok": ok, "processed": len(results), "results": results, "failures": failures}, ensure_ascii=False, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())

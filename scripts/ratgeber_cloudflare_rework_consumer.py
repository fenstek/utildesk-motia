#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_QUEUE_ENDPOINT = "https://tools.utildesk.de/admin/ratgeber/api/rework-queue"
DEFAULT_UPLOAD_ENDPOINT = "https://tools.utildesk.de/admin/ratgeber/api/upload"
DEFAULT_ARTICLE_WORKSPACE = Path("/opt/openclaw/workspace/agent-newsman")
VISUAL_ASSET_NAMES = ("cover.png", "workflow.png", "cover.svg", "workflow.svg", "illustration.svg")


class ReworkError(RuntimeError):
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


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def file_sha256(path: Path) -> str | None:
    if not path.exists() or not path.is_file():
        return None
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def visual_asset_snapshot(artifact_dir: Path) -> dict[str, str | None]:
    return {name: file_sha256(artifact_dir / name) for name in VISUAL_ASSET_NAMES}


def scope_requests_visual(request: dict[str, Any]) -> bool:
    raw_scope = request.get("scope") or ["text", "visual"]
    scope = [str(item).strip().lower() for item in raw_scope if str(item).strip()]
    return "visual" in scope or not scope


def run(args: list[str | Path], cwd: Path, timeout: int = 900) -> subprocess.CompletedProcess[str]:
    process = subprocess.run(
        [str(item) for item in args],
        cwd=str(cwd),
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        timeout=timeout,
    )
    if process.returncode != 0:
        command = " ".join(str(item) for item in args)
        output = "\n".join(part for part in [process.stdout.strip(), process.stderr.strip()] if part)
        raise ReworkError(f"Command failed ({process.returncode}): {command}\n{output[-4000:]}")
    return process


def request_json(url: str, token: str, payload: dict[str, Any] | None = None, method: str | None = None) -> dict[str, Any]:
    body = None
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; UtildeskRatgeberReworker/1.0; +https://tools.utildesk.de/)",
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
        raise ReworkError(f"Cloudflare API failed with HTTP {error.code}: {error_body}") from error


def update_request(endpoint: str, token: str, request_id: str, status: str, message: str) -> None:
    data = request_json(endpoint, token, {"requestId": request_id, "status": status, "message": message[:1400]}, method="POST")
    if not data.get("ok"):
        raise ReworkError(f"Could not update rework request {request_id}: {data}")


def get_pending_requests(endpoint: str, token: str) -> list[dict[str, Any]]:
    data = request_json(endpoint, token)
    if not data.get("ok"):
        raise ReworkError(f"Cloudflare queue response is not ok: {data}")
    return [item for item in data.get("requests") or [] if item.get("status") == "pending"]


def article_python(article_workspace: Path) -> Path:
    candidates = [
        article_workspace / ".venv" / "bin" / "python",
        article_workspace / ".venv" / "Scripts" / "python.exe",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return Path(sys.executable)


def normalize_tasks(notes: str, scope: list[str]) -> tuple[list[str], list[str]]:
    text_tasks = [
        "Poliere den Text sichtbar redaktionell: weniger PR-Ton, klarerer Einstieg, menschlicherer Rhythmus, konkretere Nutzenabwaegung.",
        "Pruefe alle Aussagen gegen die vorhandenen Quellen; keine neuen Fakten erfinden.",
    ]
    visual_tasks = [
        "Erzeuge eine neue themenspezifische Utildesk-Illustration, die sichtbar zum Text passt.",
        "Nutze eine frische Bildidee; den bisherigen visuellen Aufbau nicht wiederverwenden.",
        "Keine Service-Labels, keine internen Hinweise, keine generischen Footer-Texte in der Illustration.",
    ]
    if notes:
        if "text" in scope:
            text_tasks.append(f"Human review note: {notes}")
        if "visual" in scope:
            visual_tasks.append(f"Human visual note: {notes}")
    return text_tasks, visual_tasks


def prepare_rework_packet(article_workspace: Path, request: dict[str, Any]) -> Path:
    job_id = str(request.get("jobId") or "").strip()
    if not job_id:
        raise ReworkError(f"Rework request has no jobId: {request}")
    artifact_dir = article_workspace / "artifacts" / "article_jobs" / job_id
    if not artifact_dir.exists():
        raise ReworkError(f"Artifact directory is missing: {artifact_dir}")

    packet_path = artifact_dir / "review_packet.json"
    job_path = artifact_dir / "job.json"
    if not packet_path.exists() or not job_path.exists():
        raise ReworkError(f"Missing review_packet.json or job.json in {artifact_dir}")

    packet = load_json(packet_path)
    job = load_json(job_path)
    notes = str(request.get("notes") or "").strip()
    scope = [str(item).strip() for item in (request.get("scope") or ["text", "visual"]) if str(item).strip()]
    text_tasks, visual_tasks = normalize_tasks(notes, scope)
    now = datetime.now(timezone.utc).isoformat()

    packet["review_status"] = "rewrite_requested"
    packet["human_decision"] = "rewrite_requested"
    packet["auto_recommendation"] = "rewrite_requested"
    packet["editorial_rewrite_tasks"] = text_tasks
    packet["visual_rework_tasks"] = visual_tasks
    packet["requires_human_approval"] = True
    packet["rework_requested_at"] = now
    packet["rework_request"] = {
        "id": request.get("id"),
        "scope": scope,
        "notes": notes,
        "requested_at": request.get("requestedAt") or now,
    }
    write_json(packet_path, packet)

    brief = " ".join(visual_tasks)
    existing_brief = str(job.get("illustration_brief") or "").strip()
    if existing_brief and not job.get("original_illustration_brief"):
        job["original_illustration_brief"] = existing_brief
    job["illustration_brief"] = brief
    if "visual" in scope:
        previous_iteration = int(job.get("visual_rework_iteration") or 0)
        job["visual_rework_required"] = True
        job["visual_rework_iteration"] = previous_iteration + 1
        job["visual_rework_note"] = notes
        job["visual_rework_tasks"] = visual_tasks
        job["visual_rework_requested_at"] = now
        job["visual_rework_do_not_reuse"] = [
            "same selected renderer variant",
            "same cover/workflow asset hash",
            "generic block diagram",
            "internal footer/service labels",
        ]
    job["human_rework_notes"] = notes
    job["human_rework_scope"] = scope
    job["rework_requested_at"] = now
    write_json(job_path, job)

    verdict_path = artifact_dir / "editorial_verdict.json"
    if verdict_path.exists():
        verdict_path.unlink()
    upload_marker = artifact_dir / "cloudflare_review_uploaded.json"
    if upload_marker.exists():
        upload_marker.unlink()
    return artifact_dir


def rebuild_visuals(article_workspace: Path, artifact_dir: Path) -> None:
    py = article_python(article_workspace)
    helper = (
        "import json, pathlib, sys;"
        "root=pathlib.Path(sys.argv[1]); art=pathlib.Path(sys.argv[2]);"
        "sys.path.insert(0, str(root));"
        "from article_execution.article_runner import load_json_if_exists, analyze_article_quality, build_review_packet, render_package, write_json, normalize_article_text;"
        "job=load_json_if_exists(art/'job.json');"
        "article=normalize_article_text((art/'article.md').read_text(encoding='utf-8-sig'));"
        "result=load_json_if_exists(art/'result.json');"
        "result['article_quality']=analyze_article_quality(job, article);"
        "result['render']=render_package(job, article, art);"
        "result['rework_visual_regenerated_at']=__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat();"
        "write_json(art/'result.json', result);"
        "packet=build_review_packet(job, result, art);"
        "packet['requires_human_approval']=True;"
        "write_json(art/'review_packet.json', packet);"
    )
    run([py, "-c", helper, article_workspace, artifact_dir], cwd=article_workspace, timeout=240)


def selected_visual_variants(artifact_dir: Path) -> dict[str, str]:
    result_path = artifact_dir / "result.json"
    if not result_path.exists():
        return {}
    try:
        result = load_json(result_path)
    except Exception:
        return {}
    quality = result.get("render", {}).get("illustration_quality") or result.get("illustration_quality") or {}
    return {
        "cover": str(quality.get("cover", {}).get("selected_variant") or ""),
        "workflow": str(quality.get("workflow", {}).get("selected_variant") or ""),
    }


def ensure_visual_rework_changed(
    artifact_dir: Path,
    before_assets: dict[str, str | None],
    before_variants: dict[str, str],
) -> None:
    after_assets = visual_asset_snapshot(artifact_dir)
    after_variants = selected_visual_variants(artifact_dir)
    changed_assets = [
        name
        for name in ("cover.png", "workflow.png")
        if before_assets.get(name) and after_assets.get(name) and before_assets.get(name) != after_assets.get(name)
    ]
    changed_variants = [
        role
        for role in ("cover", "workflow")
        if before_variants.get(role) and after_variants.get(role) and before_variants.get(role) != after_variants.get(role)
    ]
    if changed_assets or changed_variants:
        return
    write_json(
        artifact_dir / "visual_rework_failed.json",
        {
            "failed_at": datetime.now(timezone.utc).isoformat(),
            "reason": "visual rework produced the same assets/renderer variants",
            "before_assets": before_assets,
            "after_assets": after_assets,
            "before_variants": before_variants,
            "after_variants": after_variants,
        },
    )
    raise ReworkError(
        "Visual rework did not change cover/workflow images. "
        "The candidate was not returned to review with unchanged visuals."
    )


def upload_candidate(article_workspace: Path, artifact_dir: Path, upload_endpoint: str, token_env: Path) -> None:
    py = article_python(article_workspace)
    run(
        [
            py,
            "scripts/ratgeber_cloudflare_candidate_sync.py",
            "--artifact-dir",
            artifact_dir,
            "--endpoint",
            upload_endpoint,
            "--token-env",
            token_env,
            "--force-upload",
            "--force-images",
        ],
        cwd=article_workspace,
        timeout=240,
    )


def process_request(args: argparse.Namespace, request: dict[str, Any]) -> dict[str, Any]:
    request_id = str(request.get("id") or "").strip()
    if not request_id:
        raise ReworkError(f"Invalid rework request: {request}")
    update_request(args.queue_endpoint, args.token, request_id, "processing", "Rework consumer picked up the request.")

    visual_rework_requested = scope_requests_visual(request)
    job_id = str(request.get("jobId") or "").strip()
    artifact_dir_for_snapshot = args.article_workspace / "artifacts" / "article_jobs" / job_id
    before_assets = visual_asset_snapshot(artifact_dir_for_snapshot) if visual_rework_requested else {}
    before_variants = selected_visual_variants(artifact_dir_for_snapshot) if visual_rework_requested else {}

    artifact_dir = prepare_rework_packet(args.article_workspace, request)
    py = article_python(args.article_workspace)
    run(
        [
            py,
            "scripts/article_rewrite_runner.py",
            "--artifact-dir",
            artifact_dir,
            "--force",
            "--max-attempts",
            str(args.max_attempts),
        ],
        cwd=args.article_workspace,
        timeout=args.rewrite_timeout,
    )
    rebuild_visuals(args.article_workspace, artifact_dir)
    if visual_rework_requested:
        ensure_visual_rework_changed(artifact_dir, before_assets, before_variants)
    upload_candidate(args.article_workspace, artifact_dir, args.upload_endpoint, args.token_env)
    update_request(args.queue_endpoint, args.token, request_id, "completed", "Text and visuals were reworked and candidate preview was refreshed.")
    return {"requestId": request_id, "jobId": request.get("jobId"), "artifactDir": str(artifact_dir)}


def main() -> int:
    parser = argparse.ArgumentParser(description="Consume Utildesk Ratgeber text+visual rework requests.")
    parser.add_argument("--queue-endpoint", default=os.getenv("RATGEBER_REWORK_QUEUE_ENDPOINT") or DEFAULT_QUEUE_ENDPOINT)
    parser.add_argument("--upload-endpoint", default=os.getenv("RATGEBER_REVIEW_UPLOAD_ENDPOINT") or DEFAULT_UPLOAD_ENDPOINT)
    parser.add_argument("--token", default=os.getenv("RATGEBER_UPLOAD_TOKEN") or "")
    parser.add_argument("--token-env", type=Path, default=Path(os.getenv("RATGEBER_REVIEW_ENV") or "auth/utildesk_ratgeber_review.env"))
    parser.add_argument("--article-workspace", type=Path, default=Path(os.getenv("RATGEBER_ARTICLE_WORKSPACE") or DEFAULT_ARTICLE_WORKSPACE))
    parser.add_argument("--limit", type=int, default=int(os.getenv("RATGEBER_REWORK_LIMIT") or "1"))
    parser.add_argument("--max-attempts", type=int, default=int(os.getenv("ARTICLE_AUTO_REWRITE_MAX_ATTEMPTS") or "3"))
    parser.add_argument("--rewrite-timeout", type=int, default=int(os.getenv("RATGEBER_REWORK_TIMEOUT") or "1200"))
    args = parser.parse_args()

    env_values = read_env_file(args.token_env)
    for key, value in env_values.items():
        os.environ.setdefault(key, value)
    args.token = args.token or env_values.get("RATGEBER_UPLOAD_TOKEN") or ""
    args.article_workspace = Path(env_values.get("RATGEBER_ARTICLE_WORKSPACE") or args.article_workspace).resolve()
    if not args.token:
        raise SystemExit(f"RATGEBER_UPLOAD_TOKEN is required (env or {args.token_env}).")

    requests = get_pending_requests(args.queue_endpoint, args.token)[: max(1, args.limit)]
    if not requests:
        print(json.dumps({"ok": True, "processed": 0, "message": "no pending rework requests"}, ensure_ascii=False, indent=2))
        return 0

    results: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []
    for request in requests:
        request_id = str(request.get("id") or "")
        try:
            results.append(process_request(args, request))
        except Exception as exc:
            message = str(exc)
            failures.append({"requestId": request_id, "error": message[-1400:]})
            if request_id:
                try:
                    update_request(args.queue_endpoint, args.token, request_id, "failed", message)
                except Exception as update_exc:
                    failures.append({"requestId": request_id, "error": f"status update failed: {update_exc}"})
    ok = not failures
    print(json.dumps({"ok": ok, "processed": len(results), "results": results, "failures": failures}, ensure_ascii=False, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""IndexNow helper for tools.utildesk.de.

Discovers a public IndexNow key file from site/public and can submit URLs
directly or derive them from changed repo files / git ranges.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Iterable


ROOT_DIR = Path(__file__).resolve().parent.parent
SITE_PUBLIC_DIR = ROOT_DIR / "site" / "public"
DEFAULT_SITE_URL = "https://tools.utildesk.de"
DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow"
KEY_PATTERN = re.compile(r"^[A-Za-z0-9-]{8,128}$")
TOOLS_PATH_RE = re.compile(r"^content/tools/_?(?P<slug>[^/]+)\.md$")
RATGEBER_PATH_RE = re.compile(r"^content/ratgeber/(?P<slug>[^/]+)\.md$")
ACCEPTABLE_LIVE_STATUSES = {200, 301, 302, 307, 308, 404, 410}


class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def print_json(payload: object) -> None:
    print(json.dumps(payload, ensure_ascii=False, indent=2))


def normalize_site_url(raw: str) -> str:
    site_url = str(raw or "").strip().rstrip("/")
    if not site_url:
        raise SystemExit("Missing site URL.")
    parsed = urllib.parse.urlparse(site_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise SystemExit(f"Invalid site URL: {site_url}")
    return site_url


def discover_indexnow_key_file(public_dir: Path) -> tuple[str, Path]:
    candidates: list[tuple[str, Path]] = []
    for path in sorted(public_dir.glob("*.txt")):
        try:
            content = path.read_text(encoding="utf-8").strip()
        except OSError:
            continue
        if not content:
            continue
        if content != path.stem:
            continue
        if not KEY_PATTERN.fullmatch(content):
            continue
        candidates.append((content, path))

    if not candidates:
        raise SystemExit(
            "No IndexNow key file found in site/public. "
            "Expected a root .txt file whose content exactly matches its filename stem."
        )
    if len(candidates) > 1:
        names = ", ".join(path.name for _, path in candidates)
        raise SystemExit(f"Multiple IndexNow key files found in site/public: {names}")
    return candidates[0]


def get_settings() -> dict[str, str]:
    site_url = normalize_site_url(os.environ.get("INDEXNOW_SITE_URL", DEFAULT_SITE_URL))
    endpoint = str(os.environ.get("INDEXNOW_ENDPOINT", DEFAULT_ENDPOINT)).strip() or DEFAULT_ENDPOINT

    key = str(os.environ.get("INDEXNOW_KEY", "")).strip()
    key_location = str(os.environ.get("INDEXNOW_KEY_LOCATION", "")).strip()

    if key:
        if not KEY_PATTERN.fullmatch(key):
            raise SystemExit("INDEXNOW_KEY does not match IndexNow key requirements.")
        if not key_location:
            key_location = f"{site_url}/{key}.txt"
        return {
            "site_url": site_url,
            "endpoint": endpoint,
            "key": key,
            "key_location": key_location,
        }

    key_value, key_file = discover_indexnow_key_file(SITE_PUBLIC_DIR)
    return {
        "site_url": site_url,
        "endpoint": endpoint,
        "key": key_value,
        "key_location": f"{site_url}/{key_file.name}",
    }


def build_opener() -> urllib.request.OpenerDirector:
    return urllib.request.build_opener(NoRedirectHandler())


def fetch_status(url: str, timeout_seconds: int = 20) -> tuple[int, str]:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "utildesk-indexnow/1.0"},
        method="GET",
    )
    opener = build_opener()
    try:
        with opener.open(request, timeout=timeout_seconds) as response:
            status = int(response.status)
            body = response.read().decode("utf-8", errors="replace")
            return status, body
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace") if exc.fp else ""
        return int(exc.code), body
    except urllib.error.URLError as exc:
        raise SystemExit(f"Failed to fetch {url}: {exc.reason}") from exc


def wait_until_accessible(
    url: str,
    *,
    timeout_seconds: int,
    poll_interval: int,
    acceptable_statuses: set[int],
) -> dict[str, object]:
    deadline = time.time() + timeout_seconds
    last_status: int | None = None
    while time.time() < deadline:
        try:
            status, body = fetch_status(url)
            last_status = status
            if status in acceptable_statuses:
                return {"url": url, "status": status, "body": body}
        except SystemExit:
            last_status = None
        time.sleep(poll_interval)
    return {"url": url, "status": last_status, "body": None}


def verify_live_key(
    settings: dict[str, str],
    *,
    timeout_seconds: int,
    poll_interval: int,
) -> dict[str, object]:
    result = wait_until_accessible(
        settings["key_location"],
        timeout_seconds=timeout_seconds,
        poll_interval=poll_interval,
        acceptable_statuses={200},
    )
    if result["status"] != 200:
        raise SystemExit(
            f"IndexNow key file is not live yet at {settings['key_location']} "
            f"(last status: {result['status']!r})."
        )
    body = str(result["body"] or "").strip()
    if body != settings["key"]:
        raise SystemExit(
            f"Live IndexNow key file content mismatch at {settings['key_location']}."
        )
    return {
        "ok": True,
        "keyLocation": settings["key_location"],
        "key": settings["key"],
    }


def dedupe_urls(urls: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for raw in urls:
        url = str(raw or "").strip()
        if not url or url in seen:
            continue
        seen.add(url)
        result.append(url)
    return result


def validate_urls_for_site(urls: list[str], site_url: str) -> list[str]:
    site_host = urllib.parse.urlparse(site_url).netloc.lower()
    validated: list[str] = []
    for url in urls:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise SystemExit(f"Invalid URL for IndexNow submission: {url}")
        if parsed.netloc.lower() != site_host:
            raise SystemExit(f"URL does not belong to {site_host}: {url}")
        validated.append(url)
    return validated


def post_indexnow_batch(
    *,
    endpoint: str,
    host: str,
    key: str,
    key_location: str,
    urls: list[str],
) -> tuple[int, str]:
    payload = {
        "host": host,
        "key": key,
        "keyLocation": key_location,
        "urlList": urls,
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=data,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json, text/plain;q=0.9, */*;q=0.8",
            "User-Agent": "utildesk-indexnow/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            body = response.read().decode("utf-8", errors="replace")
            return int(response.status), body
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace") if exc.fp else ""
        return int(exc.code), body


def collect_urls_from_repo_paths(paths: Iterable[str], site_url: str) -> list[str]:
    urls: list[str] = []
    tools_changed = False
    ratgeber_changed = False

    for raw in paths:
        path = str(raw or "").strip().replace("\\", "/")
        if not path:
            continue

        tool_match = TOOLS_PATH_RE.match(path)
        if tool_match:
            tools_changed = True
            slug = tool_match.group("slug")
            urls.append(f"{site_url}/tools/{slug}/")
            continue

        ratgeber_match = RATGEBER_PATH_RE.match(path)
        if ratgeber_match:
            ratgeber_changed = True
            slug = ratgeber_match.group("slug")
            urls.append(f"{site_url}/ratgeber/{slug}/")
            continue

    if tools_changed:
        urls.append(f"{site_url}/tools/")
    if ratgeber_changed:
        urls.append(f"{site_url}/ratgeber/")
    if tools_changed or ratgeber_changed:
        urls.append(f"{site_url}/")

    return dedupe_urls(urls)


def collect_paths_from_git_range(rev_range: str) -> list[str]:
    result = subprocess.run(
        [
            "git",
            "diff",
            "--name-only",
            "--diff-filter=ACDMRT",
            rev_range,
        ],
        cwd=ROOT_DIR,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise SystemExit(
            f"git diff failed for {rev_range}: {result.stderr.strip() or result.stdout.strip()}"
        )
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def chunked(urls: list[str], size: int = 10000) -> Iterable[list[str]]:
    for index in range(0, len(urls), size):
        yield urls[index : index + size]


def submit_urls(
    settings: dict[str, str],
    urls: list[str],
    *,
    wait_live: bool,
    timeout_seconds: int,
    poll_interval: int,
    dry_run: bool,
) -> None:
    urls = validate_urls_for_site(dedupe_urls(urls), settings["site_url"])
    if not urls:
        print_json(
            {
                "ok": True,
                "submitted": 0,
                "message": "No IndexNow-eligible URLs to submit.",
            }
        )
        return

    key_check: dict[str, object] | None = None
    if wait_live:
        key_check = verify_live_key(
            settings,
            timeout_seconds=timeout_seconds,
            poll_interval=poll_interval,
        )
        live_results = []
        for url in urls:
            result = wait_until_accessible(
                url,
                timeout_seconds=timeout_seconds,
                poll_interval=poll_interval,
                acceptable_statuses=ACCEPTABLE_LIVE_STATUSES,
            )
            live_results.append({"url": url, "status": result["status"]})
            if result["status"] not in ACCEPTABLE_LIVE_STATUSES:
                raise SystemExit(
                    f"URL did not become live in time for IndexNow: {url} "
                    f"(last status: {result['status']!r})"
                )
    else:
        live_results = []

    if dry_run:
        print_json(
            {
                "ok": True,
                "dryRun": True,
                "endpoint": settings["endpoint"],
                "siteUrl": settings["site_url"],
                "keyLocation": settings["key_location"],
                "count": len(urls),
                "urls": urls,
                "liveChecks": live_results,
                "keyCheck": key_check,
            }
        )
        return

    host = urllib.parse.urlparse(settings["site_url"]).netloc
    responses = []
    for batch in chunked(urls):
        status, body = post_indexnow_batch(
            endpoint=settings["endpoint"],
            host=host,
            key=settings["key"],
            key_location=settings["key_location"],
            urls=batch,
        )
        responses.append({"status": status, "count": len(batch), "body": body})
        if status not in {200, 202}:
            raise SystemExit(
                f"IndexNow submission failed with HTTP {status}: {body or 'no response body'}"
            )

    print_json(
        {
            "ok": True,
            "siteUrl": settings["site_url"],
            "endpoint": settings["endpoint"],
            "keyLocation": settings["key_location"],
            "count": len(urls),
            "urls": urls,
            "responses": responses,
            "liveChecks": live_results,
            "keyCheck": key_check,
        }
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="IndexNow helper for tools.utildesk.de"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    smoke = subparsers.add_parser(
        "smoke",
        help="Verify the configured IndexNow key file is publicly reachable and correct.",
    )
    smoke.add_argument("--timeout-seconds", type=int, default=300)
    smoke.add_argument("--poll-interval", type=int, default=10)

    submit_batch = subparsers.add_parser(
        "submit-batch",
        help="Submit one or more URLs to the IndexNow global endpoint.",
    )
    submit_batch.add_argument("--url", action="append", required=True)
    submit_batch.add_argument("--wait-live", action="store_true")
    submit_batch.add_argument("--timeout-seconds", type=int, default=600)
    submit_batch.add_argument("--poll-interval", type=int, default=15)
    submit_batch.add_argument("--dry-run", action="store_true")

    submit_git_range = subparsers.add_parser(
        "submit-git-range",
        help="Derive changed canonical URLs from a git diff range and submit them.",
    )
    submit_git_range.add_argument("--rev-range", required=True)
    submit_git_range.add_argument("--wait-live", action="store_true")
    submit_git_range.add_argument("--timeout-seconds", type=int, default=600)
    submit_git_range.add_argument("--poll-interval", type=int, default=15)
    submit_git_range.add_argument("--dry-run", action="store_true")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    settings = get_settings()

    if args.command == "smoke":
        key_check = verify_live_key(
            settings,
            timeout_seconds=args.timeout_seconds,
            poll_interval=args.poll_interval,
        )
        print_json(
            {
                "ok": True,
                "siteUrl": settings["site_url"],
                "endpoint": settings["endpoint"],
                **key_check,
            }
        )
        return 0

    if args.command == "submit-batch":
        submit_urls(
            settings,
            args.url,
            wait_live=args.wait_live,
            timeout_seconds=args.timeout_seconds,
            poll_interval=args.poll_interval,
            dry_run=args.dry_run,
        )
        return 0

    if args.command == "submit-git-range":
        changed_paths = collect_paths_from_git_range(args.rev_range)
        urls = collect_urls_from_repo_paths(changed_paths, settings["site_url"])
        submit_urls(
            settings,
            urls,
            wait_live=args.wait_live,
            timeout_seconds=args.timeout_seconds,
            poll_interval=args.poll_interval,
            dry_run=args.dry_run,
        )
        return 0

    parser.error(f"Unknown command: {args.command}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

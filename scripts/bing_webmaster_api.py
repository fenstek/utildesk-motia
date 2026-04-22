#!/usr/bin/env python3
"""Small Bing Webmaster Tools helper for local operational work.

Uses the API-key flow documented by Microsoft.
Default local secret file: secrets/bing-webmaster.env
"""

from __future__ import annotations

import argparse
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_ENV_FILE = Path("secrets/bing-webmaster.env")
DEFAULT_API_BASE = "https://ssl.bing.com/webmaster/api.svc/json"
BING_DATE_RE = re.compile(r"^/Date\((?P<ms>-?\d+)(?:[+-]\d{4})?\)/$")


def load_env_file(path: Path) -> dict[str, str]:
    data: dict[str, str] = {}
    if not path.exists():
        return data

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        data[key] = value
    return data


def get_settings(env_file: Path) -> dict[str, str]:
    settings = load_env_file(env_file)
    for key in (
        "BING_WEBMASTER_API_KEY",
        "BING_WEBMASTER_SITE_URL",
        "BING_WEBMASTER_API_BASE",
        "BING_WEBMASTER_SMOKE_FEED_URL",
    ):
        if os.environ.get(key):
            settings[key] = os.environ[key]

    if "BING_WEBMASTER_API_BASE" not in settings:
        settings["BING_WEBMASTER_API_BASE"] = DEFAULT_API_BASE
    return settings


def require_setting(settings: dict[str, str], key: str, human_name: str) -> str:
    value = settings.get(key, "").strip()
    if value:
        return value
    raise SystemExit(
        f"Missing {human_name}. Fill it in {DEFAULT_ENV_FILE.as_posix()} "
        f"or set the {key} environment variable."
    )


def unwrap_bing_json(payload: Any) -> Any:
    if isinstance(payload, dict) and "d" in payload:
        return payload["d"]
    return payload


def parse_bing_date(raw: Any) -> str | None:
    if not isinstance(raw, str):
        return None
    match = BING_DATE_RE.match(raw.strip())
    if not match:
        return None
    milliseconds = int(match.group("ms"))
    return datetime.fromtimestamp(milliseconds / 1000, tz=timezone.utc).isoformat()


def call_bing_api(
    *,
    api_base: str,
    api_key: str,
    method: str,
    http_method: str,
    params: dict[str, Any] | None = None,
) -> Any:
    method = method.strip("/")
    http_method = http_method.upper()
    params = params or {}

    base_url = f"{api_base.rstrip('/')}/{method}"
    query = urllib.parse.urlencode({"apikey": api_key})
    url = f"{base_url}?{query}"
    headers = {"Accept": "application/json"}
    body: bytes | None = None

    if http_method == "GET":
        if params:
            extra_query = urllib.parse.urlencode(
                {key: "" if value is None else str(value) for key, value in params.items()}
            )
            url = f"{url}&{extra_query}"
    elif http_method == "POST":
        headers["Content-Type"] = "application/json; charset=utf-8"
        body = json.dumps(params, ensure_ascii=False).encode("utf-8")
    else:
        raise SystemExit(f"Unsupported HTTP method: {http_method}")

    request = urllib.request.Request(url, data=body, headers=headers, method=http_method)

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            raw = response.read()
            if not raw:
                return None
            charset = response.headers.get_content_charset() or "utf-8"
            return json.loads(raw.decode(charset))
    except urllib.error.HTTPError as exc:
        raw = exc.read()
        details = raw.decode("utf-8", errors="replace") if raw else ""
        raise SystemExit(
            f"Bing Webmaster API error {exc.code} for {method}: {details or exc.reason}"
        ) from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"Failed to reach Bing Webmaster API: {exc.reason}") from exc


def print_json(data: Any) -> None:
    print(json.dumps(data, ensure_ascii=False, indent=2))


def parse_kv_pairs(values: list[str]) -> dict[str, str]:
    parsed: dict[str, str] = {}
    for item in values:
        if "=" not in item:
            raise SystemExit(f"Invalid --param value: {item}. Expected key=value.")
        key, value = item.split("=", 1)
        parsed[key] = value
    return parsed


def add_common_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--env-file",
        default=str(DEFAULT_ENV_FILE),
        help="Path to the local Bing Webmaster env file.",
    )
    parser.add_argument(
        "--site-url",
        help="Verified site URL in Bing Webmaster Tools. Defaults to BING_WEBMASTER_SITE_URL.",
    )


def command_smoke(settings: dict[str, str], site_url_override: str | None) -> None:
    api_key = require_setting(settings, "BING_WEBMASTER_API_KEY", "Bing Webmaster API key")
    site_url = site_url_override or require_setting(
        settings, "BING_WEBMASTER_SITE_URL", "Bing Webmaster site URL"
    )
    api_base = settings["BING_WEBMASTER_API_BASE"]

    result = call_bing_api(
        api_base=api_base,
        api_key=api_key,
        method="GetUrlSubmissionQuota",
        http_method="GET",
        params={"siteUrl": site_url},
    )

    print_json(
        {
            "ok": True,
            "siteUrl": site_url,
            "quota": unwrap_bing_json(result),
        }
    )


def command_quota(settings: dict[str, str], site_url_override: str | None) -> None:
    api_key = require_setting(settings, "BING_WEBMASTER_API_KEY", "Bing Webmaster API key")
    site_url = site_url_override or require_setting(
        settings, "BING_WEBMASTER_SITE_URL", "Bing Webmaster site URL"
    )
    api_base = settings["BING_WEBMASTER_API_BASE"]

    result = call_bing_api(
        api_base=api_base,
        api_key=api_key,
        method="GetUrlSubmissionQuota",
        http_method="GET",
        params={"siteUrl": site_url},
    )
    print_json(unwrap_bing_json(result))


def command_sites(settings: dict[str, str]) -> None:
    api_key = require_setting(settings, "BING_WEBMASTER_API_KEY", "Bing Webmaster API key")
    api_base = settings["BING_WEBMASTER_API_BASE"]

    result = call_bing_api(
        api_base=api_base,
        api_key=api_key,
        method="GetUserSites",
        http_method="GET",
    )
    print_json(unwrap_bing_json(result))


def command_feeds(settings: dict[str, str], site_url_override: str | None) -> None:
    api_key = require_setting(settings, "BING_WEBMASTER_API_KEY", "Bing Webmaster API key")
    site_url = site_url_override or require_setting(
        settings, "BING_WEBMASTER_SITE_URL", "Bing Webmaster site URL"
    )
    api_base = settings["BING_WEBMASTER_API_BASE"]

    result = call_bing_api(
        api_base=api_base,
        api_key=api_key,
        method="GetFeeds",
        http_method="GET",
        params={"siteUrl": site_url},
    )
    print_json(unwrap_bing_json(result))


def command_crawl_summary(
    settings: dict[str, str],
    site_url_override: str | None,
    days: int,
) -> None:
    if days <= 0:
        raise SystemExit("--days must be greater than 0.")

    api_key = require_setting(settings, "BING_WEBMASTER_API_KEY", "Bing Webmaster API key")
    site_url = site_url_override or require_setting(
        settings, "BING_WEBMASTER_SITE_URL", "Bing Webmaster site URL"
    )
    api_base = settings["BING_WEBMASTER_API_BASE"]

    result = call_bing_api(
        api_base=api_base,
        api_key=api_key,
        method="GetCrawlStats",
        http_method="GET",
        params={"siteUrl": site_url},
    )
    stats = unwrap_bing_json(result)
    if not isinstance(stats, list) or not stats:
        print_json({"siteUrl": site_url, "days": 0, "message": "No crawl stats returned."})
        return

    recent = stats[-days:]
    summary = {
        "siteUrl": site_url,
        "days": len(recent),
        "latestDateUtc": parse_bing_date(recent[-1].get("Date")),
        "latestInIndex": recent[-1].get("InIndex"),
        "avgCrawledPages": round(
            sum(float(item.get("CrawledPages", 0)) for item in recent) / len(recent), 2
        ),
        "avg2xx": round(sum(float(item.get("Code2xx", 0)) for item in recent) / len(recent), 2),
        "avg4xx": round(sum(float(item.get("Code4xx", 0)) for item in recent) / len(recent), 2),
        "avgCrawlErrors": round(
            sum(float(item.get("CrawlErrors", 0)) for item in recent) / len(recent), 2
        ),
        "max4xx": max(int(item.get("Code4xx", 0)) for item in recent),
        "maxCrawlErrors": max(int(item.get("CrawlErrors", 0)) for item in recent),
        "daysWithRobotsBlocks": sum(
            1 for item in recent if int(item.get("BlockedByRobotsTxt", 0)) > 0
        ),
        "daysWith5xx": sum(1 for item in recent if int(item.get("Code5xx", 0)) > 0),
    }
    print_json(summary)


def command_submit_url(
    settings: dict[str, str],
    site_url_override: str | None,
    url: str,
) -> None:
    api_key = require_setting(settings, "BING_WEBMASTER_API_KEY", "Bing Webmaster API key")
    site_url = site_url_override or require_setting(
        settings, "BING_WEBMASTER_SITE_URL", "Bing Webmaster site URL"
    )
    api_base = settings["BING_WEBMASTER_API_BASE"]

    result = call_bing_api(
        api_base=api_base,
        api_key=api_key,
        method="SubmitUrl",
        http_method="POST",
        params={"siteUrl": site_url, "url": url},
    )
    print_json({"ok": True, "siteUrl": site_url, "url": url, "result": unwrap_bing_json(result)})


def command_submit_batch(
    settings: dict[str, str],
    site_url_override: str | None,
    urls: list[str],
) -> None:
    api_key = require_setting(settings, "BING_WEBMASTER_API_KEY", "Bing Webmaster API key")
    site_url = site_url_override or require_setting(
        settings, "BING_WEBMASTER_SITE_URL", "Bing Webmaster site URL"
    )
    api_base = settings["BING_WEBMASTER_API_BASE"]

    final_urls = [item.strip() for item in urls if item.strip()]
    if not final_urls:
        raise SystemExit("Submit-batch requires at least one non-empty --url value.")

    result = call_bing_api(
        api_base=api_base,
        api_key=api_key,
        method="SubmitUrlBatch",
        http_method="POST",
        params={"siteUrl": site_url, "urlList": final_urls},
    )
    print_json(
        {
            "ok": True,
            "siteUrl": site_url,
            "count": len(final_urls),
            "urls": final_urls,
            "result": unwrap_bing_json(result),
        }
    )


def command_submit_feed(
    settings: dict[str, str],
    site_url_override: str | None,
    feed_url: str | None,
) -> None:
    api_key = require_setting(settings, "BING_WEBMASTER_API_KEY", "Bing Webmaster API key")
    site_url = site_url_override or require_setting(
        settings, "BING_WEBMASTER_SITE_URL", "Bing Webmaster site URL"
    )
    api_base = settings["BING_WEBMASTER_API_BASE"]
    final_feed_url = (
        feed_url
        or settings.get("BING_WEBMASTER_SMOKE_FEED_URL", "").strip()
        or f"{site_url.rstrip('/')}/sitemap.xml"
    )

    result = call_bing_api(
        api_base=api_base,
        api_key=api_key,
        method="SubmitFeed",
        http_method="POST",
        params={"siteUrl": site_url, "feedUrl": final_feed_url},
    )
    print_json(
        {
            "ok": True,
            "siteUrl": site_url,
            "feedUrl": final_feed_url,
            "result": unwrap_bing_json(result),
        }
    )


def command_call(
    settings: dict[str, str],
    method: str,
    http_method: str,
    params: list[str],
) -> None:
    api_key = require_setting(settings, "BING_WEBMASTER_API_KEY", "Bing Webmaster API key")
    api_base = settings["BING_WEBMASTER_API_BASE"]
    payload = parse_kv_pairs(params)
    result = call_bing_api(
        api_base=api_base,
        api_key=api_key,
        method=method,
        http_method=http_method,
        params=payload,
    )
    print_json({"method": method, "httpMethod": http_method.upper(), "result": result})


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Local helper for Bing Webmaster Tools API using the API-key flow."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    smoke = subparsers.add_parser(
        "smoke", help="Validate the key against GetUrlSubmissionQuota for the configured site."
    )
    add_common_args(smoke)

    quota = subparsers.add_parser(
        "quota", help="Show Bing URL submission quota for the configured site."
    )
    add_common_args(quota)

    sites = subparsers.add_parser(
        "sites", help="List verified sites visible to the configured Bing API key."
    )
    sites.add_argument("--env-file", default=str(DEFAULT_ENV_FILE))

    feeds = subparsers.add_parser(
        "feeds", help="List feeds/sitemaps currently registered for the configured site."
    )
    add_common_args(feeds)

    crawl_summary = subparsers.add_parser(
        "crawl-summary",
        help="Summarize recent Bing crawl stats for the configured site.",
    )
    add_common_args(crawl_summary)
    crawl_summary.add_argument(
        "--days",
        type=int,
        default=30,
        help="How many most-recent days to summarize (default: 30).",
    )

    submit_url = subparsers.add_parser("submit-url", help="Submit one URL to Bing.")
    add_common_args(submit_url)
    submit_url.add_argument("--url", required=True, help="Absolute URL to submit.")

    submit_batch = subparsers.add_parser(
        "submit-batch", help="Submit multiple canonical URLs to Bing in one request."
    )
    add_common_args(submit_batch)
    submit_batch.add_argument(
        "--url",
        action="append",
        required=True,
        help="Absolute URL to submit. Repeat --url for multiple URLs.",
    )

    submit_feed = subparsers.add_parser(
        "submit-feed", help="Submit sitemap/feed URL to Bing."
    )
    add_common_args(submit_feed)
    submit_feed.add_argument(
        "--feed-url",
        help="Absolute sitemap/feed URL. Defaults to BING_WEBMASTER_SMOKE_FEED_URL or /sitemap.xml.",
    )

    call = subparsers.add_parser("call", help="Call an arbitrary Bing Webmaster API method.")
    call.add_argument("--env-file", default=str(DEFAULT_ENV_FILE))
    call.add_argument("--method", required=True, help="Method name, e.g. GetSiteList or SubmitUrl.")
    call.add_argument(
        "--http-method",
        default="GET",
        choices=("GET", "POST", "get", "post"),
        help="HTTP method to use against the Bing JSON endpoint.",
    )
    call.add_argument(
        "--param",
        action="append",
        default=[],
        help="Method parameter in key=value form. Repeat as needed.",
    )

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    env_file = Path(args.env_file)
    settings = get_settings(env_file)

    if args.command == "smoke":
        command_smoke(settings, args.site_url)
    elif args.command == "quota":
        command_quota(settings, args.site_url)
    elif args.command == "sites":
        command_sites(settings)
    elif args.command == "feeds":
        command_feeds(settings, args.site_url)
    elif args.command == "crawl-summary":
        command_crawl_summary(settings, args.site_url, args.days)
    elif args.command == "submit-url":
        command_submit_url(settings, args.site_url, args.url)
    elif args.command == "submit-batch":
        command_submit_batch(settings, args.site_url, args.url)
    elif args.command == "submit-feed":
        command_submit_feed(settings, args.site_url, args.feed_url)
    elif args.command == "call":
        command_call(settings, args.method, args.http_method, args.param)
    else:
        parser.error(f"Unknown command: {args.command}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

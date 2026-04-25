#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT_DIR / "content" / "ratgeber"
IMAGES_DIR = ROOT_DIR / "content" / "images" / "ratgeber"
SITE_IMAGE_PREFIX = "/images/ratgeber/"
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
INLINE_IMAGE_RE = re.compile(r"!\[[^\]]*\]\((?P<url>[^)]+)\)")
SOURCE_LINK_RE = re.compile(r"\[[^\]]+\]\((https?://[^)]+)\)")
RESIDUAL_CITATION_RE = re.compile(
    r"(?<!\!)\[(?:\d+(?:\s*[-–—]\s*\d+)?)(?:\s*,\s*\d+(?:\s*[-–—]\s*\d+)?)*\]"
)
MACHINE_RESIDUE_PATTERNS = [
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"\bIf you want\b",
        r"\bIn this article\b",
        r"\bThis article\b",
        r"\bWenn du willst\b",
        r"\bIch kann dir auch\b",
        r"\btool spotlight\b",
        r"\bworkflow layer\b",
    )
]
REQUIRED_FRONTMATTER_SCALARS = [
    "slug",
    "title",
    "date",
    "category",
    "eyebrow",
    "excerpt",
    "readTime",
    "coverImage",
    "secondaryImage",
]


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def clean_scalar(value: str) -> str:
    value = str(value or "").strip()
    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        return value[1:-1].strip()
    return value


def append_issue(target: list[dict[str, str]], code: str, message: str) -> None:
    target.append({"code": code, "message": message})


def resolve_package_file(package_dir: Path, raw_path: str, fallback_name: str | None = None) -> Path:
    raw = str(raw_path or "").strip()
    candidates: list[Path] = []
    if raw:
        candidate = Path(raw)
        if candidate.is_absolute():
            candidates.append(candidate)
        else:
            candidates.append(package_dir / candidate)
            candidates.append(package_dir / candidate.name)
            candidates.append(package_dir / "images" / candidate.name)
    if fallback_name:
        candidates.append(package_dir / fallback_name)
        candidates.append(package_dir / "images" / fallback_name)

    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0] if candidates else package_dir / str(fallback_name or raw_path)


def split_frontmatter(article_text: str) -> tuple[str, str]:
    normalized = article_text.replace("\r\n", "\n")
    if not normalized.startswith("---\n"):
        return "", normalized
    end = normalized.find("\n---", 4)
    if end < 0:
        return "", normalized
    frontmatter = normalized[4:end].strip()
    body = normalized[end + 4 :].lstrip("\n")
    return frontmatter, body


def frontmatter_scalar(frontmatter: str, key: str) -> str:
    match = re.search(rf"^{re.escape(key)}:\s*(.*?)\s*$", frontmatter, flags=re.MULTILINE)
    return clean_scalar(match.group(1)) if match else ""


def frontmatter_list_count(frontmatter: str, key: str) -> int:
    lines = frontmatter.splitlines()
    count = 0
    in_block = False
    for line in lines:
        if re.match(rf"^{re.escape(key)}:\s*$", line):
            in_block = True
            continue
        if in_block and re.match(r"^[A-Za-z][A-Za-z0-9_]*:", line):
            break
        if in_block and re.match(r"^\s+-\s+", line):
            count += 1
    return count


def markdown_word_count(markdown_text: str) -> int:
    text = re.sub(r"```[\s\S]*?```", " ", markdown_text)
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", text)
    text = re.sub(r"\[[^\]]+\]\([^)]+\)", " ", text)
    return len(re.findall(r"\b[\wÄÖÜäöüß-]+\b", text, flags=re.UNICODE))


def normalize_title_key(value: str) -> set[str]:
    words = re.findall(r"[a-z0-9äöüß]+", str(value or "").lower())
    stopwords = {"der", "die", "das", "und", "oder", "mit", "wie", "was", "fur", "für", "eine", "einer", "ein"}
    return {word for word in words if len(word) > 2 and word not in stopwords}


def title_similarity(left: str, right: str) -> float:
    a = normalize_title_key(left)
    b = normalize_title_key(right)
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def load_existing_article_titles() -> list[tuple[str, str]]:
    records: list[tuple[str, str]] = []
    if not CONTENT_DIR.exists():
        return records
    for path in CONTENT_DIR.glob("*.md"):
        try:
            frontmatter, _body = split_frontmatter(path.read_text(encoding="utf-8-sig"))
        except OSError:
            continue
        title = frontmatter_scalar(frontmatter, "title")
        if title:
            records.append((path.stem, title))
    return records


def ensure_approved_package(manifest: dict[str, Any], package_dir: Path) -> None:
    review_status = str(manifest.get("review_status") or "").strip()
    approved_at = str(manifest.get("approved_at") or "").strip()
    if review_status != "approved_for_publish":
        raise RuntimeError(
            f"Package is not approved for import. Expected review_status='approved_for_publish', got {review_status!r}."
        )
    if not approved_at:
        raise RuntimeError("Package has no approved_at timestamp.")

    for key in ("review_packet", "editorial_verdict"):
        rel_path = str(manifest.get(key) or "").strip()
        if not rel_path:
            raise RuntimeError(f"Package manifest missing required field: {key}")
        target = package_dir / rel_path
        if not target.exists():
            raise FileNotFoundError(f"Required approval artifact missing: {target}")


def build_package_paths(manifest: dict[str, Any], package_dir: Path) -> dict[str, Path | str]:
    slug = str(manifest.get("slug") or "").strip()
    article_src = resolve_package_file(package_dir, str(manifest.get("article_file") or ""), f"{slug}.md")
    cover_name = Path(str(manifest.get("cover_image") or "")).name
    secondary_name = Path(str(manifest.get("secondary_image") or "")).name
    cover_src = resolve_package_file(package_dir, str(manifest.get("cover_image") or ""), cover_name)
    secondary_src = resolve_package_file(package_dir, str(manifest.get("secondary_image") or ""), secondary_name)
    return {
        "slug": slug,
        "article_src": article_src,
        "cover_src": cover_src,
        "secondary_src": secondary_src,
        "article_dest": CONTENT_DIR / article_src.name,
        "cover_dest": IMAGES_DIR / cover_src.name,
        "secondary_dest": IMAGES_DIR / secondary_src.name,
        "cover_url": SITE_IMAGE_PREFIX + cover_src.name,
        "secondary_url": SITE_IMAGE_PREFIX + secondary_src.name,
    }


def validate_review_artifacts(package_dir: Path, errors: list[dict[str, str]], warnings: list[dict[str, str]]) -> dict[str, Any]:
    review_packet = {}
    editorial_verdict = {}
    try:
        review_packet = load_json(package_dir / "review_packet.json")
    except Exception as exc:
        append_issue(errors, "review_packet_unreadable", f"review_packet.json is missing or unreadable: {exc}")

    try:
        editorial_verdict = load_json(package_dir / "editorial_verdict.json")
    except Exception as exc:
        append_issue(errors, "editorial_verdict_unreadable", f"editorial_verdict.json is missing or unreadable: {exc}")

    if review_packet:
        article_quality = review_packet.get("article_quality") or {}
        visual_quality = review_packet.get("visual_quality") or {}
        score = int(article_quality.get("score") or 0)
        issue_codes = [str(code) for code in (article_quality.get("issue_codes") or []) if str(code).strip()]
        visual_issue_codes = [str(code) for code in (visual_quality.get("editorial_issue_codes") or []) if str(code).strip()]

        if review_packet.get("review_status") != "approved_for_publish":
            append_issue(errors, "review_packet_not_approved", "review_packet.json is not approved_for_publish.")
        if bool(review_packet.get("requires_human_approval")):
            append_issue(errors, "human_approval_still_required", "review_packet.json still requires human approval.")
        if not bool(article_quality.get("pass")):
            append_issue(errors, "article_quality_failed", "Article quality gate did not pass.")
        if score < 86:
            append_issue(errors, "article_quality_score_low", f"Article quality score is {score}; expected at least 86.")
        elif score < 92:
            append_issue(warnings, "article_quality_score_not_autonomous", f"Article quality score is {score}; autonomous publish should prefer 92+.")
        if article_quality.get("blockers"):
            append_issue(errors, "article_quality_blockers", f"Article quality blockers remain: {article_quality.get('blockers')}.")
        if issue_codes:
            append_issue(warnings, "article_quality_issues", f"Article quality issue codes remain: {issue_codes}.")
        if not bool(visual_quality.get("pass")):
            append_issue(errors, "visual_quality_failed", "Visual quality gate did not pass.")
        if visual_issue_codes:
            append_issue(errors, "visual_editorial_issues", f"Visual editorial issue codes remain: {visual_issue_codes}.")
        for field in ("cover_variant", "workflow_variant"):
            if str(visual_quality.get(field) or "").startswith("generic"):
                append_issue(errors, "generic_visual_fallback", f"{field} uses a generic fallback.")

    if editorial_verdict:
        verdict_status = str(editorial_verdict.get("review_status") or editorial_verdict.get("decision") or "").strip()
        if verdict_status != "approved_for_publish":
            append_issue(errors, "editorial_verdict_not_approved", "editorial_verdict.json is not approved_for_publish.")
        if not str(editorial_verdict.get("reviewed_at") or "").strip():
            append_issue(errors, "editorial_verdict_missing_reviewed_at", "editorial_verdict.json has no reviewed_at timestamp.")
        if not str(editorial_verdict.get("reviewer") or "").strip():
            append_issue(warnings, "editorial_verdict_missing_reviewer", "editorial_verdict.json has no reviewer label.")

    return {"review_packet": review_packet, "editorial_verdict": editorial_verdict}


def validate_article_markdown(
    article_text: str,
    manifest: dict[str, Any],
    paths: dict[str, Path | str],
    errors: list[dict[str, str]],
    warnings: list[dict[str, str]],
) -> dict[str, Any]:
    frontmatter, body = split_frontmatter(article_text)
    metrics: dict[str, Any] = {}
    slug = str(paths["slug"])

    if not frontmatter:
        append_issue(errors, "frontmatter_missing", "Article markdown must start with YAML frontmatter.")
        return metrics

    for key in REQUIRED_FRONTMATTER_SCALARS:
        if not frontmatter_scalar(frontmatter, key):
            append_issue(errors, "frontmatter_field_missing", f"Frontmatter field is missing: {key}")

    fm_slug = frontmatter_scalar(frontmatter, "slug")
    fm_title = frontmatter_scalar(frontmatter, "title")
    fm_date = frontmatter_scalar(frontmatter, "date")
    fm_excerpt = frontmatter_scalar(frontmatter, "excerpt")
    fm_read_time = frontmatter_scalar(frontmatter, "readTime")
    fm_cover = frontmatter_scalar(frontmatter, "coverImage")
    fm_secondary = frontmatter_scalar(frontmatter, "secondaryImage")
    tag_count = frontmatter_list_count(frontmatter, "tags")
    sidebar_count = frontmatter_list_count(frontmatter, "sidebarPoints")
    related_tools_count = frontmatter_list_count(frontmatter, "relatedTools")
    h2_count = len(re.findall(r"^##\s+", body, flags=re.MULTILINE))
    word_count = markdown_word_count(body)
    inline_images = [match.group("url") for match in INLINE_IMAGE_RE.finditer(body)]
    secondary_url = str(paths["secondary_url"])
    secondary_pos = body.find(f"]({secondary_url})")
    words_before_secondary = markdown_word_count(body[:secondary_pos]) if secondary_pos >= 0 else 0
    words_after_secondary = markdown_word_count(body[secondary_pos:]) if secondary_pos >= 0 else 0
    source_links = SOURCE_LINK_RE.findall(body)

    metrics.update(
        {
            "word_count": word_count,
            "h2_count": h2_count,
            "tag_count": tag_count,
            "sidebar_points": sidebar_count,
            "related_tools": related_tools_count,
            "inline_images": inline_images,
            "words_before_secondary_image": words_before_secondary,
            "words_after_secondary_image": words_after_secondary,
            "source_links": len(source_links),
        }
    )

    if fm_slug != slug:
        append_issue(errors, "frontmatter_slug_mismatch", f"Frontmatter slug {fm_slug!r} does not match manifest slug {slug!r}.")
    if fm_title and str(manifest.get("title") or "").strip() and fm_title != str(manifest.get("title") or "").strip():
        append_issue(warnings, "frontmatter_title_manifest_mismatch", "Frontmatter title differs from package manifest title.")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", fm_date):
        append_issue(errors, "frontmatter_date_invalid", f"Frontmatter date must be YYYY-MM-DD, got {fm_date!r}.")
    if len(fm_excerpt) < 70:
        append_issue(warnings, "excerpt_short", "Excerpt is short; Bing/GSC recommendations prefer fuller context.")
    if fm_read_time and not fm_read_time.isdigit():
        append_issue(errors, "read_time_invalid", "readTime must be an integer.")
    if fm_cover != str(paths["cover_url"]):
        append_issue(errors, "cover_image_path_mismatch", f"coverImage should be {paths['cover_url']}.")
    if fm_secondary != secondary_url:
        append_issue(errors, "secondary_image_path_mismatch", f"secondaryImage should be {secondary_url}.")
    if tag_count < 3:
        append_issue(errors, "too_few_tags", f"Expected at least 3 tags, got {tag_count}.")
    if sidebar_count < 2:
        append_issue(warnings, "thin_sidebar", f"Expected at least 2 sidebar points, got {sidebar_count}.")
    if related_tools_count < 2:
        append_issue(warnings, "thin_related_tools", f"Expected at least 2 related tools for Utildesk internal linking, got {related_tools_count}.")
    if word_count < 650:
        append_issue(errors, "article_too_short", f"Article body has {word_count} words; expected at least 650.")
    if h2_count < 4:
        append_issue(errors, "too_few_sections", f"Article body has {h2_count} H2 sections; expected at least 4.")
    if RESIDUAL_CITATION_RE.search(frontmatter + "\n" + body):
        append_issue(
            errors,
            "residual_numeric_citations",
            "Article still contains NotebookLM-style numeric citations like [1], [1-3], or [24, 26-28].",
        )
    for pattern in MACHINE_RESIDUE_PATTERNS:
        if pattern.search(body):
            append_issue(errors, "machine_residue", f"Body still contains machine/template residue matching {pattern.pattern!r}.")
    if secondary_url not in inline_images:
        append_issue(errors, "secondary_image_not_inline", "Body must include the secondary image as an inline figure.")
    if secondary_pos >= 0 and words_before_secondary < 260:
        append_issue(warnings, "secondary_image_too_early", f"Secondary image appears after only {words_before_secondary} words.")
    if secondary_pos >= 0 and words_after_secondary < 240:
        append_issue(warnings, "secondary_image_too_late_or_tail_thin", f"Only {words_after_secondary} words remain after the secondary image.")
    if "## Quellen" not in body:
        append_issue(warnings, "sources_section_missing", "Article has no explicit '## Quellen' section.")
    if len(source_links) < 2:
        append_issue(warnings, "thin_source_links", f"Article body has only {len(source_links)} external source links.")

    return metrics


def validate_package(package_dir: Path, replace: bool = False, strict_warnings: bool = False) -> dict[str, Any]:
    package_dir = package_dir.resolve()
    errors: list[dict[str, str]] = []
    warnings: list[dict[str, str]] = []
    manifest_path = package_dir / "package.json"
    manifest: dict[str, Any] = {}

    if not manifest_path.exists():
        append_issue(errors, "manifest_missing", f"Package manifest not found: {manifest_path}")
        return {
            "ok": False,
            "errors": errors,
            "warnings": warnings,
            "strict_warnings": strict_warnings,
            "package_dir": str(package_dir),
        }

    try:
        manifest = load_json(manifest_path)
    except Exception as exc:
        append_issue(errors, "manifest_unreadable", f"Package manifest is unreadable: {exc}")
        return {
            "ok": False,
            "errors": errors,
            "warnings": warnings,
            "strict_warnings": strict_warnings,
            "package_dir": str(package_dir),
        }

    try:
        ensure_approved_package(manifest, package_dir)
    except Exception as exc:
        append_issue(errors, "approval_gate_failed", str(exc))

    paths = build_package_paths(manifest, package_dir)
    slug = str(paths["slug"])
    title = str(manifest.get("title") or "").strip()

    if not slug:
        append_issue(errors, "slug_missing", "Package has no slug.")
    elif not SLUG_RE.fullmatch(slug):
        append_issue(errors, "slug_invalid", f"Slug must be lowercase kebab-case, got {slug!r}.")
    if not title:
        append_issue(errors, "title_missing", "Package has no title.")

    for key in ("article_src", "cover_src", "secondary_src"):
        path = paths[key]
        if not isinstance(path, Path) or not path.exists():
            append_issue(errors, f"{key}_missing", f"Required package file missing: {path}")

    article_dest = paths["article_dest"]
    cover_dest = paths["cover_dest"]
    secondary_dest = paths["secondary_dest"]
    if isinstance(article_dest, Path) and article_dest.exists() and not replace:
        append_issue(errors, "article_already_exists", f"Ratgeber article already exists: {article_dest}")
    if isinstance(cover_dest, Path) and cover_dest.exists() and not replace:
        append_issue(errors, "cover_image_already_exists", f"Target cover image already exists: {cover_dest}")
    if isinstance(secondary_dest, Path) and secondary_dest.exists() and not replace:
        append_issue(errors, "secondary_image_already_exists", f"Target secondary image already exists: {secondary_dest}")

    duplicate_candidates: list[dict[str, Any]] = []
    for existing_slug, existing_title in load_existing_article_titles():
        if existing_slug == slug and not replace:
            append_issue(errors, "duplicate_slug", f"Existing article slug matches package slug: {existing_slug}")
            continue
        similarity = title_similarity(title, existing_title)
        if similarity >= 0.72:
            duplicate_candidates.append({"slug": existing_slug, "title": existing_title, "similarity": round(similarity, 3)})
    if duplicate_candidates:
        append_issue(warnings, "possible_duplicate_topic", f"Possible duplicate topic/title: {duplicate_candidates[:3]}")

    metrics: dict[str, Any] = {}
    article_src = paths["article_src"]
    if isinstance(article_src, Path) and article_src.exists():
        try:
            article_text = article_src.read_text(encoding="utf-8-sig")
            metrics = validate_article_markdown(article_text, manifest, paths, errors, warnings)
        except Exception as exc:
            append_issue(errors, "article_unreadable", f"Article markdown is unreadable: {exc}")

    review_payload = validate_review_artifacts(package_dir, errors, warnings)
    ok = not errors and (not strict_warnings or not warnings)
    return {
        "ok": ok,
        "errors": errors,
        "warnings": warnings,
        "strict_warnings": strict_warnings,
        "package_dir": str(package_dir),
        "slug": slug,
        "title": title,
        "paths": {key: str(value) for key, value in paths.items()},
        "metrics": metrics,
        "review": {
            "article_quality": (review_payload.get("review_packet") or {}).get("article_quality") or {},
            "visual_quality": (review_payload.get("review_packet") or {}).get("visual_quality") or {},
            "verdict": {
                "review_status": (review_payload.get("editorial_verdict") or {}).get("review_status"),
                "reviewer": (review_payload.get("editorial_verdict") or {}).get("reviewer"),
                "reviewed_at": (review_payload.get("editorial_verdict") or {}).get("reviewed_at"),
            },
        },
    }


def ensure_preflight_ok(report: dict[str, Any]) -> None:
    if report.get("ok"):
        return
    lines = []
    for issue in report.get("errors") or []:
        lines.append(f"ERROR {issue.get('code')}: {issue.get('message')}")
    if report.get("strict_warnings"):
        for issue in report.get("warnings") or []:
            lines.append(f"WARNING {issue.get('code')}: {issue.get('message')}")
    raise RuntimeError("Ratgeber package preflight failed:\n" + "\n".join(lines))


def import_package(package_dir: Path, dry_run: bool = False, replace: bool = False, strict_warnings: bool = False) -> dict[str, Any]:
    manifest_path = package_dir / "package.json"
    if not manifest_path.exists():
        raise FileNotFoundError(f"Package manifest not found: {manifest_path}")

    manifest = load_json(manifest_path)
    preflight = validate_package(package_dir, replace=replace, strict_warnings=strict_warnings)
    ensure_preflight_ok(preflight)
    paths = build_package_paths(manifest, package_dir)
    slug = str(paths["slug"])

    article_src = paths["article_src"]
    cover_src = paths["cover_src"]
    secondary_src = paths["secondary_src"]
    article_dest = paths["article_dest"]
    cover_dest = paths["cover_dest"]
    secondary_dest = paths["secondary_dest"]
    if not all(isinstance(path, Path) for path in (article_src, cover_src, secondary_src, article_dest, cover_dest, secondary_dest)):
        raise RuntimeError("Internal path resolution failed.")

    result = {
        "slug": slug,
        "article_src": str(article_src),
        "article_dest": str(article_dest),
        "cover_dest": str(cover_dest),
        "secondary_dest": str(secondary_dest),
        "dry_run": dry_run,
        "preflight": preflight,
    }

    if dry_run:
        return result

    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    shutil.copy2(article_src, article_dest)
    shutil.copy2(cover_src, cover_dest)
    shutil.copy2(secondary_src, secondary_dest)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Import a publish-ready Ratgeber package into utildesk-motia.")
    parser.add_argument("--package-dir", type=Path, required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--preflight-only", action="store_true")
    parser.add_argument("--replace", action="store_true")
    parser.add_argument(
        "--strict-warnings",
        action="store_true",
        help="Treat warnings as blocking. Use this for autonomous publication.",
    )
    args = parser.parse_args()

    if args.preflight_only:
        result = validate_package(args.package_dir, replace=args.replace, strict_warnings=args.strict_warnings)
        print(json.dumps({"ok": bool(result.get("ok")), "preflight": result}, ensure_ascii=False, indent=2))
        return 0 if result.get("ok") else 2

    result = import_package(
        args.package_dir,
        dry_run=args.dry_run,
        replace=args.replace,
        strict_warnings=args.strict_warnings,
    )
    print(json.dumps({"ok": True, **result}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

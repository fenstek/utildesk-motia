#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT_DIR / "content" / "ratgeber"
IMAGES_DIR = ROOT_DIR / "content" / "images" / "ratgeber"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def ensure_approved_package(manifest: dict, package_dir: Path) -> None:
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


def import_package(package_dir: Path, dry_run: bool = False, replace: bool = False) -> dict:
    manifest_path = package_dir / "package.json"
    if not manifest_path.exists():
        raise FileNotFoundError(f"Package manifest not found: {manifest_path}")

    manifest = load_json(manifest_path)
    ensure_approved_package(manifest, package_dir)
    slug = str(manifest.get("slug") or "").strip()
    if not slug:
        raise RuntimeError("Package has no slug.")

    article_src = package_dir / f"{slug}.md"
    cover_src = package_dir / "images" / Path(str(manifest.get("cover_image") or "")).name
    secondary_src = package_dir / "images" / Path(str(manifest.get("secondary_image") or "")).name

    if not article_src.exists():
        raise FileNotFoundError(f"Article file missing: {article_src}")
    if not cover_src.exists():
        raise FileNotFoundError(f"Cover image missing: {cover_src}")
    if not secondary_src.exists():
        raise FileNotFoundError(f"Secondary image missing: {secondary_src}")

    article_dest = CONTENT_DIR / article_src.name
    cover_dest = IMAGES_DIR / cover_src.name
    secondary_dest = IMAGES_DIR / secondary_src.name

    if article_dest.exists() and not replace:
        raise RuntimeError(f"Ratgeber article already exists: {article_dest}")
    if (cover_dest.exists() or secondary_dest.exists()) and not replace:
        raise RuntimeError("One of the target images already exists.")

    result = {
        "slug": slug,
        "article_src": str(article_src),
        "article_dest": str(article_dest),
        "cover_dest": str(cover_dest),
        "secondary_dest": str(secondary_dest),
        "dry_run": dry_run,
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
    parser.add_argument("--replace", action="store_true")
    args = parser.parse_args()

    result = import_package(args.package_dir, dry_run=args.dry_run, replace=args.replace)
    print(json.dumps({"ok": True, **result}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

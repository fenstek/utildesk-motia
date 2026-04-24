#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import html
import json
import os
import re
import sys
import tempfile
import textwrap
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


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


def first_heading(markdown_text: str) -> str:
    for line in markdown_text.splitlines():
        if line.startswith("# "):
            return re.sub(r"\s*\[(?:\d+(?:,\s*\d+)*)\]", "", line[2:].strip())
    return "Unbenannter Artikel"


def escape(value: Any) -> str:
    return html.escape(str(value or ""), quote=True)


def short_label(value: str, limit: int = 28) -> str:
    cleaned = re.sub(r"\s+", " ", value or "").strip()
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[: limit - 1].rstrip() + "…"


def topic_terms(title: str, job: dict[str, Any]) -> list[str]:
    candidates = [
        str(job.get("format") or "").replace("_", " "),
        str(job.get("audience") or ""),
        str(job.get("angle") or ""),
        str(job.get("topic") or ""),
        title,
    ]
    text = " ".join(candidates)
    words = re.findall(r"[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß-]{4,}", text)
    stop = {
        "diese",
        "dieser",
        "deine",
        "deiner",
        "einen",
        "einem",
        "einer",
        "eine",
        "website",
        "bereit",
        "werden",
        "gerade",
        "einordnung",
        "praxis",
        "gelingt",
        "einsatz",
        "thema",
        "genug",
        "substanz",
    }
    seen: set[str] = set()
    result: list[str] = []
    for word in words:
        key = word.lower()
        if key in stop or key in seen:
            continue
        seen.add(key)
        result.append(short_label(word, 18))
        if len(result) >= 6:
            break
    return result or ["Quellen", "Agenten", "Review", "Publikation"]


def cover_html(title: str, job: dict[str, Any]) -> str:
    terms = topic_terms(title, job)
    chips = "".join(f"<span>{escape(term)}</span>" for term in terms[:5])
    title_wrapped = textwrap.wrap(title, width=38)
    if len(title_wrapped) > 4:
        title_wrapped = title_wrapped[:4]
        title_wrapped[-1] = title_wrapped[-1].rstrip(" .,:;") + "…"
    title_lines = "<br>".join(title_wrapped)
    why_now = str(job.get("why_now") or job.get("angle") or "Quellen, Agenten und Review-Gate werden zu einem belastbaren Veröffentlichungsfluss.")
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      width: 1600px;
      height: 960px;
      overflow: hidden;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #12241f;
      background:
        radial-gradient(circle at 82% 16%, rgba(125, 226, 209, .72), transparent 260px),
        radial-gradient(circle at 16% 78%, rgba(217, 138, 65, .32), transparent 300px),
        linear-gradient(135deg, #fff8ec 0%, #efe3d0 100%);
    }}
    .frame {{
      position: absolute;
      inset: 58px;
      border: 2px solid rgba(15, 84, 77, .18);
      border-radius: 58px;
      padding: 74px;
      background: rgba(255, 252, 246, .68);
      box-shadow: 0 38px 100px rgba(23, 38, 33, .14);
    }}
    .kicker {{
      color: #0f544d;
      letter-spacing: .22em;
      text-transform: uppercase;
      font-size: 30px;
      font-weight: 900;
      margin-bottom: 42px;
    }}
    h1 {{
      margin: 0;
      max-width: 880px;
      font-size: 74px;
      line-height: .95;
      letter-spacing: -.075em;
    }}
    .dek {{
      margin-top: 28px;
      max-width: 720px;
      font-size: 28px;
      line-height: 1.28;
      color: #49645d;
    }}
    .chips {{
      position: absolute;
      left: 74px;
      bottom: 70px;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      max-width: 900px;
    }}
    .chips span {{
      padding: 15px 24px;
      border-radius: 999px;
      background: #ffffff;
      color: #0f544d;
      border: 1px solid rgba(15, 84, 77, .18);
      font-size: 24px;
      font-weight: 850;
      box-shadow: 0 12px 30px rgba(23, 38, 33, .08);
    }}
    .orbit {{
      position: absolute;
      right: 82px;
      top: 126px;
      width: 440px;
      height: 600px;
    }}
    .node {{
      position: absolute;
      width: 162px;
      min-height: 120px;
      padding: 24px;
      border-radius: 34px;
      background: #0f544d;
      color: white;
      box-shadow: 0 28px 70px rgba(15, 84, 77, .26);
      font-weight: 900;
      font-size: 25px;
      line-height: 1.05;
    }}
    .node small {{
      display: block;
      margin-top: 12px;
      color: rgba(255,255,255,.74);
      font-size: 17px;
      line-height: 1.25;
      font-weight: 700;
    }}
    .n1 {{ left: 0; top: 64px; }}
    .n2 {{ right: 0; top: 0; background: #d98a41; }}
    .n3 {{ right: 34px; bottom: 96px; }}
    .n4 {{ left: 34px; bottom: 0; background: #18352f; }}
    .wire {{
      position: absolute;
      left: 58px;
      top: 148px;
      width: 318px;
      height: 318px;
      border: 12px solid rgba(15, 84, 77, .16);
      border-radius: 50%;
    }}
    .pulse {{
      position: absolute;
      left: 185px;
      top: 276px;
      width: 86px;
      height: 86px;
      border-radius: 50%;
      background: #7ee2d1;
      box-shadow: 0 0 0 28px rgba(126,226,209,.18), 0 0 0 58px rgba(126,226,209,.10);
    }}
  </style>
</head>
<body>
  <main class="frame">
    <div class="kicker">Ratgeber · KI-Agenten</div>
    <h1>{title_lines}</h1>
    <div class="dek">{escape(short_label(why_now, 132))}</div>
    <div class="chips">{chips}</div>
    <section class="orbit" aria-label="Illustration">
      <div class="wire"></div>
      <div class="pulse"></div>
      <div class="node n1">Quellen<small>Signale sammeln</small></div>
      <div class="node n2">Agenten<small>Kontext prüfen</small></div>
      <div class="node n3">Review<small>Risiken sehen</small></div>
      <div class="node n4">Index<small>publizieren</small></div>
    </section>
  </main>
</body>
</html>"""


def workflow_html(title: str, job: dict[str, Any]) -> str:
    steps = [
        ("Quellenlage", "Genug belastbare Signale, keine Einzelquelle als Fundament."),
        ("NotebookLM", "Aus Quellen entsteht ein erster, zitierbarer Artikelkern."),
        ("Redaktion", "Dedupe, Beispiele, Struktur und Nutzen werden geprüft."),
        ("Freigabe", "Finale Ansicht, PNG-Grafiken und Publikationsqueue."),
    ]
    cards = "".join(
        f"<article><span>{index:02d}</span><h2>{escape(label)}</h2><p>{escape(text)}</p></article>"
        for index, (label, text) in enumerate(steps, start=1)
    )
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      width: 1600px;
      height: 980px;
      overflow: hidden;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #142520;
      background:
        linear-gradient(120deg, rgba(15,84,77,.10), transparent 42%),
        linear-gradient(135deg, #fff8ec 0%, #efe4d4 100%);
    }}
    .frame {{
      position: absolute;
      inset: 56px;
      padding: 72px;
      border-radius: 54px;
      border: 2px solid rgba(15,84,77,.18);
      background: rgba(255,252,246,.72);
      box-shadow: 0 38px 100px rgba(23,38,33,.13);
    }}
    .kicker {{
      color: #0f544d;
      letter-spacing: .22em;
      text-transform: uppercase;
      font-size: 28px;
      font-weight: 950;
    }}
    h1 {{
      margin: 26px 0 56px;
      max-width: 1120px;
      font-size: 68px;
      line-height: .98;
      letter-spacing: -.065em;
    }}
    .cards {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 26px;
      position: relative;
    }}
    .cards:before {{
      content: "";
      position: absolute;
      left: 110px;
      right: 110px;
      top: 92px;
      height: 10px;
      border-radius: 999px;
      background: linear-gradient(90deg, #0f544d, #d98a41, #0f544d);
      opacity: .28;
    }}
    article {{
      position: relative;
      min-height: 370px;
      padding: 34px;
      border-radius: 38px;
      background: #ffffff;
      border: 1px solid rgba(15,84,77,.16);
      box-shadow: 0 24px 56px rgba(23,38,33,.10);
    }}
    article span {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 74px;
      height: 74px;
      border-radius: 26px;
      background: #0f544d;
      color: white;
      font-size: 30px;
      font-weight: 950;
      box-shadow: 0 18px 38px rgba(15,84,77,.22);
    }}
    article:nth-child(even) span {{ background: #d98a41; }}
    h2 {{
      margin: 56px 0 18px;
      color: #0f544d;
      font-size: 40px;
      line-height: 1.02;
      letter-spacing: -.04em;
    }}
    p {{
      margin: 0;
      color: #536a64;
      font-size: 25px;
      line-height: 1.34;
      font-weight: 650;
    }}
  </style>
</head>
<body>
  <main class="frame">
    <div class="kicker">Ratgeber-Workflow</div>
    <h1>Vom Signal zur geprüften Veröffentlichung</h1>
    <section class="cards">{cards}</section>
  </main>
</body>
</html>"""


def render_pngs(artifact_dir: Path, title: str, job: dict[str, Any], force: bool = False) -> None:
    cover_path = artifact_dir / "cover.png"
    workflow_path = artifact_dir / "workflow.png"
    if cover_path.exists() and workflow_path.exists() and not force:
        return

    from article_execution.render_article_package import browser_env, resolve_browser_executable
    from playwright.sync_api import sync_playwright

    executable = resolve_browser_executable()
    launch_kwargs: dict[str, Any] = {
        "headless": True,
        "env": browser_env(),
        "args": ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    }
    if executable:
        launch_kwargs["executable_path"] = executable

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        cover_html_path = tmp / "cover.html"
        workflow_html_path = tmp / "workflow.html"
        cover_html_path.write_text(cover_html(title, job), encoding="utf-8")
        workflow_html_path.write_text(workflow_html(title, job), encoding="utf-8")
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(**launch_kwargs)
            page = browser.new_page(viewport={"width": 1600, "height": 980}, device_scale_factor=1)
            page.goto(cover_html_path.as_uri(), wait_until="load")
            page.screenshot(path=str(cover_path), full_page=False)
            page.goto(workflow_html_path.as_uri(), wait_until="load")
            page.screenshot(path=str(workflow_path), full_page=False)
            browser.close()


def build_candidate_payload(artifact_dir: Path, force_images: bool = False) -> tuple[dict[str, Any], list[dict[str, str]]]:
    from scripts.article_review_server import build_publish_preview_context, render_markdown_basic

    job_id = artifact_dir.name
    job = load_json(artifact_dir / "job.json")
    packet = load_json(artifact_dir / "review_packet.json")
    article_md = (artifact_dir / "article.md").read_text(encoding="utf-8")
    title = first_heading(article_md)

    render_pngs(artifact_dir, title, job, force=force_images)

    context = build_publish_preview_context(job_id, artifact_dir, packet)
    content_markdown = str(context.get("content") or "")
    for old in [
        str(context.get("secondary_image") or ""),
        f"/raw/{job_id}/workflow.svg",
        f"/raw/{job_id}/illustration.svg",
        f"/images/ratgeber/{context.get('slug')}-workflow.svg",
        f"/images/ratgeber/{context.get('slug')}-workflow.png",
    ]:
        if old:
            content_markdown = content_markdown.replace(old, "__WORKFLOW_IMAGE_URL__")
    article_html = render_markdown_basic(content_markdown)
    quality = packet.get("article_quality") or {}
    visual_quality = packet.get("visual_quality") or {}

    candidate = {
        "jobId": job_id,
        "title": str(context.get("title") or title),
        "slug": str(context.get("slug") or ""),
        "excerpt": str(context.get("excerpt") or ""),
        "status": str(packet.get("review_status") or "review_ready"),
        "reviewStatus": str(packet.get("review_status") or ""),
        "score": quality.get("score"),
        "visualStatus": "png_ready" if (artifact_dir / "cover.png").exists() and (artifact_dir / "workflow.png").exists() else "missing_png",
        "createdAt": str(job.get("created_at") or packet.get("created_at") or ""),
        "articleHtml": article_html,
        "meta": {
            "published": str(context.get("published") or ""),
            "readTime": int(context.get("read_time") or 0),
            "category": str(context.get("category") or ""),
            "eyebrow": str(context.get("eyebrow") or ""),
            "tags": [str(item) for item in (context.get("tags") or [])],
            "relatedTools": [dict(item) for item in (context.get("related_tools") or [])],
            "sidebarTitle": str(context.get("sidebar_title") or "Kurzfazit"),
            "sidebarPoints": [str(item) for item in (context.get("sidebar_points") or [])],
        },
        "source": {
            "artifactDir": str(artifact_dir),
            "notebookLmStage": True,
            "uploadTool": "ratgeber_cloudflare_candidate_sync.py",
        },
    }

    assets = [
        {
            "role": "cover",
            "name": "cover.png",
            "contentType": "image/png",
            "base64": base64.b64encode((artifact_dir / "cover.png").read_bytes()).decode("ascii"),
        },
        {
            "role": "workflow",
            "name": "workflow.png",
            "contentType": "image/png",
            "base64": base64.b64encode((artifact_dir / "workflow.png").read_bytes()).decode("ascii"),
        },
    ]
    return candidate, assets


def post_json(endpoint: str, token: str, payload: dict[str, Any]) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Upload failed with HTTP {error.code}: {body}") from error


def find_review_ready_artifacts(root: Path) -> list[Path]:
    candidates: list[Path] = []
    if not root.exists():
        return candidates
    for artifact_dir in root.iterdir():
        if not artifact_dir.is_dir():
            continue
        packet_path = artifact_dir / "review_packet.json"
        article_path = artifact_dir / "article.md"
        job_path = artifact_dir / "job.json"
        if not packet_path.exists() or not article_path.exists() or not job_path.exists():
            continue
        try:
            packet = load_json(packet_path)
        except Exception:
            continue
        status = str(packet.get("review_status") or "").strip()
        if status in {"review_ready", "approved_for_publish"}:
            candidates.append(artifact_dir)
    return sorted(candidates, key=lambda path: path.stat().st_mtime, reverse=True)


def upload_one(artifact_dir: Path, endpoint: str, token: str, force_images: bool, dry_run: bool) -> dict[str, Any]:
    candidate, assets = build_candidate_payload(artifact_dir, force_images=force_images)
    payload = {"candidate": candidate, "assets": assets}
    (artifact_dir / "cloudflare_review_candidate.json").write_text(
        json.dumps({"candidate": candidate, "asset_names": [asset["name"] for asset in assets]}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    if dry_run:
        result = {"ok": True, "dry_run": True, "candidate": candidate, "asset_count": len(assets)}
    else:
        result = post_json(endpoint, token, payload)
        if result.get("ok"):
            (artifact_dir / "cloudflare_review_uploaded.json").write_text(
                json.dumps({"uploaded_at": result.get("uploadedAt") or "", "result": result}, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Render PNG review assets and upload a Ratgeber candidate to Cloudflare.")
    parser.add_argument("--artifact-dir", type=Path)
    parser.add_argument("--all-review-ready", action="store_true")
    parser.add_argument("--artifacts-root", type=Path, default=Path("artifacts/article_jobs"))
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--endpoint", default=os.getenv("RATGEBER_REVIEW_UPLOAD_ENDPOINT") or "https://tools.utildesk.de/admin/ratgeber/api/upload")
    parser.add_argument("--token", default=os.getenv("RATGEBER_UPLOAD_TOKEN") or "")
    parser.add_argument("--token-env", type=Path, default=Path(os.getenv("RATGEBER_REVIEW_ENV") or "auth/utildesk_ratgeber_review.env"))
    parser.add_argument("--force-images", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    env_values = read_env_file(args.token_env)
    token = args.token or env_values.get("RATGEBER_UPLOAD_TOKEN") or ""
    if not token and not args.dry_run:
        raise SystemExit(f"RATGEBER_UPLOAD_TOKEN is required (env or {args.token_env})")

    if args.all_review_ready:
        artifact_dirs = find_review_ready_artifacts(args.artifacts_root.resolve())[: max(1, args.limit)]
        if not artifact_dirs:
            print(json.dumps({"ok": True, "uploaded": 0, "message": "no review-ready artifacts"}, ensure_ascii=False, indent=2))
            return 0
    elif args.artifact_dir:
        artifact_dirs = [args.artifact_dir.resolve()]
    else:
        raise SystemExit("--artifact-dir or --all-review-ready is required")

    results = []
    for artifact_dir in artifact_dirs:
        result = upload_one(artifact_dir, args.endpoint, token, args.force_images, args.dry_run)
        results.append({"artifact_dir": str(artifact_dir), "result": result})
        print(json.dumps(results[-1], ensure_ascii=False, indent=2))
        if not result.get("ok"):
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

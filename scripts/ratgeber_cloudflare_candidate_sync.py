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
    lowered = title.lower()
    if "chatgpt" in lowered:
        return ["ChatGPT", "Claude", "Gemini", "Assistenz", "Datenschutz"]
    if "website" in lowered:
        return ["Crawler", "Agenten", "IndexNow", "Guardrails", "Traffic"]
    if "orchestrierung" in lowered:
        return ["Agenten", "Kontext", "Workflow", "Review", "Runtime"]
    if "developer" in lowered:
        return ["IDE", "CLI", "Review", "Kontext", "Release"]

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


def visual_heading(title: str) -> str:
    lowered = title.lower()
    if "chatgpt" in lowered:
        return "MODEL BENCH"
    if "website" in lowered:
        return "BOT TRAFFIC MAP"
    if "orchestrierung" in lowered:
        return "ORCHESTRATION BUS"
    if "developer" in lowered:
        return "AGENT RUN TRACE"
    return "SIGNAL MAP"


def workflow_steps(title: str) -> list[tuple[str, str, str]]:
    lowered = title.lower()
    if "chatgpt" in lowered:
        return [
            ("input", "Aufgabe", "Was soll das Modell konkret leisten?"),
            ("compare", "Assistent", "ChatGPT, Claude oder Gemini passend wählen."),
            ("sources", "Kontext", "Dokumente, Datenschutz und Recherche prüfen."),
            ("review", "Stärken", "Output gegen Risiko und Nutzen halten."),
            ("publish", "Auswahl", "Empfehlung sauber begründen."),
        ]
    if "website" in lowered:
        return [
            ("traffic", "KI-Bots", "Besucher und Agenten sichtbar machen."),
            ("rules", "Kontrolle", "Crawl-Regeln und Zugriff bewusst setzen."),
            ("format", "Markdown", "Inhalte maschinenlesbar spiegeln."),
            ("schema", "JSON-LD", "Kontext für Such- und KI-Systeme liefern."),
            ("ping", "IndexNow", "Änderungen aktiv anmelden."),
        ]
    if "orchestrierung" in lowered:
        return [
            ("scope", "Plan", "Ziele, Grenzen und Akzeptanz festlegen."),
            ("agents", "Agenten", "Teilaufgaben parallelisieren."),
            ("context", "Kontext", "Zwischenstände sichtbar halten."),
            ("review", "Gate", "Risiken vor dem Merge benennen."),
            ("ship", "Release", "Nur geprüfte Ergebnisse publizieren."),
        ]
    return [
        ("context", "Ausrichtung", "Scope und Zielbild sauber setzen."),
        ("run", "Agentenlauf", "CLI, Shards und Prüfpunkte bündeln."),
        ("proof", "Checks", "Diffs verdichten und testen."),
        ("review", "Freigabe", "Finalansicht statt Rohmaterial prüfen."),
        ("ship", "Publikation", "Erst nach echter Kontrolle veröffentlichen."),
    ]


def cover_html(title: str, job: dict[str, Any]) -> str:
    terms = topic_terms(title, job)
    plot_terms = (terms + ["Signal", "Review", "Index", "Nutzer", "Quelle"])[:5]
    chips = "".join(
        f"<span class=\"chip{' is-active' if index == 0 else ''}\">{escape(term)}</span>"
        for index, term in enumerate(terms[:5])
    )
    plot_labels = "".join(
        f"<span class=\"plot-label p{index}\"><b>{escape(short_label(term, 9))}</b><small>0{index}</small></span>"
        for index, term in enumerate(plot_terms, start=1)
    )
    title_wrapped = textwrap.wrap(title, width=44)
    if len(title_wrapped) > 4:
        title_wrapped = title_wrapped[:4]
        title_wrapped[-1] = title_wrapped[-1].rstrip(" .,:;") + "…"
    title_lines = "<br>".join(escape(line) for line in title_wrapped)
    why_now = str(job.get("why_now") or job.get("angle") or "Quellen, Agenten und Review-Gate werden zu einem belastbaren Veröffentlichungsfluss.")
    visual = visual_heading(title)
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
      font-family: "JetBrains Mono", "IBM Plex Mono", "Cascadia Mono", Consolas, monospace;
      color: #1d1e18;
      background-color: #f5f3ea;
      background-image:
        linear-gradient(#e1ddce 1px, transparent 1px),
        linear-gradient(90deg, #ddd9c9 1px, transparent 1px);
      background-size: 24px 24px;
      border: 2px solid #c8c5b3;
    }}
    .wrap {{
      display: grid;
      grid-template-columns: 1fr 700px;
      gap: 84px;
      height: 100%;
      padding: 58px 88px 52px 64px;
    }}
    .label {{
      color: #828275;
      font-size: 22px;
      font-weight: 700;
    }}
    h1 {{
      margin: 34px 0 34px;
      font-size: 62px;
      line-height: .96;
      letter-spacing: -.055em;
    }}
    .bar {{
      width: 580px;
      height: 6px;
      margin-bottom: 34px;
      background: #4f7f28;
    }}
    .title {{
      margin: 0 0 112px;
      max-width: 720px;
      font-size: 39px;
      line-height: 1.16;
      font-weight: 900;
      letter-spacing: -.04em;
    }}
    .dek {{
      max-width: 690px;
      color: #54564a;
      font-size: 27px;
      line-height: 1.34;
    }}
    .chips {{
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 46px;
      max-width: 760px;
    }}
    .chip {{
      padding: 10px 18px 9px;
      border: 2px solid #b1ad9a;
      background: #f5f3ea;
      color: #365d1b;
      font-size: 25px;
      font-weight: 850;
    }}
    .chip.is-active {{
      background: #4f7f28;
      border-color: #4f7f28;
      color: #f5f3ea;
    }}
    .panel {{
      border: 2px solid #c8c5b3;
      background: #ebe9df;
    }}
    .plot {{
      position: relative;
      height: 502px;
      margin-top: 52px;
      padding: 24px;
    }}
    .plot::before {{
      content: "[ signal_map ]";
      color: #828275;
      font-size: 23px;
      font-weight: 800;
    }}
    .gridline, .vline, .wire, .node, .plot-label {{
      position: absolute;
    }}
    .gridline {{
      left: 28px;
      right: 28px;
      height: 1px;
      background: #c8c5b3;
    }}
    .g1 {{ top: 86px; }} .g2 {{ top: 144px; }} .g3 {{ top: 202px; }} .g4 {{ top: 260px; }} .g5 {{ top: 318px; }}
    .vline {{
      top: 84px;
      bottom: 94px;
      width: 2px;
      background: #b1ad9a;
    }}
    .v1 {{ left: 64px; }} .v2 {{ left: 180px; }} .v3 {{ left: 296px; }} .v4 {{ left: 412px; }} .v5 {{ left: 528px; }}
    .wire {{
      height: 5px;
      background: #4f7f28;
      transform-origin: left center;
    }}
    .w1 {{ left: 72px; top: 336px; width: 138px; transform: rotate(-55deg); }}
    .w2 {{ left: 184px; top: 194px; width: 150px; transform: rotate(26deg); }}
    .w3 {{ left: 300px; top: 250px; width: 168px; transform: rotate(-39deg); }}
    .w4 {{ left: 426px; top: 160px; width: 158px; transform: rotate(24deg); }}
    .node {{
      width: 38px;
      height: 38px;
      border: 2px solid #1d1e18;
      background: #4f7f28;
      color: #f5f3ea;
      display: grid;
      place-items: center;
      font-size: 22px;
      font-weight: 900;
    }}
    .node.alt {{ background: #a06b1f; }}
    .n1 {{ left: 48px; top: 322px; }} .n2 {{ left: 166px; top: 178px; }} .n3 {{ left: 300px; top: 236px; }}
    .n4 {{ left: 426px; top: 122px; }} .n5 {{ left: 610px; top: 198px; }}
    .plot-label {{
      top: 420px;
      width: 112px;
      color: #54564a;
      font-size: 19px;
      line-height: 1.18;
      font-weight: 800;
    }}
    .plot-label b {{
      display: block;
      color: #365d1b;
    }}
    .plot-label small {{
      display: block;
      margin-top: 8px;
      color: #828275;
      font-size: 20px;
    }}
    .p1 {{ left: 28px; }} .p2 {{ left: 144px; }} .p3 {{ left: 260px; }} .p4 {{ left: 376px; }} .p5 {{ left: 492px; }}
    .terminal {{
      margin-top: 46px;
      height: 226px;
      padding: 24px;
      background: #1d1e18;
      color: #f5f3ea;
      border: 2px solid #1d1e18;
      font-size: 23px;
      line-height: 1.5;
      overflow: hidden;
    }}
    .terminal strong {{
      display: block;
      margin-bottom: 18px;
      color: #4f7f28;
    }}
    .terminal span {{
      color: #828275;
      display: inline-block;
      width: 128px;
    }}
    .terminal div {{
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}
    .terminal code {{
      color: #f5f3ea;
      font-family: inherit;
      font-style: normal;
    }}
    .footer {{
      position: absolute;
      left: 64px;
      right: 56px;
      bottom: 44px;
      display: flex;
      justify-content: space-between;
      color: #828275;
      font-size: 21px;
      font-weight: 700;
    }}
  </style>
</head>
<body>
  <main class="wrap">
    <section>
      <div class="label">[ utildesk.ratgeber / terminal_illustration ]</div>
      <h1>{escape(visual)}</h1>
      <div class="bar"></div>
      <p class="title">{title_lines}</p>
      <p class="dek">{escape(short_label(why_now, 170))}</p>
      <div class="chips">{chips}</div>
    </section>
    <section>
      <div class="plot panel">
        <i class="gridline g1"></i><i class="gridline g2"></i><i class="gridline g3"></i><i class="gridline g4"></i><i class="gridline g5"></i>
        <i class="vline v1"></i><i class="vline v2"></i><i class="vline v3"></i><i class="vline v4"></i><i class="vline v5"></i>
        <i class="wire w1"></i><i class="wire w2"></i><i class="wire w3"></i><i class="wire w4"></i>
        <b class="node n1">1</b><b class="node n2 alt">2</b><b class="node n3">3</b><b class="node n4 alt">4</b><b class="node n5">5</b>
        {plot_labels}
      </div>
      <div class="terminal">
        <strong>$ utildesk inspect --ratgeber</strong>
        <div><span>topic</span><code>{escape(short_label(title, 34))}</code></div>
        <div><span>format</span><code>{escape(str(job.get("format") or "guide"))}</code></div>
        <div><span>assets</span><code>terminal-png / no-svg</code></div>
        <div><span>status</span><code>reviewable final view</code></div>
      </div>
    </section>
  </main>
  <div class="footer"><span>UTILDESK // terminal editorial image system</span><span>PNG / grid / mono / no generic cards</span></div>
</body>
</html>"""


def workflow_html(title: str, job: dict[str, Any]) -> str:
    steps = workflow_steps(title)
    cards = "".join(
        f"<article><span>{index}</span><h2>{escape(label)}</h2><em>{escape(key.upper())}</em><p>{escape(text)}</p><b>ok</b></article>"
        for index, (key, label, text) in enumerate(steps, start=1)
    )
    guardrails = "".join(
        f"<span class=\"guard{' is-active' if index == 2 else ''}\">{escape(item)}</span>"
        for index, item in enumerate(["Quellen", "Dedup", "Finalansicht", "PNG", "IndexNow"])
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
      font-family: "JetBrains Mono", "IBM Plex Mono", "Cascadia Mono", Consolas, monospace;
      color: #1d1e18;
      background-color: #f5f3ea;
      background-image:
        linear-gradient(#e1ddce 1px, transparent 1px),
        linear-gradient(90deg, #ddd9c9 1px, transparent 1px);
      background-size: 24px 24px;
      border: 2px solid #c8c5b3;
    }}
    .frame {{
      height: 100%;
      padding: 58px 82px 52px;
    }}
    .label {{
      color: #828275;
      font-size: 22px;
      font-weight: 800;
    }}
    h1 {{
      margin: 36px 0 28px;
      font-size: 56px;
      line-height: .98;
      letter-spacing: -.055em;
      max-width: 1220px;
    }}
    .dek {{
      margin: 0 0 60px;
      max-width: 940px;
      color: #54564a;
      font-size: 30px;
      line-height: 1.32;
    }}
    .cards {{
      position: relative;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 42px;
    }}
    .cards::before {{
      content: "";
      position: absolute;
      left: 72px;
      right: 72px;
      top: 144px;
      height: 5px;
      background: #b1ad9a;
    }}
    article {{
      position: relative;
      min-height: 292px;
      padding: 28px 26px;
      border: 2px solid #c8c5b3;
      background: #f5f3ea;
    }}
    article:nth-child(even) {{
      background: #ebe9df;
    }}
    article span {{
      display: grid;
      place-items: center;
      width: 60px;
      height: 60px;
      border: 2px solid #1d1e18;
      background: #4f7f28;
      color: #f5f3ea;
      font-size: 25px;
      font-weight: 900;
    }}
    article:nth-child(2) span,
    article:nth-child(3) span {{
      background: #a06b1f;
    }}
    article h2 {{
      margin: 38px 0 12px;
      color: #1d1e18;
      font-size: 29px;
      line-height: 1.05;
      letter-spacing: -.035em;
    }}
    article em {{
      display: block;
      margin-bottom: 20px;
      color: #828275;
      font-style: normal;
      font-size: 22px;
      font-weight: 700;
    }}
    article p {{
      margin: 0;
      color: #54564a;
      font-size: 18px;
      line-height: 1.32;
      max-height: 72px;
      overflow: hidden;
    }}
    article b {{
      position: absolute;
      right: 26px;
      top: 32px;
      color: #365d1b;
      font-size: 25px;
    }}
    .arrow {{
      position: absolute;
      top: 424px;
      color: #365d1b;
      font-size: 36px;
      font-weight: 900;
    }}
    .a1 {{ left: 335px; }} .a2 {{ left: 624px; }} .a3 {{ left: 912px; }} .a4 {{ left: 1202px; }}
    .guardrails {{
      margin-top: 78px;
      padding: 26px 28px;
      border: 2px solid #c8c5b3;
      background: #ebe9df;
    }}
    .guardrails .label {{
      display: block;
      margin-bottom: 24px;
    }}
    .guard {{
      display: inline-block;
      margin-right: 14px;
      padding: 10px 18px;
      border: 2px solid #b1ad9a;
      background: #f5f3ea;
      color: #365d1b;
      font-size: 25px;
      font-weight: 850;
    }}
    .guard.is-active {{
      color: #f5f3ea;
      background: #4f7f28;
      border-color: #4f7f28;
    }}
    .footer {{
      position: absolute;
      left: 64px;
      right: 56px;
      bottom: 44px;
      display: flex;
      justify-content: space-between;
      color: #828275;
      font-size: 21px;
      font-weight: 700;
    }}
  </style>
</head>
<body>
  <main class="frame">
    <div class="label">[ workflow.trace ]</div>
    <h1>FROM SIGNAL TO PUBLISH</h1>
    <p class="dek">{escape(short_label(title, 110))}</p>
    <section class="cards">{cards}</section>
    <b class="arrow a1">-&gt;</b><b class="arrow a2">-&gt;</b><b class="arrow a3">-&gt;</b><b class="arrow a4">-&gt;</b>
    <section class="guardrails"><span class="label">[ guardrails ]</span>{guardrails}</section>
  </main>
  <div class="footer"><span>UTILDESK // visual review asset</span><span>article-safe / no-svg / terminal system</span></div>
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
            "User-Agent": "Mozilla/5.0 (compatible; UtildeskRatgeberSync/1.0; +https://tools.utildesk.de/)",
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

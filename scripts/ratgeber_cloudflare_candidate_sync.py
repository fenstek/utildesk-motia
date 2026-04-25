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


def topic_kind(title: str) -> str:
    lowered = title.lower()
    if "chatgpt" in lowered:
        return "models"
    if "website" in lowered:
        return "crawl"
    if "orchestrierung" in lowered:
        return "orchestration"
    if "developer" in lowered:
        return "developer"
    return "generic"


def visual_heading(title: str) -> str:
    return {
        "models": "MODEL BENCH",
        "crawl": "CRAWL CONTROL",
        "orchestration": "AGENT BUS",
        "developer": "IDE WORKBENCH",
    }.get(topic_kind(title), "SIGNAL MAP")


def cover_visual_html(title: str, terms: list[str], job: dict[str, Any]) -> str:
    visual = topic_kind(title)
    if visual == "models":
        return """
    <section class="visual bench">
      <div class="visual-label">[ comparative_model_bench ]</div>
      <div class="router">task -&gt; choose model by strength, risk, context</div>
      <article><b>ChatGPT</b><i>write</i><span style="--w:78%"></span><i>research</i><span style="--w:62%"></span><i>code</i><span style="--w:58%"></span></article>
      <article><b>Claude</b><i>write</i><span style="--w:66%"></span><i>research</i><span style="--w:74%"></span><i>code</i><span style="--w:82%"></span></article>
      <article><b>Gemini</b><i>write</i><span style="--w:58%"></span><i>research</i><span style="--w:82%"></span><i>code</i><span style="--w:54%"></span></article>
      <footer>privacy gate <em>final pick</em></footer>
    </section>"""
    if visual == "crawl":
        return """
    <section class="visual crawl-room">
      <div class="visual-label">[ crawl_control_room ]</div>
      <div class="bot b1">bot_1</div><div class="bot b2 warn">bot_2</div><div class="bot b3 warn">bot_3</div>
      <div class="waf">WAF</div>
      <div class="site"><b>tools.utildesk.de</b><i></i><i></i><i></i><i></i></div>
      <div class="bot b4">bot_4</div><div class="bot b5 warn">bot_5</div>
      <footer>robots.txt + ai crawl rules <small>allow useful / throttle costly / block abuse</small></footer>
    </section>"""
    if visual == "orchestration":
        return """
    <section class="visual agent-bus">
      <div class="visual-label">[ orchestration_bus ]</div>
      <div class="bus">context bus</div>
      <article class="n1 warn">NotebookLM<small>source draft</small></article>
      <article class="n2">Planner<small>scope</small></article>
      <article class="n3">Agent 03<small>parallel</small></article>
      <article class="n4">Agent 01<small>code path</small></article>
      <article class="n5 warn">Agent 02<small>research</small></article>
      <article class="n6 dark">Review<small>gate</small></article>
      <footer>trace: sources -&gt; plan -&gt; shards -&gt; verifier -&gt; publish</footer>
    </section>"""
    return """
    <section class="visual ide-workbench">
      <div class="visual-label">[ ide_cli_workbench ]</div>
      <div class="ide"><b>IDE / context</b><p>+ define acceptance</p><p>+ split shard tests</p><p>- remove blind merge</p><p>+ verify preview</p></div>
      <div class="cli"><b>$ codex run</b><p>spawn shards</p><p>collect diffs</p><p>run checks</p></div>
      <div class="gate"><b>review gate</b><p>tests: ok</p><p>merge: held</p></div>
    </section>"""


def workflow_visual_html(title: str) -> str:
    visual = topic_kind(title)
    if visual == "models":
        return """
    <section class="workflow matrix">
      <div class="row head"><span></span><b>ChatGPT</b><b>Claude</b><b>Gemini</b></div>
      <div class="row"><span>Schreiben</span><i>■■■■</i><i>■■■□</i><i>■■■□</i></div>
      <div class="row"><span>Recherche</span><i>■■□□</i><i>■■■□</i><i>■■■■</i></div>
      <div class="row"><span>Coding</span><i>■■■□</i><i>■■■■</i><i>■■□□</i></div>
      <div class="row"><span>Privacy</span><i>■■□□</i><i>■■■□</i><i>■□□□</i></div>
      <footer>route only after context + risk check</footer>
    </section>"""
    if visual == "crawl":
        return """
    <section class="workflow edge-stack">
      <ol>
        <li><b>01</b><span>KI-Bots</span><em>TRAFFIC</em></li>
        <li><b>02</b><span>Crawl Control</span><em>RULES</em></li>
        <li><b>03</b><span>Markdown</span><em>MIRROR</em></li>
        <li><b>04</b><span>JSON-LD</span><em>SCHEMA</em></li>
        <li><b>05</b><span>IndexNow</span><em>PING</em></li>
      </ol>
      <aside><b>[ server load before/after ]</b><i></i><i></i><i></i><i></i><i></i><small>less blind crawling, more explicit updates</small></aside>
    </section>"""
    if visual == "orchestration":
        return """
    <section class="workflow lanes">
      <div><b>NotebookLM</b><span>source grounded draft</span><em>logged</em></div>
      <div><b>Planner</b><span>scope + split</span><em>logged</em></div>
      <div><b>Agents</b><span>parallel work</span><em>logged</em></div>
      <div><b>Verifier</b><span>tests + risks</span><em>logged</em></div>
      <div><b>Publish</b><span>human gate</span><em>logged</em></div>
      <footer>$ publish if final preview approved</footer>
    </section>"""
    return """
    <section class="workflow rail">
      <div class="track"></div>
      <article class="up"><b>IDE</b><span>context</span></article>
      <article class="down"><b>CLI</b><span>shards</span></article>
      <article class="up"><b>Tests</b><span>proof</span></article>
      <article class="down"><b>Review</b><span>gate</span></article>
      <article class="up"><b>Release</b><span>ship</span></article>
      <footer>guardrail: no merge without real preview, tests and rollback note</footer>
    </section>"""


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
    visual_markup = cover_visual_html(title, terms, job)
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
    .visual {{
      position: relative;
      height: 736px;
      margin-top: 52px;
      border: 2px solid #c8c5b3;
      background: #ebe9df;
      overflow: hidden;
    }}
    .visual-label {{
      position: absolute;
      left: 28px;
      top: 24px;
      color: #828275;
      font-size: 22px;
      font-weight: 800;
    }}
    .bench .router {{
      position: absolute;
      left: 34px;
      right: 34px;
      top: 102px;
      padding: 14px 18px;
      border: 2px solid #b1ad9a;
      background: #f5f3ea;
      color: #54564a;
      font-size: 20px;
    }}
    .bench article {{
      position: absolute;
      top: 196px;
      width: 188px;
      height: 360px;
      padding: 24px;
      border: 2px solid #c8c5b3;
      background: #f5f3ea;
    }}
    .bench article:nth-of-type(1) {{ left: 42px; }}
    .bench article:nth-of-type(2) {{ left: 256px; }}
    .bench article:nth-of-type(3) {{ left: 470px; }}
    .bench b {{
      display: block;
      margin-bottom: 28px;
      color: #365d1b;
      font-size: 24px;
    }}
    .bench i {{
      display: block;
      margin: 14px 0 6px;
      color: #828275;
      font-size: 17px;
      font-style: normal;
    }}
    .bench span {{
      display: block;
      height: 14px;
      width: var(--w);
      background: #4f7f28;
      border: 1px solid #1d1e18;
    }}
    .bench footer {{
      position: absolute;
      left: 42px;
      right: 42px;
      bottom: 54px;
      color: #365d1b;
      font-size: 23px;
      font-weight: 850;
    }}
    .bench footer em {{
      float: right;
      color: #54564a;
      font-style: normal;
    }}
    .crawl-room .bot {{
      position: absolute;
      width: 118px;
      height: 54px;
      display: grid;
      place-items: center;
      background: #4f7f28;
      color: #f5f3ea;
      border: 2px solid #1d1e18;
      font-size: 20px;
      font-weight: 850;
    }}
    .crawl-room .warn {{ background: #a06b1f; }}
    .crawl-room .b1 {{ left: 40px; top: 126px; }} .crawl-room .b2 {{ left: 40px; top: 238px; }} .crawl-room .b3 {{ left: 40px; top: 350px; }}
    .crawl-room .b4 {{ right: 42px; top: 432px; }} .crawl-room .b5 {{ right: 42px; top: 544px; }}
    .crawl-room .waf {{
      position: absolute;
      left: 192px;
      top: 178px;
      width: 74px;
      height: 318px;
      padding-top: 24px;
      text-align: center;
      background: #e2e0d4;
      border: 2px solid #b1ad9a;
      color: #365d1b;
      font-size: 24px;
      font-weight: 900;
    }}
    .crawl-room .waf::after {{
      content: "";
      position: absolute;
      left: 34px;
      top: 82px;
      bottom: 34px;
      width: 6px;
      background: #4f7f28;
    }}
    .crawl-room .site {{
      position: absolute;
      left: 330px;
      top: 226px;
      width: 268px;
      height: 224px;
      padding: 28px;
      background: #f5f3ea;
      border: 3px solid #1d1e18;
      color: #54564a;
    }}
    .crawl-room .site i {{
      display: block;
      height: 2px;
      margin-top: 26px;
      background: #c8c5b3;
    }}
    .crawl-room footer {{
      position: absolute;
      left: 40px;
      right: 40px;
      bottom: 52px;
      padding: 20px 24px;
      border: 2px solid #c8c5b3;
      background: #f5f3ea;
      color: #1d1e18;
      font-size: 23px;
      font-weight: 850;
    }}
    .crawl-room footer small {{
      display: block;
      margin-top: 8px;
      color: #54564a;
      font-size: 17px;
    }}
    .agent-bus .bus {{
      position: absolute;
      left: 60px;
      right: 60px;
      top: 352px;
      height: 64px;
      padding: 16px 28px;
      background: #1d1e18;
      color: #4f7f28;
      font-size: 24px;
      font-weight: 900;
    }}
    .agent-bus article {{
      position: absolute;
      width: 154px;
      height: 104px;
      padding: 20px;
      border: 2px solid #c8c5b3;
      background: #f5f3ea;
      color: #1d1e18;
      font-size: 18px;
      font-weight: 850;
    }}
    .agent-bus article::after {{
      content: "";
      position: absolute;
      left: 76px;
      width: 4px;
      height: 82px;
      background: #365d1b;
    }}
    .agent-bus article small {{
      display: block;
      margin-top: 12px;
      color: #828275;
      font-size: 15px;
    }}
    .agent-bus .warn {{ color: #a06b1f; }} .agent-bus .dark {{ background: #1d1e18; color: #f5f3ea; }}
    .agent-bus .n1 {{ left: 92px; top: 126px; }} .agent-bus .n2 {{ left: 350px; top: 112px; }} .agent-bus .n3 {{ left: 570px; top: 150px; }}
    .agent-bus .n4 {{ left: 144px; top: 530px; }} .agent-bus .n5 {{ left: 402px; top: 560px; }} .agent-bus .n6 {{ left: 592px; top: 516px; }}
    .agent-bus .n1::after,.agent-bus .n2::after,.agent-bus .n3::after {{ top: 104px; }}
    .agent-bus .n4::after,.agent-bus .n5::after,.agent-bus .n6::after {{ bottom: 104px; }}
    .agent-bus footer {{
      position: absolute;
      left: 60px;
      right: 60px;
      bottom: 52px;
      padding: 16px 24px;
      border: 2px solid #c8c5b3;
      background: #f5f3ea;
      color: #54564a;
      font-size: 20px;
    }}
    .ide-workbench .ide,
    .ide-workbench .cli,
    .ide-workbench .gate {{
      position: absolute;
      border: 2px solid #c8c5b3;
      padding: 26px;
    }}
    .ide-workbench .ide {{
      left: 40px;
      top: 126px;
      width: 328px;
      height: 426px;
      background: #f5f3ea;
    }}
    .ide-workbench .cli {{
      right: 40px;
      top: 126px;
      width: 292px;
      height: 286px;
      background: #1d1e18;
      color: #f5f3ea;
    }}
    .ide-workbench .gate {{
      right: 40px;
      bottom: 86px;
      width: 292px;
      height: 160px;
      background: #f5f3ea;
    }}
    .ide-workbench b {{
      display: block;
      margin-bottom: 22px;
      color: #365d1b;
      font-size: 23px;
    }}
    .ide-workbench .cli b {{ color: #4f7f28; }}
    .ide-workbench p {{
      margin: 0 0 20px;
      color: inherit;
      font-size: 20px;
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
    <section>{visual_markup}</section>
  </main>
  <div class="footer"><span>UTILDESK // topic-specific editorial image</span><span>PNG / grid / mono / no cloned diagrams</span></div>
</body>
</html>"""


def workflow_html(title: str, job: dict[str, Any]) -> str:
    visual_markup = workflow_visual_html(title)
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
    .workflow {{
      position: relative;
      min-height: 560px;
      margin-top: 44px;
    }}
    .matrix {{
      padding: 50px 76px;
      border: 2px solid #c8c5b3;
      background: #ebe9df;
    }}
    .matrix .row {{
      display: grid;
      grid-template-columns: 220px repeat(3, 1fr);
      align-items: center;
      min-height: 66px;
      border-bottom: 1px solid #c8c5b3;
      color: #54564a;
      font-size: 26px;
    }}
    .matrix .head {{
      color: #1d1e18;
      font-size: 30px;
      font-weight: 900;
    }}
    .matrix i {{
      color: #4f7f28;
      font-style: normal;
      letter-spacing: .18em;
    }}
    .matrix footer,
    .lanes footer,
    .rail footer {{
      position: absolute;
      right: 84px;
      bottom: 42px;
      padding: 18px 26px;
      background: #1d1e18;
      color: #4f7f28;
      font-size: 22px;
      font-weight: 850;
    }}
    .edge-stack {{
      display: grid;
      grid-template-columns: 560px 1fr;
      gap: 76px;
      align-items: start;
      padding: 30px 80px 0;
    }}
    .edge-stack ol {{
      margin: 0;
      padding: 0;
      list-style: none;
    }}
    .edge-stack li {{
      display: grid;
      grid-template-columns: 70px 1fr 130px;
      align-items: center;
      margin-bottom: 22px;
      padding: 16px 22px;
      border: 2px solid #c8c5b3;
      background: #f5f3ea;
      font-size: 24px;
      font-weight: 900;
    }}
    .edge-stack b {{ color: #365d1b; }}
    .edge-stack em {{
      color: #828275;
      font-size: 18px;
      font-style: normal;
    }}
    .edge-stack aside {{
      position: relative;
      min-height: 386px;
      padding: 32px;
      border: 2px solid #c8c5b3;
      background: #ebe9df;
    }}
    .edge-stack aside i {{
      position: absolute;
      width: 48px;
      bottom: 92px;
      background: #4f7f28;
      border: 2px solid #1d1e18;
    }}
    .edge-stack aside i:nth-of-type(1) {{ left: 304px; height: 230px; background: #a06b1f; }}
    .edge-stack aside i:nth-of-type(2) {{ left: 370px; height: 204px; background: #a06b1f; }}
    .edge-stack aside i:nth-of-type(3) {{ left: 436px; height: 148px; }}
    .edge-stack aside i:nth-of-type(4) {{ left: 502px; height: 104px; }}
    .edge-stack aside i:nth-of-type(5) {{ left: 568px; height: 76px; }}
    .edge-stack small {{
      position: absolute;
      left: 32px;
      right: 32px;
      bottom: 32px;
      color: #54564a;
      font-size: 20px;
    }}
    .lanes div {{
      display: grid;
      grid-template-columns: 260px 1fr 120px;
      align-items: center;
      height: 74px;
      margin-bottom: 18px;
      padding: 0 28px;
      border: 2px solid #c8c5b3;
      background: #f5f3ea;
      font-size: 24px;
    }}
    .lanes div:nth-child(odd) {{ background: #ebe9df; }}
    .lanes b {{ color: #365d1b; }}
    .lanes span {{ color: #54564a; }}
    .lanes em {{
      justify-self: end;
      padding: 8px 12px;
      background: #4f7f28;
      color: #f5f3ea;
      font-style: normal;
      font-size: 18px;
    }}
    .rail .track {{
      position: absolute;
      left: 72px;
      right: 72px;
      top: 220px;
      height: 18px;
      background: #1d1e18;
    }}
    .rail article {{
      position: relative;
      display: inline-block;
      width: 180px;
      height: 132px;
      margin-right: 78px;
      padding: 26px;
      border: 2px solid #c8c5b3;
      background: #f5f3ea;
      font-size: 24px;
    }}
    .rail article:nth-of-type(1) {{ margin-left: 80px; top: 20px; }}
    .rail article:nth-of-type(2) {{ top: 220px; }}
    .rail article:nth-of-type(3) {{ top: 20px; }}
    .rail article:nth-of-type(4) {{ top: 220px; }}
    .rail article:nth-of-type(5) {{ top: 20px; margin-right: 0; }}
    .rail b {{ color: #365d1b; }}
    .rail span {{
      display: block;
      margin-top: 16px;
      color: #828275;
      font-size: 18px;
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
    {visual_markup}
  </main>
  <div class="footer"><span>UTILDESK // workflow visual family</span><span>article-safe / topic-specific / no clones</span></div>
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

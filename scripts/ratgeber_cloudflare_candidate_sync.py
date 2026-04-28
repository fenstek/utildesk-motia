#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import hashlib
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
      <div class="router">task -&gt; choose model by strength, risk, context</div>
      <article><b>ChatGPT</b><i>write</i><span style="--w:78%"></span><i>research</i><span style="--w:62%"></span><i>code</i><span style="--w:58%"></span></article>
      <article><b>Claude</b><i>write</i><span style="--w:66%"></span><i>research</i><span style="--w:74%"></span><i>code</i><span style="--w:82%"></span></article>
      <article><b>Gemini</b><i>write</i><span style="--w:58%"></span><i>research</i><span style="--w:82%"></span><i>code</i><span style="--w:54%"></span></article>
      <footer>privacy gate <em>final pick</em></footer>
    </section>"""
    if visual == "crawl":
        return """
    <section class="visual crawl-room">
      <div class="bot b1">bot_1</div><div class="bot b2 warn">bot_2</div><div class="bot b3 warn">bot_3</div>
      <div class="waf">WAF</div>
      <div class="site"><b>tools.utildesk.de</b><i></i><i></i><i></i><i></i></div>
      <div class="bot b4">bot_4</div><div class="bot b5 warn">bot_5</div>
      <footer>robots.txt + ai crawl rules <small>allow useful / throttle costly / block abuse</small></footer>
    </section>"""
    if visual == "orchestration":
        return """
    <section class="visual agent-bus">
      <div class="bus">context bus</div>
      <article class="n1 warn">NotebookLM<small>source draft</small></article>
      <article class="n2">Planner<small>scope</small></article>
      <article class="n3">Agent 03<small>parallel</small></article>
      <article class="n4">Agent 01<small>code path</small></article>
      <article class="n5 warn">Agent 02<small>research</small></article>
      <article class="n6 dark">Review<small>gate</small></article>
    </section>"""
    return """
    <section class="visual ide-workbench">
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
  </style>
</head>
<body>
  <main class="wrap">
    <section>
      <h1>{escape(visual)}</h1>
      <div class="bar"></div>
      <p class="title">{title_lines}</p>
      <p class="dek">{escape(short_label(why_now, 170))}</p>
      <div class="chips">{chips}</div>
    </section>
    <section>{visual_markup}</section>
  </main>
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
  </style>
</head>
<body>
  <main class="frame">
    <h1>FROM SIGNAL TO PUBLISH</h1>
    <p class="dek">{escape(short_label(title, 110))}</p>
    {visual_markup}
  </main>
</body>
</html>"""


# The definitions below intentionally shadow the older terminal-style image
# templates above. Keeping them here lets the candidate backend generate the
# same softer editorial PNG direction without adding Pillow to the VPS venv.

def visual_heading(title: str) -> str:
    return {
        "models": "ASSISTANT STUDIO",
        "crawl": "CRAWL CONTROL",
        "orchestration": "ORCHESTRATION LAB",
        "developer": "AGENT WORKBENCH",
    }.get(topic_kind(title), "SIGNAL STUDIO")


def workflow_heading(title: str) -> str:
    return {
        "models": "MODEL ROUTING",
        "crawl": "CONTROLLED CRAWL",
        "orchestration": "SOURCE TO REVIEW",
        "developer": "BUILD RUN",
    }.get(topic_kind(title), "SOURCE TO REVIEW")


def cover_visual_html(title: str, terms: list[str], job: dict[str, Any]) -> str:
    visual = topic_kind(title)
    if visual == "models":
        return """
    <section class="soft-scene models-scene">
      <i class="blob blue"></i><i class="blob sun"></i><i class="blob mint"></i>
      <div class="browser in-a"><b></b><span></span><span></span><span></span></div>
      <div class="browser in-b"><b></b><span></span><span></span><span></span></div>
      <div class="database"></div><div class="robot"></div><div class="dashboard"></div>
      <div class="wire w1"></div><div class="wire w2 orange"></div><div class="wire w3 green"></div><div class="wire w4 orange"></div>
      <em class="star s1"></em><em class="star s2"></em><em class="star s3"></em>
    </section>"""
    if visual == "crawl":
        return """
    <section class="soft-scene crawl-scene">
      <i class="blob blue"></i><i class="blob sun"></i><i class="blob mint"></i>
      <div class="browser in-a"><b></b><span></span><span></span><span></span></div>
      <div class="browser in-b"><b></b><span></span><span></span><span></span></div>
      <div class="browser in-c"><b></b><span></span><span></span><span></span></div>
      <div class="database"></div><div class="robot"></div><div class="dashboard"></div>
      <div class="tag allow">allow</div><div class="tag limit">limit</div><div class="tag block">block</div>
      <div class="wire w1"></div><div class="wire w2"></div><div class="wire w3"></div><div class="wire w4 orange"></div>
    </section>"""
    if visual == "orchestration":
        return """
    <section class="soft-scene orchestration-scene">
      <i class="blob blue"></i><i class="blob sun"></i><i class="blob mint"></i>
      <div class="book a"><b>N</b></div><div class="book b"><b>LM</b></div>
      <div class="robot"></div><div class="review-pill">review gate</div>
      <div class="step p1">Plan<small>step 01</small></div><div class="step p2">Agent<small>step 02</small></div>
      <div class="step p3 warn">Test<small>step 03</small></div><div class="step p4">Publish<small>step 04</small></div>
      <div class="wire w1"></div><div class="wire w2 orange"></div><div class="wire w3 green"></div><div class="wire w4"></div><div class="wire w5 orange"></div>
      <em class="star s1"></em><em class="star s2"></em><em class="star s3"></em>
    </section>"""
    return """
    <section class="soft-scene developer-scene">
      <i class="blob blue"></i><i class="blob sun"></i><i class="blob mint"></i>
      <div class="browser ide"><b></b><span></span><span></span><span></span><span></span></div>
      <div class="robot big"></div><div class="floating f1"></div><div class="floating f2"></div><div class="floating f3"></div>
      <div class="dashboard"></div><div class="bench"></div>
      <div class="wire w1"></div><div class="wire w2 orange"></div><div class="wire w3 green"></div>
      <em class="star s1"></em><em class="star s2"></em><em class="star s3"></em>
    </section>"""


def workflow_visual_html(title: str) -> str:
    visual = topic_kind(title)
    if visual == "models":
        return """
    <section class="soft-scene models-flow">
      <i class="blob blue"></i><i class="blob sun"></i><i class="blob mint"></i>
      <div class="robot r1"></div><div class="robot r2"></div><div class="robot r3"></div>
      <div class="database"></div><div class="decision-board"></div>
      <div class="wire w1"></div><div class="wire w2 orange"></div><div class="wire w3 green"></div><div class="wire w4"></div>
    </section>"""
    if visual == "crawl":
        return """
    <section class="soft-scene crawl-flow">
      <i class="blob blue"></i><i class="blob sun"></i><i class="blob mint"></i>
      <div class="browser in-a"><b></b><span></span><span></span><span></span></div>
      <div class="database"></div><div class="robot"></div><div class="dashboard"></div>
      <div class="tag rules">robots + indexnow</div>
      <div class="wire w1"></div><div class="wire w2 green"></div><div class="wire w3 orange"></div>
    </section>"""
    if visual == "orchestration":
        return """
    <section class="soft-scene orchestration-flow">
      <i class="blob blue"></i><i class="blob sun"></i><i class="blob mint"></i>
      <div class="step p1">NotebookLM<small>sources</small></div><div class="step p2">Plan<small>scope</small></div>
      <div class="step p3">Agents<small>parallel</small></div><div class="step p4">Verify<small>tests</small></div>
      <div class="step p5">Publish<small>preview</small></div><div class="review-pill">context - draft - shards - tests - preview</div>
      <div class="wire w1"></div><div class="wire w2 orange"></div><div class="wire w3 green"></div><div class="wire w4"></div>
    </section>"""
    return """
    <section class="soft-scene developer-flow">
      <i class="blob blue"></i><i class="blob sun"></i><i class="blob mint"></i>
      <div class="browser ide"><b></b><span></span><span></span><span></span></div>
      <div class="floating f1"></div><div class="floating f2"></div><div class="floating f3"></div>
      <div class="decision-board"></div><div class="robot"></div>
      <div class="wire w1"></div><div class="wire w2 orange"></div><div class="wire w3 green"></div>
    </section>"""


def editorial_image_css() -> str:
    return """
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 1600px;
      height: 980px;
      overflow: hidden;
      font-family: "JetBrains Mono", "IBM Plex Mono", "Cascadia Mono", Consolas, monospace;
      color: #17231e;
      background-color: #f5f3ea;
      background-image:
        radial-gradient(circle at 10% 10%, rgba(217,240,246,.72), transparent 22%),
        radial-gradient(circle at 88% 8%, rgba(255,240,187,.62), transparent 24%),
        radial-gradient(circle at 82% 88%, rgba(216,238,229,.62), transparent 25%),
        linear-gradient(#e9e5d8 1px, transparent 1px),
        linear-gradient(90deg, #e6e2d4 1px, transparent 1px);
      background-size: auto, auto, auto, 24px 24px, 24px 24px;
      border: 2px solid #c8c5b3;
    }
    .frame { position: relative; width: 1600px; height: 980px; padding: 58px 66px; }
    .meta { position: absolute; z-index: 5; left: 66px; top: 58px; }
    .label { color: #78796e; font-size: 22px; font-weight: 800; }
    h1 { margin: 28px 0 0; color: #245b3f; font-size: 42px; line-height: 1; letter-spacing: -.04em; }
    .chips { position: absolute; z-index: 5; left: 66px; bottom: 50px; display: flex; flex-wrap: wrap; gap: 12px; max-width: 620px; }
    .chip { padding: 9px 15px 8px; border: 2px solid #9d9985; border-radius: 4px; background: #f5f3ea; color: #245b3f; font-size: 18px; font-weight: 900; }
    .chip.is-active { background: #4f7f28; border-color: #4f7f28; color: #f5f3ea; }
    .soft-scene { position: absolute; inset: 0; overflow: hidden; }
    .blob { position: absolute; border-radius: 999px; opacity: .62; }
    .blob.blue { width: 410px; height: 410px; left: 170px; top: 112px; background: #d9f0f6; }
    .blob.sun { width: 430px; height: 430px; right: 80px; top: 42px; background: #fff0bb; }
    .blob.mint { width: 470px; height: 470px; right: -60px; bottom: -82px; background: #d8eee5; }
    .browser, .dashboard, .decision-board, .step, .review-pill, .floating, .tag {
      position: absolute;
      border: 2px solid #2f6f83;
      border-radius: 18px;
      background: #fffdf5;
      box-shadow: 16px 18px 0 rgba(36,32,22,.13);
    }
    .browser { width: 360px; height: 210px; }
    .browser::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 46px; border-bottom: 2px solid #2f6f83; border-radius: 18px 18px 0 0; background: #d9f0f6; }
    .browser b::before { content: ""; position: absolute; left: 22px; top: 17px; width: 12px; height: 12px; border-radius: 50%; background: #ef8d62; box-shadow: 22px 0 #f3ce73, 44px 0 #4f7f28; }
    .browser span { position: absolute; left: 76px; right: 42px; height: 3px; background: #2f6f83; opacity: .62; }
    .browser span:nth-child(2) { top: 84px; } .browser span:nth-child(3) { top: 120px; width: 190px; } .browser span:nth-child(4) { top: 156px; width: 232px; } .browser span:nth-child(5) { top: 188px; width: 160px; }
    .database { position: absolute; width: 220px; height: 186px; border: 3px solid #2f6f83; border-radius: 50% / 26%; background: #d9f0f6; box-shadow: 0 0 38px rgba(145,207,228,.48); }
    .database::before, .database::after { content: ""; position: absolute; left: -3px; right: -3px; height: 56px; border: 3px solid #2f6f83; border-radius: 50%; background: #d9f0f6; }
    .database::before { top: -3px; } .database::after { bottom: -3px; }
    .robot { position: absolute; width: 150px; height: 126px; border: 3px solid #2f6f83; border-radius: 34px; background: #d9f0f6; box-shadow: 0 0 38px rgba(145,207,228,.5), 16px 18px 0 rgba(36,32,22,.1); }
    .robot::before { content: ""; position: absolute; left: 32px; top: 36px; width: 86px; height: 46px; border-radius: 22px; background: #384740; box-shadow: inset 24px 16px 0 -18px #b8ded0, inset -24px 16px 0 -18px #b8ded0; }
    .robot::after { content: ""; position: absolute; left: 67px; top: -36px; width: 14px; height: 32px; border-radius: 12px; background: #f3ce73; border: 2px solid #2f6f83; }
    .dashboard { width: 390px; height: 270px; }
    .dashboard::before { content: ""; position: absolute; left: 42px; top: 92px; width: 18px; height: 84px; border-radius: 5px; background: #91cfe4; box-shadow: 40px -28px #f3ce73, 80px 18px #4f7f28, 120px -54px #e49442, 240px 0 0 42px rgba(145,207,228,.45); }
    .wire { position: absolute; height: 5px; border-radius: 999px; background: #2f6f83; transform-origin: left center; }
    .wire::after { content: ""; position: absolute; right: -7px; top: -6px; width: 0; height: 0; border-left: 18px solid currentColor; border-top: 9px solid transparent; border-bottom: 9px solid transparent; color: #2f6f83; }
    .wire.orange { background: #e49442; color: #e49442; } .wire.green { background: #245b3f; color: #245b3f; }
    .star { position: absolute; width: 32px; height: 32px; transform: rotate(45deg); background: #f3ce73; clip-path: polygon(50% 0, 61% 34%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 34%); }
    .book { position: absolute; width: 300px; height: 204px; border: 3px solid #2f6f83; border-radius: 18px; background: linear-gradient(90deg, #d9f0f6 0 48%, #fffdf5 48% 52%, #d9f0f6 52%); box-shadow: 16px 18px 0 rgba(36,32,22,.13); }
    .book::before { content: ""; position: absolute; inset: 34px 36px; background: repeating-linear-gradient(#91cfe4 0 2px, transparent 2px 28px); }
    .book b { position: absolute; left: 24px; top: 24px; padding: 12px 16px; border: 2px solid #e49442; border-radius: 8px; background: #fff0bb; color: #245b3f; }
    .step { width: 180px; height: 104px; padding: 20px; color: #245b3f; font-size: 22px; font-weight: 900; }
    .step small { display: block; margin-top: 22px; color: #78796e; font-size: 16px; }
    .step.warn { color: #e49442; }
    .review-pill { height: 96px; display: grid; place-items: center; border-color: #245b3f; border-radius: 60px; color: #245b3f; font-size: 24px; font-weight: 900; }
    .tag { padding: 12px 20px; border-color: #245b3f; border-radius: 22px; color: #245b3f; font-size: 16px; font-weight: 900; }
    .floating { width: 190px; height: 116px; background: #fffdf5; }
    .floating::before { content: ""; position: absolute; left: 22px; right: 24px; top: 26px; height: 4px; background: #91cfe4; box-shadow: 0 22px #f3ce73, 0 44px #e49442; }
    .bench { position: absolute; left: 90px; right: 90px; bottom: 158px; height: 126px; border: 2px solid #9d9985; border-radius: 26px; background: #ebe9df; box-shadow: 16px 18px 0 rgba(36,32,22,.12); }
    .decision-board { width: 420px; height: 290px; background: #fffdf5; }
    .decision-board::before { content: ""; position: absolute; left: 46px; top: 70px; width: 220px; height: 4px; background: #91cfe4; box-shadow: 0 48px #f3ce73, 0 96px #4f7f28, 0 144px #e49442; }
    .models-scene .in-a { left: 180px; top: 172px; } .models-scene .in-b { left: 200px; top: 494px; }
    .models-scene .database { left: 676px; top: 350px; } .models-scene .robot { left: 1054px; top: 320px; } .models-scene .dashboard { left: 1100px; top: 590px; }
    .models-scene .w1 { left: 540px; top: 310px; width: 170px; transform: rotate(20deg); } .models-scene .w2 { left: 554px; top: 626px; width: 170px; transform: rotate(-27deg); } .models-scene .w3 { left: 888px; top: 430px; width: 176px; transform: rotate(-30deg); } .models-scene .w4 { left: 890px; top: 560px; width: 236px; transform: rotate(24deg); }
    .crawl-scene .in-a { left: 110px; top: 178px; } .crawl-scene .in-b { left: 132px; top: 412px; } .crawl-scene .in-c { left: 200px; top: 634px; }
    .crawl-scene .database { left: 684px; top: 380px; } .crawl-scene .robot { left: 1120px; top: 300px; } .crawl-scene .dashboard { left: 1082px; top: 560px; }
    .crawl-scene .allow { left: 1020px; top: 202px; } .crawl-scene .limit { left: 1280px; top: 214px; } .crawl-scene .block { left: 1430px; top: 406px; }
    .crawl-scene .w1 { left: 450px; top: 320px; width: 260px; transform: rotate(18deg); } .crawl-scene .w2 { left: 472px; top: 520px; width: 250px; transform: rotate(-8deg); } .crawl-scene .w3 { left: 546px; top: 724px; width: 196px; transform: rotate(-42deg); } .crawl-scene .w4 { left: 880px; top: 530px; width: 250px; transform: rotate(28deg); }
    .orchestration-scene .book.a { left: 112px; top: 210px; } .orchestration-scene .book.b { left: 190px; top: 452px; background: linear-gradient(90deg, #fff0bb 0 48%, #fffdf5 48% 52%, #fff0bb 52%); }
    .orchestration-scene .robot { left: 718px; top: 360px; width: 174px; height: 144px; } .orchestration-scene .review-pill { left: 642px; top: 616px; width: 320px; }
    .orchestration-scene .p1 { left: 1060px; top: 190px; } .orchestration-scene .p2 { left: 1260px; top: 284px; } .orchestration-scene .p3 { left: 1080px; top: 568px; } .orchestration-scene .p4 { left: 1320px; top: 640px; }
    .orchestration-scene .w1 { left: 408px; top: 300px; width: 290px; transform: rotate(18deg); } .orchestration-scene .w2 { left: 486px; top: 548px; width: 260px; transform: rotate(-18deg); } .orchestration-scene .w3 { left: 900px; top: 374px; width: 214px; transform: rotate(-40deg); } .orchestration-scene .w4 { left: 928px; top: 446px; width: 344px; transform: rotate(-16deg); } .orchestration-scene .w5 { left: 904px; top: 500px; width: 246px; transform: rotate(32deg); }
    .developer-scene .ide { left: 154px; top: 252px; width: 490px; height: 394px; } .developer-scene .big { left: 748px; top: 268px; width: 180px; height: 152px; } .developer-scene .dashboard { left: 1138px; top: 300px; } .developer-scene .bench { display: block; }
    .developer-scene .f1 { left: 700px; top: 142px; } .developer-scene .f2 { left: 880px; top: 218px; } .developer-scene .f3 { left: 752px; top: 500px; }
    .developer-scene .w1 { left: 640px; top: 376px; width: 150px; transform: rotate(-38deg); } .developer-scene .w2 { left: 932px; top: 360px; width: 220px; transform: rotate(8deg); } .developer-scene .w3 { left: 944px; top: 536px; width: 210px; transform: rotate(-18deg); }
    .s1 { left: 560px; top: 180px; } .s2 { left: 1000px; top: 500px; } .s3 { right: 170px; bottom: 180px; }
    .workflow.soft-scene { top: 180px; }
    .models-flow .r1 { left: 190px; top: 190px; } .models-flow .r2 { left: 190px; top: 445px; } .models-flow .r3 { left: 190px; top: 650px; transform: scale(.78); }
    .models-flow .database { left: 650px; top: 392px; } .models-flow .decision-board { left: 1040px; top: 270px; }
    .models-flow .w1 { left: 330px; top: 252px; width: 350px; transform: rotate(22deg); } .models-flow .w2 { left: 330px; top: 506px; width: 340px; transform: rotate(-8deg); } .models-flow .w3 { left: 850px; top: 478px; width: 260px; transform: rotate(-20deg); } .models-flow .w4 { left: 860px; top: 546px; width: 260px; transform: rotate(24deg); }
    .crawl-flow .in-a { left: 110px; top: 230px; width: 390px; height: 250px; } .crawl-flow .database { left: 670px; top: 370px; } .crawl-flow .robot { left: 1050px; top: 280px; } .crawl-flow .dashboard { left: 1060px; top: 560px; } .crawl-flow .rules { left: 580px; top: 650px; }
    .crawl-flow .w1 { left: 500px; top: 360px; width: 200px; transform: rotate(20deg); } .crawl-flow .w2 { left: 850px; top: 430px; width: 250px; transform: rotate(-28deg); } .crawl-flow .w3 { left: 860px; top: 540px; width: 230px; transform: rotate(30deg); }
    .orchestration-flow .step { top: 350px; } .orchestration-flow .p1 { left: 150px; } .orchestration-flow .p2 { left: 430px; top: 250px; } .orchestration-flow .p3 { left: 720px; } .orchestration-flow .p4 { left: 1010px; top: 260px; } .orchestration-flow .p5 { left: 1270px; top: 430px; }
    .orchestration-flow .review-pill { left: 300px; right: 300px; bottom: 190px; height: 90px; font-size: 20px; }
    .orchestration-flow .w1 { left: 350px; top: 390px; width: 150px; transform: rotate(-34deg); } .orchestration-flow .w2 { left: 610px; top: 310px; width: 170px; transform: rotate(32deg); } .orchestration-flow .w3 { left: 900px; top: 390px; width: 160px; transform: rotate(-34deg); } .orchestration-flow .w4 { left: 1180px; top: 320px; width: 180px; transform: rotate(42deg); }
    .developer-flow .ide { left: 135px; top: 265px; width: 480px; height: 350px; } .developer-flow .f1 { left: 700px; top: 190px; } .developer-flow .f2 { left: 900px; top: 280px; } .developer-flow .f3 { left: 730px; top: 500px; } .developer-flow .decision-board { left: 1120px; top: 285px; } .developer-flow .robot { left: 430px; top: 682px; transform: scale(.7); }
    .developer-flow .w1 { left: 610px; top: 386px; width: 160px; transform: rotate(-34deg); } .developer-flow .w2 { left: 860px; top: 352px; width: 280px; transform: rotate(14deg); } .developer-flow .w3 { left: 948px; top: 570px; width: 220px; transform: rotate(-34deg); }
    """


def render_chips_html(terms: list[str]) -> str:
    return "".join(
        f"<span class=\"chip{' is-active' if index == 0 else ''}\">{escape(term)}</span>"
        for index, term in enumerate(terms[:5])
    )


def cover_html(title: str, job: dict[str, Any]) -> str:
    terms = topic_terms(title, job)
    visual = visual_heading(title)
    visual_markup = cover_visual_html(title, terms, job)
    return f"""<!doctype html>
<html>
<head><meta charset="utf-8"><style>{editorial_image_css()}</style></head>
<body>
  <main class="frame cover-frame">
    <section class="meta"><h1>{escape(visual)}</h1></section>
    {visual_markup}
    <section class="chips">{render_chips_html(terms)}</section>
  </main>
</body>
</html>"""


def workflow_html(title: str, job: dict[str, Any]) -> str:
    terms = topic_terms(title, job)
    visual_markup = workflow_visual_html(title)
    return f"""<!doctype html>
<html>
<head><meta charset="utf-8"><style>{editorial_image_css()}</style></head>
<body>
  <main class="frame workflow-frame">
    <section class="meta"><h1>{escape(workflow_heading(title))}</h1></section>
    {visual_markup}
    <section class="chips">{render_chips_html(terms)}</section>
  </main>
</body>
</html>"""


def is_voice_comparison_article(title: str, job: dict[str, Any]) -> bool:
    haystack = " ".join([
        title,
        str(job.get("topic") or ""),
        str(job.get("angle") or ""),
        " ".join(str(item) for item in (job.get("related_tool_hints") or [])),
    ]).lower()
    return any(token in haystack for token in ("wispr", "diktier", "voice-to-text", "speech", "superwhisper", "aqua voice"))


def voice_cover_html(title: str, job: dict[str, Any]) -> str:
    title_lines = "<br>".join(escape(line) for line in textwrap.wrap(title, width=46)[:4])
    return f"""<!doctype html>
<html><head><meta charset="utf-8"><style>
* {{ box-sizing: border-box; }}
body {{ margin:0; width:1600px; height:980px; overflow:hidden; font-family:"JetBrains Mono","IBM Plex Mono",Consolas,monospace; color:#16211b; background:#f5f3ea; background-image:linear-gradient(#e0dccb 1px,transparent 1px),linear-gradient(90deg,#e0dccb 1px,transparent 1px); background-size:24px 24px; border:2px solid #c7c3ae; }}
.scene {{ position:relative; width:100%; height:100%; padding:64px 72px; }}
.wash-a,.wash-b,.wash-c {{ position:absolute; border-radius:999px; opacity:.52; filter:blur(.2px); }}
.wash-a {{ width:520px; height:520px; left:86px; top:96px; background:#dff0f0; }}
.wash-b {{ width:520px; height:520px; right:78px; top:46px; background:#fff1bd; }}
.wash-c {{ width:440px; height:440px; right:80px; bottom:-130px; background:#dff0e5; }}
h1 {{ position:absolute; left:76px; top:112px; width:650px; margin:0; color:#275f43; font-size:64px; line-height:.96; letter-spacing:-.06em; }}
.title {{ position:absolute; left:76px; top:252px; width:650px; font-size:35px; line-height:1.18; font-weight:900; letter-spacing:-.045em; }}
.voice-card {{ position:absolute; left:90px; top:470px; width:520px; height:260px; border:3px solid #286c7e; border-radius:42px; background:#fffdf4; box-shadow:18px 22px 0 rgba(22,33,27,.16); }}
.voice-card:before {{ content:""; position:absolute; left:52px; right:52px; top:74px; height:18px; border-radius:99px; background:linear-gradient(90deg,#94d2e7 0 18%,transparent 18% 25%,#f3c85f 25% 45%,transparent 45% 53%,#e58a35 53% 70%,transparent 70% 77%,#4f812c 77%); }}
.voice-card:after {{ content:"voice note"; position:absolute; left:52px; top:128px; color:#275f43; font-size:34px; font-weight:900; }}
.mic {{ position:absolute; left:690px; top:332px; width:270px; height:370px; border:3px solid #286c7e; border-radius:110px 110px 86px 86px; background:#d7eef2; box-shadow:18px 22px 0 rgba(22,33,27,.14); }}
.mic:before {{ content:""; position:absolute; left:62px; right:62px; top:64px; height:96px; border-radius:60px; background:#16211b; box-shadow:0 0 0 22px #bfe5d8; }}
.mic:after {{ content:""; position:absolute; left:118px; top:-35px; width:34px; height:82px; border-radius:24px; background:#f1ca63; border:3px solid #286c7e; }}
.wave {{ position:absolute; left:626px; top:395px; width:86px; height:160px; border:8px solid transparent; border-left-color:#e58a35; border-radius:80px; }}
.wave.two {{ left:604px; top:366px; width:132px; height:218px; border-left-color:#286c7e; opacity:.75; }}
.output {{ position:absolute; right:88px; top:316px; width:470px; height:330px; border:3px solid #286c7e; border-radius:34px; background:#fffdf4; box-shadow:18px 22px 0 rgba(22,33,27,.14); padding:52px 58px; }}
.output b {{ display:block; color:#275f43; font-size:34px; margin-bottom:30px; }}
.line {{ height:10px; margin:22px 0; border-radius:20px; background:#8fcde3; }}
.line:nth-child(3) {{ width:82%; background:#f1ca63; }} .line:nth-child(4) {{ width:68%; background:#e58a35; }} .line:nth-child(5) {{ width:92%; background:#4f812c; }}
.apps {{ position:absolute; left:76px; right:76px; bottom:64px; display:flex; gap:18px; align-items:center; }}
.app {{ padding:16px 22px; border:2px solid #a7a28e; border-radius:22px; background:#fffdf4; color:#275f43; font-size:25px; font-weight:900; box-shadow:8px 9px 0 rgba(22,33,27,.10); }}
.app.hot {{ background:#4f812c; color:#fffdf4; border-color:#4f812c; }}
.caption {{ position:absolute; right:92px; bottom:150px; width:480px; color:#63645a; font-size:22px; line-height:1.35; }}
.spark {{ position:absolute; width:30px; height:30px; transform:rotate(45deg); background:#f1ca63; }} .s1 {{ left:638px; top:236px; }} .s2 {{ right:190px; top:250px; }} .s3 {{ right:350px; bottom:278px; }}
</style></head><body><main class="scene">
<div class="wash-a"></div><div class="wash-b"></div><div class="wash-c"></div>
<h1>VOICE<br>WORKBENCH</h1><div class="title">{title_lines}</div>
<div class="voice-card"></div><div class="wave two"></div><div class="wave"></div><div class="mic"></div>
<section class="output"><b>polished text</b><div class="line"></div><div class="line"></div><div class="line"></div><div class="line"></div></section>
<p class="caption">Sprache wird nicht nur transkribiert. Gute Tools gl&auml;tten, kontextualisieren und halten trotzdem genug Kontrolle beim Menschen.</p>
<div class="apps"><span class="app hot">Wispr Flow</span><span class="app">Superwhisper</span><span class="app">Aqua Voice</span><span class="app">Otter.ai</span><span class="app">Descript</span></div>
<div class="spark s1"></div><div class="spark s2"></div><div class="spark s3"></div>
</main></body></html>"""


def voice_workflow_html(title: str, job: dict[str, Any]) -> str:
    return """<!doctype html>
<html><head><meta charset="utf-8"><style>
* { box-sizing:border-box; }
body { margin:0; width:1600px; height:980px; overflow:hidden; font-family:"JetBrains Mono","IBM Plex Mono",Consolas,monospace; color:#16211b; background:#f5f3ea; background-image:linear-gradient(#e0dccb 1px,transparent 1px),linear-gradient(90deg,#e0dccb 1px,transparent 1px); background-size:24px 24px; border:2px solid #c7c3ae; }
.frame { position:relative; width:100%; height:100%; padding:60px 74px; }
h1 { margin:28px 0 16px; width:980px; color:#275f43; font-size:56px; line-height:1.02; letter-spacing:-.055em; }
.dek { width:900px; color:#57594f; font-size:26px; line-height:1.32; }
.wash-a,.wash-b,.wash-c { position:absolute; border-radius:999px; opacity:.48; }
.wash-a{right:70px;top:58px;width:430px;height:430px;background:#fff1bd;}
.wash-b{left:72px;bottom:-120px;width:480px;height:480px;background:#dff0e5;}
.wash-c{right:250px;bottom:78px;width:300px;height:300px;background:#dff0f0;}
.apps { position:absolute; right:86px; top:88px; display:flex; flex-direction:column; gap:12px; }
.apps span { padding:10px 16px; border:2px solid #a7a28e; border-radius:18px; background:#fffdf4; color:#275f43; font-size:20px; font-weight:900; box-shadow:7px 8px 0 rgba(22,33,27,.08); }
.signal { position:absolute; left:116px; right:116px; top:356px; height:128px; border-radius:76px; background:#d7eef2; border:3px solid #286c7e; box-shadow:18px 20px 0 rgba(22,33,27,.13); }
.signal:before { content:""; position:absolute; left:70px; right:70px; top:52px; height:18px; border-radius:50px; background:linear-gradient(90deg,#286c7e 0 10%,transparent 10% 14%,#f1ca63 14% 28%,transparent 28% 35%,#e58a35 35% 44%,transparent 44% 51%,#4f812c 51% 68%,transparent 68% 73%,#286c7e 73%); }
.signal small { position:absolute; left:72px; top:18px; color:#275f43; font-size:19px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
.step { position:absolute; top:560px; width:322px; height:278px; padding:30px 30px 28px; border:3px solid #286c7e; border-radius:34px; background:#fffdf4; box-shadow:14px 16px 0 rgba(22,33,27,.13); overflow:hidden; }
.step b { display:block; color:#275f43; font-size:31px; margin:0 0 12px; }
.step p { margin:0; color:#57594f; font-size:20px; line-height:1.3; }
.step .icon { width:78px; height:78px; border-radius:28px; margin-bottom:20px; background:#d7eef2; border:3px solid #286c7e; position:relative; }
.step .icon:after { content:""; position:absolute; inset:24px 14px; border-radius:40px; background:#16211b; }
.speak { left:106px; } .clean { left:454px; } .check { left:802px; } .ship { left:1150px; }
.clean .icon { background:#fff1bd; } .check .icon { background:#e3f0df; } .ship .icon { background:#f8d6ad; }
.clean .icon:after { inset:18px; border-radius:12px; background:linear-gradient(#286c7e 0 18%,transparent 18% 34%,#e58a35 34% 52%,transparent 52% 68%,#4f812c 68%); }
.check .icon:after { inset:15px 22px; width:34px; height:48px; transform:rotate(38deg); border-right:9px solid #4f812c; border-bottom:9px solid #4f812c; background:transparent; border-radius:0; }
.ship .icon:after { inset:22px; background:#4f812c; clip-path:polygon(0 22%,68% 22%,68% 0,100% 50%,68% 100%,68% 78%,0 78%); border-radius:0; }
.num { position:absolute; right:24px; top:22px; color:#e58a35; font-weight:900; font-size:26px; }
.rule { position:absolute; left:118px; right:118px; bottom:60px; height:2px; background:#c7c3ae; }
.spark { position:absolute; width:30px; height:30px; transform:rotate(45deg); background:#f1ca63; } .s1{left:620px;top:294px;} .s2{right:300px;top:326px;} .s3{left:310px;bottom:92px;}
</style></head><body><main class="frame"><div class="wash-a"></div><div class="wash-b"></div><div class="wash-c"></div><h1>Vom Roh-Diktat zum brauchbaren Workflow</h1><p class="dek">Erst vergleichen, dann entscheiden: Diktat, KI-Gl&auml;ttung, Review und Einsatz geh&ouml;ren in einen kontrollierbaren Ablauf.</p><div class="apps"><span>Wispr Flow</span><span>Superwhisper</span><span>Aqua Voice</span></div><div class="signal"><small>SPRACHE / TEXT / PR&Uuml;FUNG</small></div><section class="step speak"><span class="num">01</span><div class="icon"></div><b>Sprechen</b><p>Rohgedanken aufnehmen, ohne den Fluss zu stoppen.</p></section><section class="step clean"><span class="num">02</span><div class="icon"></div><b>Gl&auml;tten</b><p>KI macht daraus lesbaren Text mit erkennbarem Ton.</p></section><section class="step check"><span class="num">03</span><div class="icon"></div><b>Pr&uuml;fen</b><p>Fakten, Datenschutz und App-Kontext kurz kontrollieren.</p></section><section class="step ship"><span class="num">04</span><div class="icon"></div><b>Einsetzen</b><p>In Mail, Dokument, Kommentar oder Meeting-Notiz nutzen.</p></section><div class="rule"></div><div class="spark s1"></div><div class="spark s2"></div><div class="spark s3"></div></main></body></html>"""


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
        if is_voice_comparison_article(title, job):
            cover_source = voice_cover_html(title, job)
            workflow_source = voice_workflow_html(title, job)
        else:
            cover_source = cover_html(title, job)
            workflow_source = workflow_html(title, job)
        cover_html_path.write_text(cover_source, encoding="utf-8")
        workflow_html_path.write_text(workflow_source, encoding="utf-8")
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


def stable_for_signature(value: Any) -> Any:
    if isinstance(value, list):
        return [stable_for_signature(item) for item in value]
    if isinstance(value, dict):
        ignored = {"uploadedAt", "updatedAt", "publish", "uploadSignature"}
        return {
            key: stable_for_signature(value[key])
            for key in sorted(value)
            if key not in ignored
        }
    return value


def upload_signature(candidate: dict[str, Any], assets: list[dict[str, str]]) -> str:
    payload = {"candidate": candidate, "assets": assets}
    encoded = json.dumps(stable_for_signature(payload), ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def read_previous_upload_signature(artifact_dir: Path) -> str:
    upload_path = artifact_dir / "cloudflare_review_uploaded.json"
    if not upload_path.exists():
        return ""
    try:
        data = load_json(upload_path)
    except Exception:
        return ""
    return str(data.get("uploadSignature") or data.get("result", {}).get("uploadSignature") or "")


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


def upload_one(
    artifact_dir: Path,
    endpoint: str,
    token: str,
    force_images: bool,
    dry_run: bool,
    force_upload: bool,
    local_dedupe: bool,
) -> dict[str, Any]:
    candidate, assets = build_candidate_payload(artifact_dir, force_images=force_images)
    signature = upload_signature(candidate, assets)
    candidate["uploadSignature"] = signature
    payload = {"candidate": candidate, "assets": assets}
    if force_upload:
        payload["force"] = True
    (artifact_dir / "cloudflare_review_candidate.json").write_text(
        json.dumps(
            {"candidate": candidate, "asset_names": [asset["name"] for asset in assets], "uploadSignature": signature},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    if local_dedupe and not force_upload and not dry_run and read_previous_upload_signature(artifact_dir) == signature:
        return {
            "ok": True,
            "skipped": True,
            "reason": "unchanged-local",
            "jobId": candidate["jobId"],
            "uploadSignature": signature,
        }

    if dry_run:
        result = {
            "ok": True,
            "dry_run": True,
            "candidate": candidate,
            "asset_count": len(assets),
            "uploadSignature": signature,
        }
    else:
        result = post_json(endpoint, token, payload)
        if result.get("ok"):
            (artifact_dir / "cloudflare_review_uploaded.json").write_text(
                json.dumps(
                    {"uploaded_at": result.get("uploadedAt") or "", "uploadSignature": signature, "result": result},
                    ensure_ascii=False,
                    indent=2,
                ),
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
    parser.add_argument("--force-upload", action="store_true", help="Upload even when the local payload signature is unchanged.")
    parser.add_argument("--no-local-dedupe", action="store_true", help="Disable local signature dedupe before POSTing to Cloudflare.")
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
        result = upload_one(
            artifact_dir,
            args.endpoint,
            token,
            args.force_images,
            args.dry_run,
            args.force_upload,
            not args.no_local_dedupe,
        )
        results.append({"artifact_dir": str(artifact_dir), "result": result})
        print(json.dumps(results[-1], ensure_ascii=False, indent=2))
        if not result.get("ok"):
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

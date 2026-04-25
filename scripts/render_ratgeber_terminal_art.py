#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT_DIR = Path(__file__).resolve().parent.parent
RATGEBER_DIR = ROOT_DIR / "content" / "ratgeber"
IMAGE_DIR = ROOT_DIR / "content" / "images" / "ratgeber"
SIZE = (1600, 980)

BG = "#f5f3ea"
BG_2 = "#ebe9df"
BG_3 = "#e2e0d4"
LINE = "#c8c5b3"
LINE_2 = "#b1ad9a"
FG = "#1d1e18"
FG_2 = "#54564a"
FG_3 = "#828275"
ACCENT = "#4f7f28"
ACCENT_D = "#365d1b"
WARN = "#a06b1f"


@dataclass
class Article:
    slug: str
    title: str
    excerpt: str
    tags: list[str]
    category: str
    read_time: str


def font_path(bold: bool = False) -> str | None:
    candidates = [
        Path("C:/Windows/Fonts/consolab.ttf" if bold else "C:/Windows/Fonts/consola.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"),
        Path("/usr/share/fonts/dejavu/DejaVuSansMono-Bold.ttf" if bold else "/usr/share/fonts/dejavu/DejaVuSansMono.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    return None


def load_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    path = font_path(bold)
    if path:
        return ImageFont.truetype(path, size=size)
    return ImageFont.load_default(size=size)


F = {
    "xxs": load_font(18),
    "xs": load_font(22),
    "sm": load_font(28),
    "sm_b": load_font(28, True),
    "md": load_font(34),
    "md_b": load_font(34, True),
    "lg": load_font(46, True),
    "xl": load_font(64, True),
    "xxl": load_font(82, True),
}


def parse_frontmatter(path: Path) -> Article:
    text = path.read_text(encoding="utf-8-sig")
    front = text.split("---", 2)[1]

    def scalar(key: str) -> str:
        match = re.search(rf"^{re.escape(key)}:\s*\"?(.*?)\"?\s*$", front, re.M)
        return match.group(1).strip() if match else ""

    tags: list[str] = []
    in_tags = False
    for line in front.splitlines():
        if line.strip() == "tags:":
            in_tags = True
            continue
        if in_tags and re.match(r"^[A-Za-z][A-Za-z0-9_]*:", line):
            break
        if in_tags:
            match = re.match(r"\s+-\s+\"?(.*?)\"?\s*$", line)
            if match:
                tags.append(match.group(1).strip())

    return Article(
        slug=scalar("slug") or path.stem,
        title=scalar("title") or path.stem,
        excerpt=scalar("excerpt"),
        tags=tags[:5],
        category=scalar("category"),
        read_time=scalar("readTime"),
    )


def text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1]


def wrap_by_pixels(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if text_size(draw, candidate, font)[0] <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_text_block(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.ImageFont,
    max_width: int,
    fill: str,
    line_gap: int = 10,
    max_lines: int | None = None,
) -> int:
    x, y = xy
    lines = wrap_by_pixels(draw, text, font, max_width)
    if max_lines and len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1].rstrip(" .,:;") + "..."
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += text_size(draw, line, font)[1] + line_gap
    return y


def canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", SIZE, BG)
    draw = ImageDraw.Draw(img)
    for x in range(0, SIZE[0], 24):
        draw.line((x, 0, x, SIZE[1]), fill="#ddd9c9", width=1)
    for y in range(0, SIZE[1], 24):
        draw.line((0, y, SIZE[0], y), fill="#e1ddce", width=1)
    draw.rectangle((0, 0, SIZE[0] - 1, SIZE[1] - 1), outline=LINE, width=2)
    return img, draw


def rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str, outline: str = LINE, width: int = 2) -> None:
    draw.rectangle(box, fill=fill, outline=outline, width=width)


def label(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, fill: str = FG_3) -> None:
    draw.text(xy, value, font=F["xs"], fill=fill)


def short(value: str, limit: int) -> str:
    value = re.sub(r"\s+", " ", value or "").strip()
    if len(value) <= limit:
        return value
    return value[: limit - 3].rstrip(" .,:;") + "..."


def chip(draw: ImageDraw.ImageDraw, x: int, y: int, text: str, active: bool = False) -> int:
    font = F["sm_b"] if active else F["sm"]
    w, h = text_size(draw, text, font)
    pad_x, pad_y = 18, 10
    box = (x, y, x + w + pad_x * 2, y + h + pad_y * 2)
    rect(draw, box, ACCENT if active else BG, ACCENT if active else LINE_2, 2)
    draw.text((x + pad_x, y + pad_y - 2), text, font=font, fill=BG if active else ACCENT_D)
    return box[2] + 14


def kind(article: Article) -> str:
    title = article.title.lower()
    if "chatgpt" in title:
        return "models"
    if "website" in title:
        return "crawl"
    if "orchestrierung" in title:
        return "orchestration"
    if "developer" in title:
        return "developer"
    return "generic"


def article_terms(article: Article) -> list[str]:
    by_kind = {
        "models": ["ChatGPT", "Claude", "Gemini", "Recherche", "Datenschutz"],
        "crawl": ["Crawler", "Agenten", "IndexNow", "Guardrails", "Traffic"],
        "orchestration": ["Agenten", "Kontext", "Workflow", "Review", "Runtime"],
        "developer": ["IDE", "CLI", "Diff", "Tests", "Release"],
    }
    terms = by_kind.get(kind(article), [article.category, *article.tags])
    seen: set[str] = set()
    result: list[str] = []
    for term in terms:
        clean = str(term or "").strip()
        key = clean.lower()
        if clean and key not in seen:
            seen.add(key)
            result.append(clean[:18])
    return result[:5] or ["Signal", "Review", "Index", "Quelle"]


def cover_heading(article: Article) -> str:
    return {
        "models": "MODEL BENCH",
        "crawl": "CRAWL CONTROL",
        "orchestration": "AGENT BUS",
        "developer": "IDE WORKBENCH",
    }.get(kind(article), "SIGNAL MAP")


def draw_cover_text(draw: ImageDraw.ImageDraw, article: Article) -> None:
    label(draw, (64, 58), "[ utildesk.ratgeber / terminal_illustration ]")
    draw.text((64, 116), cover_heading(article), font=F["xl"], fill=FG)
    draw.line((64, 208, 648, 208), fill=ACCENT, width=6)
    draw_text_block(draw, (64, 246), article.title, F["lg"], 680, FG, line_gap=12, max_lines=4)
    draw_text_block(draw, (64, 522), article.excerpt, F["sm"], 650, FG_2, line_gap=12, max_lines=4)

    x = 64
    for index, term in enumerate(article_terms(article)[:4]):
        x = chip(draw, x, 744, term, active=index == 0)
    if article.read_time:
        chip(draw, 64, 814, f"{article.read_time} min", active=False)


def draw_footer(draw: ImageDraw.ImageDraw, left: str, right: str) -> None:
    label(draw, (64, 910), left)
    label(draw, (1088, 910), right)


def arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], fill: str = ACCENT_D, width: int = 4) -> None:
    draw.line((*start, *end), fill=fill, width=width)
    x1, y1 = start
    x2, y2 = end
    if abs(x2 - x1) >= abs(y2 - y1):
        sign = 1 if x2 >= x1 else -1
        pts = [(x2, y2), (x2 - sign * 18, y2 - 10), (x2 - sign * 18, y2 + 10)]
    else:
        sign = 1 if y2 >= y1 else -1
        pts = [(x2, y2), (x2 - 10, y2 - sign * 18), (x2 + 10, y2 - sign * 18)]
    draw.polygon(pts, fill=fill)


def small_window(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], title: str, fill: str = BG_2) -> None:
    rect(draw, box, fill, LINE, 2)
    x1, y1, x2, _ = box
    draw.line((x1, y1 + 38, x2, y1 + 38), fill=LINE, width=2)
    draw.rectangle((x1 + 16, y1 + 13, x1 + 26, y1 + 23), fill=WARN)
    draw.rectangle((x1 + 34, y1 + 13, x1 + 44, y1 + 23), fill=ACCENT)
    draw.text((x1 + 60, y1 + 9), title, font=F["xs"], fill=FG_3)


def draw_models_cover(draw: ImageDraw.ImageDraw) -> None:
    panel = (810, 112, 1510, 848)
    rect(draw, panel, BG_2, LINE, 2)
    label(draw, (840, 142), "[ comparative_model_bench ]")
    draw.text((840, 190), "prompt_router", font=F["md_b"], fill=FG)
    rect(draw, (840, 246, 1480, 304), BG, LINE_2, 2)
    draw.text((864, 260), "task -> choose model by strength, risk, context", font=F["sm"], fill=FG_2)
    names = [("ChatGPT", ACCENT), ("Claude", WARN), ("Gemini", FG)]
    for index, (name, color) in enumerate(names):
        x1 = 840 + index * 215
        x2 = x1 + 190
        small_window(draw, (x1, 350, x2, 710), name, BG)
        draw.text((x1 + 22, 424), name, font=F["sm_b"], fill=color)
        metrics = [("write", 118 - index * 8), ("research", 86 + index * 18), ("code", 96 + (1 if index == 1 else 0) * 34)]
        y = 492
        for label_text, value in metrics:
            draw.text((x1 + 22, y), label_text, font=F["xxs"], fill=FG_3)
            rect(draw, (x1 + 22, y + 26, x1 + 150, y + 38), BG_3, LINE, 1)
            draw.rectangle((x1 + 22, y + 26, x1 + 22 + min(value, 128), y + 38), fill=color)
            y += 58
        draw.rectangle((x1 + 24, 642, x1 + 78, 678), fill=color, outline=FG, width=2)
        draw.text((x1 + 92, 646), f"M0{index + 1}", font=F["xs"], fill=FG_2)
    arrow(draw, (1160, 304), (1160, 342), WARN)
    draw.line((934, 744, 1386, 744), fill=LINE_2, width=4)
    draw.text((914, 774), "privacy gate", font=F["sm_b"], fill=ACCENT_D)
    draw.text((1196, 774), "final pick", font=F["sm_b"], fill=FG_2)


def draw_crawl_cover(draw: ImageDraw.ImageDraw) -> None:
    panel = (810, 112, 1510, 848)
    rect(draw, panel, BG_2, LINE, 2)
    label(draw, (840, 142), "[ crawl_control_room ]")
    rect(draw, (1080, 300, 1300, 500), BG, FG, 3)
    draw.text((1114, 326), "tools.utildesk.de", font=F["xs"], fill=FG_2)
    for y in range(368, 474, 34):
        draw.line((1110, y, 1272, y), fill=LINE, width=2)
    rect(draw, (946, 250, 1018, 552), BG_3, LINE_2, 2)
    draw.text((958, 280), "WAF", font=F["sm_b"], fill=ACCENT_D)
    draw.line((982, 330, 982, 510), fill=ACCENT, width=5)
    for i, y in enumerate([214, 302, 402, 602, 694]):
        x = 846 if i < 3 else 1350
        color = ACCENT if i in {0, 3} else WARN
        rect(draw, (x, y, x + 118, y + 54), color, FG, 2)
        draw.text((x + 18, y + 12), f"bot_{i+1}", font=F["xs"], fill=BG)
        target = (946, min(max(y + 26, 288), 524)) if i < 3 else (1300, min(max(y + 26, 328), 500))
        arrow(draw, (x + (118 if i < 3 else 0), y + 27), target, ACCENT_D if color == ACCENT else WARN)
    rect(draw, (840, 704, 1220, 792), BG, LINE, 2)
    draw.text((864, 728), "robots.txt + ai crawl rules", font=F["sm_b"], fill=FG)
    draw.text((864, 764), "allow useful / throttle costly / block abuse", font=F["xs"], fill=FG_2)


def draw_orchestration_cover(draw: ImageDraw.ImageDraw) -> None:
    panel = (790, 110, 1520, 848)
    rect(draw, panel, BG_2, LINE, 2)
    label(draw, (820, 140), "[ orchestration_bus ]")
    rect(draw, (844, 400, 1470, 464), FG, FG, 2)
    draw.text((878, 416), "context bus", font=F["sm_b"], fill=ACCENT)
    nodes = [
        (880, 210, "NotebookLM", "source draft", WARN),
        (1136, 196, "Planner", "scope", ACCENT),
        (1360, 232, "Agent 03", "parallel", ACCENT),
        (934, 572, "Agent 01", "code path", ACCENT),
        (1190, 604, "Agent 02", "research", WARN),
        (1380, 560, "Review", "gate", FG),
    ]
    for x, y, title, sub, color in nodes:
        rect(draw, (x, y, x + 154, y + 104), BG, LINE, 2)
        draw.rectangle((x + 18, y + 18, x + 48, y + 48), fill=color, outline=FG, width=2)
        draw.text((x + 58, y + 18), title, font=F["xs"], fill=FG)
        draw.text((x + 18, y + 64), sub, font=F["xxs"], fill=FG_3)
        anchor_y = 400 if y < 400 else 464
        arrow(draw, (x + 77, y + (104 if y < 400 else 0)), (x + 77, anchor_y), ACCENT_D)
    rect(draw, (842, 742, 1470, 800), BG, LINE_2, 2)
    draw.text((866, 756), "trace: sources -> plan -> shards -> verifier -> publish", font=F["sm"], fill=FG_2)


def draw_developer_cover(draw: ImageDraw.ImageDraw) -> None:
    panel = (792, 110, 1520, 848)
    rect(draw, panel, BG_2, LINE, 2)
    label(draw, (822, 140), "[ ide_cli_workbench ]")
    small_window(draw, (830, 196, 1158, 620), "IDE / context", BG)
    code_lines = [
        "+ define acceptance",
        "+ split shard tests",
        "- remove blind merge",
        "+ verify preview",
        "+ publish only after gate",
    ]
    y = 272
    for line in code_lines:
        color = ACCENT_D if line.startswith("+") else WARN
        draw.text((856, y), line, font=F["sm"], fill=color)
        y += 54
    small_window(draw, (1192, 196, 1484, 486), "CLI agent run", FG)
    draw.text((1218, 266), "$ codex run", font=F["sm_b"], fill=ACCENT)
    draw.text((1218, 318), "spawn shards", font=F["sm"], fill=BG)
    draw.text((1218, 368), "collect diffs", font=F["sm"], fill=BG)
    draw.text((1218, 418), "run checks", font=F["sm"], fill=BG)
    rect(draw, (1200, 552, 1484, 712), BG, LINE, 2)
    draw.text((1224, 578), "review gate", font=F["md_b"], fill=FG)
    draw.text((1224, 632), "tests: ok", font=F["sm_b"], fill=ACCENT_D)
    draw.text((1224, 672), "merge: held", font=F["sm"], fill=WARN)
    arrow(draw, (1158, 406), (1192, 406), ACCENT_D)
    arrow(draw, (1338, 486), (1338, 552), ACCENT_D)


def draw_generic_cover(draw: ImageDraw.ImageDraw, article: Article) -> None:
    draw_orchestration_cover(draw)


def render_cover(article: Article, output: Path) -> None:
    img, draw = canvas()
    draw_cover_text(draw, article)
    {
        "models": draw_models_cover,
        "crawl": draw_crawl_cover,
        "orchestration": draw_orchestration_cover,
        "developer": draw_developer_cover,
    }.get(kind(article), lambda d: draw_generic_cover(d, article))(draw)
    draw_footer(draw, "UTILDESK // topic-specific editorial image", "PNG / grid / mono / no cloned diagrams")
    output.parent.mkdir(parents=True, exist_ok=True)
    img.save(output, "PNG", optimize=True)


def draw_workflow_header(draw: ImageDraw.ImageDraw, article: Article, title: str) -> None:
    label(draw, (64, 58), "[ workflow.trace ]")
    draw.text((64, 116), title, font=F["xl"], fill=FG)
    draw_text_block(draw, (64, 206), article.title, F["md"], 940, FG_2, line_gap=10, max_lines=2)


def draw_models_workflow(draw: ImageDraw.ImageDraw, article: Article) -> None:
    draw_workflow_header(draw, article, "MODEL ROUTING")
    rect(draw, (86, 344, 1514, 802), BG_2, LINE, 2)
    labels = ["Schreiben", "Recherche", "Coding", "Privacy"]
    models = ["ChatGPT", "Claude", "Gemini"]
    for i, model in enumerate(models):
        x = 340 + i * 300
        draw.text((x, 382), model, font=F["md_b"], fill=[ACCENT_D, WARN, FG][i])
        draw.line((x - 30, 430, x + 230, 430), fill=LINE_2, width=2)
    for r, label_text in enumerate(labels):
        y = 486 + r * 68
        draw.text((130, y), label_text, font=F["sm_b"], fill=FG)
        draw.line((292, y + 18, 1392, y + 18), fill=LINE, width=1)
        for c in range(3):
            score = [3, 2, 2, 1][r] + (1 if c == r % 3 else 0)
            x = 360 + c * 300
            for dot in range(4):
                fill = ACCENT if dot < score else BG
                draw.rectangle((x + dot * 34, y, x + dot * 34 + 20, y + 20), fill=fill, outline=LINE_2, width=1)
    rect(draw, (1040, 704, 1394, 766), FG, FG, 2)
    draw.text((1066, 720), "route only after context + risk check", font=F["xs"], fill=BG)


def draw_crawl_workflow(draw: ImageDraw.ImageDraw, article: Article) -> None:
    draw_workflow_header(draw, article, "EDGE CONTROL STACK")
    steps = [
        ("traffic", "KI-Bots"),
        ("rules", "Crawl Control"),
        ("mirror", "Markdown"),
        ("schema", "JSON-LD"),
        ("ping", "IndexNow"),
    ]
    x = 162
    prev = None
    for i, (key, title) in enumerate(steps):
        y = 342 + i * 92
        rect(draw, (x, y, 690, y + 64), BG if i % 2 else BG_2, LINE, 2)
        draw.text((190, y + 16), f"{i+1:02d}", font=F["sm_b"], fill=ACCENT_D if i != 1 else WARN)
        draw.text((270, y + 16), title, font=F["sm_b"], fill=FG)
        draw.text((560, y + 18), key.upper(), font=F["xs"], fill=FG_3)
        if prev:
            arrow(draw, prev, (426, y), ACCENT_D)
        prev = (426, y + 64)
    rect(draw, (852, 348, 1456, 734), BG_2, LINE, 2)
    label(draw, (882, 378), "[ server load before/after ]")
    for i, h in enumerate([232, 188, 124, 84, 62]):
        x1 = 930 + i * 86
        draw.rectangle((x1, 666 - h, x1 + 48, 666), fill=WARN if i < 2 else ACCENT, outline=FG, width=2)
    draw.line((906, 666, 1396, 666), fill=FG_3, width=2)
    draw.text((910, 694), "less blind crawling, more explicit updates", font=F["sm"], fill=FG_2)


def draw_orchestration_workflow(draw: ImageDraw.ImageDraw, article: Article) -> None:
    draw_workflow_header(draw, article, "ORCHESTRATION RUN")
    lanes = [
        ("NotebookLM", "source grounded draft"),
        ("Planner", "scope + split"),
        ("Agents", "parallel work"),
        ("Verifier", "tests + risks"),
        ("Publish", "human gate"),
    ]
    for i, (name, desc) in enumerate(lanes):
        y = 330 + i * 92
        rect(draw, (86, y, 1514, y + 64), BG_2 if i % 2 else BG, LINE, 2)
        draw.text((116, y + 16), name, font=F["sm_b"], fill=ACCENT_D if i in {0, 4} else FG)
        draw.text((430, y + 16), desc, font=F["sm"], fill=FG_2)
        draw.rectangle((1328, y + 15, 1384, y + 49), fill=ACCENT if i != 3 else WARN, outline=FG, width=2)
        draw.text((1404, y + 16), "logged", font=F["xs"], fill=FG_3)
        if i < len(lanes) - 1:
            arrow(draw, (800, y + 64), (800, y + 92), ACCENT_D)
    rect(draw, (980, 744, 1514, 824), FG, FG, 2)
    draw.text((1010, 768), "$ publish if final preview approved", font=F["sm"], fill=ACCENT)


def draw_developer_workflow(draw: ImageDraw.ImageDraw, article: Article) -> None:
    draw_workflow_header(draw, article, "DEV AGENT RAIL")
    rect(draw, (100, 438, 1490, 456), FG, FG, 2)
    stops = [
        (180, "IDE", "context"),
        (444, "CLI", "shards"),
        (708, "Tests", "proof"),
        (972, "Review", "gate"),
        (1236, "Release", "ship"),
    ]
    for i, (x, name, sub) in enumerate(stops):
        y = 334 if i % 2 == 0 else 536
        rect(draw, (x, y, x + 190, y + 130), BG_2 if i % 2 else BG, LINE, 2)
        draw.rectangle((x + 24, y + 22, x + 64, y + 62), fill=ACCENT if i != 3 else WARN, outline=FG, width=2)
        draw.text((x + 78, y + 24), name, font=F["sm_b"], fill=FG)
        draw.text((x + 24, y + 82), sub, font=F["xs"], fill=FG_3)
        arrow(draw, (x + 95, y + (130 if i % 2 == 0 else 0)), (x + 95, 446), ACCENT_D)
    rect(draw, (196, 724, 1398, 812), BG_2, LINE, 2)
    draw.text((226, 750), "guardrail: no merge without real preview, tests and rollback note", font=F["sm"], fill=FG_2)


def render_workflow(article: Article, output: Path) -> None:
    img, draw = canvas()
    {
        "models": draw_models_workflow,
        "crawl": draw_crawl_workflow,
        "orchestration": draw_orchestration_workflow,
        "developer": draw_developer_workflow,
    }.get(kind(article), draw_orchestration_workflow)(draw, article)
    draw_footer(draw, "UTILDESK // workflow visual family", "article-safe / topic-specific / no clones")
    output.parent.mkdir(parents=True, exist_ok=True)
    img.save(output, "PNG", optimize=True)


def render_article(path: Path, output_dir: Path) -> tuple[Path, Path]:
    article = parse_frontmatter(path)
    cover = output_dir / f"{article.slug}-cover.png"
    workflow = output_dir / f"{article.slug}-workflow.png"
    render_cover(article, cover)
    render_workflow(article, workflow)
    return cover, workflow


def main() -> int:
    parser = argparse.ArgumentParser(description="Render topic-specific Utildesk PNG illustrations for Ratgeber articles.")
    parser.add_argument("--article", type=Path)
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=IMAGE_DIR)
    args = parser.parse_args()

    if args.all:
        articles = sorted(RATGEBER_DIR.glob("*.md"))
    elif args.article:
        articles = [args.article]
    else:
        raise SystemExit("Use --article path or --all.")

    rendered = []
    for article in articles:
        cover, workflow = render_article(article, args.output_dir)
        rendered.append({"article": str(article), "cover": str(cover), "workflow": str(workflow)})

    for item in rendered:
        print(f"{item['article']} -> {item['cover']} / {item['workflow']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

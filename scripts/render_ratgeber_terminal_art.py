#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import textwrap
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


def chip(draw: ImageDraw.ImageDraw, x: int, y: int, text: str, active: bool = False) -> int:
    font = F["sm_b"] if active else F["sm"]
    w, h = text_size(draw, text, font)
    pad_x, pad_y = 18, 10
    box = (x, y, x + w + pad_x * 2, y + h + pad_y * 2)
    rect(draw, box, ACCENT if active else BG, ACCENT if active else LINE_2, 2)
    draw.text((x + pad_x, y + pad_y - 2), text, font=font, fill=BG if active else ACCENT_D)
    return box[2] + 14


def article_terms(article: Article) -> list[str]:
    terms = [article.category, *article.tags]
    if "ChatGPT" in article.title:
        terms = ["ChatGPT", "Claude", "Gemini", "Assistenz", "Datenschutz"]
    elif "Orchestrierung" in article.title:
        terms = ["Agenten", "Kontext", "Workflow", "Review", "Runtime"]
    elif "Website" in article.title:
        terms = ["Crawler", "Agenten", "IndexNow", "Guardrails", "Traffic"]
    elif "Developer" in article.title:
        terms = ["IDE", "CLI", "Review", "Kontext", "Release"]
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
    title = article.title.lower()
    if "chatgpt" in title:
        return "MODEL BENCH"
    if "website" in title:
        return "BOT TRAFFIC MAP"
    if "orchestrierung" in title:
        return "ORCHESTRATION BUS"
    if "developer" in title:
        return "AGENT RUN TRACE"
    return "SIGNAL MAP"


def draw_signal_plot(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], terms: list[str]) -> None:
    x1, y1, x2, y2 = box
    rect(draw, box, BG_2, LINE, 2)
    label(draw, (x1 + 24, y1 + 22), "[ signal_map ]")
    for i in range(5):
        y = y1 + 88 + i * 58
        draw.line((x1 + 28, y, x2 - 28, y), fill=LINE, width=1)
    for i, term in enumerate(terms):
        x = x1 + 52 + i * 116
        draw.line((x, y1 + 84, x, y2 - 44), fill=LINE_2, width=2)
        draw.text((x - 10, y2 - 40), f"0{i+1}", font=F["xs"], fill=FG_3)
        draw.text((x - 24, y2 - 76), term[:8], font=F["xs"], fill=ACCENT_D if i % 2 == 0 else FG_2)

    points = [
        (x1 + 64, y2 - 156),
        (x1 + 168, y1 + 174),
        (x1 + 302, y1 + 244),
        (x1 + 440, y1 + 130),
        (x2 - 76, y1 + 210),
    ]
    for start, end in zip(points, points[1:]):
        draw.line((*start, *end), fill=ACCENT, width=5)
    for i, (x, y) in enumerate(points):
        color = ACCENT if i % 2 == 0 else WARN
        draw.rectangle((x - 18, y - 18, x + 18, y + 18), fill=color, outline=FG, width=2)
        draw.text((x - 8, y - 12), str(i + 1), font=F["xs"], fill=BG)


def draw_terminal_log(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], article: Article) -> None:
    x1, y1, x2, y2 = box
    rect(draw, box, FG, FG, 2)
    draw.text((x1 + 24, y1 + 22), "$ utildesk inspect --ratgeber", font=F["sm_b"], fill=ACCENT)
    rows = [
        ("topic", article.title[:42]),
        ("format", article.category or "guide"),
        ("assets", "terminal-png / no-svg"),
        ("status", "reviewable final view"),
    ]
    y = y1 + 82
    for key, value in rows:
        draw.text((x1 + 26, y), f"{key:<8}", font=F["sm"], fill=FG_3)
        draw_text_block(draw, (x1 + 160, y), str(value), F["sm"], x2 - x1 - 190, BG, line_gap=0, max_lines=1)
        y += 40


def render_cover(article: Article, output: Path) -> None:
    img, draw = canvas()
    label(draw, (64, 58), "[ utildesk.ratgeber / terminal_illustration ]")
    draw.text((64, 116), cover_heading(article), font=F["xl"], fill=FG)
    draw.line((64, 216, 640, 216), fill=ACCENT, width=6)
    draw_text_block(draw, (64, 250), article.title, F["lg"], 680, FG, line_gap=12, max_lines=4)
    draw_text_block(draw, (64, 518), article.excerpt, F["sm"], 660, FG_2, line_gap=12, max_lines=4)

    x = 64
    for index, term in enumerate(article_terms(article)[:4]):
        x = chip(draw, x, 744, term, active=index == 0)
    if article.read_time:
        chip(draw, 64, 814, f"{article.read_time} min", active=False)

    draw_signal_plot(draw, (810, 110, 1510, 612), article_terms(article))
    draw_terminal_log(draw, (810, 658, 1510, 884), article)
    label(draw, (64, 910), "UTILDESK // terminal editorial image system")
    label(draw, (1114, 910), "PNG / grid / mono / no generic cards")
    output.parent.mkdir(parents=True, exist_ok=True)
    img.save(output, "PNG", optimize=True)


def workflow_steps(article: Article) -> list[tuple[str, str]]:
    title = article.title.lower()
    if "chatgpt" in title:
        return [
            ("input", "Aufgabe"),
            ("model", "Assistent"),
            ("check", "Stärken"),
            ("risk", "Datenschutz"),
            ("choice", "Auswahl"),
        ]
    if "website" in title:
        return [
            ("traffic", "KI-Bots"),
            ("rules", "Kontrolle"),
            ("format", "Markdown"),
            ("schema", "JSON-LD"),
            ("ping", "IndexNow"),
        ]
    if "orchestrierung" in title:
        return [
            ("scope", "Plan"),
            ("agents", "Agenten"),
            ("context", "Kontext"),
            ("review", "Gate"),
            ("ship", "Release"),
        ]
    return [
        ("context", "Ausrichtung"),
        ("run", "Agentenlauf"),
        ("proof", "Checks"),
        ("review", "Freigabe"),
        ("ship", "Publikation"),
    ]


def render_workflow(article: Article, output: Path) -> None:
    img, draw = canvas()
    label(draw, (64, 58), "[ workflow.trace ]")
    draw.text((64, 116), "FROM SIGNAL TO PUBLISH", font=F["xl"], fill=FG)
    draw_text_block(draw, (64, 206), article.title, F["md"], 920, FG_2, line_gap=10, max_lines=2)

    steps = workflow_steps(article)
    left, top, card_w, card_h, gap = 82, 342, 250, 292, 42
    mid_y = top + card_h // 2
    draw.line((left + 40, mid_y, left + 4 * (card_w + gap) + card_w - 40, mid_y), fill=LINE_2, width=5)
    for i, (key, title) in enumerate(steps):
        x = left + i * (card_w + gap)
        box = (x, top, x + card_w, top + card_h)
        rect(draw, box, BG_2 if i % 2 else BG, LINE, 2)
        badge_fill = ACCENT if i in {0, 3, 4} else WARN
        draw.rectangle((x + 26, top + 28, x + 86, top + 88), fill=badge_fill, outline=FG, width=2)
        draw.text((x + 40, top + 42), f"{i+1}", font=F["sm_b"], fill=BG)
        draw.text((x + 26, top + 124), title, font=F["md_b"], fill=FG)
        draw.text((x + 26, top + 174), key.upper(), font=F["sm"], fill=FG_3)
        draw.line((x + 26, top + 220, x + card_w - 26, top + 220), fill=LINE, width=2)
        draw.text((x + 26, top + 242), "ok", font=F["sm_b"], fill=ACCENT_D)
        if i < len(steps) - 1:
            ax = x + card_w + 10
            draw.text((ax, mid_y - 20), "->", font=F["md_b"], fill=ACCENT_D)

    rect(draw, (82, 712, 1518, 856), BG_2, LINE, 2)
    label(draw, (110, 738), "[ guardrails ]")
    guardrails = ["Quellen", "Dedup", "Finalansicht", "PNG", "IndexNow"]
    x = 110
    for i, item in enumerate(guardrails):
        x = chip(draw, x, 786, item, active=i == 2)

    for x in range(120, 1510, 72):
        draw.line((x, 898, x + 38, 898), fill=LINE_2, width=2)
    label(draw, (64, 910), "UTILDESK // visual review asset")
    label(draw, (1088, 910), "article-safe / no-svg / terminal system")
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
    parser = argparse.ArgumentParser(description="Render Utildesk terminal-style PNG illustrations for Ratgeber articles.")
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

#!/usr/bin/env python3
from __future__ import annotations

import argparse
import math
import re
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT_DIR = Path(__file__).resolve().parent.parent
RATGEBER_DIR = ROOT_DIR / "content" / "ratgeber"
IMAGE_DIR = ROOT_DIR / "content" / "images" / "ratgeber"
SIZE = (1600, 980)

PAPER = "#f5f3ea"
PAPER_2 = "#ebe9df"
PAPER_3 = "#e2e0d4"
GRID_A = "#e9e5d8"
GRID_B = "#e6e2d4"
LINE = "#c8c5b3"
LINE_D = "#9d9985"
INK = "#17231e"
INK_2 = "#384740"
MUTED = "#78796e"
GREEN = "#4f7f28"
GREEN_D = "#245b3f"
MINT = "#b8ded0"
MINT_2 = "#d8eee5"
BLUE = "#91cfe4"
BLUE_2 = "#d9f0f6"
BLUE_D = "#2f6f83"
SUN = "#f3ce73"
SUN_2 = "#fff0bb"
ORANGE = "#e49442"
CORAL = "#ef8d62"
WHITE = "#fffdf5"


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
    "tiny": load_font(15, True),
    "xxs": load_font(18),
    "xxs_b": load_font(18, True),
    "xs": load_font(22),
    "xs_b": load_font(22, True),
    "sm": load_font(26),
    "sm_b": load_font(26, True),
    "md": load_font(32),
    "md_b": load_font(32, True),
    "lg": load_font(42, True),
    "xl": load_font(58, True),
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
        "models": ["ChatGPT", "Claude", "Gemini", "Privacy"],
        "crawl": ["Crawler", "Agenten", "IndexNow", "Guardrails"],
        "orchestration": ["NotebookLM", "Agenten", "Review", "Kontext"],
        "developer": ["IDE", "CLI", "Tests", "Release"],
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
    return result[:4] or ["Signal", "Review", "Quelle", "Index"]


def text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1]


def wrap_by_pixels(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = re.sub(r"\s+", " ", text or "").strip().split()
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


def short(value: str, limit: int) -> str:
    value = re.sub(r"\s+", " ", value or "").strip()
    if len(value) <= limit:
        return value
    return value[: limit - 3].rstrip(" .,:;") + "..."


class Art:
    def __init__(self) -> None:
        self.img = Image.new("RGBA", SIZE, PAPER)
        self.draw = ImageDraw.Draw(self.img)
        self.background_wash()
        self.grid()

    def background_wash(self) -> None:
        layer, d = self.overlay()
        d.ellipse((-120, -90, 420, 360), fill=(217, 240, 246, 92))
        d.ellipse((1180, -120, 1780, 420), fill=(255, 240, 187, 84))
        d.ellipse((1120, 640, 1680, 1120), fill=(216, 238, 229, 84))
        d.rounded_rectangle((120, 700, 620, 1040), radius=80, fill=(255, 240, 187, 54))
        self.composite(layer)

    def grid(self) -> None:
        for x in range(0, SIZE[0], 24):
            self.draw.line((x, 0, x, SIZE[1]), fill=GRID_B, width=1)
        for y in range(0, SIZE[1], 24):
            self.draw.line((0, y, SIZE[0], y), fill=GRID_A, width=1)
        self.draw.rectangle((0, 0, SIZE[0] - 1, SIZE[1] - 1), outline=LINE, width=2)

    def overlay(self) -> tuple[Image.Image, ImageDraw.ImageDraw]:
        layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        return layer, ImageDraw.Draw(layer)

    def composite(self, layer: Image.Image) -> None:
        self.img.alpha_composite(layer)
        self.draw = ImageDraw.Draw(self.img)

    def shadow_round(self, box: tuple[int, int, int, int], radius: int = 28, offset: tuple[int, int] = (14, 18)) -> None:
        layer, d = self.overlay()
        x1, y1, x2, y2 = box
        d.rounded_rectangle((x1 + offset[0], y1 + offset[1], x2 + offset[0], y2 + offset[1]), radius=radius, fill=(36, 32, 22, 28))
        self.composite(layer)

    def glow(self, box: tuple[int, int, int, int], color: tuple[int, int, int, int] = (145, 207, 228, 62), radius: int = 40) -> None:
        layer, d = self.overlay()
        x1, y1, x2, y2 = box
        for step in range(5, 0, -1):
            expand = radius * step // 5
            alpha = color[3] // (6 - step)
            d.rounded_rectangle((x1 - expand, y1 - expand, x2 + expand, y2 + expand), radius=radius + expand, fill=(*color[:3], alpha))
        self.composite(layer)

    def round_rect(self, box: tuple[int, int, int, int], fill: str = WHITE, outline: str = LINE, radius: int = 24, width: int = 2, shadow: bool = False) -> None:
        if shadow:
            self.shadow_round(box, radius=radius)
        self.draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

    def ellipse(self, box: tuple[int, int, int, int], fill: str, outline: str = LINE, width: int = 2, shadow: bool = False) -> None:
        if shadow:
            self.shadow_round(box, radius=(box[2] - box[0]) // 2, offset=(10, 14))
        self.draw.ellipse(box, fill=fill, outline=outline, width=width)

    def text(self, xy: tuple[int, int], text: str, font: ImageFont.ImageFont, fill: str = INK, anchor: str | None = None) -> None:
        self.draw.text(xy, text, font=font, fill=fill, anchor=anchor)

    def line(self, points: list[tuple[int, int]] | tuple[int, int, int, int], fill: str = BLUE_D, width: int = 4) -> None:
        self.draw.line(points, fill=fill, width=width, joint="curve")

    def curve_points(self, points: list[tuple[int, int]], steps: int = 36) -> list[tuple[int, int]]:
        if len(points) == 3:
            p0, p1, p2 = points
            result = []
            for i in range(steps + 1):
                t = i / steps
                x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t**2 * p2[0]
                y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t**2 * p2[1]
                result.append((int(x), int(y)))
            return result
        if len(points) == 4:
            p0, p1, p2, p3 = points
            result = []
            for i in range(steps + 1):
                t = i / steps
                x = (1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t**2 * p2[0] + t**3 * p3[0]
                y = (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t**2 * p2[1] + t**3 * p3[1]
                result.append((int(x), int(y)))
            return result
        return points

    def flow(self, points: list[tuple[int, int]], fill: str = BLUE_D, width: int = 4, dots: bool = True, arrow: bool = True) -> None:
        curve = self.curve_points(points)
        self.line(curve, fill=fill, width=width)
        if dots:
            for x, y in points[1:-1]:
                self.ellipse((x - 8, y - 8, x + 8, y + 8), fill=PAPER, outline=fill, width=3)
        if not arrow:
            return
        x1, y1 = curve[-6]
        x2, y2 = curve[-1]
        angle = math.atan2(y2 - y1, x2 - x1)
        head = [
            (x2, y2),
            (int(x2 - 18 * math.cos(angle - 0.45)), int(y2 - 18 * math.sin(angle - 0.45))),
            (int(x2 - 18 * math.cos(angle + 0.45)), int(y2 - 18 * math.sin(angle + 0.45))),
        ]
        self.draw.polygon(head, fill=fill)

    def dots(self, x: int, y: int, cols: int, rows: int, fill: str = SUN, step: int = 18, r: int = 3) -> None:
        for row in range(rows):
            for col in range(cols):
                self.draw.ellipse((x + col * step, y + row * step, x + col * step + r, y + row * step + r), fill=fill)

    def chip(self, x: int, y: int, text: str, active: bool = False) -> int:
        font = F["xs_b"]
        w, h = text_size(self.draw, text, font)
        box = (x, y, x + w + 30, y + h + 20)
        self.round_rect(box, fill=GREEN if active else PAPER, outline=GREEN if active else LINE_D, radius=4, width=2)
        self.text((x + 15, y + 8), text, font, PAPER if active else GREEN_D)
        return box[2] + 12

    def header(self, article: Article, label: str) -> None:
        self.text((66, 62), "[ utildesk.ratgeber ]", F["xs_b"], MUTED)
        self.text((66, 106), label, F["lg"], GREEN_D)
        x = 66
        for index, term in enumerate(article_terms(article)):
            x = self.chip(x, 836, term, active=index == 0)
        if article.read_time:
            self.chip(66, 894, f"{article.read_time} min")

    def small_label(self, box: tuple[int, int, int, int], title: str, sub: str = "", accent: str = GREEN_D) -> None:
        x1, y1, x2, y2 = box
        self.round_rect(box, fill=WHITE, outline=LINE, radius=16, width=2, shadow=True)
        self.text((x1 + 22, y1 + 20), title, F["xs_b"], accent)
        if sub:
            self.text((x1 + 22, y2 - 38), sub, F["xxs"], MUTED)

    def browser_window(self, box: tuple[int, int, int, int], title: str = "", fill: str = BLUE_2) -> None:
        x1, y1, x2, y2 = box
        self.round_rect(box, fill=WHITE, outline=BLUE_D, radius=20, width=3, shadow=True)
        self.draw.rounded_rectangle((x1, y1, x2, y1 + 54), radius=20, fill=fill, outline=BLUE_D, width=3)
        for i, color in enumerate([CORAL, SUN, GREEN]):
            self.ellipse((x1 + 22 + i * 26, y1 + 18, x1 + 36 + i * 26, y1 + 32), fill=color, outline=BLUE_D, width=1)
        if title:
            self.round_rect((x1 + 118, y1 + 17, x2 - 28, y1 + 36), fill=WHITE, outline=BLUE_D, radius=9, width=1)
            self.text((x1 + 134, y1 + 16), title, F["tiny"], MUTED)

    def mini_card(self, box: tuple[int, int, int, int], color: str = MINT_2, icon: str = "dots") -> None:
        x1, y1, x2, y2 = box
        self.round_rect(box, fill=color, outline=LINE, radius=12, width=2)
        if icon == "image":
            self.draw.polygon([(x1 + 22, y2 - 24), (x1 + 54, y1 + 34), (x1 + 82, y2 - 24)], fill=BLUE, outline=BLUE_D)
            self.ellipse((x2 - 38, y1 + 20, x2 - 22, y1 + 36), fill=SUN, outline=BLUE_D, width=1)
        elif icon == "gear":
            self.gear((x1 + 48, y1 + 44), 22, BLUE_D, fill=PAPER)
        else:
            for y in range(y1 + 24, y2 - 18, 18):
                self.line([(x1 + 22, y), (x2 - 22, y)], fill=BLUE_D, width=2)

    def database(self, cx: int, cy: int, w: int = 210, h: int = 180, fill: str = BLUE_2) -> None:
        x1, x2 = cx - w // 2, cx + w // 2
        y1, y2 = cy - h // 2, cy + h // 2
        self.glow((x1, y1, x2, y2), color=(145, 207, 228, 52), radius=36)
        self.draw.rounded_rectangle((x1, y1 + 28, x2, y2 - 20), radius=20, fill=fill, outline=BLUE_D, width=3)
        self.draw.ellipse((x1, y1, x2, y1 + 58), fill=BLUE_2, outline=BLUE_D, width=3)
        self.draw.ellipse((x1, y2 - 50, x2, y2 + 8), fill=fill, outline=BLUE_D, width=3)
        self.draw.arc((x1, y1 + 54, x2, y1 + 112), 0, 180, fill=BLUE_D, width=2)
        for x in range(x1 + 52, x2 - 30, 34):
            self.line([(x, y1 + 92), (x, y2 - 28)], fill=ORANGE if x % 2 else GREEN, width=3)
            self.ellipse((x - 5, y1 + 84, x + 5, y1 + 94), fill=PAPER, outline=BLUE_D, width=2)

    def robot(self, cx: int, cy: int, scale: float = 1.0, accent: str = SUN, happy: bool = True) -> None:
        w = int(150 * scale)
        h = int(130 * scale)
        head = (cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2)
        self.glow(head, color=(145, 207, 228, 46), radius=int(36 * scale))
        self.round_rect(head, fill=BLUE_2, outline=BLUE_D, radius=int(34 * scale), width=max(2, int(3 * scale)), shadow=True)
        face = (cx - int(52 * scale), cy - int(24 * scale), cx + int(52 * scale), cy + int(30 * scale))
        self.round_rect(face, fill=INK_2, outline=BLUE_D, radius=int(22 * scale), width=2)
        eye_y = cy - int(2 * scale)
        self.ellipse((cx - int(34 * scale), eye_y - 5, cx - int(22 * scale), eye_y + 7), fill=MINT, outline=MINT, width=1)
        self.ellipse((cx + int(22 * scale), eye_y - 5, cx + int(34 * scale), eye_y + 7), fill=MINT, outline=MINT, width=1)
        if happy:
            self.draw.arc((cx - int(22 * scale), cy + int(2 * scale), cx + int(22 * scale), cy + int(24 * scale)), 8, 172, fill=MINT, width=max(2, int(3 * scale)))
        self.ellipse((cx - int(76 * scale), cy - int(8 * scale), cx - int(56 * scale), cy + int(28 * scale)), fill=accent, outline=BLUE_D, width=2)
        self.ellipse((cx + int(56 * scale), cy - int(8 * scale), cx + int(76 * scale), cy + int(28 * scale)), fill=accent, outline=BLUE_D, width=2)
        self.line([(cx, cy - h // 2), (cx, cy - h // 2 - int(26 * scale))], fill=BLUE_D, width=3)
        self.ellipse((cx - int(10 * scale), cy - h // 2 - int(42 * scale), cx + int(10 * scale), cy - h // 2 - int(22 * scale)), fill=accent, outline=BLUE_D, width=2)

    def gear(self, center: tuple[int, int], r: int, outline: str = BLUE_D, fill: str = WHITE) -> None:
        cx, cy = center
        for i in range(8):
            angle = math.tau * i / 8
            x = cx + int(math.cos(angle) * (r + 7))
            y = cy + int(math.sin(angle) * (r + 7))
            self.round_rect((x - 5, y - 5, x + 5, y + 5), fill=outline, outline=outline, radius=2, width=1)
        self.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill, outline=outline, width=3)
        self.ellipse((cx - r // 3, cy - r // 3, cx + r // 3, cy + r // 3), fill=PAPER, outline=outline, width=2)

    def star(self, cx: int, cy: int, r: int = 28, fill: str = SUN) -> None:
        pts = []
        for i in range(10):
            radius = r if i % 2 == 0 else r // 2
            angle = -math.pi / 2 + i * math.pi / 5
            pts.append((cx + int(math.cos(angle) * radius), cy + int(math.sin(angle) * radius)))
        self.draw.polygon(pts, fill=fill, outline=ORANGE)

    def book(self, box: tuple[int, int, int, int], color: str = BLUE_2, badge: str = "") -> None:
        x1, y1, x2, y2 = box
        self.round_rect(box, fill=WHITE, outline=BLUE_D, radius=18, width=3, shadow=True)
        mid = (x1 + x2) // 2
        self.draw.pieslice((x1 - 18, y1, mid + 18, y2), 270, 90, fill=color, outline=BLUE_D, width=3)
        self.draw.pieslice((mid - 18, y1, x2 + 18, y2), 90, 270, fill=color, outline=BLUE_D, width=3)
        self.line([(mid, y1 + 12), (mid, y2 - 12)], fill=BLUE_D, width=3)
        for y in range(y1 + 38, y2 - 20, 28):
            self.line([(x1 + 36, y), (mid - 24, y)], fill=BLUE, width=2)
            self.line([(mid + 24, y), (x2 - 36, y)], fill=BLUE, width=2)
        if badge:
            self.round_rect((x1 + 24, y1 + 24, x1 + 84, y1 + 68), fill=SUN_2, outline=ORANGE, radius=8, width=2)
            self.text((x1 + 38, y1 + 33), badge, F["tiny"], GREEN_D)

    def dashboard(self, box: tuple[int, int, int, int]) -> None:
        x1, y1, x2, y2 = box
        self.browser_window(box, "monitor")
        self.mini_card((x1 + 40, y1 + 86, x1 + 250, y1 + 226), BLUE_2)
        self.mini_card((x1 + 274, y1 + 86, x2 - 40, y1 + 226), MINT_2, "image")
        for i, h in enumerate([50, 84, 118, 76, 142]):
            bx = x1 + 62 + i * 34
            self.draw.rounded_rectangle((bx, y2 - 52 - h, bx + 18, y2 - 52), radius=5, fill=[BLUE, SUN, GREEN, BLUE, ORANGE][i], outline=BLUE_D, width=1)
        self.draw.arc((x2 - 188, y2 - 190, x2 - 70, y2 - 72), 30, 330, fill=BLUE_D, width=8)
        self.draw.pieslice((x2 - 188, y2 - 190, x2 - 70, y2 - 72), 300, 30, fill=ORANGE)

    def floating_code(self, box: tuple[int, int, int, int], accent: str = BLUE) -> None:
        x1, y1, x2, y2 = box
        self.round_rect(box, fill=WHITE, outline=BLUE_D, radius=18, width=2, shadow=True)
        for i, y in enumerate(range(y1 + 28, y2 - 24, 20)):
            color = [accent, SUN, MINT, ORANGE][i % 4]
            self.line([(x1 + 22, y), (x1 + 72 + (i % 3) * 32, y)], fill=color, width=4)
            self.line([(x1 + 92, y), (x2 - 24, y)], fill=BLUE_D if i % 2 else LINE_D, width=2)


def draw_models_cover(a: Art, article: Article) -> None:
    a.header(article, "ASSISTANT STUDIO")
    a.dots(100, 190, 8, 8, fill=SUN, step=18, r=4)
    a.browser_window((184, 160, 610, 430), "prompt")
    a.browser_window((206, 482, 632, 752), "research")
    for x, y, color in [(236, 248, BLUE_2), (382, 248, MINT_2), (504, 248, SUN_2), (260, 570, MINT_2), (424, 570, BLUE_2)]:
        a.mini_card((x, y, x + 104, y + 82), color, "image" if x % 2 else "gear")
    a.database(820, 460, 230, 210)
    a.robot(1160, 378, 0.95, accent=SUN)
    a.dashboard((1112, 570, 1510, 820))
    a.flow([(616, 292), (710, 330), (760, 408), (708, 508)], fill=BLUE_D, width=4)
    a.flow([(632, 606), (720, 592), (770, 510)], fill=ORANGE, width=4)
    a.flow([(932, 420), (1028, 340), (1084, 354)], fill=GREEN_D, width=4)
    a.flow([(940, 520), (1044, 634), (1112, 664)], fill=ORANGE, width=4)
    for x, y in [(1060, 210), (1308, 250), (1450, 474), (986, 724)]:
        a.star(x, y, 20, fill=SUN)
    a.text((214, 116), "model inputs", F["xs_b"], MUTED)
    a.text((742, 316), "routing core", F["xs_b"], GREEN_D)
    a.text((1206, 514), "answer quality", F["xs_b"], MUTED)


def draw_crawl_cover(a: Art, article: Article) -> None:
    a.header(article, "CRAWL CONTROL")
    a.dots(86, 690, 10, 5, fill=SUN, step=18, r=4)
    for idx, (x, y) in enumerate([(96, 178), (116, 430), (176, 620)]):
        a.browser_window((x, y, x + 350, y + 190), f"page_{idx+1}")
        a.mini_card((x + 36, y + 76, x + 138, y + 150), BLUE_2, "image")
        for line_y in range(y + 82, y + 146, 24):
            a.line([(x + 166, line_y), (x + 300, line_y)], fill=BLUE_D, width=2)
    a.database(776, 470, 240, 250, fill=BLUE_2)
    a.robot(1178, 292, 0.86, accent=SUN)
    a.dashboard((1100, 520, 1510, 806))
    for start, mid in [((446, 268), (560, 280)), ((466, 520), (592, 488)), ((526, 708), (614, 580))]:
        a.flow([start, mid, (670, 474)], fill=BLUE_D, width=4)
    a.flow([(880, 420), (1008, 332), (1102, 300)], fill=SUN, width=4)
    a.flow([(888, 526), (1012, 616), (1100, 642)], fill=ORANGE, width=4)
    for x, y, label in [(1008, 190, "allow"), (1266, 202, "limit"), (1448, 388, "block")]:
        a.round_rect((x, y, x + 118, y + 48), fill=WHITE, outline=GREEN_D, radius=22, width=2, shadow=True)
        a.text((x + 18, y + 13), label, F["tiny"], GREEN_D)
    a.gear((1008, 728), 34, GREEN_D, fill=MINT_2)
    a.gear((1458, 478), 28, BLUE_D, fill=BLUE_2)


def draw_orchestration_cover(a: Art, article: Article) -> None:
    a.header(article, "ORCHESTRATION LAB")
    a.dots(84, 182, 9, 8, fill=SUN, step=18, r=4)
    a.book((110, 210, 404, 420), BLUE_2, "N")
    a.book((190, 448, 484, 660), SUN_2, "LM")
    a.robot(800, 420, 1.08, accent=SUN)
    a.round_rect((640, 612, 960, 732), fill=WHITE, outline=GREEN_D, radius=60, width=3, shadow=True)
    a.text((706, 648), "review gate", F["sm_b"], GREEN_D)
    for i, (x, y, title, color) in enumerate(
        [
            (1060, 180, "Plan", BLUE_2),
            (1250, 270, "Agent", MINT_2),
            (1080, 560, "Test", SUN_2),
            (1326, 626, "Publish", BLUE_2),
        ]
    ):
        a.small_label((x, y, x + 180, y + 104), title, f"step {i+1:02d}", accent=GREEN_D if i != 2 else ORANGE)
        a.gear((x + 138, y + 44), 20, BLUE_D, fill=color)
    a.flow([(410, 300), (536, 276), (650, 350)], fill=BLUE_D, width=5)
    a.flow([(488, 540), (582, 548), (682, 492)], fill=ORANGE, width=5)
    a.flow([(908, 370), (1014, 252), (1060, 230)], fill=GREEN_D, width=5)
    a.flow([(930, 442), (1120, 420), (1250, 324)], fill=BLUE_D, width=5)
    a.flow([(900, 498), (1008, 586), (1080, 610)], fill=ORANGE, width=5)
    a.flow([(946, 650), (1170, 704), (1326, 682)], fill=GREEN_D, width=5)
    for x, y in [(568, 186), (1012, 474), (1418, 184), (1214, 776)]:
        a.star(x, y, 22, fill=SUN)


def draw_developer_cover(a: Art, article: Article) -> None:
    a.header(article, "AGENT WORKBENCH")
    a.round_rect((90, 694, 1510, 820), fill=PAPER_2, outline=LINE_D, radius=26, width=2, shadow=True)
    a.browser_window((154, 252, 644, 646), "workspace")
    for y, color in [(340, GREEN), (386, BLUE_D), (432, ORANGE), (478, GREEN), (524, BLUE_D)]:
        a.line([(206, y), (540, y)], fill=color, width=5)
        a.line([(226, y + 20), (448, y + 20)], fill=LINE_D, width=2)
    a.round_rect((742, 236, 1068, 594), fill=BLUE_2, outline=BLUE_D, radius=120, width=4, shadow=True)
    a.round_rect((802, 294, 1008, 454), fill=WHITE, outline=BLUE_D, radius=36, width=3)
    a.robot(904, 360, 0.76, accent=SUN)
    a.line([(906, 594), (906, 696)], fill=BLUE_D, width=12)
    a.ellipse((846, 666, 966, 760), fill=SUN_2, outline=ORANGE, width=3)
    a.dashboard((1136, 298, 1512, 612))
    for i, (x, y) in enumerate([(676, 158), (834, 110), (1006, 154), (1118, 204)]):
        a.floating_code((x, y, x + 154, y + 94), accent=[BLUE, GREEN, SUN, ORANGE][i])
    a.flow([(644, 370), (714, 312), (790, 318)], fill=BLUE_D, width=4)
    a.flow([(1018, 360), (1104, 346), (1136, 370)], fill=ORANGE, width=4)
    a.flow([(960, 186), (1088, 172), (1188, 246)], fill=GREEN_D, width=4)
    for x, y in [(720, 688), (1044, 682), (1406, 236), (1188, 730), (536, 196)]:
        a.star(x, y, 24, fill=SUN)
    a.gear((124, 210), 28, GREEN_D, fill=MINT_2)
    a.gear((1404, 684), 30, BLUE_D, fill=BLUE_2)


def draw_generic_cover(a: Art, article: Article) -> None:
    draw_orchestration_cover(a, article)


def draw_models_workflow(a: Art, article: Article) -> None:
    a.header(article, "MODEL ROUTING")
    a.robot(252, 330, 0.86, accent=SUN)
    a.robot(252, 598, 0.86, accent=ORANGE)
    a.robot(252, 742, 0.7, accent=MINT)
    a.database(706, 520, 260, 230)
    a.round_rect((1010, 224, 1450, 748), fill=WHITE, outline=BLUE_D, radius=28, width=3, shadow=True)
    a.text((1054, 270), "final answer board", F["sm_b"], GREEN_D)
    for i, (name, color) in enumerate([("write", BLUE), ("research", SUN), ("code", GREEN), ("privacy", ORANGE)]):
        y = 342 + i * 78
        a.text((1054, y), name, F["xs_b"], INK_2)
        a.line([(1190, y + 12), (1370, y + 12)], fill=LINE_D, width=4)
        a.line([(1190, y + 12), (1260 + i * 26, y + 12)], fill=color, width=10)
    a.flow([(342, 330), (494, 348), (590, 456)], fill=BLUE_D, width=5)
    a.flow([(342, 598), (494, 594), (590, 548)], fill=ORANGE, width=5)
    a.flow([(800, 492), (926, 380), (1010, 356)], fill=GREEN_D, width=5)
    a.flow([(810, 560), (930, 650), (1010, 626)], fill=BLUE_D, width=5)
    a.star(886, 236, 28)
    a.star(1438, 176, 22)


def draw_crawl_workflow(a: Art, article: Article) -> None:
    a.header(article, "CONTROLLED CRAWL")
    a.browser_window((106, 222, 494, 468), "site")
    a.database(760, 462, 220, 220, fill=BLUE_2)
    a.robot(1060, 320, 0.86, accent=SUN)
    a.dashboard((1060, 518, 1486, 782))
    a.round_rect((572, 644, 928, 752), fill=WHITE, outline=GREEN_D, radius=22, width=3, shadow=True)
    a.text((616, 674), "robots + indexnow", F["sm_b"], GREEN_D)
    for i, y in enumerate([260, 342, 424]):
        a.round_rect((142, y + 248, 416, y + 298), fill=[BLUE_2, MINT_2, SUN_2][i], outline=LINE, radius=16, width=2)
    a.flow([(494, 338), (600, 360), (650, 432)], fill=BLUE_D, width=5)
    a.flow([(852, 424), (954, 338), (1000, 324)], fill=GREEN_D, width=5)
    a.flow([(856, 520), (976, 610), (1060, 644)], fill=ORANGE, width=5)
    a.flow([(760, 572), (750, 632), (750, 644)], fill=GREEN_D, width=5)
    for x, y, txt in [(232, 766, "allow"), (412, 766, "limit"), (1016, 766, "submit")]:
        a.round_rect((x, y, x + 132, y + 48), fill=WHITE, outline=GREEN_D, radius=22, width=2)
        a.text((x + 22, y + 13), txt, F["tiny"], GREEN_D)


def draw_orchestration_workflow(a: Art, article: Article) -> None:
    a.header(article, "SOURCE TO REVIEW")
    steps = [
        (172, 330, "NotebookLM", "sources", BLUE_2),
        (448, 250, "Plan", "scope", SUN_2),
        (742, 360, "Agents", "parallel", MINT_2),
        (1028, 270, "Verify", "tests", BLUE_2),
        (1290, 430, "Publish", "preview", SUN_2),
    ]
    for x, y, title, sub, color in steps:
        a.small_label((x, y, x + 200, y + 120), title, sub, accent=GREEN_D)
        if title == "Agents":
            a.robot(x + 142, y + 68, 0.48, accent=SUN)
        elif title == "NotebookLM":
            a.book((x + 118, y + 24, x + 186, y + 92), color)
        else:
            a.gear((x + 154, y + 54), 20, BLUE_D, fill=color)
    a.flow([(372, 386), (430, 320), (448, 310)], fill=BLUE_D, width=5)
    a.flow([(648, 310), (704, 352), (742, 420)], fill=ORANGE, width=5)
    a.flow([(942, 420), (998, 346), (1028, 330)], fill=GREEN_D, width=5)
    a.flow([(1228, 330), (1282, 386), (1290, 490)], fill=BLUE_D, width=5)
    a.round_rect((292, 644, 1308, 770), fill=PAPER_2, outline=LINE_D, radius=64, width=2, shadow=True)
    for i, label_text in enumerate(["context", "draft", "shards", "tests", "preview"]):
        x = 354 + i * 180
        a.round_rect((x, 684, x + 136, 726), fill=WHITE, outline=LINE, radius=21, width=2)
        a.text((x + 18, 696), label_text, F["tiny"], GREEN_D)
    a.star(558, 548, 22)
    a.star(1186, 596, 26)


def draw_developer_workflow(a: Art, article: Article) -> None:
    a.header(article, "BUILD RUN")
    a.browser_window((126, 250, 600, 610), "ide")
    a.floating_code((668, 160, 876, 300), accent=GREEN)
    a.floating_code((852, 246, 1068, 386), accent=BLUE)
    a.floating_code((728, 460, 948, 600), accent=ORANGE)
    a.round_rect((1120, 268, 1488, 618), fill=WHITE, outline=BLUE_D, radius=30, width=3, shadow=True)
    a.text((1160, 318), "release gate", F["sm_b"], GREEN_D)
    for i, txt in enumerate(["lint", "tests", "preview", "rollback"]):
        y = 386 + i * 44
        a.ellipse((1166, y, 1184, y + 18), fill=GREEN if i < 3 else SUN, outline=BLUE_D, width=1)
        a.text((1204, y - 4), txt, F["xs"], INK_2)
    a.flow([(600, 372), (684, 272), (668, 230)], fill=BLUE_D, width=4)
    a.flow([(604, 420), (760, 392), (852, 316)], fill=ORANGE, width=4)
    a.flow([(946, 530), (1054, 520), (1120, 452)], fill=GREEN_D, width=5)
    a.robot(390, 700, 0.62, accent=SUN)
    a.star(640, 692, 24)
    a.star(996, 180, 20)
    a.gear((1390, 706), 34, GREEN_D, fill=MINT_2)


def render_cover(article: Article, output: Path) -> None:
    art = Art()
    {
        "models": draw_models_cover,
        "crawl": draw_crawl_cover,
        "orchestration": draw_orchestration_cover,
        "developer": draw_developer_cover,
    }.get(kind(article), draw_generic_cover)(art, article)
    output.parent.mkdir(parents=True, exist_ok=True)
    art.img.convert("RGB").save(output, "PNG", optimize=True)


def render_workflow(article: Article, output: Path) -> None:
    art = Art()
    {
        "models": draw_models_workflow,
        "crawl": draw_crawl_workflow,
        "orchestration": draw_orchestration_workflow,
        "developer": draw_developer_workflow,
    }.get(kind(article), draw_orchestration_workflow)(art, article)
    output.parent.mkdir(parents=True, exist_ok=True)
    art.img.convert("RGB").save(output, "PNG", optimize=True)


def render_article(path: Path, output_dir: Path) -> tuple[Path, Path]:
    article = parse_frontmatter(path)
    cover = output_dir / f"{article.slug}-cover.png"
    workflow = output_dir / f"{article.slug}-workflow.png"
    render_cover(article, cover)
    render_workflow(article, workflow)
    return cover, workflow


def main() -> int:
    parser = argparse.ArgumentParser(description="Render topic-specific Utildesk editorial PNG illustrations for Ratgeber articles.")
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

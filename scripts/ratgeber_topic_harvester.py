#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parent.parent
ARTICLE_PIPELINE_ROOT = ROOT_DIR / "data" / "article_jobs"
DEFAULT_MANIFEST_PATH = ARTICLE_PIPELINE_ROOT / "latest_run.json"
DEFAULT_POOL_PATH = ARTICLE_PIPELINE_ROOT / "ratgeber_topic_pool.json"
DEFAULT_CANDIDATES_PATH = ROOT_DIR / "data" / "tool_candidates" / "daily_candidates.jsonl"
DISALLOWED_LANGUAGE_RE = re.compile(r"[\u0400-\u04ff\u3400-\u9fff\uf900-\ufaff]")
DISALLOWED_URL_LANGUAGE_RE = re.compile(
    r"(?i)(?:^https?://(?:ru|zh|cn)\.|[/.](?:ru|zh|zh-cn|zh-tw|cn)(?:[/?#]|$)|[?&](?:lang|locale|hl)=(?:ru|zh|zh-cn|zh-tw|cn)(?:&|$))"
)
DISALLOWED_SOURCE_HOST_RE = re.compile(r"(?i)(?:^|\.)(?:ru|cn)$")
DISALLOWED_SOURCE_ORG_RE = re.compile(
    r"(?i)\b("
    r"habr|sber|sberbank|sbertech|platform\s*v|yandex|vk|mail\.ru|rambler|"
    r"rutube|skolkovo|tinkoff|t-bank|mts|kaspersky|russian\s+market|russia-based"
    r")\b"
)

FORBIDDEN_SINGLE_TOOL_FORMATS = {
    "tool_spotlight",
    "tool_review",
    "product_spotlight",
    "product_review",
}

DEFAULT_FEEDS = [
    {"name": "Hacker News", "url": "https://news.ycombinator.com/rss"},
    {"name": "Product Hunt", "url": "https://www.producthunt.com/feed"},
]


@dataclass(frozen=True)
class ClusterDefinition:
    id: str
    topic: str
    format: str
    theme: str
    priority: int
    min_current_support: int
    min_total_sources: int
    min_total_tools: int
    min_observations: int
    keywords: tuple[str, ...]
    tool_keywords: tuple[str, ...]
    angle: str
    why_now: str
    seo_focus: tuple[str, ...]
    editorial_tags: tuple[str, ...]
    related_tool_hints: tuple[str, ...]
    illustration_brief: str


CLUSTERS: tuple[ClusterDefinition, ...] = (
    ClusterDefinition(
        id="agent_observability_runtime",
        topic="AI-Agenten im Betrieb: Welche Tools Kontrolle, Monitoring und Review wirklich leisten",
        format="comparison",
        theme="agents",
        priority=88,
        min_current_support=3,
        min_total_sources=3,
        min_total_tools=3,
        min_observations=1,
        keywords=(
            "agent",
            "agents",
            "monitor",
            "monitoring",
            "observability",
            "eval",
            "grader",
            "review",
            "guardrail",
            "security",
            "runtime",
            "api",
            "browser automation",
            "deploy",
        ),
        tool_keywords=("agent", "monitor", "grader", "browser", "eval", "guardrail", "api"),
        angle=(
            "Vergleichen, wie Teams Agenten nicht nur starten, sondern im Betrieb pruefen, "
            "ueberwachen und wieder einfange koennen."
        ),
        why_now=(
            "Im Signalstrom tauchen gerade viele Agenten-Tools auf, aber der Engpass verschiebt "
            "sich sichtbar von Demo zu Betrieb: Monitoring, API-Pruefung, Browser-Automation und Review-Gates."
        ),
        seo_focus=("ai agent monitoring", "agent observability tools", "ai agent evaluation"),
        editorial_tags=("KI-Agenten", "Monitoring", "Developer Tools", "Vergleich"),
        related_tool_hints=("LangSmith", "Langfuse", "Arize Phoenix", "Helicone", "OpenTelemetry"),
        illustration_brief=(
            "Szenische, magazinartige Illustration statt Blockschema: ein Kontrollraum fuer KI-Agenten "
            "mit menschlicher Review-Station, Warnsignalen und mehreren Tool-Karten. Keine Platzhaltertexte, "
            "keine Debug-Labels, keine nackten Diagramme."
        ),
    ),
    ClusterDefinition(
        id="voice_to_workflow_stack",
        topic="Voice-to-Workflow: Welche Diktier- und Transkriptions-Tools produktiv wirklich helfen",
        format="comparison",
        theme="audio",
        priority=82,
        min_current_support=3,
        min_total_sources=3,
        min_total_tools=3,
        min_observations=1,
        keywords=(
            "voice",
            "audio",
            "dictation",
            "transcription",
            "meeting",
            "speech",
            "notes",
            "recording",
            "whisper",
            "wispr",
        ),
        tool_keywords=("voice", "audio", "dictation", "transcription", "meeting", "speech", "notes"),
        angle=(
            "Nicht nur Diktat vergleichen, sondern den gesamten Weg von Sprache zu brauchbarem "
            "Arbeitskontext bewerten."
        ),
        why_now=(
            "Sprache wird wieder zu einer ernsthaften Eingabeschicht: Diktat, Meeting-Notizen und "
            "Workflow-Automation wachsen zusammen."
        ),
        seo_focus=("dictation apps comparison", "voice to text ai tools", "meeting transcription tools"),
        editorial_tags=("Audio", "Produktivitaet", "Vergleich", "Workflows"),
        related_tool_hints=("Wispr Flow", "Otter.ai", "Whisper", "MacWhisper", "Superwhisper"),
        illustration_brief=(
            "Helle, lebendige Story-Illustration: Person spricht Gedanken ein, daraus entstehen "
            "Dokument, Chat-Antwort und Aufgabenkarte. Keine generischen Diagramme, keine Service-Labels."
        ),
    ),
    ClusterDefinition(
        id="ai_search_visibility",
        topic="AI Search und Agenten-Crawler: Wie Websites 2026 sichtbar und kontrollierbar bleiben",
        format="how_to",
        theme="search",
        priority=84,
        min_current_support=3,
        min_total_sources=3,
        min_total_tools=2,
        min_observations=2,
        keywords=(
            "search",
            "crawler",
            "crawl",
            "index",
            "sitemap",
            "robots",
            "agent-ready",
            "ai mode",
            "schema",
            "structured data",
            "cloudflare",
            "perplexity",
        ),
        tool_keywords=("search", "crawler", "seo", "index", "schema", "cloudflare", "perplexity"),
        angle=(
            "Praktisch erklaeren, welche Signale Website-Betreiber fuer Google, Bing, AI Search "
            "und Agenten getrennt steuern sollten."
        ),
        why_now=(
            "Suchmaschinen, AI-Antwortsysteme und Agenten-Crawler ziehen auseinander; Websites brauchen "
            "deshalb klarere Sitemaps, strukturierte Daten und Bot-Steuerung."
        ),
        seo_focus=("ai search seo", "agent crawler control", "llms.txt sitemap structured data"),
        editorial_tags=("AI Search", "SEO", "Webstrategie", "KI-Agenten"),
        related_tool_hints=("Google Search Console", "Bing Webmaster Tools", "Cloudflare", "Perplexity"),
        illustration_brief=(
            "Editoriale Web-Illustration: Website als Leuchtturm mit getrennten Wegen fuer Google, Bing "
            "und AI-Agenten. Atmosphaerisch und konkret, keine nackte Tabelle und kein Standard-Flowchart."
        ),
    ),
    ClusterDefinition(
        id="browser_automation_agents",
        topic="Browser-Agenten im Praxistest: Wo Automation hilft und wo sie gefaehrlich wird",
        format="workflow_article",
        theme="automation",
        priority=80,
        min_current_support=3,
        min_total_sources=3,
        min_total_tools=3,
        min_observations=1,
        keywords=(
            "browser",
            "automation",
            "web agent",
            "computer use",
            "playwright",
            "scraping",
            "testing",
            "intuned",
            "operator",
        ),
        tool_keywords=("browser", "automation", "web agent", "computer", "testing", "scraping"),
        angle=(
            "Browser-Agenten als neue Automationsschicht einordnen: produktive Use Cases, Grenzen, "
            "Sicherheitsrisiken und Review-Punkte."
        ),
        why_now=(
            "Browser-Automation wird gerade von Skripten zu agentischen Systemen umgebaut; das ist nuetzlich, "
            "aber ohne Grenzen und Freigaben schnell riskant."
        ),
        seo_focus=("browser agents", "ai browser automation", "computer use agents"),
        editorial_tags=("Automatisierung", "KI-Agenten", "Browser", "Workflows"),
        related_tool_hints=("Playwright", "Selenium", "Browserbase", "Intuned", "OpenAI Operator"),
        illustration_brief=(
            "Szenische Illustration: ein Agent navigiert durch mehrere Browserfenster, ein Mensch prueft "
            "Freigaben an einer Konsole. Dynamisch, aber ohne Debug-Schrift und ohne leere Diagrammkaesten."
        ),
    ),
    ClusterDefinition(
        id="ai_launch_distribution",
        topic="AI-Launch und Distribution: Welche Tool-Schicht Makers nach dem Build wirklich brauchen",
        format="trend_piece",
        theme="tools",
        priority=78,
        min_current_support=3,
        min_total_sources=3,
        min_total_tools=3,
        min_observations=4,
        keywords=(
            "launch",
            "distribution",
            "product hunt",
            "growth",
            "marketing",
            "submit",
            "directory",
            "backlink",
            "visibility",
            "maker",
        ),
        tool_keywords=("launch", "growth", "marketing", "submit", "directory", "seo", "product hunt"),
        angle=(
            "Zeigen, welche Distributionstools nach dem Produktbau wirklich helfen und wo nur Listing-Theater entsteht."
        ),
        why_now=(
            "AI-Makers bauen schneller als sie Reichweite bekommen; deshalb entsteht eine eigene Tool-Schicht "
            "fuer Launches, Listings, Backlinks und Distribution."
        ),
        seo_focus=("ai launch tools", "product launch distribution", "startup launch stack"),
        editorial_tags=("Distribution", "Marketing", "AI-Tools", "Trend"),
        related_tool_hints=("Product Hunt", "Submit.DIY", "Tally", "Notion", "Zapier"),
        illustration_brief=(
            "Magazinartige Szene: ein Maker schiebt ein neues Tool aus der Werkstatt in mehrere Kanaele "
            "mit echten Wegweisern fuer Launch, Community und Suche. Keine abstrakte Tabelle."
        ),
    ),
    ClusterDefinition(
        id="multimodal_agent_stack",
        topic="Multimodale Agenten: Warum Bild, Video und Code jetzt in einem Workflow landen",
        format="explainer",
        theme="agents",
        priority=76,
        min_current_support=3,
        min_total_sources=3,
        min_total_tools=2,
        min_observations=2,
        keywords=(
            "multimodal",
            "vision",
            "image",
            "video",
            "glm",
            "foundation model",
            "agent",
            "code",
            "computer",
        ),
        tool_keywords=("vision", "image", "video", "agent", "code", "multimodal"),
        angle=(
            "Erklaeren, warum multimodale Modelle nicht nur bessere Chatbots sind, sondern neue "
            "Arbeitsablaeufe fuer Recherche, Design, Testing und Coding ermoeglichen."
        ),
        why_now=(
            "Mehrere aktuelle Signale zeigen, dass Modelle Bild, Video und Code zunehmend als gemeinsamen "
            "Kontext behandeln statt als getrennte Features."
        ),
        seo_focus=("multimodal ai agents", "vision language agents", "ai workflow tools"),
        editorial_tags=("Multimodal", "KI-Agenten", "Workflows", "Explainer"),
        related_tool_hints=("ChatGPT", "Claude", "Gemini", "Runway", "Cursor"),
        illustration_brief=(
            "Cinematische, freundliche Illustration: mehrere Arbeitsmaterialien, Screenshot, Video-Frame "
            "und Code liegen auf einem Desk und werden von einem Agenten sortiert. Keine Blockschema-Grafik."
        ),
    ),
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_json(path: Path, fallback: dict[str, Any] | None = None) -> dict[str, Any]:
    if not path.exists():
        return fallback or {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
        return payload if isinstance(payload, dict) else (fallback or {})
    except Exception:
        return fallback or {}


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def slugify(value: str, limit: int = 80) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")
    return re.sub(r"-+", "-", slug)[:limit] or "topic"


def signature_for(topic: str, format_name: str) -> str:
    text = unicodedata.normalize("NFKD", f"{topic} {format_name}".lower())
    text = text.encode("ascii", "ignore").decode("ascii")
    words = re.findall(r"[a-z0-9]{3,}", text)
    stop = {"und", "oder", "the", "for", "mit", "von", "wie", "was", "das", "ein", "eine"}
    return " ".join(word for word in words if word not in stop)[:90]


def job_id_for(run_at: str, topic: str, format_name: str) -> str:
    date = re.sub(r"[^0-9]", "", run_at[:10]) or datetime.now(timezone.utc).strftime("%Y%m%d")
    digest = hashlib.sha1(f"{topic}|{format_name}".encode("utf-8")).hexdigest()[:8]
    return f"{date}-{slugify(topic, 64)}-{format_name}-{digest}"


def clean_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def domain_from_url(url: str) -> str:
    match = re.match(r"https?://([^/]+)/?", url or "")
    return match.group(1).lower() if match else ""


def has_disallowed_language(text: str) -> bool:
    return bool(DISALLOWED_LANGUAGE_RE.search(text or ""))


def has_disallowed_source_url(url: str) -> bool:
    normalized = clean_text(url).lower()
    if not normalized:
        return False
    domain = domain_from_url(normalized)
    suffix = domain.rsplit(".", 1)[-1] if "." in domain else domain
    return bool(DISALLOWED_URL_LANGUAGE_RE.search(normalized) or DISALLOWED_SOURCE_HOST_RE.fullmatch(suffix or ""))


def source_language_allowed(title: str, summary: str, url: str) -> bool:
    # Utildesk is German/English only. Do not let Russian/Chinese source material
    # or Russian corporate PR/claimed "local know-how" into NotebookLM prompts or
    # public review previews, even as background signal.
    text = " ".join(part for part in [title, summary] if part)
    return (
        not has_disallowed_language(text)
        and not has_disallowed_source_url(url)
        and not DISALLOWED_SOURCE_ORG_RE.search(" ".join([text, url or ""]))
    )


def source_dict_allowed(source: dict[str, Any]) -> bool:
    return source_language_allowed(
        clean_text(source.get("title")),
        clean_text(source.get("summary")),
        clean_text(source.get("url")),
    )


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            payload = json.loads(line)
        except Exception:
            continue
        if isinstance(payload, dict):
            rows.append(payload)
    return rows


def signal_from_item(item: dict[str, Any], kind: str) -> dict[str, Any] | None:
    title = clean_text(item.get("title") or item.get("source_item_title") or item.get("tool_name"))
    summary = clean_text(
        item.get("summary")
        or item.get("short_description_en_if_available")
        or item.get("short_description_ru")
        or item.get("notes")
    )
    url = clean_text(item.get("url") or item.get("source_item_url") or item.get("official_url_guess"))
    source_name = clean_text(item.get("source_name") or item.get("name") or domain_from_url(url) or kind)
    tool_name = clean_text(item.get("tool_name") or item.get("source_item_title") if kind == "candidate" else "")
    category = clean_text(item.get("category_guess") or item.get("category"))
    tags = item.get("tags_guess") or item.get("tags") or []
    tags_text = " ".join(clean_text(tag) for tag in tags if clean_text(tag))
    if not title and not summary:
        return None
    if not source_language_allowed(title, summary, url):
        return None
    score = int(item.get("score_candidate") or item.get("score_digest") or item.get("ai_relevance_score") or 10)
    text = " ".join(part for part in [title, summary, category, tags_text, tool_name] if part).lower()
    return {
        "kind": kind,
        "title": title,
        "summary": summary,
        "url": url,
        "source_name": source_name,
        "domain": domain_from_url(url),
        "tool_name": tool_name,
        "category": category,
        "tags": [clean_text(tag) for tag in tags if clean_text(tag)],
        "score": score,
        "text": text,
    }


def signals_from_manifest(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    signals: list[dict[str, Any]] = []
    for key, kind in (("digest_items", "digest"), ("release_items", "release"), ("candidate_tools", "candidate")):
        for item in manifest.get(key) or []:
            if isinstance(item, dict):
                signal = signal_from_item(item, kind)
                if signal:
                    signals.append(signal)
    return signals


def fetch_url(url: str, timeout: int = 15) -> bytes:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "UtildeskRatgeberTopicHarvester/1.0 (+https://tools.utildesk.de/)",
            "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.2",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read(2_000_000)


def text_from_node(node: ET.Element, names: tuple[str, ...]) -> str:
    for name in names:
        child = node.find(name)
        if child is not None and child.text:
            return clean_text(child.text)
    return ""


def parse_feed_items(source_name: str, content: bytes, limit: int = 25) -> list[dict[str, Any]]:
    root = ET.fromstring(content)
    items = root.findall(".//item")
    if not items:
        items = root.findall("{http://www.w3.org/2005/Atom}entry")
    parsed: list[dict[str, Any]] = []
    for item in items[:limit]:
        title = text_from_node(item, ("title", "{http://www.w3.org/2005/Atom}title"))
        summary = text_from_node(
            item,
            ("description", "summary", "{http://www.w3.org/2005/Atom}summary", "{http://www.w3.org/2005/Atom}content"),
        )
        link = text_from_node(item, ("link", "guid"))
        if not link:
            atom_link = item.find("{http://www.w3.org/2005/Atom}link")
            link = clean_text(atom_link.get("href")) if atom_link is not None else ""
        parsed.append(
            {
                "source_name": source_name,
                "title": title,
                "summary": re.sub(r"<[^>]+>", " ", summary),
                "url": link,
            }
        )
    return parsed


def fetch_feed_signals(feeds: list[dict[str, str]], warnings: list[str]) -> list[dict[str, Any]]:
    signals: list[dict[str, Any]] = []
    for feed in feeds:
        name = feed["name"]
        url = feed["url"]
        try:
            items = parse_feed_items(name, fetch_url(url))
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"feed_fetch_failed:{name}:{type(exc).__name__}")
            continue
        for item in items:
            signal = signal_from_item(item, "feed")
            if signal:
                signals.append(signal)
    return signals


def fetch_perplexity_signals(clusters: tuple[ClusterDefinition, ...], warnings: list[str]) -> list[dict[str, Any]]:
    if os.getenv("RATGEBER_USE_PERPLEXITY", "").strip().lower() not in {"1", "true", "yes"}:
        return []
    api_key = os.getenv("PERPLEXITY_API_KEY", "").strip()
    if not api_key:
        warnings.append("perplexity_skipped:missing_PERPLEXITY_API_KEY")
        return []

    signals: list[dict[str, Any]] = []
    model = os.getenv("PERPLEXITY_MODEL", "sonar").strip() or "sonar"
    endpoint = os.getenv("PERPLEXITY_API_URL", "https://api.perplexity.ai/chat/completions").strip()
    for cluster in clusters[:4]:
        prompt = (
            "Find 3 recent, reliable source URLs about this editorial topic. "
            "Return compact bullets with title and URL only. Topic: "
            f"{cluster.topic}"
        )
        payload = json.dumps(
            {
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a careful research scout. Prefer primary sources."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "max_tokens": 600,
            }
        ).encode("utf-8")
        request = urllib.request.Request(
            endpoint,
            data=payload,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"perplexity_failed:{cluster.id}:{type(exc).__name__}")
            continue
        content = clean_text(
            (((data.get("choices") or [{}])[0].get("message") or {}).get("content") if isinstance(data, dict) else "")
        )
        citations = data.get("citations") if isinstance(data, dict) else []
        urls = [url for url in citations if isinstance(url, str) and url.startswith("http")]
        urls.extend(re.findall(r"https?://[^\s)\]]+", content))
        for idx, url in enumerate(dict.fromkeys(urls[:5]), 1):
            signal = signal_from_item(
                {
                    "source_name": "Perplexity",
                    "title": f"{cluster.topic} - Perplexity source {idx}",
                    "summary": content[:500],
                    "url": url.rstrip(".,"),
                },
                "perplexity",
            )
            if signal:
                signal["cluster_hint"] = cluster.id
                signals.append(signal)
        time.sleep(0.3)
    return signals


def has_any(text: str, terms: tuple[str, ...] | list[str]) -> bool:
    return any(term in text for term in terms)


def has_agentish(text: str) -> bool:
    return bool(
        re.search(r"\bagents?\b|\bagentic\b", text)
        or "ии-агент" in text
        or "ии агент" in text
        or "ии-агентов" in text
        or "ии агентов" in text
        or " ai-агент" in text
    )


def cluster_signal_matches(cluster: ClusterDefinition, signal: dict[str, Any]) -> bool:
    text = str(signal.get("text") or "")
    if signal.get("cluster_hint") == cluster.id:
        return True
    if cluster.id == "agent_observability_runtime":
        return (has_agentish(text) or has_any(text, ("llm", "языков"))) and has_any(
            text,
            (
                "monitor",
                "observability",
                "eval",
                "grader",
                "review",
                "guardrail",
                "security",
                "pentest",
                "sandbox",
                "runtime",
                "trace",
                "audit",
                "безопас",
                "провер",
                "тест",
                "лог",
                "контекст",
                "mcp",
            ),
        )
    if cluster.id == "ai_search_visibility":
        return has_any(
            text,
            (
                "ai search",
                "crawler",
                "crawl",
                "indexnow",
                "indexing",
                "sitemap",
                "robots",
                "structured data",
                "schema",
                "agent-ready",
                "google search",
                "bing",
                "cloudflare ai crawl",
                "perplexity",
            ),
        )
    if cluster.id == "browser_automation_agents":
        return (
            has_any(text, ("browser", "браузер", "computer use", "playwright", "selenium", "scraping", "intuned"))
            and (has_agentish(text) or has_any(text, ("automation", "automate", "testing", "task", "автоматиз")))
        ) or (
            has_any(text, ("автоматиз", "workflow", "workflows", "рабочие процессы"))
            and (has_agentish(text) or has_any(text, ("ии", "ai")))
        )
    if cluster.id == "ai_launch_distribution":
        return has_any(
            text,
            (
                "launch",
                "distribution",
                "growth",
                "marketing",
                "submit",
                "directory",
                "backlink",
                "visibility",
                "maker",
                "listing",
            ),
        )
    if cluster.id == "multimodal_agent_stack":
        return has_any(
            text,
            (
                "multimodal",
                "vision",
                "image",
                "video",
                "glm-",
                "foundation model",
                "vlm",
                "screenshot",
            ),
        ) and has_any(text, ("agent", "workflow", "model", "ai"))
    return any(keyword in text for keyword in cluster.keywords)


def current_matches(cluster: ClusterDefinition, signals: list[dict[str, Any]]) -> list[dict[str, Any]]:
    matched: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for signal in signals:
        text = str(signal.get("text") or "")
        if cluster_signal_matches(cluster, signal):
            url = str(signal.get("url") or "")
            signature = url or f"{signal.get('source_name')}:{signal.get('title')}"
            if signature in seen_urls:
                continue
            seen_urls.add(signature)
            matched.append(signal)
    matched.sort(key=lambda item: int(item.get("score") or 0), reverse=True)
    return matched


def infer_tool_names(cluster: ClusterDefinition, matches: list[dict[str, Any]]) -> list[str]:
    names: list[str] = []
    for signal in matches:
        explicit = clean_text(signal.get("tool_name"))
        if explicit:
            names.append(explicit)
            continue
        if signal.get("source_name") == "Product Hunt":
            title = clean_text(signal.get("title"))
            if title:
                names.append(re.split(r"\s+by\s+|:|\||-", title, maxsplit=1)[0].strip())
    for hint in cluster.related_tool_hints:
        names.append(hint)
    result: list[str] = []
    seen: set[str] = set()
    for name in names:
        normalized = re.sub(r"\s+", " ", name).strip()
        key = normalized.lower()
        if len(normalized) < 2 or key in seen:
            continue
        seen.add(key)
        result.append(normalized)
    return result[:10]


def source_object(signal: dict[str, Any]) -> dict[str, str]:
    return {
        "name": clean_text(signal.get("source_name")),
        "title": clean_text(signal.get("title")),
        "url": clean_text(signal.get("url")),
        "summary": clean_text(signal.get("summary"))[:320],
    }


def diversified_sources(sources: list[dict[str, str]], limit: int = 12) -> list[dict[str, str]]:
    by_name: dict[str, list[dict[str, str]]] = {}
    for source in sources:
        name = clean_text(source.get("name")) or "Source"
        by_name.setdefault(name, []).append(source)

    preferred_names = ["Hacker News", "Product Hunt", "Perplexity"]
    selected: list[dict[str, str]] = []
    seen_urls: set[str] = set()

    def add(source: dict[str, str]) -> None:
        url = clean_text(source.get("url"))
        if not url or url in seen_urls or len(selected) >= limit:
            return
        seen_urls.add(url)
        selected.append(source)

    for name in preferred_names:
        for source in by_name.get(name, [])[:2]:
            add(source)
    for name, group in by_name.items():
        if name in preferred_names:
            continue
        for source in group[:1]:
            add(source)
    for source in sources:
        add(source)
    return selected


def blocked_signatures(pipeline_root: Path) -> set[str]:
    blocked: set[str] = set()
    for registry in ("generated_signatures.json", "published_signatures.json"):
        payload = load_json(pipeline_root / registry)
        for entry in payload.get("entries") or []:
            if not isinstance(entry, dict):
                continue
            signature = clean_text(entry.get("signature"))
            topic = clean_text(entry.get("topic"))
            format_name = clean_text(entry.get("format"))
            if signature:
                blocked.add(signature)
            if topic:
                blocked.add(signature_for(topic, format_name))
                blocked.add(slugify(f"{topic} {format_name}"))
    queue_root = pipeline_root / "queue"
    for folder in ("pending", "processing", "done"):
        for path in (queue_root / folder).glob("*.json"):
            payload = load_json(path)
            signature = clean_text(payload.get("signature"))
            topic = clean_text(payload.get("topic"))
            format_name = clean_text(payload.get("format"))
            if signature:
                blocked.add(signature)
            if topic:
                blocked.add(signature_for(topic, format_name))
                blocked.add(slugify(f"{topic} {format_name}"))
    return blocked


def update_pool(
    pool: dict[str, Any],
    clusters: tuple[ClusterDefinition, ...],
    signals: list[dict[str, Any]],
    run_at: str,
) -> dict[str, Any]:
    cluster_pool = pool.setdefault("clusters", {})
    for cluster in clusters:
        matches = current_matches(cluster, signals)
        if len(matches) < cluster.min_current_support:
            continue
        entry = cluster_pool.get(cluster.id) if isinstance(cluster_pool.get(cluster.id), dict) else {}
        entry.setdefault("first_seen", run_at)
        entry["last_seen"] = run_at
        entry["topic"] = cluster.topic
        entry["format"] = cluster.format
        entry["theme"] = cluster.theme
        entry["observations"] = int(entry.get("observations") or 0) + 1
        entry["current_support"] = len(matches)
        entry["current_signal"] = sum(int(item.get("score") or 0) for item in matches)

        existing_sources = [source for source in list(entry.get("sources") or []) if isinstance(source, dict) and source_dict_allowed(source)]
        existing_all_sources = [
            source for source in list(entry.get("all_sources") or []) if isinstance(source, dict) and source_dict_allowed(source)
        ]
        sources = [*existing_all_sources, *existing_sources]
        by_url = {clean_text(source.get("url")): source for source in sources if isinstance(source, dict)}
        for match in matches:
            source = source_object(match)
            if source["url"] and source_dict_allowed(source):
                by_url[source["url"]] = source
        all_sources = [source for source in by_url.values() if source_dict_allowed(source)]
        entry["all_sources"] = all_sources[:80]
        entry["sources"] = diversified_sources(all_sources, limit=12)
        entry["source_names"] = sorted({clean_text(source.get("name")) for source in all_sources if clean_text(source.get("name"))})
        entry["tool_names"] = infer_tool_names(cluster, matches)
        entry["latest_titles"] = [clean_text(item.get("title")) for item in matches[:8] if clean_text(item.get("title"))]
        source_count = len([source for source in all_sources if clean_text(source.get("url"))])
        source_diversity = len(entry["source_names"])
        tool_count = len(entry["tool_names"])
        readiness_score = min(
            100,
            int(entry["observations"]) * 18
            + min(32, source_count * 5)
            + min(20, source_diversity * 6)
            + min(20, tool_count * 4),
        )
        ready = (
            int(entry["observations"]) >= cluster.min_observations
            and source_count >= cluster.min_total_sources
            and source_diversity >= 3
            and tool_count >= cluster.min_total_tools
        )
        entry["editorial_readiness_score"] = readiness_score
        entry["ready_for_article"] = bool(ready)
        entry["readiness_requirements"] = {
            "observations": int(entry["observations"]),
            "source_count": source_count,
            "source_diversity": source_diversity,
            "tool_count": tool_count,
            "min_total_sources": cluster.min_total_sources,
            "min_total_tools": cluster.min_total_tools,
            "min_observations": cluster.min_observations,
        }
        cluster_pool[cluster.id] = entry
    pool["updated_at"] = run_at
    return pool


def build_job(cluster: ClusterDefinition, entry: dict[str, Any], run_at: str) -> dict[str, Any]:
    sources = [
        source
        for source in entry.get("sources") or []
        if isinstance(source, dict) and clean_text(source.get("url")) and source_dict_allowed(source)
    ][:8]
    tool_names = [clean_text(name) for name in entry.get("tool_names") or [] if clean_text(name)]
    why_now = (
        f"{cluster.why_now} Der Topic-Harvester sieht inzwischen "
        f"{len(sources)} belegte Quellen aus {len(entry.get('source_names') or [])} Quelltypen "
        f"und mindestens {len(tool_names)} relevante Tools oder Tool-Familien."
    )
    signature = signature_for(cluster.topic, cluster.format)
    return {
        "job_id": job_id_for(run_at, cluster.topic, cluster.format),
        "created_at": run_at,
        "topic": cluster.topic,
        "format": cluster.format,
        "angle": cluster.angle,
        "audience": "Leser, die KI-Tools praktisch auswählen, vergleichen oder in Workflows einbauen",
        "sources": sources,
        "illustration_brief": cluster.illustration_brief,
        "visual_generation_policy": (
            "Illustrationen muessen thematisch, szenisch oder magazinartig sein; nicht nur Tabellen, "
            "nicht nur Blockschemata, keine service/debug labels, keine leeren generischen Diagramme."
        ),
        "seo_focus": list(cluster.seo_focus),
        "article_language": "de",
        "style_guide": (
            "menschlich, redaktionell, vergleichend, mit eigener Einordnung; keine erweiterte Einzeltool-Karte"
        ),
        "editorial_tags": list(cluster.editorial_tags),
        "related_tool_hints": tool_names[:8] or list(cluster.related_tool_hints),
        "why_now": why_now,
        "priority": int(cluster.priority) + min(10, int(entry.get("editorial_readiness_score") or 0) // 15),
        "status": "pending",
        "signature": signature,
        "ready_for_article": True,
        "editorial_readiness_score": max(70, int(entry.get("editorial_readiness_score") or 0)),
        "source": "ratgeber_topic_harvester",
        "notes": (
            f"Ratgeber topic cluster {cluster.id}; observations={entry.get('observations')}; "
            f"requirements={entry.get('readiness_requirements')}"
        ),
    }


def append_manifest_jobs(manifest: dict[str, Any], jobs: list[dict[str, Any]]) -> dict[str, Any]:
    existing = [
        job
        for job in manifest.get("article_job_suggestions") or []
        if isinstance(job, dict) and clean_text(job.get("format")).lower() not in FORBIDDEN_SINGLE_TOOL_FORMATS
    ]
    by_signature: dict[str, dict[str, Any]] = {}
    for job in [*existing, *jobs]:
        signature = clean_text(job.get("signature")) or signature_for(clean_text(job.get("topic")), clean_text(job.get("format")))
        if not signature:
            continue
        current = by_signature.get(signature)
        if not current or int(job.get("priority") or 0) > int(current.get("priority") or 0):
            by_signature[signature] = job
    manifest["article_job_suggestions"] = sorted(
        by_signature.values(),
        key=lambda job: int(job.get("priority") or 0),
        reverse=True,
    )
    manifest.setdefault("harvester_runs", [])
    manifest["harvester_runs"] = [*manifest["harvester_runs"][-5:], {"run_at": now_iso(), "jobs_added": len(jobs)}]
    return manifest


def collect_signals(args: argparse.Namespace, manifest: dict[str, Any], warnings: list[str]) -> list[dict[str, Any]]:
    signals = signals_from_manifest(manifest)
    for row in read_jsonl(args.candidates):
        signal = signal_from_item(row, "candidate")
        if signal:
            signals.append(signal)
    if args.fetch_rss:
        signals.extend(fetch_feed_signals(DEFAULT_FEEDS, warnings))
    signals.extend(fetch_perplexity_signals(CLUSTERS, warnings))
    return signals


def run(args: argparse.Namespace) -> dict[str, Any]:
    run_at = now_iso()
    warnings: list[str] = []
    manifest = load_json(args.manifest, fallback={"run_at": run_at, "article_job_suggestions": []})
    if not manifest.get("run_at"):
        manifest["run_at"] = run_at
    pool = load_json(args.pool, fallback={"clusters": {}})
    signals = collect_signals(args, manifest, warnings)
    pool = update_pool(pool, CLUSTERS, signals, run_at)
    blocked = blocked_signatures(args.pipeline_root)

    jobs: list[dict[str, Any]] = []
    for cluster in CLUSTERS:
        entry = (pool.get("clusters") or {}).get(cluster.id)
        if not isinstance(entry, dict) or not entry.get("ready_for_article"):
            continue
        signature = signature_for(cluster.topic, cluster.format)
        if signature in blocked or slugify(f"{cluster.topic} {cluster.format}") in blocked:
            entry["suppressed_reason"] = "already_published_or_queued"
            continue
        if cluster.format in FORBIDDEN_SINGLE_TOOL_FORMATS:
            entry["suppressed_reason"] = "forbidden_single_tool_format"
            continue
        jobs.append(build_job(cluster, entry, run_at))
    jobs.sort(key=lambda job: int(job.get("priority") or 0), reverse=True)
    jobs = jobs[: max(0, int(args.limit))]

    if args.write:
        write_json(args.pool, pool)
        updated_manifest = append_manifest_jobs(manifest, jobs)
        write_json(args.manifest, updated_manifest)

    return {
        "ok": True,
        "write": bool(args.write),
        "run_at": run_at,
        "signals": len(signals),
        "clusters_tracked": len(pool.get("clusters") or {}),
        "ready_clusters": [
            {
                "id": cluster_id,
                "topic": entry.get("topic"),
                "score": entry.get("editorial_readiness_score"),
                "requirements": entry.get("readiness_requirements"),
                "suppressed_reason": entry.get("suppressed_reason", ""),
            }
            for cluster_id, entry in (pool.get("clusters") or {}).items()
            if isinstance(entry, dict) and entry.get("ready_for_article")
        ],
        "jobs": jobs,
        "warnings": warnings,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build mature, multi-source Ratgeber topic clusters.")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST_PATH)
    parser.add_argument("--pool", type=Path, default=DEFAULT_POOL_PATH)
    parser.add_argument("--pipeline-root", type=Path, default=ARTICLE_PIPELINE_ROOT)
    parser.add_argument("--candidates", type=Path, default=DEFAULT_CANDIDATES_PATH)
    parser.add_argument("--limit", type=int, default=2)
    parser.add_argument("--write", action="store_true", help="Persist pool and append ready jobs to latest_run.json")
    parser.add_argument("--fetch-rss", dest="fetch_rss", action="store_true", default=True)
    parser.add_argument("--no-fetch-rss", dest="fetch_rss", action="store_false")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    result = run(args)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

export const TEMPLATE_PHRASES = [
  "Prüfpunkt für",
  "Praxislauf mit",
  "Qualitätssicherung in",
  "Übergabe mit",
  "Guter Start für",
  "Risiko bei",
  "kleinen Vorher-nachher-Vergleich",
  "Datenqualität, Laufzeit, Wartbarkeit, Ergebnisstabilität und Akzeptanz",
  "spart wenig, wenn Einrichtung, Kontrolle und Nacharbeit",
];

const EDITORIAL_HEADING_PATTERNS = [
  /^redaktionelle einschätzung\b/i,
  /^editorial assessment\b/i,
  /^editorial verdict\b/i,
  /^workflow-fit\b/i,
  /^workflow fit\b/i,
  /^praxis-check\b/i,
  /^was im alltag wirklich zählt\b/i,
  /^worauf es wirklich ankommt\b/i,
];

const NON_CURATED_SECTION_PATTERN =
  /(^|\n)#{2,3}\s+(Redaktionelle Einschätzung|Editorial Assessment|Editorial Verdict|Workflow-Fit|Praxis-Check|Was im Alltag wirklich zählt|Worauf es wirklich ankommt)\b[^\n]*\n[\s\S]*?(?=\n#{1,3}\s|\s*$)/gi;

const TEMPLATE_BULLET_PATTERN =
  /^\s*[-*]\s+\*\*(?:Prüfpunkt für|Praxislauf mit|Qualitätssicherung in|Übergabe mit|Guter Start für|Risiko bei)[^*]*:\*\*.*$/gmi;

export function splitMarkdownDocument(raw) {
  const text = String(raw ?? "").replace(/\r/g, "");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { frontmatter: "", body: text };
  return {
    frontmatter: match[1],
    body: text.slice(match[0].length),
  };
}

export function parseSimpleFrontmatter(raw) {
  const { frontmatter } = splitMarkdownDocument(raw);
  const data = {};

  for (const line of frontmatter.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)\s*$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();
    if (!value) {
      data[key] = "";
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      data[key] = value;
    }
  }

  return data;
}

export function countTemplatePhrases(content, phrases = TEMPLATE_PHRASES) {
  const text = String(content ?? "");
  return phrases.reduce((sum, phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return sum + (text.match(new RegExp(escaped, "g")) ?? []).length;
  }, 0);
}

export function findEditorialBlocks(content) {
  const headings = String(content ?? "").match(/^#{2,3}\s+(.+)$/gm) ?? [];
  return headings
    .map((heading) => heading.replace(/^#{2,3}\s+/, "").trim())
    .filter((heading) => {
      const normalized = heading.toLowerCase();
      return EDITORIAL_HEADING_PATTERNS.some((pattern) => pattern.test(normalized));
    });
}

export function countInternalRepeats(content, minLength = 60) {
  const seen = new Map();
  const blocks = String(content ?? "")
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .replace(/\[[^\]]+]\([^)]*\)/g, "")
        .replace(/[`*_>#-]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((block) => block.length >= minLength);

  for (const block of blocks) {
    seen.set(block, (seen.get(block) ?? 0) + 1);
  }

  return [...seen.values()].filter((count) => count > 1).length;
}

export function hasLastReviewed(data = {}) {
  return Boolean(
    String(
      data.lastReviewed ??
        data.last_reviewed ??
        data.lastReviewedAt ??
        data.last_reviewed_at ??
        "",
    ).trim(),
  );
}

export function hasRatgeberLinks(content) {
  return /\/ratgeber\/[a-z0-9-]+\/?/i.test(String(content ?? ""));
}

export function classifyToolEntry(entry) {
  const data = entry?.data ?? {};
  const content = String(entry?.content ?? "");
  const explicitTier = String(data.tier ?? "").trim().toUpperCase();
  const templatePhraseCount = countTemplatePhrases(content);
  const editorialBlocks = findEditorialBlocks(content);
  const internalRepeats = countInternalRepeats(content);
  const bodyLen = content.length;
  const mentionedInRatgeber = hasRatgeberLinks(content);
  const reviewed = hasLastReviewed(data);

  let tier;
  if (["A", "B", "C", "D"].includes(explicitTier)) {
    tier = explicitTier;
  } else if (mentionedInRatgeber) {
    tier = "A";
  } else if (reviewed && templatePhraseCount < 2) {
    tier = "B";
  } else if (bodyLen < 4000 || editorialBlocks.length === 0) {
    tier = "D";
  } else if (templatePhraseCount >= 3 || internalRepeats >= 2) {
    tier = "C";
  } else {
    tier = "C";
  }

  return {
    tier,
    bodyLen,
    editorialBlocks,
    hasLastReviewed: reviewed,
    templatePhraseCount,
    internalRepeats,
    mentionedInRatgeber,
  };
}

export function isCuratedTier(tier) {
  return tier === "A" || tier === "B";
}

export function stripTemplateBoilerplate(content) {
  let next = String(content ?? "");

  next = next.replace(NON_CURATED_SECTION_PATTERN, (section) =>
    TEMPLATE_PHRASES.some((phrase) => section.includes(phrase)) ? "\n" : section,
  );
  next = next.replace(TEMPLATE_BULLET_PATTERN, "");

  for (const phrase of TEMPLATE_PHRASES.slice(6)) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(new RegExp(`^.*${escaped}.*$`, "gmi"), "");
  }

  return next.replace(/\n{3,}/g, "\n\n").trim();
}

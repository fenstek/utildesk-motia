export function normalizeSeoText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function ensureSentence(value: string): string {
  const normalized = normalizeSeoText(value);
  if (!normalized) return "";
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

export function truncateSeoText(value: string, maxLength = 160): string {
  const normalized = normalizeSeoText(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

export function enrichMetaDescription(
  primary: string,
  additions: string[] = [],
  options: { minLength?: number; maxLength?: number } = {},
): string {
  const minLength = options.minLength ?? 110;
  const maxLength = options.maxLength ?? 160;

  let text = ensureSentence(primary);
  for (const addition of additions) {
    if (text.length >= minLength) break;
    const sentence = ensureSentence(addition);
    if (!sentence) continue;
    text = normalizeSeoText(`${text} ${sentence}`);
  }
  return truncateSeoText(text, maxLength);
}

export function buildToolMetaTitle(name: string): string {
  return normalizeSeoText(`${name}: Funktionen, Preise & Einsatzbereiche | Utildesk`);
}

export function buildCollectionMetaTitle(subject: string, intent: string): string {
  return normalizeSeoText(`${subject}: ${intent} | Utildesk`);
}

export function humanizeTagLabel(tag: string): string {
  const normalized = normalizeSeoText(tag).replace(/[-_]+/g, " ");
  if (!normalized) return "";
  return normalized
    .split(" ")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "ai") return "AI";
      if (lower === "seo") return "SEO";
      if (lower === "ui") return "UI";
      if (lower === "ux") return "UX";
      if (lower === "crm") return "CRM";
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

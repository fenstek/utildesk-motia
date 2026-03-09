const unique = (items: Array<string | null | undefined>) => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    if (!item) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    result.push(item);
  }

  return result;
};

const KNOWN_LOGO_OVERRIDES: Record<string, string[]> = {
  "aider.chat": ["https://aider.chat/assets/logo.svg"],
};

export const getAvatarFallbackDataUrl = (title: string) => {
  const cleaned = String(title ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase() || "?";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${cleaned}"><rect width="128" height="128" rx="24" fill="#E8F0FE"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#1A73E8">${cleaned}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const getFaviconCandidates = (url: string | null, size = 128) => {
  if (!url) return [] as string[];

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const origin = parsed.origin;
    const pathname = parsed.pathname.replace(/\/+$/, "");
    const nestedPath = pathname && pathname !== "/" ? `${origin}${pathname}/favicon.ico` : null;
    const overrides = KNOWN_LOGO_OVERRIDES[hostname] ?? [];

    return unique([
      ...overrides,
      `https://www.google.com/s2/favicons?sz=${size}&domain_url=${encodeURIComponent(parsed.toString())}`,
      `https://www.google.com/s2/favicons?sz=${size}&domain=${encodeURIComponent(hostname)}`,
      `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
      `https://icon.horse/icon/${hostname}`,
      nestedPath,
      `${origin}/favicon.ico`,
    ]);
  } catch {
    return [] as string[];
  }
};

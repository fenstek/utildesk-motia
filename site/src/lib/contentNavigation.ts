export type ContentHeading = {
  id: string;
  label: string;
};

const decodeHtml = (value: string) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)));

const headingLabel = (html: string) =>
  decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

const slugifyHeading = (label: string) =>
  label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "abschnitt";

export const addContentHeadingIds = (html: string) => {
  const headings: ContentHeading[] = [];
  const usedIds = new Set<string>();

  const transformedHtml = html.replace(
    /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi,
    (_match, rawAttributes: string, innerHtml: string) => {
      const label = headingLabel(innerHtml);
      if (!label) return _match;

      const existingId = rawAttributes.match(/\bid=["']([^"']+)["']/i)?.[1];
      const baseId = existingId || slugifyHeading(label);
      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      usedIds.add(id);
      headings.push({ id, label });

      const attributes = existingId ? rawAttributes : `${rawAttributes} id="${id}"`;
      return `<h2${attributes}>${innerHtml}</h2>`;
    },
  );

  return { html: transformedHtml, headings };
};

export const extractFirstEditorialFigure = (html: string) => {
  const figurePattern = /<figure\b[^>]*class=["'][^"']*\btool-editorial-figure\b[^"']*["'][^>]*>[\s\S]*?<\/figure>/i;
  const match = html.match(figurePattern);
  if (!match) return { html, figureHtml: "" };

  return {
    html: html.replace(figurePattern, "").trim(),
    figureHtml: match[0],
  };
};

export const wrapFaqSection = (html: string, summaryLabel: string) =>
  html.replace(
    /(<h2\b[^>]*>\s*(?:FAQ|Frequently asked questions|Haufige Fragen|Häufige Fragen)[\s\S]*?<\/h2>)([\s\S]*?)(?=<h2\b|$)/i,
    `<details class="content-secondary" open><summary>${summaryLabel}</summary><div class="content-secondary-body">$1$2</div></details>`,
  );

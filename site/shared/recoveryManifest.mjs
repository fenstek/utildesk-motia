// Single source of truth for the temporary, DE-only search recovery surface.
// Keep this list deliberately explicit: every path here must be a real,
// canonical page that is allowed to be indexable during recovery.
export const RECOVERY_ALLOWED_TOOL_SLUGS = new Set([
  "cloudconvert",
  "convertio",
  "smallpdf",
  "tesseract-ocr",
  "openai-codex",
  "claude",
  "cursor",
  "github-copilot",
]);

export const RECOVERY_ALLOWED_RATGEBER_SLUGS = new Set([
  "beste-ocr-apis-rechnungen-deutschland-2026",
  "open-source-ocr-pdfs-tesseract-ocrmypdf-paddleocr",
  "pdf-daten-extrahieren-ki-tools-apis-kosten-vergleich",
  "rechnungen-automatisch-aus-e-mails-auslesen-tools-workflows",
  "make-vs-n8n-vs-zapier-rechnungsautomatisierung",
  "coding-agenten-2026-codex-claude-code-und-gemini-cli-im-entwickler-workflow",
  "vibe-coding-nach-dem-hype-wie-teams-ai-code-pruefen-testen-und-reviewen",
  "multi-model-coding-workflows-codex-gemini-claude-code-review",
]);

export const RECOVERY_ALLOWED_STATIC_PATHS = new Set([
  "/",
  "/tools",
  "/methodologie",
  "/ratgeber",
]);

export const RECOVERY_ALLOWED_DE_PATHS = new Set([
  ...RECOVERY_ALLOWED_STATIC_PATHS,
  ...[...RECOVERY_ALLOWED_TOOL_SLUGS].map((slug) => `/tools/${slug}`),
  ...[...RECOVERY_ALLOWED_RATGEBER_SLUGS].map((slug) => `/ratgeber/${slug}`),
]);

/**
 * Category matcher - uses the same logic as the website
 *
 * Matches tool tags against CATEGORIES.matchTags to find primary category
 */

// Same categories as in site/src/lib/categories.ts
const CATEGORIES = [
  {
    slug: "ai-chatbots",
    title: "Chatbots & Assistenten",
    matchTags: ["chatbot", "llm", "aillm", "gpt", "assistant", "conversation", "chat", "dialogue"],
  },
  {
    slug: "schreiben-content",
    title: "Schreiben & Content",
    matchTags: ["writing", "content", "copywriting", "text", "blog", "artikel", "editor", "texte"],
  },
  {
    slug: "design-kreativ",
    title: "Design & Kreativität",
    matchTags: ["design", "art", "image", "kreativ", "photo", "grafik", "ui", "ux", "bild", "visual"],
  },
  {
    slug: "audio-video",
    title: "Audio & Video",
    matchTags: ["audio", "video", "aiaudio", "speech", "tts", "transcription", "musik", "voice", "sound", "podcast"],
  },
  {
    slug: "produktivitaet",
    title: "Produktivität",
    matchTags: ["produktivitat", "produktivität", "productivity", "workflow", "organization", "task", "effizienz"],
  },
  {
    slug: "entwickler-tools",
    title: "Entwickler-Tools",
    matchTags: ["developer", "devtools", "code", "api", "sdk", "github", "programming", "coding", "dev"],
  },
  {
    slug: "automatisierung",
    title: "Automatisierung",
    matchTags: ["automation", "workflow", "integration", "zapier", "n8n", "ifttt", "automate"],
  },
  {
    slug: "marketing-vertrieb",
    title: "Marketing & Vertrieb",
    matchTags: ["marketing", "seo", "ads", "sales", "crm", "newsletter", "email"],
  }
];

/**
 * Find primary category for a tool based on its tags
 * Uses same logic as site/src/pages/tools/[slug].astro
 *
 * @param {string[]} tags - Tool tags
 * @returns {{slug: string, title: string} | null} - Primary category or null
 */
export function findPrimaryCategory(tags = []) {
  const normalizedTags = Array.isArray(tags)
    ? tags.map(t => String(t).toLowerCase().trim()).filter(Boolean)
    : [];

  if (normalizedTags.length === 0) {
    return null;
  }

  // Find first matching category (same as website logic)
  const primaryCategory = CATEGORIES.find((cat) =>
    normalizedTags.some((tag) => cat.matchTags.includes(tag))
  );

  return primaryCategory
    ? { slug: primaryCategory.slug, title: primaryCategory.title }
    : null;
}

/**
 * Check if tags will match any category
 *
 * @param {string[]} tags - Tool tags
 * @returns {boolean} - True if tags match at least one category
 */
export function hasMatchingCategory(tags = []) {
  return findPrimaryCategory(tags) !== null;
}

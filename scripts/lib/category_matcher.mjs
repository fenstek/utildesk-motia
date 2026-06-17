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
 * Selects category with the highest number of matching tags.
 * On tie, prefers category whose first matching tag appears earlier in the tool's tags.
 * If still tied, uses category order in CATEGORIES array.
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

  // Count matches and track first match position for each category
  const results = CATEGORIES.map(cat => {
    const matches = normalizedTags.filter(tag => cat.matchTags.includes(tag));
    const matchCount = matches.length;

    // Find position of first matching tag in normalizedTags
    const firstMatchPos = matchCount > 0
      ? normalizedTags.findIndex(tag => cat.matchTags.includes(tag))
      : Infinity;

    return {
      category: cat,
      matchCount,
      firstMatchPos
    };
  }).filter(r => r.matchCount > 0);

  if (results.length === 0) {
    return null;
  }

  // Sort by: 1) highest match count, 2) earliest first match position, 3) category order
  results.sort((a, b) => {
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount; // Higher match count first
    }
    return a.firstMatchPos - b.firstMatchPos; // Earlier position first
  });

  const bestCategory = results[0].category;

  return {
    slug: bestCategory.slug,
    title: bestCategory.title
  };
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

// ============================================================================
// SIMPLE TESTS (no framework, run with: node scripts/lib/category_matcher.mjs)
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Testing category matcher...\n');

  const tests = [
    {
      name: 'Video + content → Audio & Video (2 matches vs 1)',
      tags: ['video', 'content'],
      expected: 'Audio & Video'
    },
    {
      name: 'Writing + content → Schreiben & Content (2 matches)',
      tags: ['writing', 'content'],
      expected: 'Schreiben & Content'
    },
    {
      name: 'Assistant + chatbot → Chatbots & Assistenten (2 matches)',
      tags: ['assistant', 'chatbot'],
      expected: 'Chatbots & Assistenten'
    },
    {
      name: 'Design only → Design & Kreativität (1 match)',
      tags: ['design'],
      expected: 'Design & Kreativität'
    },
    {
      name: 'Transcription + audio + video → Audio & Video (3 matches)',
      tags: ['transcription', 'audio', 'video'],
      expected: 'Audio & Video'
    },
    {
      name: 'Content only → Schreiben & Content (first in order)',
      tags: ['content'],
      expected: 'Schreiben & Content'
    },
    {
      name: 'Workflow appears in multiple → Produktivität (first in order)',
      tags: ['workflow'],
      expected: 'Produktivität'
    },
    {
      name: 'Marketing + seo + email → Marketing & Vertrieb (3 matches)',
      tags: ['marketing', 'seo', 'email'],
      expected: 'Marketing & Vertrieb'
    },
    {
      name: 'Empty tags → null',
      tags: [],
      expected: null
    },
    {
      name: 'No matching tags → null',
      tags: ['unknown', 'random'],
      expected: null
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = findPrimaryCategory(test.tags);
    const actual = result?.title || null;
    const success = actual === test.expected;

    if (success) {
      console.log(`✅ ${test.name}`);
      console.log(`   Tags: [${test.tags.join(', ')}] → ${actual}\n`);
      passed++;
    } else {
      console.log(`❌ ${test.name}`);
      console.log(`   Tags: [${test.tags.join(', ')}]`);
      console.log(`   Expected: ${test.expected}`);
      console.log(`   Got:      ${actual}\n`);
      failed++;
    }
  }

  console.log('═'.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

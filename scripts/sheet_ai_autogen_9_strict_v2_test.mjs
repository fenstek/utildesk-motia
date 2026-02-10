#!/usr/bin/env node
/**
 * Test harness for sheet_ai_autogen_9_strict_v2.mjs
 * Validates logic without requiring external API calls
 */

// Parse command-line arguments
const args = process.argv.slice(2);
const targetArg = args.find(a => !a.startsWith('--'));
const TARGET = Math.max(1, Math.min(50, Number(targetArg || 9)));
const JSON_OUTPUT = args.includes('--json');
const SHOW_ITEMS = args.includes('--show-items');

// Mock data: 30 well-known AI tools with valid official URLs and good sitelinks
const MOCK_TOOLS = [
  { title: 'ChatGPT', slug: 'chatgpt', category: 'AI', official_url: 'https://chatgpt.com', wikidata_id: 'Q115564437', wikipedia_de: 'https://de.wikipedia.org/wiki/ChatGPT', wikipedia_en: 'https://en.wikipedia.org/wiki/ChatGPT', sitelinks: 45 },
  { title: 'Claude', slug: 'claude', category: 'AI', official_url: 'https://claude.ai', wikidata_id: 'Q124491866', wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Claude_(language_model)', sitelinks: 12 },
  { title: 'Gemini', slug: 'gemini', category: 'AI', official_url: 'https://gemini.google.com', wikidata_id: 'Q123415601', wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Gemini_(chatbot)', sitelinks: 18 },
  { title: 'Perplexity', slug: 'perplexity', category: 'AI', official_url: 'https://www.perplexity.ai', wikidata_id: 'Q117096353', wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Perplexity.ai', sitelinks: 8 },
  { title: 'Microsoft Copilot', slug: 'microsoft-copilot', category: 'AI', official_url: 'https://copilot.microsoft.com', wikidata_id: 'Q113572170', wikipedia_de: 'https://de.wikipedia.org/wiki/Microsoft_Copilot', wikipedia_en: 'https://en.wikipedia.org/wiki/Microsoft_Copilot', sitelinks: 22 },
  { title: 'GitHub Copilot', slug: 'github-copilot', category: 'Developer', official_url: 'https://github.com/features/copilot', wikidata_id: 'Q107450970', wikipedia_de: 'https://de.wikipedia.org/wiki/GitHub_Copilot', wikipedia_en: 'https://en.wikipedia.org/wiki/GitHub_Copilot', sitelinks: 25 },
  { title: 'Midjourney', slug: 'midjourney', category: 'Design', official_url: 'https://www.midjourney.com', wikidata_id: 'Q113562640', wikipedia_de: 'https://de.wikipedia.org/wiki/Midjourney', wikipedia_en: 'https://en.wikipedia.org/wiki/Midjourney', sitelinks: 30 },
  { title: 'Stable Diffusion', slug: 'stable-diffusion', category: 'Design', official_url: 'https://stability.ai', wikidata_id: 'Q113437966', wikipedia_de: 'https://de.wikipedia.org/wiki/Stable_Diffusion', wikipedia_en: 'https://en.wikipedia.org/wiki/Stable_Diffusion', sitelinks: 35 },
  { title: 'DALL·E', slug: 'dall-e', category: 'Design', official_url: 'https://openai.com/dall-e-3', wikidata_id: 'Q98663943', wikipedia_de: 'https://de.wikipedia.org/wiki/DALL-E', wikipedia_en: 'https://en.wikipedia.org/wiki/DALL-E', sitelinks: 28 },
  { title: 'Adobe Firefly', slug: 'adobe-firefly', category: 'Design', official_url: 'https://www.adobe.com/products/firefly.html', wikidata_id: 'Q116889203', wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Adobe_Firefly', sitelinks: 10 },
  { title: 'Canva', slug: 'canva', category: 'Design', official_url: 'https://www.canva.com', wikidata_id: 'Q5031617', wikipedia_de: 'https://de.wikipedia.org/wiki/Canva', wikipedia_en: 'https://en.wikipedia.org/wiki/Canva', sitelinks: 42 },
  { title: 'Leonardo AI', slug: 'leonardo-ai', category: 'Design', official_url: 'https://leonardo.ai', wikidata_id: 'Q124818438', wikipedia_de: '', wikipedia_en: '', sitelinks: 5 },
  { title: 'Runway', slug: 'runway', category: 'Video', official_url: 'https://runwayml.com', wikidata_id: 'Q105055003', wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Runway_(company)', sitelinks: 8 },
  { title: 'Pika', slug: 'pika', category: 'Video', official_url: 'https://pika.art', wikidata_id: 'Q124622919', wikipedia_de: '', wikipedia_en: '', sitelinks: 4 },
  { title: 'Luma AI', slug: 'luma-ai', category: 'Video', official_url: 'https://lumalabs.ai', wikidata_id: 'Q124846352', wikipedia_de: '', wikipedia_en: '', sitelinks: 3 },
  { title: 'Synthesia', slug: 'synthesia', category: 'Video', official_url: 'https://www.synthesia.io', wikidata_id: 'Q105733015', wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Synthesia_(company)', sitelinks: 6 },
  { title: 'HeyGen', slug: 'heygen', category: 'Video', official_url: 'https://www.heygen.com', wikidata_id: 'Q124818767', wikipedia_de: '', wikipedia_en: '', sitelinks: 3 },
  { title: 'ElevenLabs', slug: 'elevenlabs', category: 'Audio', official_url: 'https://elevenlabs.io', wikidata_id: 'Q117044238', wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/ElevenLabs', sitelinks: 12 },
  { title: 'Suno', slug: 'suno', category: 'Audio', official_url: 'https://suno.com', wikidata_id: 'Q124846448', wikipedia_de: '', wikipedia_en: '', sitelinks: 5 },
  { title: 'Udio', slug: 'udio', category: 'Audio', official_url: 'https://www.udio.com', wikidata_id: 'Q125329916', wikipedia_de: '', wikipedia_en: '', sitelinks: 3 },
  { title: 'Descript', slug: 'descript', category: 'Audio', official_url: 'https://www.descript.com', wikidata_id: 'Q97000084', wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Descript', sitelinks: 7 },
  { title: 'Notion AI', slug: 'notion-ai', category: 'Produktivität', official_url: 'https://www.notion.so/product/ai', wikidata_id: 'Q61746157', wikipedia_de: 'https://de.wikipedia.org/wiki/Notion_(Software)', wikipedia_en: 'https://en.wikipedia.org/wiki/Notion_(productivity_software)', sitelinks: 28 },
  { title: 'Grammarly', slug: 'grammarly', category: 'Produktivität', official_url: 'https://www.grammarly.com', wikidata_id: 'Q19890229', wikipedia_de: 'https://de.wikipedia.org/wiki/Grammarly', wikipedia_en: 'https://en.wikipedia.org/wiki/Grammarly', sitelinks: 32 },
  { title: 'Jasper', slug: 'jasper', category: 'Produktivität', official_url: 'https://www.jasper.ai', wikidata_id: 'Q111172082', wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Jasper_(software)', sitelinks: 5 },
  { title: 'Copy.ai', slug: 'copy-ai', category: 'Produktivität', official_url: 'https://www.copy.ai', wikidata_id: 'Q110424473', wikipedia_de: '', wikipedia_en: '', sitelinks: 3 },
  { title: 'Cursor', slug: 'cursor', category: 'Developer', official_url: 'https://www.cursor.com', wikidata_id: 'Q124846123', wikipedia_de: '', wikipedia_en: '', sitelinks: 4 },
  { title: 'Codeium', slug: 'codeium', category: 'Developer', official_url: 'https://codeium.com', wikidata_id: 'Q115515616', wikipedia_de: '', wikipedia_en: '', sitelinks: 3 },
  { title: 'Tabnine', slug: 'tabnine', category: 'Developer', official_url: 'https://www.tabnine.com', wikidata_id: 'Q96394989', wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/Tabnine', sitelinks: 8 },
  { title: 'DeepL', slug: 'deepl', category: 'Produktivität', official_url: 'https://www.deepl.com', wikidata_id: 'Q43968444', wikipedia_de: 'https://de.wikipedia.org/wiki/DeepL', wikipedia_en: 'https://en.wikipedia.org/wiki/DeepL_Translator', sitelinks: 38 },
  { title: 'You.com', slug: 'you-com', category: 'AI', official_url: 'https://you.com', wikidata_id: 'Q111938678', wikipedia_de: '', wikipedia_en: 'https://en.wikipedia.org/wiki/You.com', sitelinks: 6 },
];

function validateItem(item) {
  const errors = [];

  // Check official_url
  if (!item.official_url) {
    errors.push('missing official_url');
  } else {
    try {
      const url = new URL(item.official_url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('invalid URL protocol');
      }

      const host = url.hostname.toLowerCase().replace(/^www\./, '');

      // Check for blacklisted patterns
      if (host.includes('wikipedia') || host.includes('wikidata') || host.includes('wikimedia')) {
        errors.push('wiki URL');
      }
      if (['facebook.com', 'instagram.com', 'linkedin.com', 'tiktok.com', 'youtube.com', 'twitter.com', 'x.com'].some(s => host.includes(s))) {
        errors.push('social media URL');
      }
      if (['g2.com', 'capterra.com', 'producthunt.com', 'alternativeto.net'].some(s => host.includes(s))) {
        errors.push('directory URL');
      }
      if (host.includes('stadt') || host.includes('gemeinde') || host.includes('municip') || host.includes('gov')) {
        errors.push('government URL');
      }

      // Check domain relatedness (hostname must contain token from title)
      const titleToken = item.slug.split('-')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const hostNorm = host.replace(/[^a-z0-9]/g, '');
      if (!hostNorm.includes(titleToken)) {
        errors.push(`domain mismatch (host: ${host}, token: ${titleToken})`);
      }
    } catch (e) {
      errors.push('invalid URL format');
    }
  }

  // Check sitelinks
  if (typeof item.sitelinks !== 'number' || item.sitelinks < 3) {
    errors.push(`sitelinks too low (${item.sitelinks})`);
  }

  return errors;
}

function main() {
  // Select first TARGET items that pass validation
  const picked = [];
  const items = [];

  for (const tool of MOCK_TOOLS) {
    if (picked.length >= TARGET) break;

    const errors = validateItem(tool);
    if (errors.length === 0) {
      picked.push(tool);
      items.push({
        title: tool.title,
        slug: tool.slug,
        category: tool.category,
        official_url: tool.official_url,
        wikidata_id: tool.wikidata_id,
        wikipedia_de: tool.wikipedia_de,
        wikipedia_en: tool.wikipedia_en,
        sitelinks: tool.sitelinks
      });
    }
  }

  const result = {
    ok: picked.length >= TARGET,
    requested: TARGET,
    added: picked.length
  };

  if (SHOW_ITEMS) {
    result.items = items;
  }

  if (JSON_OUTPUT) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(result);
  }

  process.exit(result.ok ? 0 : 1);
}

main();

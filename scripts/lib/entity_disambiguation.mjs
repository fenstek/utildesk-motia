/**
 * entity_disambiguation.mjs — Wrong-entity / dual-name detection (v2.4)
 *
 * Problem: Some AI tool slugs collide with other entities:
 *   - "transformers" → HuggingFace library OR Hasbro toy brand
 *   - "llama" → Meta LLM OR Llama the animal product company
 *   - "bert" → Google NLP model OR a person's name
 *   - "stable-diffusion" → AI image model OR a chemistry concept
 *
 * This module:
 *   1) classifyEntity(slug, title) → "library_or_model" | "product_or_company" | null
 *   2) isWrongEntityDomain(host, slug, entityClass) → boolean
 *      Returns true if the resolved domain is clearly the wrong entity.
 *
 * Usage:
 *   import { classifyEntity, isWrongEntityDomain } from './entity_disambiguation.mjs';
 *   const cls = classifyEntity(slug, title);
 *   if (isWrongEntityDomain(host, slug, cls)) { // block }
 */

// ─── Known ML library / model slugs ─────────────────────────────────────────
// These slugs primarily refer to ML libraries or research models.
// Their official URLs are expected to be on neutral hosting (huggingface, github, etc.)
// rather than on a brand-specific consumer product domain.

export const LIBRARY_OR_MODEL_SLUGS = new Set([
  'transformers',
  'llama', 'llama-2', 'llama-3',
  'bert', 'roberta', 'distilbert', 'albert',
  'stable-diffusion', 'sdxl', 'stable-diffusion-xl',
  'gpt', 'gpt-2', 'gpt-3', 'gpt-j', 'gpt-neo', 'gpt-neox',
  'clip', 'dall-e',
  'whisper',
  'mistral', 'mixtral',
  'falcon',
  'bloom',
  'opt',
  'vicuna', 'alpaca', 'guanaco',
  'langchain', 'llamaindex',
  'diffusers',
  'sentence-transformers',
  'spacy',
]);

// ─── Wrong-entity domain tokens ──────────────────────────────────────────────
// If a slug is classified as library_or_model and the resolved host contains
// any of these tokens, it is the WRONG entity (e.g., hasbro for transformers).

export const WRONG_ENTITY_TOKENS = new Set([
  // Toy / entertainment brands
  'hasbro', 'lego', 'disney', 'mattel', 'bandai', 'playmates',
  // Consumer product companies with same-name AI ambiguity
  'llama', // llama.com → lifestyle brand, not Meta's model
  // Generic wrong-entity indicators for ML slug collisions
  'toys', 'games', 'clothing', 'apparel', 'fashion',
]);

// ─── Ambiguous keywords that may appear in titles ────────────────────────────
// If slug AND title both strongly suggest an ML model/library, classify as such.

export const AMBIGUOUS_KEYWORDS = [
  'model', 'library', 'framework', 'neural', 'nlp', 'transformer', 'diffusion',
  'language model', 'large language', 'llm', 'foundation model',
  'open source', 'open-source', 'hugging face', 'huggingface',
  'pytorch', 'tensorflow', 'jax',
  'embedding', 'fine-tun', 'pre-train', 'checkpoint',
];

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Classify an entity as a library/model or a product/company.
 *
 * @param {string} slug
 * @param {string} title
 * @returns {"library_or_model" | "product_or_company" | null}
 */
export function classifyEntity(slug, title = '') {
  const sl = String(slug || '').toLowerCase().trim();
  const ti = String(title || '').toLowerCase().trim();

  // Direct slug match
  if (LIBRARY_OR_MODEL_SLUGS.has(sl)) return 'library_or_model';

  // Slug contains known library keyword
  if (
    sl.includes('transformer') ||
    sl.includes('diffusion') ||
    sl.includes('langchain') ||
    sl.includes('llama') ||
    sl.includes('bert')
  ) return 'library_or_model';

  // Title contains ambiguous keyword → classify as model/library
  if (AMBIGUOUS_KEYWORDS.some(kw => ti.includes(kw))) {
    return 'library_or_model';
  }

  return null; // unknown / default → product_or_company treatment
}

/**
 * Returns true if the resolved domain is clearly the wrong entity for this slug.
 *
 * Logic:
 *   - If entity is classified as library_or_model:
 *     - Block if host contains any WRONG_ENTITY_TOKEN
 *     - Block if host is a known consumer/lifestyle brand that conflicts with the slug
 *   - Otherwise: no wrong-entity blocking (other gates apply).
 *
 * @param {string} host - Normalized hostname (no www, lowercase)
 * @param {string} slug
 * @param {string|null} entityClass - from classifyEntity()
 * @returns {boolean}
 */
export function isWrongEntityDomain(host, slug, entityClass) {
  if (!host || !entityClass) return false;
  if (entityClass !== 'library_or_model') return false;

  const h = String(host).toLowerCase();

  // Check against wrong-entity tokens
  for (const token of WRONG_ENTITY_TOKENS) {
    if (h.includes(token)) return true;
  }

  // Specific known collisions
  // transformers.hasbro.com, shop.hasbro.com/transformers etc.
  if (slug.includes('transform') && (h.includes('hasbro') || h.includes('tfw2005') || h.includes('seibertron'))) {
    return true;
  }
  // llama.com is a lifestyle/consumer brand, not Meta's LLaMA model
  if ((slug === 'llama' || slug.startsWith('llama-')) && h === 'llama.com') {
    return true;
  }

  return false;
}

export const CANONICAL_PRICE_MODELS = [
  "Freemium",
  "Kostenlos",
  "Open Source",
  "Abonnement",
  "Nutzungsbasiert",
  "Einmalzahlung",
  "Kostenpflichtig",
  "Individuelles Angebot",
  "Je nach Plan",
];

const CANONICAL_SET = new Set(CANONICAL_PRICE_MODELS);

const OPEN_SOURCE_RE = /(open[\s-]?source|self-host|self host)/i;
const FREEMIUM_RE = /(freemium|premium-features|premium-funktionen|premium-abonnements|kostenpflichtigen upgrades|kostenpflichtigen erweiterungen|kostenlosen basisversion|kostenlos.*premium|kostenfrei.*premium|kostenlos.*kostenpflichtig|kostenfrei.*kostenpflichtig|kostenlos.*abonnement|kostenfrei.*abonnement|kostenlos.*paid|free.*premium|in-app-käufen|in-app-kaeufen|in-app-kaufen)/i;
const FREE_RE = /^(kostenlos|kostenfrei)$/i;
const SUBSCRIPTION_RE = /(abonnement|abo\b|subscription|monatlich|jährlich|jaehrlich|premium|plus|lizenzmodell.*abonnement)/i;
const USAGE_RE = /(nutzungsbasiert|nutzungsabhängig|nutzungsabhaengig|abrechnung nach nutzung|abhängig von nutzung|abhaengig von nutzung|je nach nutzung|nutzungsumfang|nutzungsvolumen|nutzungsplan|pay-as-you-go|pay as you go|usage-based|usage based|pro minute|pro request|verbrauchsbasiert)/i;
const ONE_TIME_RE = /(einmalzahlung|perpetual|perpetuell|lifetime|dauerlizenz)/i;
const CUSTOM_RE = /(auf anfrage|individuell(?:es)? angebot|contact sales|enterprise-preismodell|enterprise preismodell|vertrieb|sales kontakt|kontaktieren sie den vertrieb)/i;
const VARIABLE_RE = /(je nach|abhängig|abhaengig|variabel|unterschiedlich|anbieter\/plan|anbieter und plan|tarif|lizenzvariante|lizenzmodell|plan|nutzungsumfang|nutzungsvolumen|microsoft 365)/i;
const PAID_RE = /^(paid|kostenpflichtig)$/i;

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePriceModel(rawValue) {
  const value = normalizeWhitespace(rawValue);
  if (!value) return "";
  if (value === "{{PRICE_MODEL}}" || /^tags\s*:/i.test(value)) return "";
  if (CANONICAL_SET.has(value)) return value;

  if (OPEN_SOURCE_RE.test(value)) return "Open Source";
  if (FREEMIUM_RE.test(value)) return "Freemium";
  if (FREE_RE.test(value)) return "Kostenlos";
  if (USAGE_RE.test(value)) return "Nutzungsbasiert";
  if (ONE_TIME_RE.test(value)) return "Einmalzahlung";
  if (CUSTOM_RE.test(value)) return "Individuelles Angebot";
  if (SUBSCRIPTION_RE.test(value)) return "Abonnement";
  if (PAID_RE.test(value)) return "Kostenpflichtig";
  if (VARIABLE_RE.test(value)) return "Je nach Plan";

  return value;
}

export function isCanonicalPriceModel(rawValue) {
  const value = normalizeWhitespace(rawValue);
  return !value || CANONICAL_SET.has(value);
}

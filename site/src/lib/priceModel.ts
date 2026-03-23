const CANONICAL_VALUES = new Set([
  "Freemium",
  "Kostenlos",
  "Open Source",
  "Abonnement",
  "Nutzungsbasiert",
  "Einmalzahlung",
  "Kostenpflichtig",
  "Individuelles Angebot",
  "Je nach Plan",
]);

const OPEN_SOURCE_RE = /(open[\s-]?source|self-host|self host)/i;
const FREEMIUM_RE = /(freemium|premium-features|premium-funktionen|premium-abonnements|kostenpflichtigen upgrades|kostenpflichtigen erweiterungen|kostenlosen basisversion|kostenlos.*premium|kostenfrei.*premium|kostenlos.*kostenpflichtig|kostenfrei.*kostenpflichtig|kostenlos.*abonnement|kostenfrei.*abonnement|kostenlos.*paid|free.*premium|in-app-käufen|in-app-kaeufen|in-app-kaufen)/i;
const FREE_RE = /^(kostenlos|kostenfrei)$/i;
const SUBSCRIPTION_RE = /(abonnement|abo\b|subscription|monatlich|jährlich|jaehrlich|premium|plus|lizenzmodell.*abonnement)/i;
const USAGE_RE = /(nutzungsbasiert|nutzungsabhängig|nutzungsabhaengig|abrechnung nach nutzung|abhängig von nutzung|abhaengig von nutzung|je nach nutzung|nutzungsumfang|nutzungsvolumen|nutzungsplan|pay-as-you-go|pay as you go|usage-based|usage based|pro minute|pro request|verbrauchsbasiert)/i;
const ONE_TIME_RE = /(einmalzahlung|perpetual|perpetuell|lifetime|dauerlizenz)/i;
const CUSTOM_RE = /(auf anfrage|individuell(?:es)? angebot|contact sales|enterprise-preismodell|enterprise preismodell|vertrieb|sales kontakt|kontaktieren sie den vertrieb)/i;
const VARIABLE_RE = /(je nach|abhängig|abhaengig|variabel|unterschiedlich|anbieter\/plan|anbieter und plan|tarif|lizenzvariante|lizenzmodell|plan|nutzungsumfang|nutzungsvolumen|microsoft 365)/i;
const PAID_RE = /^(paid|kostenpflichtig)$/i;

function normalizeWhitespace(value: unknown) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePriceModel(value: unknown) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return null;
  if (normalized === "{{PRICE_MODEL}}" || /^tags\s*:/i.test(normalized)) return null;
  if (CANONICAL_VALUES.has(normalized)) return normalized;

  if (OPEN_SOURCE_RE.test(normalized)) return "Open Source";
  if (FREEMIUM_RE.test(normalized)) return "Freemium";
  if (FREE_RE.test(normalized)) return "Kostenlos";
  if (USAGE_RE.test(normalized)) return "Nutzungsbasiert";
  if (ONE_TIME_RE.test(normalized)) return "Einmalzahlung";
  if (CUSTOM_RE.test(normalized)) return "Individuelles Angebot";
  if (SUBSCRIPTION_RE.test(normalized)) return "Abonnement";
  if (PAID_RE.test(normalized)) return "Kostenpflichtig";
  if (VARIABLE_RE.test(normalized)) return "Je nach Plan";

  return normalized;
}

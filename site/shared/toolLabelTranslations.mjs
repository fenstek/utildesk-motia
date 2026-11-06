const CATEGORY_LABELS = new Map([
  ["produktivitaet", "Productivity"],
  ["produktivität", "Productivity"],
  ["schreiben", "Writing"],
  ["content", "Content"],
  ["audio", "Audio"],
  ["video", "Video"],
  ["design", "Design"],
  ["marketing", "Marketing"],
  ["vertrieb", "Sales"],
  ["automatisierung", "Automation"],
  ["automation", "Automation"],
  ["entwickler", "Developer Tools"],
  ["developer tools", "Developer Tools"],
  ["vergleich", "Comparison"],
  ["anleitung", "Guide"],
  ["einordnung", "Analysis"],
  ["workflow", "Workflow"],
]);

const TAG_LABELS = new Map([
  ["ki-agenten", "AI agents"],
  ["ki-assistenten", "AI assistants"],
  ["ki-orchestrierung", "AI orchestration"],
  ["softwareentwicklung", "software development"],
  ["produktivitaet", "productivity"],
  ["produktivität", "productivity"],
  ["webstrategie", "web strategy"],
]);

const PRICE_MODEL_LABELS = new Map([
  ["kostenlos", "Free"],
  ["free", "Free"],
  ["freemium", "Freemium"],
  ["kostenpflichtig", "Paid"],
  ["paid", "Paid"],
  ["open source", "Open Source"],
  ["abonnement", "Subscription"],
  ["subscription", "Subscription"],
  ["nutzungsbasiert", "Usage-based"],
  ["usage-based", "Usage-based"],
  ["einmalzahlung", "One-time purchase"],
  ["one-time purchase", "One-time purchase"],
  ["individuelles angebot", "Custom quote"],
  ["custom quote", "Custom quote"],
  ["je nach plan", "Plan-based"],
  ["plan-based", "Plan-based"],
  ["testversion", "Trial"],
  ["trial", "Trial"],
  ["auf anfrage", "On request"],
  ["on request", "On request"],
]);

const rawLabel = (value) => String(value ?? "").trim();

export const translateLabel = (value) => {
  const raw = rawLabel(value);
  if (!raw) return "";
  const key = raw.toLowerCase();
  return CATEGORY_LABELS.get(key) ?? TAG_LABELS.get(key) ?? raw;
};

export const translatePriceModelLabel = (value) => {
  const raw = rawLabel(value);
  if (!raw) return "";
  return PRICE_MODEL_LABELS.get(raw.toLowerCase()) ?? raw;
};

export const translateTags = (tags = []) => tags
  .map((tag) => translateLabel(tag))
  .filter(Boolean)
  .filter((tag, index, list) => list.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index);

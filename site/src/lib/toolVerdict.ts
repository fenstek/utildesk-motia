export type ToolEditorialVerdictValue = "recommend" | "caution" | "overrated" | "reject";
export type ToolVerdictLocale = "de" | "en";

export type ToolEditorialVerdict = {
  value: ToolEditorialVerdictValue;
  kind: ToolEditorialVerdictValue;
  icon: string;
  label: string;
  detailKicker: string;
  detailHeadline: string;
  detailText: string;
  trustLabel: string;
};

export const normalizeToolEditorialVerdict = (
  value: unknown,
  fallback: ToolEditorialVerdictValue = "caution",
): ToolEditorialVerdictValue => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (/(reject|not[-_\s]?recommended|nicht\s+empfohlen|ablehnen)/i.test(normalized)) return "reject";
  if (/(overrated|ueberbewertet|überbewertet|oversold)/i.test(normalized)) return "overrated";
  if (/(caution|caveat|reservation|vorbehalt|guardrail|prüfen|pruefen)/i.test(normalized)) return "caution";
  if (/(recommend|recommended|empfehlen|empfohlen)/i.test(normalized)) return "recommend";
  return fallback;
};

export const getToolEditorialVerdict = (
  value: unknown,
  locale: ToolVerdictLocale = "de",
  fallback: ToolEditorialVerdictValue = "caution",
): ToolEditorialVerdict => {
  const verdict = normalizeToolEditorialVerdict(value, fallback);
  const isEn = locale === "en";
  const copy: Record<ToolEditorialVerdictValue, ToolEditorialVerdict> = {
    recommend: {
      value: "recommend",
      kind: "recommend",
      icon: "✓",
      label: isEn ? "Recommend" : "Empfehlen",
      detailKicker: isEn ? "Recommend" : "Empfehlen",
      detailHeadline: isEn
        ? "Recommend — as a tool, not as autopilot."
        : "Empfehlen — als Werkzeug, nicht als Autopilot.",
      detailText: isEn
        ? "Good starting point with a clear task, human review and traceable data flows."
        : "Sicherer Start mit klarer Aufgabe, menschlicher Prüfung und nachvollziehbaren Datenflüssen.",
      trustLabel: isEn ? "4 / 5 · high" : "4 / 5 · hoch",
    },
    caution: {
      value: "caution",
      kind: "caution",
      icon: "◐",
      label: isEn ? "With caveat" : "Mit Vorbehalt",
      detailKicker: isEn ? "With caveat" : "Mit Vorbehalt",
      detailHeadline: isEn
        ? "With caveat — check first, then use in production."
        : "Mit Vorbehalt — erst prüfen, dann produktiv nutzen.",
      detailText: isEn
        ? "Useful in a bounded pilot, but data, permissions, review and fallback must be clear."
        : "Nützlich in einem begrenzten Pilot, aber Daten, Rechte, Review und Rückweg müssen klar sein.",
      trustLabel: isEn ? "3 / 5 · check" : "3 / 5 · prüfen",
    },
    overrated: {
      value: "overrated",
      kind: "overrated",
      icon: "⊘",
      label: isEn ? "Overrated" : "Überbewertet",
      detailKicker: isEn ? "Overrated" : "Überbewertet",
      detailHeadline: isEn
        ? "Overrated — promise is stronger than proof."
        : "Überbewertet — Versprechen stärker als Belege.",
      detailText: isEn
        ? "Only use after a narrow test with evidence, alternatives and a clear exit path."
        : "Nur nach engem Praxistest mit Belegen, Alternativen und klarem Ausstiegspfad einsetzen.",
      trustLabel: isEn ? "2 / 5 · weak" : "2 / 5 · schwach",
    },
    reject: {
      value: "reject",
      kind: "reject",
      icon: "×",
      label: isEn ? "Not recommended" : "Nicht empfehlen",
      detailKicker: isEn ? "Not recommended" : "Nicht empfehlen",
      detailHeadline: isEn
        ? "Not recommended — do not use as a decision basis."
        : "Nicht empfehlen — nicht als Entscheidungsgrundlage nutzen.",
      detailText: isEn
        ? "The risk, quality gap or missing evidence is too large for a recommendation."
        : "Risiko, Qualitätslücke oder fehlende Belege sind zu groß für eine Empfehlung.",
      trustLabel: isEn ? "1 / 5 · avoid" : "1 / 5 · meiden",
    },
  };

  return copy[verdict];
};

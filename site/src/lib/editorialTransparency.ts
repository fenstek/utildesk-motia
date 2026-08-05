export type EditorialDisclosureMode = "editorial-passport" | "required-text" | "none";
export type ImageDisclosureMode = "ai-generated" | "ai-modified" | "none";

export interface EditorialTransparency {
  reviewed: boolean;
  aiAssisted: boolean;
  disclosureMode: EditorialDisclosureMode;
  reviewedAt: string;
  reviewScope: string;
  coverDisclosure: ImageDisclosureMode;
}

interface TransparencyDefaults {
  reviewed?: boolean;
  aiAssisted?: boolean;
  reviewedAt?: string;
}

const firstDefined = (data: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== "") return data[key];
  }
  return undefined;
};

const asBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1", "ja"].includes(normalized)) return true;
    if (["false", "no", "0", "nein", "none"].includes(normalized)) return false;
  }
  return fallback;
};

const asString = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  return "";
};

export function resolveEditorialTransparency(
  data: Record<string, unknown>,
  defaults: TransparencyDefaults = {},
): EditorialTransparency {
  const reviewed = asBoolean(
    firstDefined(data, ["editorialReviewed", "editorial_reviewed", "humanReviewed", "human_reviewed"]),
    defaults.reviewed ?? true,
  );
  const aiAssisted = asBoolean(
    firstDefined(data, ["aiAssistance", "ai_assistance", "aiAssisted", "ai_assisted"]),
    defaults.aiAssisted ?? true,
  );

  const requestedDisclosure = asString(
    firstDefined(data, ["aiDisclosureMode", "ai_disclosure_mode", "disclosureMode", "disclosure_mode"]),
  );
  let disclosureMode: EditorialDisclosureMode = reviewed ? "editorial-passport" : "required-text";
  if (["editorial-passport", "required-text", "none"].includes(requestedDisclosure)) {
    disclosureMode = requestedDisclosure as EditorialDisclosureMode;
  }
  // An explicit lack of editorial review must never be hidden by a content flag.
  if (!reviewed) disclosureMode = "required-text";

  const requestedCoverDisclosure = asString(
    firstDefined(data, ["coverDisclosure", "cover_disclosure", "imageDisclosure", "image_disclosure"]),
  );
  const coverDisclosure = ["ai-generated", "ai-modified"].includes(requestedCoverDisclosure)
    ? requestedCoverDisclosure as ImageDisclosureMode
    : "none";

  return {
    reviewed,
    aiAssisted,
    disclosureMode,
    reviewedAt: asString(
      firstDefined(data, [
        "finalHumanApprovalAt",
        "final_human_approval_at",
        "editorialReviewedAt",
        "editorial_reviewed_at",
      ]),
    ) || defaults.reviewedAt || "",
    reviewScope: asString(
      firstDefined(data, ["editorialReviewScope", "editorial_review_scope"]),
    ),
    coverDisclosure,
  };
}

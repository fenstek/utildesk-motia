const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

export const NON_PUBLIC_TOOL_STATUSES = new Set([
  "BLACKLIST",
  "DUPLICATE",
  "REJECTED",
  "DISABLED",
]);

// These names are owned by route clusters below /tools/, not by tool cards.
export const RESERVED_TOOL_SLUGS = new Set(["tag"]);

const firstDefined = (values) => values.find((value) => value !== undefined && value !== null && value !== "");

export function normalizeBooleanLike(value) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return null;
}

export function normalizeToolStatus(data = {}) {
  return String(
    firstDefined([
      data.sheet_status,
      data.sheetStatus,
      data.source_status,
      data.sourceStatus,
      data.intake_status,
      data.intakeStatus,
      data.status,
    ]) ?? "",
  ).trim().toUpperCase();
}

const basename = (value) => String(value ?? "").split(/[\\/]/).pop() ?? "";
const withoutMarkdownExtension = (value) => basename(value).replace(/\.md$/i, "");

export function getToolPublicState(input = {}) {
  const data = input.data ?? input.metadata ?? input.frontmatter ?? input;
  const filename = basename(input.filename ?? input.file ?? input.sourcePath ?? "");
  const fileSlug = withoutMarkdownExtension(filename);
  const slug = String(input.slug ?? data.slug ?? fileSlug).trim();
  const status = normalizeToolStatus(data);
  const routeState = String(data.route_state ?? data.routeState ?? "").trim().toLowerCase();
  const aliasTarget = String(
    firstDefined([
      data.alias_of,
      data.aliasOf,
      data.canonical_slug,
      data.canonicalSlug,
      data.redirect_to,
      data.redirectTo,
      data.replacement_slug,
      data.replacementSlug,
    ]) ?? "",
  ).trim();

  let reason = "active";
  if (!slug) reason = "missing_slug";
  else if (filename.startsWith("_") || fileSlug.startsWith("_")) reason = "underscore_file";
  else if (RESERVED_TOOL_SLUGS.has(slug.toLowerCase())) reason = "reserved_slug";
  else if (normalizeBooleanLike(data.disabled) === true) reason = "disabled";
  else if (normalizeBooleanLike(data.draft) === true) reason = "draft";
  else if (normalizeBooleanLike(data.active) === false) reason = "inactive";
  else if (NON_PUBLIC_TOOL_STATUSES.has(status)) reason = `status_${status.toLowerCase()}`;
  else if (normalizeBooleanLike(data.alias_only ?? data.aliasOnly) === true) reason = "alias_only";
  else if (["redirect", "disabled", "tombstone"].includes(routeState)) reason = `route_${routeState}`;
  else if (aliasTarget && aliasTarget !== slug) reason = "alias_target";
  else if (input.primaryPublishable === false) reason = "primary_inactive";

  return {
    isPublishable: reason === "active",
    reason,
    slug,
    filename,
    status: status || null,
    routeState: routeState || null,
    aliasTarget: aliasTarget || null,
  };
}

export function isPublishableTool(input = {}) {
  return getToolPublicState(input).isPublishable;
}

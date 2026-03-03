export const STATUS_BLACKLIST = "BLACKLIST";
export const STATUS_DISABLED = "DISABLED";
export const STATUS_NEEDS_REVIEW = "NEEDS_REVIEW";
export const STATUS_NEW = "NEW";
export const STATUS_IN_PROGRESS = "IN_PROGRESS";
export const STATUS_DONE = "DONE";
export const STATUS_ERROR = "ERROR";

export const HARD_SKIP_STATUSES = new Set([STATUS_DISABLED, STATUS_BLACKLIST]);
export const REVIEW_ONLY_STATUSES = new Set([STATUS_NEEDS_REVIEW]);
export const REPO_DISABLE_SYNC_STATUSES = new Set([
  STATUS_DISABLED,
  STATUS_BLACKLIST,
  STATUS_NEEDS_REVIEW,
]);

export function normalizeStatus(status) {
  return String(status || "").trim().toUpperCase();
}

export function getPublishGuardDecision(status, flags = {}) {
  const normalized = normalizeStatus(status);
  const allowNeedsReview = Boolean(flags.allowNeedsReview);

  if (HARD_SKIP_STATUSES.has(normalized)) {
    return {
      action: "skip_disabled_sync",
      exitCode: 0,
      reason: "disabled_or_blacklist",
      syncDisabledRepo: true,
      allowStatusWrite: false,
    };
  }

  if (normalized === STATUS_NEEDS_REVIEW) {
    return {
      action: allowNeedsReview ? "local_rebuild_only" : "skip_needs_review",
      exitCode: allowNeedsReview ? 0 : 2,
      reason: allowNeedsReview ? "needs_review_manual_rebuild_only" : "needs_review_blocked",
      syncDisabledRepo: true,
      allowStatusWrite: false,
    };
  }

  return {
    action: "publish",
    exitCode: 0,
    reason: "publishable_status",
    syncDisabledRepo: false,
    allowStatusWrite: true,
  };
}

export function assertSafeStatusTransition(currentStatus, nextStatus) {
  const current = normalizeStatus(currentStatus);
  const next = normalizeStatus(nextStatus);

  if (!next) {
    throw new Error("Refusing empty status transition");
  }

  if (
    current === STATUS_DISABLED ||
    current === STATUS_BLACKLIST ||
    current === STATUS_NEEDS_REVIEW
  ) {
    if (current === next) return;
    throw new Error(
      `Refusing status transition for protected row: ${current} -> ${next}`,
    );
  }
}

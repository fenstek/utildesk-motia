import { readdirSync } from "node:fs";
import { fromContent } from "./contentRoot.mjs";

type IssueLocale = "de" | "en";

let cachedRatgeberCount: number | null = null;

export const getDecisionIssueCount = () => {
  if (cachedRatgeberCount !== null) return cachedRatgeberCount;

  try {
    cachedRatgeberCount = readdirSync(fromContent("ratgeber"))
      .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
      .length;
  } catch {
    cachedRatgeberCount = 1;
  }

  return cachedRatgeberCount;
};

export const getDecisionIssueNumber = () =>
  String(getDecisionIssueCount()).padStart(3, "0");

export const getDecisionIssueLabel = (locale: IssueLocale = "de") => {
  const issueNo = getDecisionIssueNumber();
  return locale === "en" ? `Issue ${issueNo}` : `Ausgabe ${issueNo}`;
};

export const getDecisionIssueNavLabel = (locale: IssueLocale = "de") => {
  const issueNo = getDecisionIssueNumber();
  return locale === "en" ? `Issue № ${issueNo}` : `Ausgabe № ${issueNo}`;
};

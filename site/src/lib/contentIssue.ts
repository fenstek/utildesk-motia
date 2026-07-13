import contentLastmodManifest from "../data/content-lastmod.json";

type IssueLocale = "de" | "en";

let cachedRatgeberCount: number | null = null;

export const getDecisionIssueCount = () => {
  if (cachedRatgeberCount !== null) return cachedRatgeberCount;

  // The manifest is generated before the static build and is Worker-safe.
  // It replaces the former runtime node:fs directory scan in the shared shell.
  cachedRatgeberCount = Object.keys(contentLastmodManifest as Record<string, string>)
    .filter((path) => /^content\/ratgeber\/[^_][^/]*\.md$/i.test(path))
    .length || 1;

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

import contentLastmodManifest from "../data/content-lastmod.json";

type FreshnessLocale = "de" | "en";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const contentLastmod = contentLastmodManifest as Record<string, string>;

const dateFromIso = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const getLatestContentDate = () => {
  const dates = Object.values(contentLastmod)
    .filter((value) => DATE_PATTERN.test(String(value)))
    .sort();

  return dates.at(-1) ?? new Date().toISOString().slice(0, 10);
};

export const getLatestContentDateLabels = (locale: FreshnessLocale = "de") => {
  const iso = getLatestContentDate();
  const date = dateFromIso(iso);
  const formatterLocale = locale === "en" ? "en-GB" : "de-DE";

  return {
    iso,
    compact: new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(date),
    long: new Intl.DateTimeFormat(formatterLocale, {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date).replace(",", " ·"),
  };
};

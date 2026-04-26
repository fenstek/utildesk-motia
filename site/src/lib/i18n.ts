import { SITE_URL } from "./siteMeta";

export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

export const LOCALE_META: Record<Locale, { label: string; nativeLabel: string; lang: string }> = {
  de: { label: "German", nativeLabel: "Deutsch", lang: "de" },
  en: { label: "English", nativeLabel: "English", lang: "en" },
};

export const normalizePath = (path = "/") => {
  const raw = path.startsWith("/") ? path : `/${path}`;
  if (raw === "/") return "/";
  return raw.endsWith("/") ? raw : `${raw}/`;
};

export const getLocaleFromPath = (pathname = "/"): Locale =>
  normalizePath(pathname).startsWith("/en/") ? "en" : "de";

export const stripLocalePrefix = (pathname = "/") => {
  const normalized = normalizePath(pathname);
  if (normalized === "/en/") return "/";
  if (normalized.startsWith("/en/")) return normalizePath(normalized.slice(3));
  return normalized;
};

export const localizePath = (path = "/", locale: Locale = DEFAULT_LOCALE) => {
  const normalized = normalizePath(path);
  if (locale === "de") return normalized;
  return normalized === "/" ? "/en/" : normalizePath(`/en${normalized}`);
};

const SPECIAL_ALTERNATES = [
  { de: "/datenschutz/", en: "/en/privacy/" },
  { de: "/impressum/", en: "/en/imprint/" },
];

const TRANSLATED_PATH_PATTERNS = [
  /^\/$/,
  /^\/tools\/$/,
  /^\/tools\/[^/]+\/$/,
  /^\/tools\/tag\/[^/]+\/$/,
  /^\/category\/$/,
  /^\/category\/[^/]+\/$/,
  /^\/ratgeber\/$/,
  /^\/ratgeber\/[^/]+\/$/,
];

export const getAlternatePaths = (pathname = "/"): Record<Locale, string> | null => {
  const normalized = normalizePath(pathname);
  const special = SPECIAL_ALTERNATES.find(
    (item) => item.de === normalized || item.en === normalized,
  );
  if (special) return { de: special.de, en: special.en };

  const sourcePath = stripLocalePrefix(normalized);
  if (!TRANSLATED_PATH_PATTERNS.some((pattern) => pattern.test(sourcePath))) {
    return null;
  }

  return {
    de: sourcePath,
    en: localizePath(sourcePath, "en"),
  };
};

export const toAbsoluteLocalizedUrl = (path: string) => `${SITE_URL}${normalizePath(path)}`;

export const hrefFor = (path: string, locale: Locale) => localizePath(path, locale);

export const UI = {
  de: {
    skipLink: "Zum Inhalt springen",
    systemStatus: "Systemstatus",
    navLabel: "Hauptnavigation",
    brandSub: "// ki-werkzeugverzeichnis",
    navHome: "Verzeichnis",
    navTools: "Tools",
    navGuides: "Ratgeber",
    navCategories: "Kategorien",
    llms: "llms.txt",
    themeLight: "Hell",
    themeDark: "Dunkel",
    themeToggleLabel: "Design umschalten",
    themeToDark: "Zum dunklen Design wechseln",
    themeToLight: "Zum hellen Design wechseln",
    dbStatus: "db: tools + ratgeber",
    indexNowStatus: "indexnow: aktiv",
    aiReadableStatus: "ai-readable manifests: online",
    footerTools: "Tools",
    footerGuides: "Ratgeber",
    footerCategories: "Kategorien",
    footerPrivacy: "Datenschutzerkl\u00e4rung",
    footerImprint: "Impressum",
    footerCopy:
      "Disclaimer: Utildesk ist ein unabh\u00e4ngiges Tool-Verzeichnis. Marken, Logos und Namen geh\u00f6ren den jeweiligen Rechteinhabern.",
    languageSwitch: "English",
    languageLabel: "Sprache wechseln",
  },
  en: {
    skipLink: "Skip to content",
    systemStatus: "System status",
    navLabel: "Main navigation",
    brandSub: "// ai tools directory",
    navHome: "Directory",
    navTools: "Tools",
    navGuides: "Guides",
    navCategories: "Categories",
    llms: "llms.txt",
    themeLight: "Light",
    themeDark: "Dark",
    themeToggleLabel: "Toggle design",
    themeToDark: "Switch to dark design",
    themeToLight: "Switch to light design",
    dbStatus: "db: tools + guides",
    indexNowStatus: "indexnow: active",
    aiReadableStatus: "ai-readable manifests: online",
    footerTools: "Tools",
    footerGuides: "Guides",
    footerCategories: "Categories",
    footerPrivacy: "Privacy",
    footerImprint: "Imprint",
    footerCopy:
      "Disclaimer: Utildesk is an independent tools directory. All trademarks, logos, and brand names are the property of their respective owners.",
    languageSwitch: "Deutsch",
    languageLabel: "Switch language",
  },
} satisfies Record<Locale, Record<string, string>>;

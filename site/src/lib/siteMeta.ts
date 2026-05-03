export const SITE_URL = "https://tools.utildesk.de";
export const SITE_NAME = "Utildesk";
export const SITE_DESCRIPTION =
  "Kuratiertes KI-Tools Verzeichnis 2026 fuer AI-Tools, Automatisierung, Produktivitaet und redaktionelle Ratgeber.";
export const SITE_DESCRIPTION_EN =
  "Curated AI tools directory 2026 for automation, productivity and editorial guides.";
export const SITE_LANGUAGE = "de-DE";
export const SITE_LANGUAGE_EN = "en";
export const ORGANIZATION_LOGO_PATH = "/logo-grid.svg";
export const DEFAULT_ROBOTS_CONTENT =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

export function toAbsoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPublisherOrganization() {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: toAbsoluteUrl(ORGANIZATION_LOGO_PATH),
    },
  };
}

export function buildOrganizationSchema({
  description = SITE_DESCRIPTION,
  inLanguage = SITE_LANGUAGE,
}: {
  description?: string;
  inLanguage?: string;
} = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description,
    inLanguage,
    logo: {
      "@type": "ImageObject",
      url: toAbsoluteUrl(ORGANIZATION_LOGO_PATH),
    },
  };
}

export function buildWebSiteSchema({
  description = SITE_DESCRIPTION,
  inLanguage = SITE_LANGUAGE,
}: {
  description?: string;
  inLanguage?: string;
} = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description,
    inLanguage,
    publisher: buildPublisherOrganization(),
  };
}

export function buildCollectionPageSchema({
  name,
  description,
  url,
  about,
  mainEntity,
  inLanguage = SITE_LANGUAGE,
}: {
  name: string;
  description: string;
  url: string;
  about?: string[];
  mainEntity?: Record<string, unknown>;
  inLanguage?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    inLanguage,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...(about?.length
      ? {
          about: about.map((item) => ({
            "@type": "Thing",
            name: item,
          })),
        }
      : {}),
    ...(mainEntity ? { mainEntity } : {}),
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

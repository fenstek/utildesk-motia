import { existsSync } from "node:fs";
import { join } from "node:path";

const LOGO_EXTENSIONS = ["svg", "png", "webp", "ico"];
const getLogoRoots = () => [
  join(process.cwd(), "public", "images", "logos"),
];

/**
 * Resolve local logo path for a tool slug.
 * Only returns assets that are actually served from Astro's public directory.
 */
export function resolveLocalLogo(slug: string): string | null {
  if (!slug) return null;

  for (const root of getLogoRoots()) {
    for (const extension of LOGO_EXTENSIONS) {
      const candidatePath = join(root, `${slug}.${extension}`);
      if (existsSync(candidatePath)) {
        return `/images/logos/${slug}.${extension}`;
      }
    }
  }

  return null;
}

import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Resolve local logo path for a tool slug.
 * Checks for SVG first, then PNG.
 * Returns the public path (/images/logos/<slug>.svg|png) or null.
 */
export function resolveLocalLogo(slug: string): string | null {
  if (!slug) return null;

  const svgPath = join(process.cwd(), "public", "images", "logos", `${slug}.svg`);
  if (existsSync(svgPath)) {
    return `/images/logos/${slug}.svg`;
  }

  const pngPath = join(process.cwd(), "public", "images", "logos", `${slug}.png`);
  if (existsSync(pngPath)) {
    return `/images/logos/${slug}.png`;
  }

  return null;
}

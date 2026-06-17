import { readdir, readFile } from "node:fs/promises";
import matter from "gray-matter";
import { fromContent } from "./contentRoot.mjs";
import type { Locale } from "./i18n";

const ratgeberDirForLocale = (locale: Locale = "de") =>
  locale === "en" ? fromContent("en", "ratgeber") : fromContent("ratgeber");

export interface RatgeberRelatedTool {
  title: string;
  href: string;
}

export interface RatgeberEntryData {
  slug?: string;
  title?: string;
  date?: string;
  excerpt?: string;
  readTime?: number;
  category?: string;
  eyebrow?: string;
  coverImage?: string;
  secondaryImage?: string;
  tags?: string[];
  sidebarTitle?: string;
  sidebarPoints?: string[];
  relatedTools?: RatgeberRelatedTool[];
}

export interface RatgeberEntry {
  slug: string;
  sourcePath: string;
  data: RatgeberEntryData;
  content: string;
}

const parseStringArray = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];

const parseRelatedTools = (value: unknown): RatgeberRelatedTool[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const maybe = item as { title?: unknown; href?: unknown };
      const title = String(maybe.title ?? "").trim();
      const href = String(maybe.href ?? "").trim();
      if (!title || !href) return null;
      return { title, href };
    })
    .filter((item): item is RatgeberRelatedTool => Boolean(item));
};

const parseEntry = async (file: string, locale: Locale = "de"): Promise<RatgeberEntry | null> => {
  const sourcePath = fromContent(locale === "en" ? "en/ratgeber" : "ratgeber", file);
  const raw = await readFile(sourcePath, "utf-8");
  const parsed = matter(raw);
  const slug = String(parsed.data.slug ?? file.replace(/\.md$/, ""));
  const title = String(parsed.data.title ?? slug).trim();
  if (!title) return null;

  return {
    slug,
    sourcePath,
    data: {
      ...parsed.data,
      slug,
      title,
      readTime: parsed.data.readTime ? Number(parsed.data.readTime) : undefined,
      tags: parseStringArray(parsed.data.tags),
      sidebarPoints: parseStringArray(parsed.data.sidebarPoints),
      relatedTools: parseRelatedTools(parsed.data.relatedTools),
    },
    content: parsed.content,
  };
};

export async function listRatgeberEntries(locale: Locale = "de") {
  const files = (await readdir(ratgeberDirForLocale(locale)))
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .sort((a, b) => a.localeCompare(b));

  const entries = await Promise.all(files.map((file) => parseEntry(file, locale)));

  return entries
    .filter((entry): entry is RatgeberEntry => Boolean(entry))
    .sort((a, b) => {
      const aTime = a.data.date ? Date.parse(a.data.date) : 0;
      const bTime = b.data.date ? Date.parse(b.data.date) : 0;
      if (bTime !== aTime) return bTime - aTime;
      return a.data.title!.localeCompare(b.data.title!, locale);
    });
}

export async function getRatgeberEntry(slug: string, locale: Locale = "de") {
  const entries = await listRatgeberEntries(locale);
  return entries.find((entry) => entry.slug === slug) ?? null;
}

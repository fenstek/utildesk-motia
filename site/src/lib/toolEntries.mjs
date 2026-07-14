import { readdir, readFile } from "node:fs/promises";
import matter from "gray-matter";
import { normalizePriceModel } from "./priceModel";
import { fromContent } from "./contentRoot.mjs";
import { getToolPublicState } from "../../shared/toolPublicState.mjs";

const TOOLS_DIR = fromContent("tools");

export async function listActiveToolEntries() {
  const files = (await readdir(TOOLS_DIR))
    .filter((file) => file.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  const entries = await Promise.all(
    files.map(async (file) => {
      const sourcePath = fromContent("tools", file);
      const raw = await readFile(sourcePath, "utf-8");
      const parsed = matter(raw);
      const publicState = getToolPublicState({ filename: file, data: parsed.data });
      if (!publicState.isPublishable) return null;

      return {
        slug: publicState.slug,
        sourcePath,
        raw,
        data: {
          ...parsed.data,
          price_model: normalizePriceModel(parsed.data.price_model),
        },
        content: parsed.content,
      };
    })
  );

  return entries.filter(Boolean);
}

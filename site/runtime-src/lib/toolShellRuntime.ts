import { slugifyTag } from "../../src/lib/tagRoutes";
import type { RuntimeLocale } from "./runtimeContent";
import { listRuntimeShellEntries } from "./runtimeContent";
import { buildRuntimeDisplayTool, buildRuntimeHomeTool, buildRuntimeRatgeberPageEntry } from "./toolMachineRuntime";

export async function getRuntimeToolShellData(locale: RuntimeLocale) {
  const [tools, ratgeber, primaryTools] = await Promise.all([
    listRuntimeShellEntries("tool", locale),
    listRuntimeShellEntries("ratgeber", locale),
    locale === "en" ? listRuntimeShellEntries("tool", "de") : Promise.resolve([]),
  ]);
  const primaryBySlug = new Map(primaryTools.map((entry) => [entry.slug, entry]));
  return {
    displayTools: tools.map((entry) => buildRuntimeDisplayTool(entry, locale, primaryBySlug.get(entry.slug) ?? entry)),
    homeTools: tools.map((entry) => buildRuntimeHomeTool(entry, locale, primaryBySlug.get(entry.slug) ?? entry)),
    ratgeber: ratgeber.map(buildRuntimeRatgeberPageEntry),
  };
}

export function resolveRuntimeTag(tools: Awaited<ReturnType<typeof getRuntimeToolShellData>>["displayTools"], slug: string) {
  for (const tool of tools) {
    for (const tag of tool.tags) if (slugifyTag(tag) === slug) return tag;
  }
  return null;
}

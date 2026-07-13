import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";

// This config is intentionally separate from the live Pages build. It lets us
// validate Worker-rendered routes while the current static production site stays intact.
export default defineConfig({
  // Do not bundle the current static route tree into the runtime worker. The
  // migration gets its own small app and can move routes over one cluster at a
  // time without making the initial preview upload thousands of files.
  srcDir: "./runtime-src",
  publicDir: "./runtime-public",
  // Preview the eventual steady-state deployment: routes are rendered by the
  // Worker, so adding locales does not multiply a static build.
  output: "server",
  integrations: [mdx()],
  adapter: cloudflare({
    configPath: "./wrangler.hybrid.jsonc",
    imageService: "passthrough",
    // Existing static routes still read the repository during prerendering.
    prerenderEnvironment: "node",
  }),
});

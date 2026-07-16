import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// Production content renderer. Its assets deliberately use a separate prefix:
// the static Cloudflare Pages app keeps ownership of /_astro/* during the
// gradual route-by-route migration.
export default defineConfig({
  srcDir: "./runtime-src",
  publicDir: "./runtime-public",
  output: "server",
  outDir: "./dist-runtime",
  build: { assets: "runtime-assets" },
  integrations: [],
  adapter: cloudflare({
    configPath: "./wrangler.runtime.production.jsonc",
    imageService: "passthrough",
    prerenderEnvironment: "node",
  }),
});

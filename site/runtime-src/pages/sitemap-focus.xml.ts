import type { APIRoute } from "astro";
import { createRuntimeSitemap } from "../lib/runtimeSitemap";

export const prerender = false;
export const GET: APIRoute = () => createRuntimeSitemap();

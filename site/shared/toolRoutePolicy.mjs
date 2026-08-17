export const TOOL_REDIRECTS = Object.freeze({
  appinventor: "mit-app-inventor",
  sendinblue: "brevo",
  "crello-jetzt-vistacreate": "vista-create",
  renpy: "ren-py",
  "rev-com": "rev",
  "veed-io": "veed",
  vn: "vn-video-editor",
  "streak-crm": "streak",
  "systran-translation-api": "systran-translate-api",
  "hubspot-sales": "hubspot-sales-hub",
  luminar: "luminar-neo",
  "clarifai-video-recognition": "clarifai",
  "cohere-api": "cohere",
  "tensorflow-keras": "keras",
  "microsoft-office-365": "microsoft-365",
});

export const TOOL_TOMBSTONES = new Set([
  "xamarin",
  "mxnet",
  "adobe-xd",
  "deepfake",
  "meaningcloud",
  "pipio",
  "play-ht",
  "abbyy-vantage",
  "autogen",
  "aws-textract",
  "azure-ai-document-intelligence",
  "doodle",
  "drift",
  "eclipse-che",
  "google-search-console",
  "help-scout",
  "higgsfield",
  "ibm-watson-natural-language-understanding",
  "italki",
  "izotope-ozone",
  "kafka-streams",
  "katalon",
  "klaviyo",
  "kodex",
  "kore-ai",
  "lens-org",
  "leonardo-ai",
  "lever",
  "lindy",
  "lm-arena",
  "lm-studio",
  "logic-pro",
  "loudmax",
  "lunacy",
  "mailbird",
  "mailshake",
  "makecode",
  "mate-translate",
  "mattermost",
  "meldaproduction-mlimiter",
  "mendix",
  "microsoft-azure-cosmos-db",
  "microsoft-editor",
  "mistral-ocr",
  "mongodb-atlas",
  "moxo",
  "nativescript",
  "new-relic",
  "noise-blocker",
  "notion-calendar",
  "ocrmypdf",
  "online-convert",
  "openfaas",
  "paddleocr",
  "photomath",
  "photoscissors",
  "phrase",
  "piktochart",
  "pillar",
  "pipedrive",
  "podbean",
  "procreate",
  "rawtherapee",
  "reply-io",
  "samsung-bixby",
  "sendible",
  "slate-digital-fg-x",
  "stanford-nlp",
  "waves-abbey-road-tg-mastering-chain",
  "waves-l1-ultramaximizer",
  "waves-l2-ultramaximizer",
  "weaviate",
  "wellsaid-labs",
  "wevideo",
  "when2meet",
  "whereby",
  "wink",
  "wipo-patentscope",
  "wit-ai",
  "wix-mit-velo",
  "woebot",
  "wombo-ai",
  "wordtune",
  "workable",
  "workday",
  "workfusion",
  "writer",
  "writerduet",
  "wysa",
  "xai",
  "yarn-spinner",
  "yesware",
  "youchat",
  "youtrack",
  "zendesk-suite",
  "zendesk-talk",
  "zeppelin",
  "zest-ai",
  "zoho-calendar",
  "zoho-creator",
  "zoho-crm",
  "zoho-desk",
  "zoho-office-suite",
  "zoho-people",
  "zoho-sheet",
  "zoho-social",
  "zoho-zia",
  "zoom-phone",
  "zoom",
  "zulip",
]);

const slugPattern = "[a-z0-9]+(?:-[a-z0-9]+)*";

function routeFor(pathname) {
  const locale = pathname.startsWith("/en/") ? "en" : "de";
  const prefix = locale === "en" ? "/en" : "";
  const detail = pathname.match(new RegExp(`^${prefix}/tools/(${slugPattern})/?$`));
  if (detail) return { locale, kind: "html", slug: detail[1], canonical: `${prefix}/tools/` };
  const json = pathname.match(new RegExp(`^${prefix}/api/tools/(${slugPattern})\\.json$`));
  if (json) return { locale, kind: "json", slug: json[1], canonical: `${prefix}/api/tools/` };
  const markdown = pathname.match(new RegExp(`^${prefix}/markdown/tools/(${slugPattern})\\.md$`));
  if (markdown) return { locale, kind: "markdown", slug: markdown[1], canonical: `${prefix}/markdown/tools/` };
  return null;
}

export function getToolRouteAction(pathname) {
  const route = routeFor(pathname);
  if (!route) return null;
  if (TOOL_REDIRECTS[route.slug]) {
    const targetSlug = TOOL_REDIRECTS[route.slug];
    const target = route.kind === "html"
      ? `${route.canonical}${targetSlug}/`
      : route.kind === "json"
        ? `${route.canonical}${targetSlug}.json`
        : `${route.canonical}${targetSlug}.md`;
    return { type: "redirect", status: 301, ...route, target, targetSlug };
  }
  if (TOOL_TOMBSTONES.has(route.slug)) return { type: "tombstone", status: 410, ...route };
  return null;
}

export function respondToToolRouteAction(action, origin, search = "") {
  if (!action) return null;
  if (action.type === "redirect") {
    return Response.redirect(`${origin}${action.target}${search}`, 301);
  }
  return new Response(null, {
    status: 410,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export function applyToolRoutePolicy(request) {
  if (!request?.url) return null;
  const url = new URL(request.url);
  return respondToToolRouteAction(getToolRouteAction(url.pathname), url.origin, url.search);
}

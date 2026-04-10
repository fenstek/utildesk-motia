const CANONICAL_ALIAS_SLUGS = new Set([
  "adalo",
  "amazon-codewhisperer",
  "amazon-comprehend",
  "amazon-lex",
  "amazon-polly",
  "amazon-transcribe",
  "amazon-web-services-ai",
  "atlas-ti",
  "auphonic",
  "aws-sagemaker",
  "befunky",
  "boomy",
  "boords",
  "buffer",
  "camtasia",
  "chatterbot",
  "clearscope",
  "codesandbox",
  "crowdin",
  "dedoose",
  "deep-dream-generator",
  "deepgram",
  "descript-overdub",
  "elicit",
  "flexclip",
  "fotojet",
  "framer",
  "github-codespaces",
  "gitpod",
  "glide",
  "google-palm",
  "h2o-ai",
  "hootsuite",
  "hugging-face-transformers",
  "ibm-watson-natural-language-understanding",
  "ibm-watson-speech-to-text",
  "ibm-watson-studio",
  "ibm-watson-text-to-speech",
  "ispeech",
  "jovian",
  "kapwing",
  "kodular",
  "kofax-rpa",
  "later",
  "magma",
  "maxqda",
  "microsoft-translator",
  "miro",
  "nvivo",
  "outsystems",
  "paperspace-gradient",
  "peppertype-ai",
  "pixlr",
  "postman",
  "power-bi",
  "qlik-sense",
  "quirkos",
  "research-rabbit",
  "responsivevoice",
  "reverso",
  "scholarcy",
  "semantic-scholar",
  "semrush",
  "smmry",
  "spacy",
  "surfer-seo",
  "thunkable",
  "visier",
  "visual-studio-code-mit-remote-extensions",
  "webflow",
  "wix-mit-velo",
  "xero",
  "zamzar-ai",
  "zest-ai",
]);

const CURATED_CANONICAL_REDIRECTS = new Map([
  ["ai21-labs", "ai21-studio"],
  ["canva-video", "canva-video-editor"],
  ["deepart-io", "deep-art-effects"],
  ["google-cloud-vision-ai", "google-cloud-vision"],
  ["google-cloud-vision-api", "google-cloud-vision"],
  ["google-data-studio", "looker-studio"],
  ["openai-chatgpt", "chatgpt"],
  ["right-inbox", "rightinbox"],
  ["runwayml", "runway"],
  ["swagger-ui", "swagger"],
  ["veed", "veed-io"],
]);

export function onRequest(context) {
  const url = new URL(context.request.url);
  const slug = context.params.slug;

  if (typeof slug === "string" && CURATED_CANONICAL_REDIRECTS.has(slug)) {
    const canonicalSlug = CURATED_CANONICAL_REDIRECTS.get(slug);
    return Response.redirect(`${url.origin}/tools/${canonicalSlug}/`, 308);
  }

  if (typeof slug === "string" && slug.startsWith("_")) {
    const canonicalSlug = slug.slice(1);
    if (CANONICAL_ALIAS_SLUGS.has(canonicalSlug)) {
      return Response.redirect(`${url.origin}/tools/${canonicalSlug}/`, 308);
    }
  }

  return context.next();
}

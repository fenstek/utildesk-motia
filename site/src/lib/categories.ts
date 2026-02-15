export interface Category {
  slug: string;
  title: string;
  description: string;
  matchTags: string[];
}

export const CATEGORIES: Category[] = [
  {
    slug: "ai-chatbots",
    title: "AI & Chatbots",
    description: "KI-gestützte Chatbots und Sprachmodelle für natürliche Konversationen und intelligente Assistenz.",
    matchTags: ["ai", "chatbot", "llm", "aillm", "gpt", "claude"]
  },
  {
    slug: "schreiben-content",
    title: "Schreiben & Content",
    description: "Tools für Texterstellung, Content-Generierung und kreatives Schreiben mit KI-Unterstützung.",
    matchTags: ["writing", "content", "copywriting", "text", "blog", "artikel"]
  },
  {
    slug: "design-kreativ",
    title: "Design & Kreativität",
    description: "KI-Tools für Design, Bildgenerierung und kreative Projekte.",
    matchTags: ["design", "art", "image", "kreativ", "photo", "grafik", "ui", "ux"]
  },
  {
    slug: "audio-video",
    title: "Audio & Video",
    description: "KI-gestützte Audio- und Video-Tools für Bearbeitung, Generierung und Transkription.",
    matchTags: ["audio", "video", "aiaudio", "speech", "tts", "transcription", "musik", "voice"]
  },
  {
    slug: "produktivitaet",
    title: "Produktivität",
    description: "Tools zur Steigerung der Produktivität und Effizienz im Arbeitsalltag.",
    matchTags: ["produktivitat", "productivity", "workflow", "organization", "task"]
  },
  {
    slug: "entwickler-tools",
    title: "Entwickler-Tools",
    description: "KI-Tools für Entwickler: Code-Assistenten, APIs und DevOps-Lösungen.",
    matchTags: ["developer", "devtools", "code", "api", "sdk", "github", "programming"]
  },
  {
    slug: "automatisierung",
    title: "Automatisierung",
    description: "Automatisierungstools für Workflows, Integrationen und wiederkehrende Aufgaben.",
    matchTags: ["automation", "workflow", "integration", "zapier", "n8n", "ifttt"]
  }
];

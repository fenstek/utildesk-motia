export interface Category {
  slug: string;
  title: string;
  description: string;
  matchTags: string[];
}

export const CATEGORIES: Category[] = [
  {
    slug: "ai-chatbots",
    title: "Chatbots & Assistenten",
    description: "KI-gestützte Chatbots und Sprachmodelle für natürliche Konversationen und intelligente Assistenz.",
    matchTags: ["chatbot", "llm", "aillm", "gpt", "assistant", "conversation", "chat", "dialogue"]
  },
  {
    slug: "schreiben-content",
    title: "Schreiben & Content",
    description: "Tools für Texterstellung, Content-Generierung und kreatives Schreiben mit KI-Unterstützung.",
    matchTags: ["writing", "content", "copywriting", "text", "blog", "artikel", "editor", "texte"]
  },
  {
    slug: "design-kreativ",
    title: "Design & Kreativität",
    description: "KI-Tools für Design, Bildgenerierung und kreative Projekte.",
    matchTags: ["design", "art", "image", "kreativ", "photo", "grafik", "ui", "ux", "bild", "visual"]
  },
  {
    slug: "audio-video",
    title: "Audio & Video",
    description: "KI-gestützte Audio- und Video-Tools für Bearbeitung, Generierung und Transkription.",
    matchTags: ["audio", "video", "aiaudio", "speech", "tts", "transcription", "musik", "voice", "sound", "podcast"]
  },
  {
    slug: "produktivitaet",
    title: "Produktivität",
    description: "Tools zur Steigerung der Produktivität und Effizienz im Arbeitsalltag.",
    matchTags: ["produktivitat", "produktivität", "productivity", "workflow", "organization", "task", "effizienz"]
  },
  {
    slug: "entwickler-tools",
    title: "Entwickler-Tools",
    description: "KI-Tools für Entwickler: Code-Assistenten, APIs und DevOps-Lösungen.",
    matchTags: ["developer", "devtools", "code", "api", "sdk", "github", "programming", "coding", "dev"]
  },
  {
    slug: "automatisierung",
    title: "Automatisierung",
    description: "Automatisierungstools für Workflows, Integrationen und wiederkehrende Aufgaben.",
    matchTags: ["automation", "workflow", "integration", "zapier", "n8n", "ifttt", "automate"]
  },
  {
    slug: "marketing-vertrieb",
    title: "Marketing & Vertrieb",
    description: "KI-Tools für Marketing, SEO, Werbung und Vertriebsautomatisierung.",
    matchTags: ["marketing", "seo", "ads", "sales", "crm", "newsletter", "email"]
  }
];

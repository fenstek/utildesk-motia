export type FaqPair = {
  question: string;
  answer: string;
};

const stripMarkdown = (value: string) =>
  String(value || "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isLikelyQuestion = (value: string) => /\?\s*$/.test(value.trim());

export function extractFaqPairsFromMarkdown(markdown = "", limit = 8): FaqPair[] {
  const section = String(markdown).match(
    /(?:^|\n)#{2,3}\s+(?:FAQ|Haeufige Fragen|Häufige Fragen|Frequently Asked Questions)\s*\n([\s\S]*?)(?=\n#{1,3}\s|\s*$)/i,
  );

  if (!section) return [];

  const lines = section[1].split(/\r?\n/);
  const pairs: FaqPair[] = [];
  let question = "";
  let answerLines: string[] = [];

  const flush = () => {
    if (!question) return;
    const answer = stripMarkdown(answerLines.join(" "));
    if (isLikelyQuestion(question) && answer.length >= 20) {
      pairs.push({
        question: stripMarkdown(question),
        answer,
      });
    }
    question = "";
    answerLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (question && answerLines.length) answerLines.push(" ");
      continue;
    }

    const heading = line.match(/^#{3,4}\s+(.+\?)\s*$/);
    const boldOnly = line.match(/^\*\*(?:\d+[.)]\s*)?(.+\?)\*\*\s*$/);
    const boldInline = line.match(/^\*\*(?:\d+[.)]\s*)?(.+\?)\*\*\s*(.+)$/);

    if (heading || boldOnly || boldInline) {
      flush();
      question = (heading?.[1] ?? boldOnly?.[1] ?? boldInline?.[1] ?? "").trim();
      if (boldInline?.[2]) answerLines.push(boldInline[2]);
      continue;
    }

    if (/^[-*]\s+\*\*/.test(line)) {
      const listQuestion = line.match(/^[-*]\s+\*\*(?:\d+[.)]\s*)?(.+\?)\*\*\s*(.+)?$/);
      if (listQuestion) {
        flush();
        question = listQuestion[1].trim();
        if (listQuestion[2]) answerLines.push(listQuestion[2]);
        continue;
      }
    }

    if (question) answerLines.push(line);
  }

  flush();
  return pairs.slice(0, limit);
}

export function buildFaqPageSchema(faqPairs: FaqPair[]) {
  if (!faqPairs.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqPairs.map((pair) => ({
      "@type": "Question",
      name: pair.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: pair.answer,
      },
    })),
  };
}

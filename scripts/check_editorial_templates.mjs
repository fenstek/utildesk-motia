import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const toolsDir = path.join(repoRoot, 'content', 'tools');

const bannedSnippets = [
  'nicht als Spielerei, sondern als Teil eines konkreten Arbeitsablaufs',
  'sinnvoller Vergleichspunkt für angrenzende Workflows, Kosten oder Team-Fit',
  'sinnvoller Vergleichspunkt, wenn Workflow, Preis oder Spezialisierung anders ausfallen sollen',
  'Das hängt vom Einsatz ab. Für einfache Tests reicht oft ein kleiner Einstieg',
  'Für erste Tests meistens ja. Der produktive Einsatz hängt aber weniger vom Einstieg ab',
  'Ohne diese Einordnung wird selbst ein gutes Werkzeug schnell zu einem weiteren offenen Tab',
  'Je nach Einsatz können Texte, Bilder, Audiodaten, Kundendaten, Forschungsnotizen oder interne Prozessinformationen verarbeitet werden',
  'Das Tool zu früh als Lösung zu betrachten. Besser ist ein kleiner Praxistest',
  'ein anderer Schwerpunkt gesetzt werden soll',
  'F?r ',
];

const files = fs
  .readdirSync(toolsDir)
  .filter((file) => file.endsWith('.md') && !file.startsWith('_'));

const failures = [];
const paragraphs = new Map();

for (const file of files) {
  const filePath = path.join(toolsDir, file);
  const text = fs.readFileSync(filePath, 'utf8').replace(/\r/g, '');
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '');

  for (const snippet of bannedSnippets) {
    if (text.includes(snippet)) {
      failures.push(`${file}: banned editorial template snippet: ${snippet}`);
    }
  }

  if (/\*\*tags:\s*\[/.test(body) || /Preismodell \*\*tags: \[/.test(body)) {
    failures.push(`${file}: frontmatter tags leaked into rendered body text`);
  }

  const paragraphsInFile = new Map();

  for (const paragraph of body
    .split(/\n\s*\n/)
    .map((value) => value.trim())
    .filter(Boolean)) {
    if (
      paragraph.startsWith('#') ||
      paragraph.startsWith('- ') ||
      paragraph.startsWith('**Zum Anbieter:**')
    ) {
      continue;
    }

    const normalized = paragraph.replace(/\s+/g, ' ').trim();
    if (normalized.length < 120) continue;

    paragraphsInFile.set(normalized, (paragraphsInFile.get(normalized) || 0) + 1);

    if (!paragraphs.has(normalized)) paragraphs.set(normalized, new Set());
    paragraphs.get(normalized).add(file);
  }

  for (const [paragraph, count] of paragraphsInFile.entries()) {
    if (count < 2) continue;
    failures.push(`${file}: duplicate long paragraph within file: ${paragraph.slice(0, 180)}`);
  }
}

for (const [paragraph, paragraphFiles] of paragraphs.entries()) {
  if (paragraphFiles.size < 2) continue;
  failures.push(
    `Duplicate long paragraph in ${[...paragraphFiles].join(', ')}: ${paragraph.slice(0, 180)}`,
  );
}

if (failures.length) {
  console.error(`Editorial template check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Editorial template check passed.');

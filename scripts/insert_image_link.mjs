import fs from "node:fs";
import process from "node:process";

const mdPath = process.argv[2];
const slug = process.argv[3];
const toolName = process.argv[4] || slug;

if (!mdPath || !slug) {
  console.error("Использование: node insert_image_link.mjs <file.md> <slug> [tool_name]");
  process.exit(1);
}

let md = fs.readFileSync(mdPath, "utf8");

// Если уже есть картинка — ничего не делаем
if (md.includes(`/images/tools/${slug}.png`)) {
  console.log(JSON.stringify({ ok: true, changed: false, reason: "already_has_image" }, null, 2));
  process.exit(0);
}

const imgLine = `![${toolName}](/images/tools/${slug}.png)\n`;

// Вставляем сразу после первой строки "# ..."
const lines = md.split("\n");
let inserted = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith("# ")) {
    lines.splice(i + 1, 0, "", imgLine.trimEnd(), "");
    inserted = true;
    break;
  }
}

if (!inserted) {
  // если вдруг нет H1 — добавим в начало
  lines.unshift(imgLine.trimEnd(), "");
}

md = lines.join("\n").replace(/\n{3,}/g, "\n\n");
fs.writeFileSync(mdPath, md.trim() + "\n", "utf8");

console.log(JSON.stringify({ ok: true, changed: true }, null, 2));

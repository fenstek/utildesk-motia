import fs from "node:fs";
import process from "node:process";

const filePath = process.argv[2];
const affiliateUrl = process.argv[3] || "";

if (!filePath) {
  console.error("Использование: node finalize_md.mjs <file.md> [affiliate_url]");
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error("Файл не найден:", filePath);
  process.exit(1);
}

let md = fs.readFileSync(filePath, "utf8");

// Удаляем условные handlebars-блоки
md = md.replace(/{{#if[^}]*}}/g, "");
md = md.replace(/{{\/if}}/g, "");

// Подставляем affiliate URL или удаляем строку
if (affiliateUrl) {
  md = md.replace(/{{AFFILIATE_URL}}/g, affiliateUrl);
} else {
  md = md.replace(/^.*{{AFFILIATE_URL}}.*$/gm, "");
}

// Убираем все оставшиеся {{...}}
md = md.replace(/{{[^}]+}}/g, "");

// Чистим лишние пустые строки
md = md.replace(/\n{3,}/g, "\n\n");

fs.writeFileSync(filePath, md.trim() + "\n", "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      finalized: filePath,
      affiliate_used: Boolean(affiliateUrl),
    },
    null,
    2
  )
);

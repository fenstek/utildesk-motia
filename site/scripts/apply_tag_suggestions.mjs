import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";

// Load suggestions
const suggestionsPath = join(process.cwd(), "scripts", "tag_suggestions.json");
const suggestions = JSON.parse(await readFile(suggestionsPath, "utf-8"));

console.log(`\n📋 Загружено ${suggestions.length} предложений\n`);

const errors = [];
const skipped = [];
const updated = [];
const newTagsCount = new Map();

// Process each suggestion
for (const suggestion of suggestions) {
  const { slug, file, allNewTags, oldTags } = suggestion;

  if (!allNewTags || allNewTags.length === 0) {
    skipped.push({ slug, reason: "Нет новых тегов" });
    continue;
  }

  // Skip if tags are the same
  const oldTagsSet = new Set(oldTags || []);
  const newTagsSet = new Set(allNewTags);
  if (oldTagsSet.size === newTagsSet.size && [...oldTagsSet].every(t => newTagsSet.has(t))) {
    skipped.push({ slug, reason: "Теги не изменились" });
    continue;
  }

  try {
    const filePath = join(process.cwd(), "..", "content", "tools", file);

    // Read file
    const raw = await readFile(filePath, "utf-8");
    const { data, content } = matter(raw);

    // Update tags
    data.tags = allNewTags;

    // Count new tags
    allNewTags.forEach(tag => {
      newTagsCount.set(tag, (newTagsCount.get(tag) || 0) + 1);
    });

    // Stringify back to YAML frontmatter + content
    const newContent = matter.stringify(content, data);

    // Write file
    await writeFile(filePath, newContent, "utf-8");

    updated.push({ slug, oldTags, newTags: allNewTags });

    // Progress indicator
    if (updated.length % 10 === 0) {
      console.log(`✓ Обновлено ${updated.length}/${suggestions.length}...`);
    }
  } catch (error) {
    errors.push({
      slug,
      file,
      error: error.message
    });
  }
}

console.log("\n" + "═".repeat(65));
console.log("  РЕЗУЛЬТАТЫ ПРИМЕНЕНИЯ");
console.log("═".repeat(65) + "\n");

console.log(`✅ Успешно обновлено:  ${updated.length} файлов`);
console.log(`⏭️  Пропущено:          ${skipped.length} файлов`);
console.log(`❌ Ошибок:             ${errors.length} файлов\n`);

if (skipped.length > 0) {
  console.log("⏭️  ПРОПУЩЕННЫЕ ФАЙЛЫ:");
  skipped.forEach(({ slug, reason }) => {
    console.log(`   • ${slug}: ${reason}`);
  });
  console.log();
}

if (errors.length > 0) {
  console.log("❌ ОШИБКИ:");
  errors.forEach(({ slug, file, error }) => {
    console.log(`   • ${slug} (${file}): ${error}`);
  });
  console.log();

  console.log("⚠️  ПРЕРЫВАНИЕ: обнаружены ошибки при обработке файлов");
  console.log("    Изменения НЕ должны быть закоммичены.");
  process.exit(1);
}

// Top 10 new tags
const sortedTags = Array.from(newTagsCount.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log("📊 ТОП-10 НОВЫХ ТЕГОВ:");
sortedTags.forEach(([tag, count], i) => {
  console.log(`   ${String(i + 1).padStart(2)}. ${tag.padEnd(20)} ${count} файлов`);
});

console.log("\n✅ Все файлы успешно обновлены!\n");

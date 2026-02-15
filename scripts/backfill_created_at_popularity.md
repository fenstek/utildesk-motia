# backfill_created_at_popularity.mjs

## Описание

Скрипт для массового заполнения полей `created_at` и `popularity` в frontmatter файлов `content/tools/*.md`.

Необходим для активации функциональности сортировки на странице `/tools` по дате добавления и популярности.

## Логика работы

Для каждого файла `content/tools/<slug>.md`:

1. **Парсинг frontmatter**:
   - Если frontmatter отсутствует — файл пропускается
   - Файлы начинающиеся с `_` пропускаются

2. **Поле `created_at`**:
   - Если поле отсутствует или пустое:
     - Получает дату первого коммита файла через `git log --follow --diff-filter=A`
     - Извлекает только `YYYY-MM-DD` из ISO даты
     - Если git не вернул результат — использует `"1970-01-01"`
     - Записывает как: `created_at: "YYYY-MM-DD"`
   - Если поле уже существует — не изменяет

3. **Поле `popularity`**:
   - Если поле отсутствует или пустое:
     - Устанавливает значение `0` (число)
     - Записывает как: `popularity: 0`
   - Если поле уже существует — не изменяет

4. **Сохранение**:
   - Сохраняет порядок полей frontmatter
   - Не изменяет тело markdown документа
   - Не изменяет другие поля frontmatter

## Использование

```bash
# Dry-run (показать что будет изменено, без записи)
node scripts/backfill_created_at_popularity.mjs --dry-run

# Реальный прогон (применить изменения)
node scripts/backfill_created_at_popularity.mjs
```

## Параметры

- `--dry-run` — режим предварительного просмотра. Показывает какие файлы будут изменены и какие поля добавлены, но не записывает изменения в файлы.

## Примеры вывода

### Dry-run режим

```
=== DRY RUN MODE ===
Processing files in: /opt/utildesk-motia/content/tools

[DRY-RUN] Would update adobe-express.md: created_at, popularity
  created_at: "2025-02-15"
  popularity: 0
[DRY-RUN] Would update anthropic.md: created_at, popularity
  created_at: "2025-02-12"
  popularity: 0
[SKIP] claude.md (already has all fields)

=== SUMMARY ===
Total files scanned:       120
Updated created_at:        115
Updated popularity:        115
Skipped (no frontmatter):  0
Skipped (has all fields):  5
Errors:                    0

✓ Dry run complete. Run without --dry-run to apply changes.
```

### Реальный прогон

```
=== LIVE MODE ===
Processing files in: /opt/utildesk-motia/content/tools

[UPDATE] adobe-express.md: created_at, popularity
[UPDATE] anthropic.md: created_at, popularity
[SKIP] claude.md (already has all fields)

=== SUMMARY ===
Total files scanned:       120
Updated created_at:        115
Updated popularity:        115
Skipped (no frontmatter):  0
Skipped (has all fields):  5
Errors:                    0

✓ Complete!
```

## Безопасность

- ✅ Не перезаписывает существующие значения
- ✅ Сохраняет все другие поля frontmatter
- ✅ Не изменяет тело markdown
- ✅ Поддерживает dry-run для проверки перед применением
- ✅ Пропускает файлы без frontmatter
- ✅ Пропускает служебные файлы (начинающиеся с `_`)

## Требования

- Git репозиторий с историей коммитов
- Node.js 18+
- Запуск из корня проекта `/opt/utildesk-motia`

## Связанные изменения

Этот скрипт дополняет функциональность сортировки на странице `/tools`, реализованную в коммите `774c795`.

После запуска скрипта, сортировка по дате добавления и популярности начнет работать на основе реальных данных из frontmatter.

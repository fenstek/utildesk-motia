# Umami Popularity Sync Script

Автоматическая синхронизация популярности инструментов из Umami Analytics в frontmatter поле `popularity` файлов `content/tools/*.md`.

## Что делает

Скрипт:

1. Авторизуется в Umami Analytics через API
2. Получает метрики просмотров страниц за последние N дней
3. Извлекает просмотры только для путей `/tools/<slug>` или `/tools/<slug>/`
4. Сопоставляет slug'и с файлами в `content/tools/`
5. Обновляет поле `popularity` в frontmatter каждого файла
6. По умолчанию работает в режиме **dry-run** для безопасности

## Требуемые переменные окружения

```bash
# Umami Website ID (обязательно)
UMAMI_WEBSITE_ID=1cb00ebe-8e55-45c6-ad41-e34ff8e28e18

# Umami API credentials (обязательно)
UMAMI_USERNAME=popularity-bot
UMAMI_PASSWORD=umami-stats-2024

# Umami base URL (опционально, по умолчанию: https://stats.utildesk.de)
UMAMI_BASE_URL=https://stats.utildesk.de
```

### Добавление переменных в .env

Добавьте в файл `/opt/utildesk-motia/.env`:

```bash
# Umami Analytics API (for popularity sync)
UMAMI_WEBSITE_ID=1cb00ebe-8e55-45c6-ad41-e34ff8e28e18
UMAMI_USERNAME=popularity-bot
UMAMI_PASSWORD=umami-stats-2024
```

## Использование

### Dry run (безопасный режим, по умолчанию)

Показывает, что будет изменено, без записи файлов:

```bash
node scripts/umami_sync_popularity.mjs --days 30
```

### Apply (реальное обновление)

Применяет изменения к файлам:

```bash
node scripts/umami_sync_popularity.mjs --days 30 --apply
```

### Установка нулей для отсутствующих

По умолчанию, если для инструмента нет статистики, поле `popularity` не изменяется. Чтобы выставить 0:

```bash
node scripts/umami_sync_popularity.mjs --apply --zero-missing
```

### Ограничение изменений

Для защиты от случайного массового изменения всех файлов:

```bash
node scripts/umami_sync_popularity.mjs --apply --max-updates 50
```

По умолчанию максимум 200 файлов.

### JSON output для автоматизации

```bash
node scripts/umami_sync_popularity.mjs --json
```

Возвращает JSON с детальной информацией о изменениях:

```json
{
  "success": true,
  "totalMetrics": 342,
  "matchedSlugs": 87,
  "totalFiles": 120,
  "updatedFiles": 15,
  "dryRun": true,
  "changes": [
    {
      "slug": "chatgpt",
      "file": "chatgpt.md",
      "old": 1234,
      "new": 1567
    }
  ]
}
```

## Опции командной строки

| Опция | Описание | По умолчанию |
|-------|----------|--------------|
| `--days N` | Количество дней для выборки статистики | 30 |
| `--dry-run` | Показать изменения без записи | true |
| `--apply` | Применить изменения к файлам | false |
| `--zero-missing` | Установить popularity=0 для инструментов без статистики | false |
| `--max-updates N` | Максимальное количество обновляемых файлов | 200 |
| `--json` | Вывод в формате JSON | false |
| `--help` | Показать справку | - |

## Интеграция в cron

### Ручной запуск

```bash
cd /opt/utildesk-motia
source .env  # Загрузить переменные окружения
node scripts/umami_sync_popularity.mjs --days 30 --apply --zero-missing
```

### Автоматический nightly sync

Используйте helper-скрипт:

```bash
bash scripts/cron_umami_popularity.sh
```

### Добавление в crontab

Ежедневно в 03:15 UTC:

```cron
15 3 * * * cd /opt/utildesk-motia && bash scripts/cron_umami_popularity.sh >> /var/log/umami-sync.log 2>&1
```

Или каждые 6 часов:

```cron
15 */6 * * * cd /opt/utildesk-motia && bash scripts/cron_umami_popularity.sh >> /var/log/umami-sync.log 2>&1
```

## Меры безопасности

### 1. Dry-run по умолчанию

Скрипт **всегда** работает в режиме dry-run, если явно не указан `--apply`. Это предотвращает случайные изменения.

### 2. Лимит изменений (max-updates)

По умолчанию скрипт остановится после 200 изменений. Это защищает от случайного изменения всех файлов из-за ошибки в API или конфигурации.

```bash
# Ограничить 10 файлами для теста
node scripts/umami_sync_popularity.mjs --apply --max-updates 10
```

### 3. Сохранение существующих данных

- Скрипт **не изменяет** другие поля frontmatter (только `popularity`)
- Скрипт **сохраняет** форматирование и содержимое markdown
- Если slug не найден в метриках и не указан `--zero-missing`, поле остаётся без изменений

### 4. Секреты не в git

Переменные `UMAMI_USERNAME` и `UMAMI_PASSWORD` хранятся только в `.env` файле, который находится в `.gitignore`.

### 5. Логирование

Рекомендуется направлять вывод в лог-файл:

```bash
node scripts/umami_sync_popularity.mjs --apply 2>&1 | tee -a /var/log/umami-sync.log
```

### 6. Проверка изменений перед коммитом

После запуска с `--apply`, проверьте изменения:

```bash
git diff content/tools/
```

Если изменения выглядят корректно:

```bash
git add content/tools/*.md
git commit -m "chore: sync popularity from Umami"
git push origin master
```

## Примеры использования

### Пример 1: Первый запуск (тест)

```bash
# Dry run для проверки
node scripts/umami_sync_popularity.mjs --days 7

# Если результат выглядит корректно, apply на ограниченное количество
node scripts/umami_sync_popularity.mjs --days 7 --apply --max-updates 10

# Проверить изменения
git diff content/tools/
```

### Пример 2: Полная синхронизация за 30 дней

```bash
# Dry run сначала
node scripts/umami_sync_popularity.mjs --days 30

# Apply
node scripts/umami_sync_popularity.mjs --days 30 --apply --zero-missing
```

### Пример 3: Мониторинг изменений в CI/CD

```bash
# Получить JSON output
node scripts/umami_sync_popularity.mjs --json > sync-result.json

# Проверить количество изменений
CHANGES=$(jq '.updatedFiles' sync-result.json)
if [ "$CHANGES" -gt 0 ]; then
  echo "Updated $CHANGES files"
fi
```

## Troubleshooting

### Error: UMAMI_WEBSITE_ID environment variable is required

**Решение:** Добавьте переменные окружения в `.env` или экспортируйте их:

```bash
export UMAMI_WEBSITE_ID=1cb00ebe-8e55-45c6-ad41-e34ff8e28e18
export UMAMI_USERNAME=popularity-bot
export UMAMI_PASSWORD=umami-stats-2024
```

### Error: Umami login failed: Unauthorized

**Решение:** Проверьте `UMAMI_USERNAME` и `UMAMI_PASSWORD`. Убедитесь, что пользователь имеет доступ к website.

### Error: Umami metrics request failed

**Решение:**
- Проверьте `UMAMI_WEBSITE_ID` корректен
- Убедитесь, что пользователь в team, который владеет website
- Проверьте доступность Umami сервера

### Не находятся slug'и

**Причина:** Slug в frontmatter отличается от имени файла.

**Решение:** Скрипт сначала пытается использовать `frontmatter.slug`, затем имя файла. Если проблема сохраняется, проверьте формат URL в Umami (должен быть `/tools/<slug>`).

## Структура данных

### Входные данные (Umami API)

```json
[
  { "x": "/tools/chatgpt", "y": 1567 },
  { "x": "/tools/claude", "y": 892 },
  { "x": "/tools/midjourney/", "y": 743 }
]
```

### Обновление frontmatter

До:
```yaml
---
slug: chatgpt
name: ChatGPT
popularity: 1234
---
```

После:
```yaml
---
slug: chatgpt
name: ChatGPT
popularity: 1567
---
```

## См. также

- [Umami API Documentation](https://docs.umami.is/docs/api)
- [Cron Helper Script](./cron_umami_popularity.sh)
- [Umami Client Module](../tmp/umami-client.mjs) - для других интеграций

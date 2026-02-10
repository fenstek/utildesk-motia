# Autonomous Engineering Agent

Полностью автономный агент для автоматического исправления ошибок в коде через цикл until-pass.

## Архитектура

```
agent/
├── cli.mjs          - CLI интерфейс
├── core.mjs         - Основной цикл until-pass
├── executor.mjs     - Выполнение команд (local/SSH)
├── analyzer.mjs     - Анализ stdout/stderr/JSON
├── llm.mjs          - Генерация патчей через LLM
├── patcher.mjs      - Применение патчей через git
├── config.mjs       - Конфигурация
└── README.md        - Документация
```

## Принцип работы

1. **Executor** запускает проверочную команду (local или SSH)
2. **Analyzer** анализирует stdout/stderr/JSON на предмет ошибок
3. Если ошибки найдены → **LLM** генерирует patch
4. **Patcher** применяет patch через git (write + commit)
5. Повторяет цикл до SUCCESS или max iterations

## Быстрый старт

```bash
# Базовый запуск
node agent/cli.mjs \
  --task "fix validation errors" \
  --check "node scripts/sheet_ai_autogen_9_strict_v2.mjs 5 --dry-run --json"

# С SSH
node agent/cli.mjs \
  --task "pass tests on VPS" \
  --check "npm test" \
  --mode ssh \
  --max-iterations 5

# С git веткой
node agent/cli.mjs \
  --task "fix linter" \
  --check "npm run lint" \
  --branch agent/lint-fixes

# Dry-run (без применения патчей)
node agent/cli.mjs \
  --task "test patch generation" \
  --check "npm test" \
  --dry-run \
  --verbose
```

## Переменные окружения

```bash
# LLM (обязательно)
OPENAI_API_KEY=sk-...
AGENT_LLM_MODEL=gpt-4o-mini      # или gpt-4, claude-3-opus и т.д.
AGENT_MAX_TOKENS=4000
AGENT_TEMPERATURE=0.1

# Execution
AGENT_MODE=local                  # local | ssh
AGENT_SSH_HOST=vps.example.com
AGENT_SSH_USER=deploy
AGENT_TIMEOUT=120000              # мс
AGENT_CWD=/path/to/repo

# Iterations
AGENT_MAX_ITERATIONS=10

# Git
AGENT_AUTO_COMMIT=true
AGENT_COMMIT_PREFIX=[agent]
AGENT_BRANCH=agent/auto-fixes

# Logging
AGENT_VERBOSE=true
AGENT_DRY_RUN=false
```

## Примеры использования

### 1. Автофикс валидации AI tools

```bash
node agent/cli.mjs \
  --task "fix AI tools validation" \
  --check "node scripts/sheet_ai_autogen_9_strict_v2.mjs 10 --dry-run --json" \
  --branch agent/validation-fixes
```

### 2. Исправление тестов

```bash
node agent/cli.mjs \
  --task "pass all unit tests" \
  --check "npm test" \
  --max-iterations 5
```

### 3. Фикс линтера

```bash
node agent/cli.mjs \
  --task "fix ESLint errors" \
  --check "npm run lint" \
  --branch agent/eslint-fixes
```

### 4. Проверка на VPS через SSH

```bash
export AGENT_SSH_HOST=vps.utildesk.com
export AGENT_SSH_USER=deploy

node agent/cli.mjs \
  --task "ensure production build passes" \
  --check "cd /var/www/utildesk && npm run build" \
  --mode ssh
```

## Формат output

```json
{
  "success": true,
  "iterations": 3,
  "duration": 45231,
  "patches": [
    {
      "iteration": 1,
      "patch": {
        "changes": [
          {
            "file": "scripts/something.mjs",
            "action": "edit",
            "content": "..."
          }
        ]
      },
      "commit": {
        "hash": "abc123",
        "message": "[agent] Auto-fix: 1 file modified",
        "files": ["scripts/something.mjs"]
      }
    }
  ],
  "finalOutput": "..."
}
```

## Интеграция с CI/CD

### GitHub Actions

```yaml
name: Auto-fix with Agent

on:
  schedule:
    - cron: '0 2 * * *'  # Каждую ночь в 2:00

jobs:
  auto-fix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install deps
        run: npm ci

      - name: Run Agent
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          node agent/cli.mjs \
            --task "fix validation" \
            --check "node scripts/sheet_ai_autogen_9_strict_v2.mjs 20 --dry-run --json" \
            --branch agent/nightly-fixes \
            --max-iterations 5

      - name: Push changes
        run: |
          git push origin agent/nightly-fixes
```

### Cron (локально или на VPS)

```bash
# crontab -e
0 3 * * * cd /home/user/utildesk-motia && node agent/cli.mjs --task "nightly validation" --check "node scripts/sheet_ai_autogen_9_strict_v2.mjs 50 --dry-run --json" --branch agent/nightly >> /var/log/agent.log 2>&1
```

## Расширение агента

### Добавление кастомного анализатора

```javascript
// agent/analyzer.mjs
class CustomAnalyzer extends Analyzer {
  analyzeCustomFormat(execResult) {
    // Ваша логика
  }
}
```

### Использование другого LLM (Anthropic Claude)

```javascript
// agent/llm.mjs
import Anthropic from '@anthropic-ai/sdk';

class ClaudeLLMClient extends LLMClient {
  async generatePatch(context) {
    const anthropic = new Anthropic({
      apiKey: this.config.anthropicApiKey,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      messages: [
        { role: 'user', content: this.buildUserPrompt(...) }
      ],
    });

    return this.parsePatchResponse(response.content[0].text);
  }
}
```

## Безопасность

⚠️ **ВАЖНО:**

- Агент автоматически коммитит изменения в git
- НЕ используйте на production ветке без review
- Всегда указывайте отдельную ветку через `--branch`
- Используйте `--dry-run` для тестирования
- Проверяйте патчи перед merge

## Troubleshooting

### LLM возвращает невалидный JSON

→ Увеличьте `AGENT_MAX_TOKENS` или смените модель на более мощную

### Агент не может найти файлы

→ Проверьте `AGENT_CWD` или используйте абсолютные пути в `--check`

### SSH не работает

→ Убедитесь, что SSH ключи настроены: `ssh user@host "echo OK"`

### Патчи не применяются

→ Проверьте права записи в репозиторий и git статус

## Лицензия

MIT

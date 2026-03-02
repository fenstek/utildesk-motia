# check_stale_routes_prod.mjs

Проверяет live `tools.utildesk.de` после деплоя на два класса ошибок:

- `hugging-face` и `spacy` должны отдавать `200` и содержать правильные official domains
- удалённые/stale slug не должны отдавать `200`

Сейчас проверяются:

- `hugging-face` -> должен содержать `huggingface.co`, не должен содержать `hugging-face.com`
- `spacy` -> должен содержать `spacy.io`, не должен содержать `spacy.com`
- `explainable-ai` -> не должен отдавать `200`
- `transformers` -> не должен отдавать `200`

## Usage

```bash
node scripts/check_stale_routes_prod.mjs
node scripts/check_stale_routes_prod.mjs --base https://tools.utildesk.de
```

## Exit codes

- `0` -> PASS
- `2` -> live check failed
- `1` -> script/runtime error

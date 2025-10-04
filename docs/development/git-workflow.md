# Git Workflow и Conventional Commits

## Обзор

Данный документ описывает правила работы с Git в проекте, основанные на [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) спецификации. Это обеспечивает единообразную структуру коммитов, автоматическую генерацию CHANGELOG и семантическое версионирование.

## Структура коммитов

### Базовая структура

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Обязательные элементы

1. **Type** - тип коммита (обязательно)
2. **Description** - краткое описание изменений (обязательно)

### Опциональные элементы

1. **Scope** - область изменений (опционально)
2. **Body** - подробное описание (опционально)
3. **Footer** - дополнительная информация (опционально)

## Типы коммитов

### Основные типы

- **`feat`** - новая функциональность (соответствует MINOR в SemVer)
- **`fix`** - исправление бага (соответствует PATCH в SemVer)

### Дополнительные типы

- **`build`** - изменения в системе сборки, внешних зависимостях
- **`chore`** - изменения в инструментах, конфигурации, задачах
- **`ci`** - изменения в CI/CD конфигурации
- **`docs`** - изменения в документации
- **`style`** - изменения форматирования, отсутствующие точки с запятой и т.д.
- **`refactor`** - рефакторинг кода без изменения функциональности
- **`perf`** - изменения, улучшающие производительность
- **`test`** - добавление или изменение тестов
- **`revert`** - откат предыдущих изменений

## Scope (Область изменений)

Scope указывает на конкретную часть кодовой базы, которая была изменена:

### FSD архитектура scope

- **`app`** - изменения в App слое
- **`pages`** - изменения в Pages слое
- **`widgets`** - изменения в Widgets слое
- **`features`** - изменения в Features слое
- **`entities`** - изменения в Entities слое
- **`shared`** - изменения в Shared слое

### Технические scope

- **`api`** - изменения в API
- **`database`** - изменения в базе данных
- **`ui`** - изменения в пользовательском интерфейсе
- **`auth`** - изменения в аутентификации
- **`docker`** - изменения в Docker конфигурации
- **`config`** - изменения в конфигурации

## Breaking Changes

### Обозначение Breaking Changes

Breaking changes могут быть обозначены двумя способами:

1. **В footer секции:**

   ```
   feat: allow provided config object to extend other configs

   BREAKING CHANGE: `extends` key in config file is now used for extending other config files
   ```

2. **В type/scope с восклицательным знаком:**
   ```
   feat!: send an email to the customer when a product is shipped
   feat(api)!: send an email to the customer when a product is shipped
   ```

## Примеры коммитов

### Простые коммиты

```bash
# Исправление бага
fix: resolve error for empty product descriptions

# Новая функциональность
feat: add product image optimization

# Документация
docs: update API documentation for product endpoints

# Тесты
test: add unit tests for product service
```

### Коммиты с scope

```bash
# Изменения в конкретном слое FSD
feat(entities): add product entity with validation
fix(pages): resolve product list pagination issue
refactor(widgets): optimize product card component

# Технические изменения
feat(api): add product search endpoint
fix(database): resolve product category foreign key issue
chore(docker): update Node.js version in Dockerfile
```

### Коммиты с body

```bash
feat(images): implement image processing pipeline

Add comprehensive image processing pipeline using Caravaggio:
- Image resizing and optimization
- Format conversion (WebP, AVIF)
- Quality adjustment based on device
- Caching mechanism for processed images

Closes #123
```

### Breaking Changes

```bash
feat!: migrate to new product schema

BREAKING CHANGE: Product model now requires 'categoryId' field instead of 'category' string.
Update your product creation code to use the new schema.

Migration guide available in docs/migration/product-schema.md
```

### Revert коммиты

```bash
revert: let us never again speak of the noodle incident

Refs: 676104e, a215868
```

## Правила написания

### Description (Описание)

- **Максимум 50 символов** для краткости
- **Начинать с маленькой буквы** (не с заглавной)
- **Без точки в конце**
- **Использовать повелительное наклонение** ("add feature", не "added feature")

### Body (Тело коммита)

- **Отделять пустой строкой** от description
- **Объяснять "что" и "почему"**, а не "как"
- **Максимум 72 символа на строку**
- **Использовать повелительное наклонение**

### Footer

- **Отделять пустой строкой** от body
- **Ссылки на issues**: `Closes #123`, `Fixes #456`
- **Breaking changes**: `BREAKING CHANGE: description`
- **Co-authors**: `Co-authored-by: Name <email>`

## Интеграция с инструментами

### Автоматическая генерация CHANGELOG

```bash
# Установка conventional-changelog
npm install -g conventional-changelog-cli

# Генерация CHANGELOG
conventional-changelog -p angular -i CHANGELOG.md -s
```

### Семантическое версионирование

```bash
# Установка semantic-release
npm install -g semantic-release

# Автоматическое определение версии
semantic-release
```

### Commitlint проверка

```bash
# Установка commitlint
npm install --save-dev @commitlint/cli @commitlint/config-conventional

# Конфигурация .commitlintrc.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert'
      ]
    ]
  }
}
```

## Workflow в команде

### Процесс разработки

1. **Создание feature branch**

   ```bash
   git checkout -b feat/product-search
   ```

2. **Коммиты в процессе разработки**

   ```bash
   feat(entities): add product search model
   feat(api): implement search endpoint
   test(api): add search endpoint tests
   docs(api): document search parameters
   ```

3. **Squash коммитов перед merge**

   ```bash
   git rebase -i HEAD~3
   # Выбрать squash для объединения коммитов
   ```

4. **Merge в main с conventional commit**
   ```bash
   git checkout main
   git merge --no-ff feat/product-search
   # Редактировать commit message в conventional format
   ```

### Code Review процесс

1. **Проверка commit messages** на соответствие conventional commits
2. **Проверка scope** на соответствие FSD архитектуре
3. **Валидация breaking changes** с описанием миграции
4. **Проверка CHANGELOG** на корректность

## Инструменты и автоматизация

### Pre-commit hooks

```bash
# Установка husky
npm install --save-dev husky

# Настройка pre-commit hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit $1'
```

### GitHub Actions

```yaml
name: Conventional Commits
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install dependencies
        run: npm ci
      - name: Lint commit messages
        run: npx commitlint --from HEAD~1 --to HEAD --verbose
```

## Troubleshooting

### Частые ошибки

1. **Неправильный type**

   ```bash
   # Неправильно
   git commit -m "added new feature"

   # Правильно
   git commit -m "feat: add new feature"
   ```

2. **Заглавная буква в description**

   ```bash
   # Неправильно
   git commit -m "feat: Add new feature"

   # Правильно
   git commit -m "feat: add new feature"
   ```

3. **Отсутствие scope для FSD**

   ```bash
   # Неправильно
   git commit -m "feat: add product component"

   # Правильно
   git commit -m "feat(entities): add product component"
   ```

### Исправление коммитов

```bash
# Изменение последнего коммита
git commit --amend -m "feat(entities): add product validation"

# Интерактивный rebase для изменения истории
git rebase -i HEAD~3

# Force push (только для feature branches!)
git push --force-with-lease origin feature-branch
```

## Ссылки

- [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/)
- [Semantic Versioning](https://semver.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Commitlint Configuration](https://commitlint.js.org/#/reference-configuration)

---

_Последнее обновление: $(date)_

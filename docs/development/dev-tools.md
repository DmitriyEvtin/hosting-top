# Инструменты разработки

## Обзор

Проект настроен с современными инструментами разработки для обеспечения качества кода, соблюдения архитектурных принципов FSD и автоматизации процессов разработки.

## Настроенные инструменты

### ESLint

- **Конфигурация**: `eslint.config.mjs`
- **Правила**: Next.js, TypeScript, Prettier интеграция
- **FSD правила**: Настроены для проверки архитектуры Feature-Sliced Design
- **Команды**:
  - `npm run lint` - проверка кода
  - `npm run lint:fix` - автоматическое исправление

### Prettier

- **Конфигурация**: `.prettierrc`
- **Игнорирование**: `.prettierignore`
- **Настройки**: Единообразное форматирование кода
- **Команды**:
  - `npm run format` - форматирование кода
  - `npm run format:check` - проверка форматирования

### Husky

- **Pre-commit hook**: Автоматический запуск lint-staged перед коммитом
- **Конфигурация**: `.husky/pre-commit`
- **Функции**: Проверка и исправление кода перед коммитом

### lint-staged

- **Конфигурация**: `.lintstagedrc.json`
- **Функции**: Запуск ESLint и Prettier только для измененных файлов
- **Оптимизация**: Быстрая проверка только измененного кода

### Steiger (FSD Architecture)

- **Конфигурация**: `steiger.config.json`
- **Функции**: Проверка соблюдения принципов Feature-Sliced Design
- **Правила**: layer-imports, public-api, relative-path
- **Команда**: `npm run steiger`

### VS Code

- **Настройки**: `.vscode/settings.json`
- **Расширения**: `.vscode/extensions.json`
- **Функции**: Автоформатирование, автодополнение, интеграция с инструментами

## Скрипты package.json

```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "steiger": "steiger",
    "prepare": "husky install"
  }
}
```

## Workflow разработки

### 1. Разработка

- VS Code автоматически форматирует код при сохранении
- ESLint показывает ошибки в реальном времени
- TypeScript проверяет типы

### 2. Коммит

- Husky запускает pre-commit hook
- lint-staged проверяет только измененные файлы
- ESLint и Prettier автоматически исправляют код
- Коммит блокируется при наличии ошибок

### 3. Проверка архитектуры

- Steiger проверяет соблюдение FSD принципов
- Валидация импортов между слоями
- Проверка публичного API

## Конфигурация FSD

### Слои (Layers)

- `app` - может импортировать только из `shared`
- `pages` - может импортировать из `widgets`, `features`, `entities`, `shared`
- `widgets` - может импортировать из `features`, `entities`, `shared`
- `features` - может импортировать из `entities`, `shared`
- `entities` - может импортировать только из `shared`
- `shared` - не может импортировать из других слоев

### Сегменты (Segments)

- `ui` - UI компоненты
- `api` - API функции
- `model` - Бизнес логика
- `lib` - Утилиты
- `config` - Конфигурация

## Рекомендации

### Для разработчиков

1. Установите рекомендуемые VS Code расширения
2. Используйте `npm run lint:fix` для исправления ошибок
3. Запускайте `npm run steiger` для проверки архитектуры
4. Следуйте принципам FSD при создании новых компонентов

### Для команды

1. Все коммиты проходят автоматическую проверку
2. Код автоматически форматируется
3. Архитектурные нарушения блокируют коммиты
4. Единообразный стиль кода во всей команде

## Troubleshooting

### ESLint ошибки

```bash
npm run lint:fix
```

### Prettier ошибки

```bash
npm run format
```

### TypeScript ошибки

```bash
npm run type-check
```

### Steiger ошибки

```bash
npm run steiger
```

## Обновление инструментов

### ESLint

```bash
npm update eslint eslint-config-next eslint-config-prettier eslint-plugin-prettier
```

### Prettier

```bash
npm update prettier
```

### Husky

```bash
npm update husky lint-staged
```

### Steiger

```bash
npm update steiger @feature-sliced/steiger-plugin
```

## Интеграция с CI/CD

Все инструменты интегрированы в GitHub Actions workflow:

- ESLint проверка
- Prettier проверка
- TypeScript проверка
- Steiger проверка архитектуры

Это обеспечивает единообразное качество кода во всей команде и автоматическую проверку при каждом PR.

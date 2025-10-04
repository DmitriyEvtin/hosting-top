# Тестовая конфигурация

## Переменные окружения для тестирования

Создайте файл `.env.test` в корне проекта со следующими переменными:

```env
# Test environment variables
NODE_ENV=test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parket_crm_test"
NEXTAUTH_SECRET="test-secret-key-for-ci"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3 Test Configuration (using localstack or mock)
AWS_ACCESS_KEY_ID="test-access-key"
AWS_SECRET_ACCESS_KEY="test-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="test-bucket"

# Redis Test Configuration
REDIS_URL="redis://localhost:6379"

# Sentry Test Configuration
SENTRY_DSN=""
SENTRY_ENVIRONMENT="test"
```

## Настройка тестовой базы данных

### Локальная разработка

1. Запустите PostgreSQL через Docker:

```bash
docker-compose up -d postgres
```

2. Создайте тестовую базу данных:

```bash
createdb parket_crm_test
```

3. Запустите миграции:

```bash
npm run db:migrate
```

4. Заполните тестовыми данными:

```bash
npm run db:seed
```

### CI/CD окружение

В GitHub Actions используется встроенный PostgreSQL сервис с автоматической настройкой.

## Покрытие кода

### Настройка

Покрытие кода настраивается в `jest.config.js`:

- **Минимальный порог:** 70% для всех метрик
- **Отчеты:** text, lcov, html, json
- **Директория:** `coverage/`

### Запуск

```bash
# Локально
npm run test:coverage

# В CI/CD
npm run test:ci
```

### Исключения из покрытия

- API routes (`src/app/**/route.ts`)
- Layout файлы (`src/app/**/layout.tsx`)
- Page файлы (`src/app/**/page.tsx`)
- Тестовые файлы (`src/**/__tests__/**`)
- Утилиты тестирования (`src/**/test-utils/**`)

## Sentry интеграция

### Настройка для тестов

1. Создайте проект в Sentry
2. Получите DSN для тестового окружения
3. Добавьте переменные в `.env.test`

### Мониторинг тестов

Sentry будет автоматически отслеживать:

- Ошибки в тестах
- Производительность тестов
- Статистику выполнения

## GitHub Actions

### Workflow файл

Основной workflow находится в `.github/workflows/test.yml` и включает:

1. **Проверка кода:**
   - Linting
   - Type checking
   - Unit тесты
   - Integration тесты
   - E2E тесты

2. **Сборка:**
   - Проверка сборки приложения
   - Загрузка артефактов

3. **Покрытие кода:**
   - Генерация отчетов
   - Загрузка в Codecov

### Триггеры

- Push в main/master/develop
- Pull requests в main/master/develop

### Сервисы

- PostgreSQL 15
- Автоматическая настройка тестовой БД
- Миграции и seed данные

# Архитектура проекта "Каталог металлопроката"

## Обзор

Проект построен на основе Feature-Sliced Design (FSD) архитектуры с использованием Next.js 15, React 19, TypeScript 5, Tailwind CSS 4 и shadcn/ui компонентов.

## Технологический стек

### Frontend

- **Next.js 15** - React фреймворк с App Router
- **React 19** - UI библиотека
- **TypeScript 5** - Типизация
- **Tailwind CSS 4** - Стилизация
- **shadcn/ui** - UI компоненты

### Backend

- **PostgreSQL** - Основная база данных
- **Prisma ORM** - Работа с базой данных
- **Redis** - Кэширование и сессии
- **NextAuth.js** - Аутентификация

### Парсинг и обработка данных

- **Puppeteer** - Автоматизация браузера
- **Cheerio** - Парсинг HTML
- **Axios** - HTTP клиент

### Cloud и DevOps

- **AWS S3** - Хранение изображений
- **CloudFront** - CDN
- **Docker** - Контейнеризация
- **Docker Registry** - Хранение Docker образов
- **Traefik** - Reverse proxy и load balancer
- **GitHub Actions** - CI/CD

## Структура проекта (FSD)

```
src/
├── app/                          # Next.js App Router + FSD App layer
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   └── api/                     # API routes
│       └── config/              # Configuration endpoints
├── pages/                       # FSD Pages layer
│   └── home/                    # Home page slice
│       ├── ui/
│       │   └── HomePage/        # Home page components
│       └── index.ts
├── widgets/                     # FSD Widgets layer (будущее)
├── features/                    # FSD Features layer (будущее)
├── entities/                    # FSD Entities layer (будущее)
└── shared/                      # FSD Shared layer
    ├── ui/                      # Shared UI components
    │   ├── Button/
    │   ├── Card/
    │   └── index.ts
    ├── api/                     # Shared API utilities
    │   └── database/            # Database configuration
    └── lib/                     # Shared utilities
        ├── env.ts               # Environment variables
        ├── auth-config.ts       # Authentication configuration
        ├── aws-config.ts       # AWS S3 configuration
        ├── parsing-config.ts    # Parsing configuration
        ├── database-test.ts    # Database testing utilities
        ├── utils.ts            # General utilities
        └── index.ts            # Exports
```

## Переменные окружения

### Основные переменные

```bash
# Основные настройки
NODE_ENV="development"
APP_NAME="Каталог металлопроката"
APP_VERSION="1.0.0"

# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Redis
REDIS_URL="redis://localhost:6379"

# Аутентификация
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="eu-west-1"
AWS_S3_BUCKET=""
CLOUDFRONT_DOMAIN=""

# Парсинг
PARSING_BATCH_SIZE="10"
PARSING_DELAY_MS="1000"
PARSING_MAX_RETRIES="3"

# Мониторинг
SENTRY_DSN=""
LOG_LEVEL="debug"

# Email
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="noreply@rolled-metal.local"

# Безопасность
CORS_ORIGIN="http://localhost:3000"
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW_MS="900000"
```

### Валидация переменных

Все переменные окружения валидируются с помощью Zod схем в `src/shared/lib/env.ts`:

```typescript
import { env, isDevelopment, hasAws } from "@/shared/lib/env";

// Типизированные переменные
console.log(env.DATABASE_URL);
console.log(env.NODE_ENV);

// Утилиты для проверки
if (isDevelopment) {
  console.log("Development mode");
}

if (hasAws) {
  console.log("AWS S3 configured");
}
```

## Конфигурация сервисов

### 1. База данных (PostgreSQL + Prisma)

```typescript
// src/shared/api/database/client.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export { prisma };
```

### 2. Аутентификация (NextAuth.js)

```typescript
// src/shared/lib/auth-config.ts
export const authConfig: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  url: env.NEXTAUTH_URL,
  providers: [
    // Email провайдер
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
};
```

### 3. AWS S3 (хранение изображений)

```typescript
// src/shared/lib/aws-config.ts
export const s3Config: S3ClientConfig = {
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  },
};
```

### 4. Парсинг данных

```typescript
// src/shared/lib/parsing-config.ts
export const parsingConfig = {
  baseUrl: "https://bvb-alyans.ru",
  batch: {
    size: env.PARSING_BATCH_SIZE,
    delay: env.PARSING_DELAY_MS,
    maxRetries: env.PARSING_MAX_RETRIES,
  },
  browser: {
    userAgent: env.PARSING_USER_AGENT,
    headless: true,
  },
};
```

## API Endpoints

### Конфигурация

- `GET /api/config/check` - Проверка статуса конфигурации
- `HEAD /api/config/check` - Health check

### База данных

- `GET /api/database/test` - Тестирование подключения к БД

## Мониторинг и логирование

### Статус системы

Главная страница отображает статус всех сервисов:

- База данных
- Redis
- AWS S3
- SMTP
- Sentry

### Логирование

```typescript
// Разные уровни логирования для разных окружений
const logLevel = env.LOG_LEVEL; // 'error', 'warn', 'info', 'debug'

// Валидация для production
if (env.NODE_ENV === "production") {
  validateProductionEnv();
}
```

## Безопасность

### Валидация переменных

- Все переменные валидируются при запуске
- Критические переменные проверяются для production
- Секретные ключи не логируются

### CORS и Rate Limiting

```typescript
// Настройки безопасности
CORS_ORIGIN = "http://localhost:3000";
RATE_LIMIT_MAX = "100";
RATE_LIMIT_WINDOW_MS = "900000";
```

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Code Quality (`code-quality.yml`)

- Проверка FSD архитектуры
- Линтинг и форматирование
- Проверка типов
- Unit и integration тесты
- Покрытие кода

#### 2. Docker Build (`docker-build.yml`)

- Сборка Docker образов
- Отправка в GitHub Container Registry
- Сканирование безопасности (Trivy)
- Multi-platform сборка

#### 3. Deploy (`deploy.yml`)

- Автоматический деплой в staging
- Деплой в production по тегам
- Health checks
- Rollback при ошибках

#### 4. Monitoring (`monitoring.yml`)

- Периодические health checks
- Performance тесты
- Security сканирование
- Генерация отчетов

### Docker Configuration

#### Production Dockerfile

```dockerfile
# Multi-stage build для оптимизации
FROM node:24-alpine AS base
FROM base AS deps
FROM base AS builder
FROM base AS runner

# Standalone режим Next.js
# Health checks
# Security (non-root user)
```

#### Docker Compose

```yaml
# Development: docker-compose.yml
# Production: docker-compose.prod.yml
# Health checks для всех сервисов
# Volume persistence
# Network isolation
```

## Развертывание

### Development

```bash
# Установка зависимостей
npm install

# Настройка переменных окружения
cp env.example .env.local

# Запуск базы данных
make dev

# Или вручную
docker compose up -d postgres redis
npm run dev
```

### Production

```bash
# Настройка переменных окружения
cp .env.production.example .env.production
# Заполните реальными значениями

# Запуск production окружения
make prod-up

# Или вручную
docker compose -f docker-compose.prod.yml up -d

# Применение миграций
make db-migrate

# Проверка здоровья
make health
```

### Docker Commands

```bash
# Сборка образов
make build

# Отправка в registry
make push

# Тестирование
make test-docker

# Мониторинг
make logs
make health

# Очистка
make clean
```

### Docker Registry

```bash
# Управление Registry
make registry-up          # Запуск Registry
make registry-down        # Остановка Registry
make registry-logs        # Просмотр логов
make registry-status      # Проверка статуса

# Работа с образами
make registry-login       # Логин в Registry
make registry-push        # Отправка образов
make registry-pull        # Загрузка образов
```

Registry доступен по адресу: `https://registry.evtin.ru`

### Environment Variables

См. [Environment Variables Documentation](./deployment/environment-variables.md) для полного списка переменных окружения.

## Следующие шаги

1. **Этап 2**: Настройка тестирования
2. **Этап 3**: Настройка CI/CD
3. **Этап 4**: Разработка парсера
4. **Этап 5**: Расширение схемы БД

## Документация

- [Настройка переменных окружения](./development/environment-setup.md)
- [Настройка базы данных](./database-setup.md)
- [FSD структура](./architecture/fsd-structure.md)
- [API дизайн](./architecture/api-design.md)
- [Схема базы данных](./architecture/database-schema.md)
- [Docker Registry](./deployment/docker-registry.md)
- [Traefik Configuration](./deployment/traefik.md)

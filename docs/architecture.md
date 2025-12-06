# Архитектура проекта "Hosting Top"

## Обзор

Проект построен на основе Feature-Sliced Design (FSD) архитектуры версии 2.1+ с использованием Next.js 15, React 19, TypeScript 5, Tailwind CSS 4 и shadcn/ui компонентов.

## Технологический стек

### Frontend

- **Next.js 15** - React фреймворк с App Router
- **React 19** - UI библиотека
- **TypeScript 5** - Типизация
- **Tailwind CSS 4** - Стилизация с поддержкой темной темы
- **shadcn/ui** - UI компоненты
- **Lucide React** - Иконки

### Backend

- **PostgreSQL** - Основная база данных
- **Prisma ORM** - Работа с базой данных
- **Redis** - Кэширование и сессии
- **NextAuth.js** - Аутентификация с поддержкой OAuth провайдеров

### Cloud и DevOps

- **AWS S3** - Хранение изображений
- **CloudFront** - CDN
- **Docker** - Контейнеризация
- **Docker Registry** - Хранение Docker образов
- **Traefik** - Reverse proxy и load balancer
- **GitHub Actions** - CI/CD

### Конфигурация изображений

- **Next.js Image Optimization** - Автоматическая оптимизация изображений
- **S3 Integration** - Поддержка внешних доменов для изображений
- **Remote Patterns** - Гибкая настройка доменов с wildcards
- **Format Support** - WebP и AVIF для лучшей производительности

## Структура проекта (FSD)

```
src/
├── app/                          # Next.js App Router + FSD App layer
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   └── api/                     # API routes
│       └── config/              # Configuration endpoints
├── views/                       # FSD Views layer (переименован из pages для избежания конфликтов с Next.js)
│   ├── home/                    # Home page slice
│   │   ├── ui/
│   │   │   ├── Homepage/         # Public home page component
│   │   │   │   ├── Homepage.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── manager/                  # Manager pages slice
│   │   └── dashboard/            # Manager dashboard slice
│   │       ├── ui/
│   │       │   ├── ManagerDashboardPage/  # Manager dashboard page component
│   │       │   │   ├── ManagerDashboardPage.tsx
│   │       │   │   └── index.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   ├── admin/                    # Admin pages slice
│   └── auth/                     # Auth pages slice
├── widgets/                     # FSD Widgets layer (будущее)
├── features/                    # FSD Features layer (будущее)
├── entities/                    # FSD Entities layer (будущее)
└── shared/                      # FSD Shared layer
    ├── ui/                      # Shared UI components
    │   ├── Button/
    │   │   ├── Button.tsx
    │   │   └── index.ts
    │   ├── Card/
    │   │   ├── Card.tsx
    │   │   └── index.ts
    │   ├── ThemeToggle/         # Theme toggle component
    │   │   ├── ThemeToggle.tsx
    │   │   └── index.ts
    │   └── index.ts
    ├── api/                     # Shared API utilities
    │   └── database/            # Database configuration
    └── lib/                     # Shared utilities
        ├── env.ts               # Environment variables
        ├── auth-config.ts       # Authentication configuration
        ├── auth-providers/      # OAuth providers
        │   ├── vk-provider.ts   # VKontakte OAuth
        │   ├── ok-provider.ts   # Одноклассники OAuth
        │   ├── mail-provider.ts # Mail.ru OAuth
        │   └── yandex-provider.ts # Yandex OAuth
        ├── aws-config.ts       # AWS S3 configuration
        ├── database-test.ts    # Database testing utilities
        ├── theme-context.tsx    # Theme management context
        ├── utils.ts            # General utilities
        └── index.ts            # Exports
```

## Структура компонентов

### Правила организации компонентов

Каждый компонент должен быть организован в отдельной папке со следующей структурой:

```
ComponentName/
├── ComponentName.tsx    # Основной файл компонента
└── index.ts            # Экспорт для чистых импортов
```

### Примеры структуры

**Shared UI компоненты:**

```
src/shared/ui/Button/
├── Button.tsx          # export function Button() { ... }
└── index.ts            # export { Button } from "./Button";
```

**Page компоненты:**

```
src/views/manager/dashboard/ui/ManagerDashboardPage/
├── ManagerDashboardPage.tsx        # export function ManagerDashboardPage() { ... }
└── index.ts            # export { ManagerDashboardPage } from "./ManagerDashboardPage";
```

### Правила экспорта

- **Pages layer**: `index.ts` экспортирует только основной компонент страницы
- **Shared layer**: `index.ts` экспортирует все доступные компоненты
- **Компоненты**: Импортируются напрямую из своих папок в родительских компонентах

### Преимущества такой структуры

1. **Модульность** - каждый компонент изолирован в своей папке
2. **Чистые импорты** - использование index.ts для упрощения импортов
3. **Масштабируемость** - легко добавлять новые компоненты
4. **FSD соответствие** - структура соответствует принципам Feature-Sliced Design

## Переменные окружения

### Основные переменные

```bash
# Основные настройки
NODE_ENV="development"
APP_NAME="Hosting Top"
APP_VERSION="1.0.0"

# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Redis
REDIS_URL="redis://localhost:6379"

# Аутентификация
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth провайдеры
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Российские OAuth провайдеры
VK_CLIENT_ID=""
VK_CLIENT_SECRET=""
OK_CLIENT_ID=""
OK_CLIENT_SECRET=""
MAIL_CLIENT_ID=""
MAIL_CLIENT_SECRET=""
YANDEX_CLIENT_ID=""
YANDEX_CLIENT_SECRET=""

# AWS S3
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="eu-west-1"
AWS_S3_BUCKET=""
CLOUDFRONT_DOMAIN=""


# Мониторинг
SENTRY_DSN=""
LOG_LEVEL="debug"

# Email
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="noreply@parket-crm.local"

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
    // Credentials провайдер для email/password
    CredentialsProvider({...}),

    // Международные OAuth провайдеры
    GoogleProvider({...}),
    GitHubProvider({...}),

    // Российские OAuth провайдеры
    VKProvider({...}),
    OKProvider({...}),
    MailProvider({...}),
    YandexProvider({...}),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  callbacks: {
    // Обработка OAuth входов
    async signIn({ user, account }) {
      // Создание пользователя при первом OAuth входе
    },
    // Передача роли в сессию
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    },
  },
};
```

#### Поддерживаемые OAuth провайдеры

- **Google** - Международный поисковик
- **GitHub** - Платформа для разработчиков
- **VKontakte** - Российская социальная сеть
- **Одноклассники** - Российская социальная сеть
- **Mail.ru** - Российский почтовый сервис
- **Yandex** - Российский поисковик

Подробная документация: [OAuth Setup Guide](./security/oauth-setup.md)

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

## Система переключения темы

### Архитектура темы

Проект включает полноценную систему переключения между светлой и темной темами:

#### Компоненты темы

- **ThemeProvider** (`src/shared/lib/theme-context.tsx`) - Контекст для управления темой
- **ThemeToggle** (`src/shared/ui/ThemeToggle/`) - Компонент переключателя темы
- **CSS переменные** - Определены в `src/app/globals.css` для обеих тем

#### Функциональность

- Автоматическое определение системной темы
- Сохранение выбора пользователя в localStorage
- Плавные анимации переключения
- Поддержка accessibility (ARIA атрибуты)
- Интеграция с Tailwind CSS через CSS переменные

#### Использование

```tsx
import { useTheme } from "@/shared/lib/theme-context";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

// Хук для управления темой
const { theme, setTheme, toggleTheme } = useTheme();

// Компонент переключателя
<ThemeToggle />;
```

Подробная документация: [Theme System Documentation](./development/theme-system.md)

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

# Запуск сервиса миграций
make db-migrate

# Только применение миграций
make db-migrate-only

# Проверка состояния базы данных
make db-check

# Исправление проблем с базой данных
make db-fix

# Статус миграций
make db-status

# Логи миграций
make db-logs

# Проверка здоровья
make health
```

### Environment Variables

См. [Environment Variables Documentation](./deployment/environment-variables.md) для полного списка переменных окружения.

### Docker Configuration

Подробная информация о Docker конфигурации доступна в [Docker Documentation](./deployment/docker.md).

## Следующие шаги

1. **Этап 2**: Настройка тестирования
2. **Этап 3**: Настройка CI/CD
3. **Этап 5**: Расширение схемы БД

## Документация

- [Настройка переменных окружения](./development/environment-setup.md)
- [Настройка базы данных](./database-setup.md)
- [FSD структура](./architecture/fsd-structure.md)
- [API дизайн](./architecture/api-design.md)
- [Схема базы данных](./architecture/database-schema.md)
- [Docker Registry](./deployment/docker-registry.md)
- [Traefik Configuration](./deployment/traefik.md)

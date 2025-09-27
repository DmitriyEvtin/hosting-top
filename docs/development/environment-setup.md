# Настройка переменных окружения

## Обзор

Данный документ описывает настройку переменных окружения для проекта "Каталог металлопроката". Все переменные окружения централизованы и валидируются с помощью Zod схем.

## Структура файлов

```
├── env.example                 # Пример всех переменных окружения
├── .env.development           # Переменные для разработки (создать вручную)
├── .env.staging              # Переменные для staging (создать вручную)
├── .env.production           # Переменные для production (создать вручную)
└── src/shared/lib/env.ts     # Валидация и типизация переменных
```

## Основные переменные

### 1. Основные настройки приложения

```bash
NODE_ENV="development"                    # Окружение: development, staging, production
APP_NAME="Каталог металлопроката"        # Название приложения
APP_VERSION="1.0.0"                      # Версия приложения
```

### 2. База данных

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"
```

**Настройка для разных окружений:**

- **Development:** `postgresql://rolled_metal_user:rolled_metal_password@localhost:5432/rolled_metal`
- **Staging:** `postgresql://user:password@staging-db:5432/rolled_metal_staging`
- **Production:** `postgresql://user:password@prod-db:5432/rolled_metal_prod`

### 3. Redis (кэширование)

```bash
REDIS_URL="redis://localhost:6379"       # URL Redis сервера (опционально)
```

### 4. Аутентификация (NextAuth.js)

```bash
NEXTAUTH_SECRET="your-secret-key-here"   # Секретный ключ (минимум 32 символа)
NEXTAUTH_URL="http://localhost:3000"     # URL приложения
```

**Важно:** Для production обязательно измените `NEXTAUTH_SECRET` на уникальное значение!

### 5. AWS S3 (хранение изображений)

```bash
AWS_ACCESS_KEY_ID=""                    # AWS Access Key ID
AWS_SECRET_ACCESS_KEY=""                # AWS Secret Access Key
AWS_REGION="eu-west-1"                  # AWS регион
AWS_S3_BUCKET=""                        # Название S3 bucket
CLOUDFRONT_DOMAIN=""                    # CloudFront домен (опционально)
```

### 6. Настройки парсинга

```bash
PARSING_BATCH_SIZE="10"                 # Размер батча для обработки
PARSING_DELAY_MS="1000"                 # Задержка между запросами (мс)
PARSING_MAX_RETRIES="3"                 # Максимальное количество повторов
PARSING_USER_AGENT="Mozilla/5.0..."     # User-Agent для парсинга
```

### 7. Мониторинг и логирование

```bash
SENTRY_DSN=""                           # Sentry DSN для мониторинга ошибок
LOG_LEVEL="debug"                       # Уровень логирования: error, warn, info, debug
```

### 8. Email (уведомления)

```bash
SMTP_HOST=""                            # SMTP сервер
SMTP_PORT="587"                         # SMTP порт
SMTP_USER=""                            # SMTP пользователь
SMTP_PASSWORD=""                        # SMTP пароль
SMTP_FROM="noreply@rolled-metal.local"  # Email отправителя
```

### 9. Безопасность

```bash
CORS_ORIGIN="http://localhost:3000"      # Разрешенные домены для CORS
RATE_LIMIT_MAX="100"                    # Максимальное количество запросов
RATE_LIMIT_WINDOW_MS="900000"            # Окно для rate limiting (мс)
```

## Настройка для разных окружений

### Development

```bash
# Скопируйте env.example в .env.development
cp env.example .env.development

# Отредактируйте переменные для локальной разработки
# Основные настройки уже готовы для development
```

### Staging

```bash
# Создайте .env.staging
cp env.example .env.staging

# Обновите переменные для staging окружения
NODE_ENV="staging"
DATABASE_URL="postgresql://user:password@staging-db:5432/rolled_metal_staging"
NEXTAUTH_URL="https://staging.rolled-metal.com"
AWS_S3_BUCKET="rolled-metal-staging"
```

### Production

```bash
# Создайте .env.production
cp env.example .env.production

# Обновите переменные для production окружения
NODE_ENV="production"
DATABASE_URL="postgresql://user:password@prod-db:5432/rolled_metal_prod"
NEXTAUTH_URL="https://rolled-metal.com"
NEXTAUTH_SECRET="your-production-secret-key-here"
AWS_S3_BUCKET="rolled-metal-prod"
```

## Валидация переменных

Все переменные окружения автоматически валидируются при запуске приложения:

```typescript
import { env, validateProductionEnv } from "@/shared/lib/env";

// Переменные уже валидированы и типизированы
console.log(env.DATABASE_URL);
console.log(env.NODE_ENV);

// Дополнительная валидация для production
validateProductionEnv();
```

## Утилиты для работы с окружением

```typescript
import {
  isDevelopment,
  isStaging,
  isProduction,
  hasRedis,
  hasAws,
  hasSmtp,
  hasSentry,
} from "@/shared/lib/env";

// Проверка окружения
if (isDevelopment) {
  console.log("Режим разработки");
}

// Проверка доступности сервисов
if (hasAws) {
  console.log("AWS S3 доступен");
}
```

## Безопасность

### Критические переменные для production

Следующие переменные обязательны для production:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### Рекомендации по безопасности

1. **Никогда не коммитьте .env файлы в git**
2. **Используйте разные секреты для разных окружений**
3. **Регулярно ротируйте секретные ключи**
4. **Ограничьте доступ к production переменным**

## Troubleshooting

### Ошибка валидации переменных

```
Ошибка валидации переменных окружения:
DATABASE_URL: DATABASE_URL должен быть валидным URL
```

**Решение:** Проверьте формат DATABASE_URL и убедитесь, что он начинается с `postgresql://`

### Ошибка NEXTAUTH_SECRET

```
NEXTAUTH_SECRET должен содержать минимум 32 символа
```

**Решение:** Сгенерируйте новый секретный ключ:

```bash
# Генерация случайного ключа
openssl rand -base64 32
```

### Ошибка AWS конфигурации

```
AWS S3 недоступен: AccessDenied
```

**Решение:** Проверьте AWS credentials и права доступа к S3 bucket.

## Мониторинг

### Логирование

Все переменные окружения логируются при запуске (только в development):

```typescript
// В development режиме
console.log("Environment variables loaded:", {
  NODE_ENV: env.NODE_ENV,
  DATABASE_URL: env.DATABASE_URL ? "Set" : "Not set",
  AWS_S3_BUCKET: env.AWS_S3_BUCKET || "Not set",
});
```

### Проверка конфигурации

```typescript
import { checkAwsAvailability } from "@/shared/lib/aws-config";

// Проверка доступности AWS
const awsAvailable = await checkAwsAvailability();
console.log("AWS доступен:", awsAvailable);
```

## Следующие шаги

1. Скопируйте `env.example` в `.env.development`
2. Настройте переменные для вашего окружения
3. Запустите приложение и проверьте логи
4. Настройте переменные для staging и production окружений

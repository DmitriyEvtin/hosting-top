# Sentry Setup Guide

## Обзор

Sentry - это платформа для мониторинга ошибок и производительности приложений. В проекте настроена интеграция с Sentry для отслеживания ошибок как на клиенте, так и на сервере.

## Быстрый старт

### 1. Создание проекта в Sentry

1. Зайдите на [sentry.io](https://sentry.io)
2. Создайте новый проект
3. Выберите платформу "Next.js"
4. Получите DSN из настроек проекта

### 2. Настройка переменных окружения

```bash
# Sentry DSN для серверной части
SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project-id"

# Sentry DSN для клиентской части (публичный)
NEXT_PUBLIC_SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project-id"

# Sentry организация и проект (опционально)
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

### 3. Проверка работы

```bash
# Запуск приложения
npm run dev

# Тестирование Sentry
curl http://localhost:3000/api/sentry-test
```

## Конфигурация

### Файлы конфигурации

Проект уже содержит настроенные файлы:

- `sentry.client.config.ts` - для клиентской части
- `sentry.server.config.ts` - для серверной части
- `next.config.ts` - обновлен для интеграции с Sentry

### Настройка клиентской части

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: process.env.NODE_ENV === "development",
});
```

### Настройка серверной части

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: process.env.NODE_ENV === "development",
});
```

## API Endpoints

### GET /api/sentry-test

Тестирование отправки ошибки в Sentry.

**Ответ:**

```json
{
  "success": true,
  "message": "Test error sent to Sentry"
}
```

### POST /api/sentry-test

Отправка кастомного события в Sentry.

**Параметры:**

```json
{
  "message": "Тестовое сообщение"
}
```

**Ответ:**

```json
{
  "success": true,
  "message": "Custom event sent to Sentry"
}
```

## Мониторинг

### Отслеживаемые события

Sentry автоматически отслеживает:

- **JavaScript ошибки** - Ошибки в браузере
- **API ошибки** - Ошибки серверных запросов
- **Performance метрики** - Web Vitals, время загрузки
- **Пользовательские события** - Кастомные события
- **Breadcrumbs** - История действий пользователя

### Уровни логирования

```typescript
// Разные уровни для разных окружений
const logLevel = env.LOG_LEVEL; // 'error', 'warn', 'info', 'debug'

// Валидация для production
if (env.NODE_ENV === "production") {
  validateProductionEnv();
}
```

## Использование в коде

### Отправка ошибок

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Ваш код
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### Отправка кастомных событий

```typescript
import * as Sentry from "@sentry/nextjs";

// Отправка события
Sentry.captureMessage("Пользователь выполнил действие", "info");

// Отправка с дополнительными данными
Sentry.captureMessage("Ошибка валидации", "error", {
  extra: {
    formData: formData,
    userId: user.id,
  },
});
```

### Добавление контекста

```typescript
import * as Sentry from "@sentry/nextjs";

// Добавление пользователя
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Добавление тегов
Sentry.setTag("page", "product-page");
Sentry.setTag("action", "add-to-cart");

// Добавление дополнительных данных
Sentry.setContext("product", {
  id: product.id,
  name: product.name,
  price: product.price,
});
```

## Тестирование

### Проверка переменных окружения

```bash
echo $SENTRY_DSN
echo $NEXT_PUBLIC_SENTRY_DSN
```

### Проверка логов

В development режиме Sentry будет логировать события в консоль:

```
Sentry Event: { ... }
Sentry Server Event: { ... }
```

### Проверка Dashboard

- Зайдите в ваш проект Sentry
- Перейдите в Issues
- Должны появиться тестовые ошибки

## Troubleshooting

### "Sentry is not defined"

Убедитесь, что файлы конфигурации находятся в корне проекта:

- `sentry.client.config.ts`
- `sentry.server.config.ts`

### "DSN is invalid"

Проверьте формат DSN:

- ✅ `https://key@org.ingest.sentry.io/project`
- ❌ `http://key@ip:port/path`

### "Events not appearing"

- Проверьте, что переменные окружения загружены
- Убедитесь, что DSN правильный
- Проверьте, что проект в Sentry активен

## Production настройки

### Environment Variables

```bash
# Production DSN
SENTRY_DSN="https://your-production-key@your-org.ingest.sentry.io/your-project-id"
NEXT_PUBLIC_SENTRY_DSN="https://your-production-key@your-org.ingest.sentry.io/your-project-id"
```

### Мониторинг production

После настройки Sentry будет автоматически отслеживать:

- JavaScript ошибки
- Ошибки API
- Performance метрики
- Пользовательские события

Все события будут доступны в вашем Sentry Dashboard.

## Дополнительные настройки

### Фильтрация событий

```typescript
// Фильтрация по окружению
Sentry.init({
  beforeSend(event) {
    if (event.environment === "development") {
      return null; // Не отправлять в development
    }
    return event;
  },
});
```

### Настройка sampling

```typescript
// Настройка частоты отправки
Sentry.init({
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
```

### Интеграция с другими сервисами

```typescript
// Slack уведомления
Sentry.init({
  integrations: [
    new Sentry.Integrations.Slack({
      webhook: process.env.SLACK_WEBHOOK_URL,
    }),
  ],
});
```

## Мониторинг и алерты

### Настройка алертов

1. Зайдите в Sentry Dashboard
2. Перейдите в Settings → Alerts
3. Настройте правила для уведомлений
4. Добавьте email/Slack уведомления

### Метрики производительности

- **Web Vitals** - Core Web Vitals метрики
- **API Performance** - Время отклика API
- **Database Queries** - Производительность запросов
- **Memory Usage** - Использование памяти

## Документация

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Error Monitoring](https://docs.sentry.io/product/issues/)

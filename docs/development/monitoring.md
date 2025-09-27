# Мониторинг и логирование

[← Назад к документации](../README.md)

## Sentry - Централизованное логирование ошибок

### Обзор

Sentry используется для централизованного сбора, анализа и мониторинга ошибок в приложении. Это критически важный инструмент для поддержания стабильности системы и быстрого реагирования на проблемы.

### Настройка Sentry

#### 1. Установка зависимостей

```bash
npm install @sentry/nextjs
```

#### 2. Конфигурация Next.js

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
  integrations: [new Sentry.BrowserTracing()],
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### 3. Интеграция с Next.js

```typescript
// next.config.ts
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // ... ваша конфигурация
};

export default withSentryConfig(nextConfig, {
  org: "your-org",
  project: "your-project",
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
```

### Типы логируемых событий

#### 1. JavaScript ошибки

- Необработанные исключения
- Ошибки в React компонентах
- Ошибки в API роутах
- Ошибки парсинга данных

#### 2. Performance мониторинг

- Время загрузки страниц
- Медленные API запросы
- Производительность парсинга
- Время отклика базы данных

#### 3. Пользовательские события

- Ошибки аутентификации
- Проблемы с загрузкой изображений
- Ошибки валидации форм
- Проблемы с парсингом данных

### Конфигурация окружений

#### Development

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: "development",
  debug: true,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Фильтрация событий в development
    if (event.exception) {
      console.log("Sentry Event:", event);
    }
    return event;
  },
});
```

#### Production

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: "production",
  debug: false,
  tracesSampleRate: 0.1, // 10% трафика
  beforeSend(event) {
    // Фильтрация чувствительных данных
    if (event.user) {
      delete event.user.email;
    }
    return event;
  },
});
```

### Кастомные события

#### Логирование парсинга

```typescript
// src/shared/lib/sentry/parsing-logger.ts
import * as Sentry from "@sentry/nextjs";

export const logParsingError = (
  error: Error,
  context: {
    url: string;
    parserType: string;
    timestamp: Date;
  }
) => {
  Sentry.captureException(error, {
    tags: {
      component: "parser",
      parserType: context.parserType,
    },
    extra: {
      url: context.url,
      timestamp: context.timestamp.toISOString(),
    },
  });
};

export const logParsingSuccess = (data: {
  itemsCount: number;
  parserType: string;
  duration: number;
}) => {
  Sentry.addBreadcrumb({
    message: "Parsing completed successfully",
    category: "parser",
    level: "info",
    data: {
      itemsCount: data.itemsCount,
      parserType: data.parserType,
      duration: data.duration,
    },
  });
};
```

#### Логирование API ошибок

```typescript
// src/shared/lib/sentry/api-logger.ts
import * as Sentry from "@sentry/nextjs";

export const logApiError = (
  error: Error,
  context: {
    endpoint: string;
    method: string;
    statusCode?: number;
    userId?: string;
  }
) => {
  Sentry.captureException(error, {
    tags: {
      component: "api",
      endpoint: context.endpoint,
      method: context.method,
    },
    extra: {
      statusCode: context.statusCode,
      userId: context.userId,
    },
  });
};
```

### Интеграция с FSD архитектурой

#### Shared Layer

```typescript
// src/shared/lib/sentry/index.ts
export { logParsingError, logParsingSuccess } from "./parsing-logger";
export { logApiError } from "./api-logger";
export { captureException, addBreadcrumb } from "@sentry/nextjs";
```

#### Entities Layer

```typescript
// src/entities/product/api/product-service.ts
import { logApiError } from "@/shared/lib/sentry";

export class ProductService {
  async getProducts() {
    try {
      // ... логика получения продуктов
    } catch (error) {
      logApiError(error as Error, {
        endpoint: "/api/products",
        method: "GET",
      });
      throw error;
    }
  }
}
```

#### Features Layer

```typescript
// src/features/parsing/api/parser-service.ts
import { logParsingError, logParsingSuccess } from "@/shared/lib/sentry";

export class ParserService {
  async parseData(url: string) {
    const startTime = Date.now();
    try {
      // ... логика парсинга
      const result = await this.parse(url);

      logParsingSuccess({
        itemsCount: result.length,
        parserType: "metal-products",
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logParsingError(error as Error, {
        url,
        parserType: "metal-products",
        timestamp: new Date(),
      });
      throw error;
    }
  }
}
```

### Алерты и уведомления

#### Настройка алертов

- **Критические ошибки**: Немедленные уведомления
- **Парсинг ошибки**: Уведомления каждые 15 минут
- **Performance деградация**: Уведомления при превышении порогов
- **Новые типы ошибок**: Еженедельные отчеты

#### Интеграции

- **Slack**: Уведомления команды разработки
- **Email**: Отчеты для менеджмента
- **PagerDuty**: Критические инциденты

### Мониторинг производительности

#### Web Vitals

```typescript
// src/shared/lib/sentry/performance.ts
import * as Sentry from "@sentry/nextjs";

export const trackWebVitals = (metric: any) => {
  Sentry.addBreadcrumb({
    message: `Web Vital: ${metric.name}`,
    category: "performance",
    data: {
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
    },
  });
};
```

#### API Performance

```typescript
// src/shared/lib/sentry/api-performance.ts
import * as Sentry from "@sentry/nextjs";

export const trackApiPerformance = (endpoint: string, duration: number) => {
  if (duration > 5000) {
    // Медленные запросы > 5 сек
    Sentry.addBreadcrumb({
      message: "Slow API request detected",
      category: "performance",
      level: "warning",
      data: {
        endpoint,
        duration,
      },
    });
  }
};
```

### Безопасность и приватность

#### Фильтрация чувствительных данных

```typescript
// sentry.config.ts
export const sentryConfig = {
  beforeSend(event) {
    // Удаление чувствительных данных
    if (event.request?.cookies) {
      delete event.request.cookies;
    }

    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    return event;
  },
};
```

#### GDPR соответствие

- Анонимизация пользовательских данных
- Возможность удаления данных пользователя
- Согласие на обработку данных
- Локальное хранение в EU регионах

### Аналитика и отчеты

#### Дашборды

- **Обзор ошибок**: Топ ошибок по частоте
- **Performance метрики**: Время отклика и загрузки
- **Парсинг статистика**: Успешность и ошибки парсинга
- **Пользовательская активность**: Сессии и события

#### Автоматические отчеты

- **Еженедельные отчеты**: Статистика ошибок и производительности
- **Ежемесячные отчеты**: Тренды и рекомендации
- **Квартальные отчеты**: Анализ стабильности системы

### Troubleshooting

#### Частые проблемы

1. **Отсутствие событий в Sentry**
   - Проверить DSN конфигурацию
   - Убедиться в правильности environment переменных

2. **Дублирование событий**
   - Проверить настройки sample rate
   - Убедиться в отсутствии дублирования инициализации

3. **Медленная работа приложения**
   - Оптимизировать sample rate
   - Использовать асинхронную отправку событий

#### Диагностика

```typescript
// Диагностика Sentry
console.log("Sentry DSN:", process.env.NEXT_PUBLIC_SENTRY_DSN);
console.log("Sentry Environment:", process.env.NODE_ENV);
console.log("Sentry Debug:", process.env.SENTRY_DEBUG);
```

### Лучшие практики

1. **Структурированное логирование**: Используйте консистентные теги и контекст
2. **Фильтрация шума**: Настройте фильтры для избежания спама
3. **Контекстная информация**: Добавляйте релевантный контекст к ошибкам
4. **Performance мониторинг**: Отслеживайте критические метрики производительности
5. **Регулярный анализ**: Анализируйте данные для улучшения системы

## Docker Compose для мониторинга

### Обзор стека мониторинга

Проект включает полный стек мониторинга с использованием Docker Compose:

- **Grafana Loki** - Сбор и хранение логов
- **Promtail** - Агент для отправки логов в Loki (временно отключен)
- **Grafana** - Визуализация и дашборды
- **GoAccess** - Анализ access логов в реальном времени (временно отключен)

**Важно**: Вся конфигурация встроена в `docker-compose.monitoring.yml` и не требует внешних файлов из папки `monitoring/`.

### Запуск мониторинга

```bash
# Запуск стека мониторинга
docker-compose -f docker-compose.monitoring.yml up -d

# Проверка статуса
docker-compose -f docker-compose.monitoring.yml ps

# Просмотр логов
docker-compose -f docker-compose.monitoring.yml logs -f
```

### Доступ к сервисам

- **Grafana**: http://localhost:3001 (admin/admin123)
- **Loki**: http://localhost:3100
- **Promtail**: Временно отключен (проблемы с конфигурацией)
- **GoAccess**: Временно отключен (проблемы с конфигурацией)

### Конфигурация GoAccess

GoAccess настроен для анализа логов Traefik с поддержкой:

- Real-time HTML отчетов
- WebSocket соединений
- Формат логов COMBINED
- Автоматическое обновление данных

### Интеграция с Traefik

Мониторинг интегрирован с Traefik через общий volume `traefik-logs`:

- Автоматический сбор access логов
- Real-time анализ трафика
- Визуализация метрик производительности

### Troubleshooting мониторинга

#### Проблемы с образами Docker

Если возникают ошибки с загрузкой образов:

```bash
# Проверка доступности образов
docker pull grafana/loki:2.9.0
docker pull grafana/promtail:2.9.0
docker pull grafana/grafana:10.2.0
docker pull allinurl/goaccess:latest
```

#### Проблемы с volumes

```bash
# Создание внешнего volume для логов Traefik
docker volume create traefik-logs

# Проверка volumes
docker volume ls
```

#### Проблемы с сетью

```bash
# Создание сети мониторинга
docker network create monitoring

# Проверка сетей
docker network ls
```

---

_Документация по мониторингу и логированию обновлена: $(date)_

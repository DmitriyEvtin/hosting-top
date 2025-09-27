# Настройка Sentry для мониторинга ошибок

## Проблема

Вы указали `SENTRY_DNS="http://72ccbf0fc79dd8d0030979243fcf0ad7@90.156.168.6:9000/3"`, но ошибки не приходят в Sentry.

## Причины проблемы

### 1. Неправильное название переменной

- ❌ `SENTRY_DNS`
- ✅ `SENTRY_DSN`

### 2. Неправильный формат DSN

Ваш DSN выглядит как HTTP URL, но Sentry DSN должен иметь формат:

```
https://[key]@[organization].ingest.sentry.io/[project-id]
```

### 3. Отсутствует конфигурация Next.js

Sentry для Next.js требует специальных файлов конфигурации.

## Решение

### Шаг 1: Получите правильный DSN из Sentry

1. Зайдите в ваш проект Sentry
2. Перейдите в Settings → Projects → [Ваш проект] → Client Keys (DSN)
3. Скопируйте DSN в формате: `https://[key]@[organization].ingest.sentry.io/[project-id]`

### Шаг 2: Настройте переменные окружения

Создайте файл `.env.local` (или обновите существующий):

```bash
# Sentry DSN для серверной части
SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project-id"

# Sentry DSN для клиентской части (публичный)
NEXT_PUBLIC_SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project-id"

# Sentry организация и проект (опционально)
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

### Шаг 3: Проверьте конфигурацию

Файлы конфигурации уже созданы:

- `sentry.client.config.ts` - для клиентской части
- `sentry.server.config.ts` - для серверной части
- `next.config.ts` - обновлен для интеграции с Sentry

### Шаг 4: Тестирование

1. Запустите приложение:

```bash
npm run dev
```

2. Откройте в браузере:

```
http://localhost:3000/api/sentry-test
```

3. Проверьте в Sentry Dashboard, что ошибка появилась

### Шаг 5: Дополнительные тесты

#### Тест ошибки (GET запрос):

```bash
curl http://localhost:3000/api/sentry-test
```

#### Тест кастомного события (POST запрос):

```bash
curl -X POST http://localhost:3000/api/sentry-test \
  -H "Content-Type: application/json" \
  -d '{"message": "Тестовое сообщение"}'
```

## Проверка работоспособности

### 1. Проверьте переменные окружения

```bash
echo $SENTRY_DSN
echo $NEXT_PUBLIC_SENTRY_DSN
```

### 2. Проверьте логи приложения

В development режиме Sentry будет логировать события в консоль:

```
Sentry Event: { ... }
Sentry Server Event: { ... }
```

### 3. Проверьте Sentry Dashboard

- Зайдите в ваш проект Sentry
- Перейдите в Issues
- Должны появиться тестовые ошибки

## Возможные проблемы

### 1. "Sentry is not defined"

Убедитесь, что файлы конфигурации находятся в корне проекта:

- `sentry.client.config.ts`
- `sentry.server.config.ts`

### 2. "DSN is invalid"

Проверьте формат DSN:

- ✅ `https://key@org.ingest.sentry.io/project`
- ❌ `http://key@ip:port/path`

### 3. "Events not appearing"

- Проверьте, что переменные окружения загружены
- Убедитесь, что DSN правильный
- Проверьте, что проект в Sentry активен

## Дополнительная настройка

### Для production

```bash
SENTRY_DSN="https://your-production-key@your-org.ingest.sentry.io/your-project-id"
NEXT_PUBLIC_SENTRY_DSN="https://your-production-key@your-org.ingest.sentry.io/your-project-id"
```

### Для development

```bash
SENTRY_DSN="https://your-dev-key@your-org.ingest.sentry.io/your-project-id"
NEXT_PUBLIC_SENTRY_DSN="https://your-dev-key@your-org.ingest.sentry.io/your-project-id"
```

## Мониторинг

После настройки Sentry будет автоматически отслеживать:

- JavaScript ошибки
- Ошибки API
- Performance метрики
- Пользовательские события

Все события будут доступны в вашем Sentry Dashboard.

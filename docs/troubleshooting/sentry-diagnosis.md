# Диагностика Sentry

## Проблема: Логи не появляются в Sentry

### Возможные причины

1. **Неправильная конфигурация DSN**
2. **Проблемы с сетью/доступностью Sentry сервера**
3. **Неправильные переменные окружения**
4. **Проблемы с инициализацией Sentry**
5. **Фильтрация событий в beforeSend**

## Пошаговая диагностика

### 1. Проверка переменных окружения

```bash
# Проверить переменные окружения
echo $SENTRY_DSN
echo $NEXT_PUBLIC_SENTRY_DSN
echo $NODE_ENV
```

### 2. Проверка доступности Sentry сервера

```bash
# Использовать скрипт проверки подключения
make sentry-check

# Или вручную
node scripts/check-sentry-connection.js
```

### 3. Проверка конфигурации через API

```bash
# Запустить приложение
npm run dev

# Проверить диагностику Sentry
curl http://localhost:3000/api/sentry-diagnosis
```

### 4. Тестирование отправки событий

```bash
# Тест отправки ошибки
make sentry-test-error

# Тест отправки сообщения
make sentry-test-message

# Общий тест API
make sentry-test
```

## API Endpoints для диагностики

### GET /api/sentry-diagnosis

Возвращает информацию о конфигурации Sentry:

- Переменные окружения
- Состояние инициализации
- DSN конфигурация
- Результат тестового события

### POST /api/sentry-diagnosis

Отправляет принудительное тестовое событие в Sentry с дополнительной информацией.

### GET /api/sentry-test

Создает тестовую ошибку и отправляет её в Sentry.

### POST /api/sentry-test

Отправляет кастомное сообщение в Sentry.

## Логирование для отладки

### Включение debug режима

Добавьте в переменные окружения:

```bash
SENTRY_DEBUG=true
```

### Просмотр логов

```bash
# В development режиме
npm run dev

# В production режиме
docker logs <container_name>
```

## Частые проблемы и решения

### 1. DSN не настроен

**Симптомы:** В логах "DSN не настроен"
**Решение:** Проверить переменные окружения SENTRY_DSN и NEXT_PUBLIC_SENTRY_DSN

### 2. Сервер недоступен

**Симптомы:** Ошибки подключения в логах
**Решение:**

- Проверить доступность сервера: `make sentry-check`
- Проверить правильность адреса и порта
- Проверить сетевые настройки

### 3. События не отправляются

**Симптомы:** События создаются, но не доходят до Sentry
**Решение:**

- Проверить beforeSend функцию
- Проверить фильтры в Sentry
- Проверить rate limiting

### 4. Неправильный формат DSN

**Симптомы:** Ошибки парсинга DSN
**Решение:** Проверить формат DSN: `http://key@host:port/project_id`

## Мониторинг и алерты

### Настройка алертов в Sentry

1. Перейти в Settings → Alerts
2. Настроить уведомления о новых ошибках
3. Настроить rate limiting для предотвращения спама

### Проверка статистики

1. Перейти в Issues в Sentry
2. Проверить последние события
3. Проверить фильтры и правила

## Автоматическая диагностика

### Скрипт проверки

```bash
# Полная диагностика
make sentry-check && make sentry-test && make sentry-test-error
```

### CI/CD интеграция

Добавить в GitHub Actions:

```yaml
- name: Check Sentry Configuration
  run: make sentry-check
```

## Полезные команды

```bash
# Проверка конфигурации
make sentry-check

# Тест API
make sentry-test

# Тест ошибок
make sentry-test-error

# Тест сообщений
make sentry-test-message

# Полная диагностика
make sentry-check && make sentry-test && make sentry-test-error && make sentry-test-message
```

## Контакты для поддержки

При возникновении проблем:

1. Проверить логи приложения
2. Запустить полную диагностику
3. Проверить документацию Sentry
4. Обратиться к команде разработки

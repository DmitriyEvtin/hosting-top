# Database Migrations Service

Отдельный сервис для управления миграциями базы данных в продакшене.

## Обзор

Сервис `migrations` в `docker-compose.prod.yml` обеспечивает:

- Автоматическое применение миграций при развертывании
- Правильную последовательность запуска сервисов
- Изоляцию процесса миграций от основного приложения
- Логирование процесса миграций

## Конфигурация

### Docker Compose сервис

```yaml
migrations:
  image: ${REGISTRY_URL:-registry.evtin.ru}/${IMAGE_NAME:-rolled_metal}-app:${IMAGE_TAG:-latest}
  container_name: rolled-metal-migrations-prod
  environment:
    NODE_ENV: production
    DATABASE_URL: postgresql://${POSTGRES_USER:-rolled_metal_user}:${POSTGRES_PASSWORD:-rolled_metal_password}@postgres:5432/${POSTGRES_DB:-rolled_metal}
  networks:
    - rolled-metal-network
  depends_on:
    postgres:
      condition: service_healthy
  command: ["sh", "-c", "npx prisma migrate deploy && npx prisma generate"]
  restart: "no"
```

### Ключевые особенности

- **`restart: "no"`** - сервис запускается один раз и завершается
- **`depends_on`** - ждет готовности PostgreSQL
- **`command`** - выполняет миграции и генерацию Prisma клиента
- **`condition: service_completed_successfully`** - основное приложение ждет завершения миграций

## Команды управления

### Основные команды

```bash
# Запуск сервиса миграций
make db-migrate

# Только применение миграций (без сервиса)
make db-migrate-only

# Просмотр логов миграций
make db-logs

# Проверка статуса миграций
make db-status
```

### Ручное управление

```bash
# Запуск миграций вручную
docker compose -f docker-compose.prod.yml up migrations

# Запуск только миграций без сервиса
docker compose -f docker-compose.prod.yml run --rm migrations npx prisma migrate deploy

# Просмотр логов
docker compose -f docker-compose.prod.yml logs migrations

# Проверка статуса
docker compose -f docker-compose.prod.yml exec app npx prisma migrate status
```

## Последовательность развертывания

### Автоматическое развертывание

1. **PostgreSQL** - запускается и проходит health check
2. **Migrations** - применяет миграции и генерирует Prisma клиент
3. **App** - запускается только после успешного завершения миграций
4. **Nginx** - запускается после готовности приложения

### Ручное развертывание

```bash
# 1. Запуск базы данных
docker compose -f docker-compose.prod.yml up -d postgres redis

# 2. Применение миграций
make db-migrate

# 3. Запуск приложения
docker compose -f docker-compose.prod.yml up -d app

# 4. Запуск nginx
docker compose -f docker-compose.prod.yml up -d nginx
```

## Мониторинг и диагностика

### Проверка статуса

```bash
# Статус всех сервисов
docker compose -f docker-compose.prod.yml ps

# Статус миграций
make db-status

# Логи миграций
make db-logs
```

### Диагностика проблем

```bash
# Проверка подключения к БД
docker compose -f docker-compose.prod.yml exec app npx prisma db execute --stdin
# Введите: SELECT 1;

# Проверка существования таблиц
docker compose -f docker-compose.prod.yml exec app npx prisma db execute --stdin
# Введите: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

# Автоматическая диагностика и исправление
make db-check
```

## Лучшие практики

### Безопасность

- Миграции выполняются с минимальными правами доступа
- Используется отдельный контейнер для изоляции процесса
- Логирование всех операций миграций

### Надежность

- Проверка готовности базы данных перед миграциями
- Автоматическая генерация Prisma клиента после миграций
- Graceful handling ошибок миграций

### Мониторинг

- Логирование всех операций миграций
- Health checks для проверки состояния базы данных
- Возможность просмотра логов миграций

## Troubleshooting

### Проблемы с миграциями

```bash
# Проверка статуса миграций
make db-status

# Просмотр логов
make db-logs

# Автоматическое исправление
make db-fix

# Ручное применение миграций
make db-migrate-only
```

### Проблемы с зависимостями

```bash
# Проверка готовности PostgreSQL
docker compose -f docker-compose.prod.yml ps postgres

# Проверка подключения к БД
docker compose -f docker-compose.prod.yml exec app npx prisma db execute --stdin
```

### Откат миграций

```bash
# Сброс базы данных (ОСТОРОЖНО!)
make db-reset

# Или вручную
docker compose -f docker-compose.prod.yml exec app npx prisma migrate reset --force
```

## Интеграция с CI/CD

### GitHub Actions

```yaml
- name: Run Database Migrations
  run: |
    docker compose -f docker-compose.prod.yml up migrations
    docker compose -f docker-compose.prod.yml logs migrations
```

### Docker Registry

```bash
# Сборка и отправка образов
make build
make push

# Развертывание с миграциями
make prod-up
make db-migrate
```

## Заключение

Сервис миграций обеспечивает надежное и безопасное управление схемой базы данных в продакшене, автоматизируя процесс применения миграций и обеспечивая правильную последовательность развертывания сервисов.

# Изменения в Production Docker конфигурации

## Обзор изменений

Production конфигурация `docker-compose.prod.yml` была обновлена для оптимизированной работы с образами из папки `docker/`.

## Основные изменения

### 1. Dockerfile Production оптимизации

- **Исправлена проблема с Husky**: Добавлен флаг `--ignore-scripts` для игнорирования prepare скрипта в production
- **Оптимизированы npm команды**: Исключены ненужные скрипты в production сборке
- **Улучшена безопасность**: Husky не устанавливается в production контейнерах
- **Исправлен путь к Prisma клиенту**: Обновлен путь копирования с `node_modules/.prisma` на `src/shared/api/database/prisma`
- **Добавлена явная генерация Prisma**: Выполняется `npx prisma generate` после игнорирования скриптов

### 2. App Service

- **Использует готовый образ**: `${DOCKER_HUB_USERNAME}/rolled-metal-app:latest`
- **Улучшен healthcheck**: Добавлен `start_period: 40s` для корректного запуска
- **Оптимизированы зависимости**: Правильная последовательность запуска сервисов

### 2. Nginx Service

- **Использует готовый образ**: `${DOCKER_HUB_USERNAME}/rolled-metal-nginx:latest`
- **Включен healthcheck**: Активирован healthcheck для мониторинга
- **Убраны volume mapping**: Конфигурация уже включена в образ

### 3. PostgreSQL Service

- **Добавлены параметры инициализации**: `POSTGRES_INITDB_ARGS` для правильной кодировки
- **Улучшен healthcheck**: Добавлен `start_period: 30s`
- **Read-only volumes**: Инициализационные скрипты монтируются как read-only

### 4. Redis Service

- **Оптимизированы параметры**: Добавлены настройки памяти и политики
- **Улучшен healthcheck**: Добавлен `start_period: 30s`
- **Production настройки**: `--appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru`

### 5. Volumes

- **Специфичные пути**: Настроены конкретные пути для данных
- **Production готовность**: Оптимизированы для production среды

### 6. Networks

- **Выделенная подсеть**: `172.20.0.0/16` для изоляции
- **Bridge driver**: Оптимизированная сетевая конфигурация

## Преимущества обновленной конфигурации

1. **Лучшая производительность**: Оптимизированные настройки для production
2. **Улучшенный мониторинг**: Активные healthcheck'и для всех сервисов
3. **Безопасность**: Read-only монтирование конфигураций
4. **Стабильность**: Правильная последовательность запуска сервисов
5. **Масштабируемость**: Готовность к горизонтальному масштабированию

## Использование

```bash
# Запуск production среды
docker-compose -f docker-compose.prod.yml up -d

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Остановка
docker-compose -f docker-compose.prod.yml down
```

## Переменные окружения

Добавьте в ваш `.env` файл:

```bash
# Docker Hub credentials
DOCKER_HUB_USERNAME=your-dockerhub-username

# Database
POSTGRES_DB=rolled_metal
POSTGRES_USER=rolled_metal_user
POSTGRES_PASSWORD=your-secure-password

# Application
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com

# AWS (если используется)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket

# Monitoring (если используется)
SENTRY_DSN=your-sentry-dsn
```

## Требования

- Docker Compose версии 2.0+
- Минимум 2GB RAM для корректной работы
- Настроенные переменные окружения в `.env` файле
- Образы должны быть запушены в Docker Hub:
  - `{DOCKER_HUB_USERNAME}/rolled-metal-app:latest`
  - `{DOCKER_HUB_USERNAME}/rolled-metal-nginx:latest`

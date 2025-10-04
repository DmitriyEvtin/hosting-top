# Production Seed - Создание администратора в production

## Обзор

В production окружении администратор создается автоматически через Docker Compose с использованием переменных окружения.

## Переменные окружения для production

### Обязательные переменные

```bash
# Администратор (ОБЯЗАТЕЛЬНО для production)
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD="your-secure-password-here"
ADMIN_NAME="Администратор"

# База данных
POSTGRES_DB="parket_crm"
POSTGRES_USER="parket_crm_user"
POSTGRES_PASSWORD="your-secure-db-password"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket"

# Sentry
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="your-public-sentry-dsn"
```

### Опциональные переменные

```bash
# Docker Registry
REGISTRY_URL="registry.evtin.ru"
IMAGE_NAME="parket_crm"
IMAGE_TAG="latest"

# Redis
REDIS_URL="redis://redis:6379"
```

## Развертывание

### 1. Подготовка переменных окружения

Создайте файл `.env` на production сервере:

```bash
# Скопируйте env.example
cp env.example .env

# Отредактируйте переменные
nano .env
```

### 2. Запуск развертывания

```bash
# Запуск всех сервисов
docker-compose -f docker-compose.prod.yml up -d

# Проверка статуса
docker-compose -f docker-compose.prod.yml ps
```

### 3. Проверка создания администратора

```bash
# Проверка логов seed контейнера
docker logs parket-crm-seed-prod

# Проверка подключения к базе данных
docker exec -it parket-crm-postgres-prod psql -U parket_crm_user -d parket_crm -c "SELECT email, role FROM users WHERE role = 'ADMIN';"
```

## Последовательность запуска

1. **PostgreSQL** - база данных
2. **Redis** - кэширование
3. **Migrations** - применение миграций
4. **Seed** - создание администратора
5. **App** - основное приложение
6. **Nginx** - веб-сервер

## Безопасность

### Обязательные требования

1. **ADMIN_PASSWORD** - ОБЯЗАТЕЛЬНО установите сложный пароль
2. **NEXTAUTH_SECRET** - ОБЯЗАТЕЛЬНО сгенерируйте случайный секрет
3. **POSTGRES_PASSWORD** - ОБЯЗАТЕЛЬНО установите сложный пароль БД

### Генерация секретов

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# POSTGRES_PASSWORD
openssl rand -base64 32

# ADMIN_PASSWORD
openssl rand -base64 16
```

## Troubleshooting

### Проблема: Администратор не создается

```bash
# Проверьте логи seed контейнера
docker logs parket-crm-seed-prod

# Проверьте переменные окружения
docker exec parket-crm-seed-prod env | grep ADMIN

# Перезапустите seed контейнер
docker-compose -f docker-compose.prod.yml restart seed
```

### Проблема: Ошибки подключения к БД

```bash
# Проверьте статус PostgreSQL
docker logs parket-crm-postgres-prod

# Проверьте подключение
docker exec -it parket-crm-postgres-prod psql -U parket_crm_user -d parket_crm
```

### Проблема: Миграции не применяются

```bash
# Проверьте логи migrations
docker logs parket-crm-migrations-prod

# Принудительно запустите миграции
docker-compose -f docker-compose.prod.yml run --rm migrations npx prisma migrate deploy
```

## Мониторинг

### Проверка статуса сервисов

```bash
# Статус всех контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи приложения
docker logs parket-crm-app-prod

# Логи nginx
docker logs parket-crm-nginx-prod
```

### Проверка базы данных

```bash
# Подключение к БД
docker exec -it parket-crm-postgres-prod psql -U parket_crm_user -d parket_crm

# Проверка пользователей
SELECT id, email, role, created_at FROM users;

# Проверка категорий
SELECT id, name, slug FROM categories;
```

## Обновление

### Обновление приложения

```bash
# Остановка приложения
docker-compose -f docker-compose.prod.yml stop app nginx

# Обновление образов
docker-compose -f docker-compose.prod.yml pull

# Запуск обновленного приложения
docker-compose -f docker-compose.prod.yml up -d app nginx
```

### Обновление с миграциями

```bash
# Запуск миграций
docker-compose -f docker-compose.prod.yml run --rm migrations npx prisma migrate deploy

# Перезапуск приложения
docker-compose -f docker-compose.prod.yml restart app
```

## Резервное копирование

### Бэкап базы данных

```bash
# Создание бэкапа
docker exec parket-crm-postgres-prod pg_dump -U parket_crm_user parket_crm > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
docker exec -i parket-crm-postgres-prod psql -U parket_crm_user parket_crm < backup_20240101_120000.sql
```

### Бэкап volumes

```bash
# Создание архива volumes
docker run --rm -v parket-crm_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Восстановление volumes
docker run --rm -v parket-crm_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_data_20240101_120000.tar.gz -C /data
```

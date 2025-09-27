# Docker конфигурация

[← Назад к документации](../README.md)

## Архитектура контейнеризации

Проект использует Docker для контейнеризации приложения с поддержкой как development, так и production окружений. Используется многоэтапная сборка для оптимизации размера образов и безопасности.

## Структура Docker файлов

```
docker/
├── production/           # Production Dockerfile'ы
│   ├── nginx/
│   │   └── Dockerfile    # Nginx reverse proxy
│   └── node/
│       └── Dockerfile    # Next.js приложение
├── common/               # Общие конфигурации
│   └── nginx/
│       └── conf.d/
│           └── default.conf  # Nginx конфигурация
└── postgres/            # PostgreSQL инициализация
    └── init/
        └── 01-init.sql  # SQL скрипты инициализации
```

## Makefile команды

Проект использует Makefile для автоматизации сборки и развертывания Docker образов:

```makefile
# Основные команды
try-build    # Тестовая сборка с локальными тегами
build        # Сборка всех образов (frontend + nextjs)
build-frontend  # Сборка Nginx образа
build-nextjs    # Сборка Next.js образа
push         # Отправка образов в registry
down         # Остановка и удаление контейнеров
```

### Переменные окружения для сборки

- `REGISTRY` - Docker registry (по умолчанию localhost)
- `FRONT_IMAGE_NAME` - Имя образа для frontend (по умолчанию front-image)
- `FRONT_IMAGE_TAG` - Тег образа для frontend (по умолчанию 0)
- `NEXT_IMAGE_NAME` - Имя образа для Next.js (по умолчанию next-image)
- `NEXT_IMAGE_TAG` - Тег образа для Next.js (по умолчанию 0)

## Production Dockerfile

### Node.js приложение (Next.js)

```dockerfile
# docker/production/node/Dockerfile
# Базовый образ для всех стадий
FROM node:24-alpine AS base

# Стадия установки зависимостей
FROM base AS deps
# Установка libc6-compat для совместимости
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY yarn.lock* ./
COPY pnpm-lock.yaml* ./
COPY .npmrc* ./

# Устанавливаем зависимости
RUN npm install --force

# Стадия сборки
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Собираем приложение
RUN npm run build

# Стадия запуска
FROM base AS runner
WORKDIR /app

# Создаем non-root пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копируем собранное приложение
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Переключаемся на non-root пользователя
USER nextjs

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node_modules/.bin/next", "start"]
```

**Особенности реализации:**

- **Multi-stage сборка**: Оптимизация размера образа через отдельные стадии
- **Безопасность**: Использование non-root пользователя `nextjs`
- **Совместимость**: Установка `libc6-compat` для Alpine Linux
- **Гибкость**: Поддержка различных менеджеров пакетов (npm, yarn, pnpm)

### Nginx конфигурация

```dockerfile
# docker/production/nginx/Dockerfile
FROM nginx:1.22-alpine

RUN apk add --no-cache curl

COPY ./docker/common/nginx/conf.d /etc/nginx/conf.d

WORKDIR /app

HEALTHCHECK --interval=5s --timeout=3s --start-period=1s CMD curl --fail http://127.0.0.1/health || exit 1
```

**Особенности реализации:**

- **Health Check**: Встроенная проверка здоровья контейнера
- **Curl**: Установка curl для health check
- **Конфигурация**: Использование общей конфигурации из `docker/common/nginx/conf.d`

## Nginx конфигурация

### Основная конфигурация

```nginx
# docker/common/nginx/conf.d/default.conf
server {
    listen 80;
    charset utf-8;
    root /app/public;
    server_tokens off;

    resolver 127.0.0.11 ipv6=off;

    add_header X-Frame-Options "SAMEORIGIN";

    location /health {
        add_header Content-Type text/plain;
        return 200 'alive';
    }

    location /_next/webpack-hmr {
        set $upstream http://frontend-node:3000;
        proxy_set_header  Host $host;
        proxy_set_header  Upgrade $http_upgrade;
        proxy_set_header  Connection "Upgrade";
        proxy_pass        $upstream;
        proxy_redirect    off;
    }

    location /sockjs-node {
        set $upstream http://frontend-node:3000;
        proxy_set_header  Host $host;
        proxy_set_header  Upgrade $http_upgrade;
        proxy_set_header  Connection "Upgrade";
        proxy_pass        $upstream;
        proxy_redirect    off;
    }

    location / {
        set $upstream http://frontend-node:3000;
        proxy_set_header  Host $host;
        proxy_pass        $upstream;
        proxy_redirect    off;
    }
}
```

**Особенности конфигурации:**

- **Health Check**: Эндпоинт `/health` для проверки состояния
- **Hot Reload**: Поддержка Webpack HMR для разработки
- **WebSocket**: Поддержка WebSocket соединений через `/sockjs-node`
- **Upstream**: Проксирование на `frontend-node:3000`
- **Безопасность**: Отключение server tokens и настройка заголовков

## Docker Compose конфигурация

### Основной docker-compose.yml

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: rolled-metal-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: rolled_metal
      POSTGRES_USER: rolled_metal_user
      POSTGRES_PASSWORD: rolled_metal_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d
    networks:
      - rolled-metal-network

  redis:
    image: redis:7-alpine
    container_name: rolled-metal-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - rolled-metal-network

  adminer:
    image: adminer:4.8.1
    container_name: rolled-metal-adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    networks:
      - rolled-metal-network
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:

networks:
  rolled-metal-network:
    driver: bridge
```

**Особенности конфигурации:**

- **PostgreSQL 15**: Последняя стабильная версия с Alpine Linux
- **Redis 7**: Последняя версия Redis для кэширования
- **Adminer**: Веб-интерфейс для управления базой данных
- **Сеть**: Изолированная сеть `rolled-metal-network`
- **Инициализация**: Автоматическая инициализация БД через SQL скрипты

## PostgreSQL инициализация

### SQL скрипт инициализации

```sql
-- docker/postgres/init/01-init.sql
-- Инициализация базы данных для проекта "Каталог металлопроката"
-- Создание расширений для работы с JSON и полнотекстовым поиском

-- Включаем расширения для работы с JSON
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Создаем схему для приложения (опционально, можно использовать public)
-- CREATE SCHEMA IF NOT EXISTS rolled_metal;

-- Настройки для оптимизации производительности
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Перезагружаем конфигурацию
SELECT pg_reload_conf();
```

**Особенности инициализации:**

- **UUID поддержка**: Расширение `uuid-ossp` для генерации UUID
- **Полнотекстовый поиск**: Расширение `pg_trgm` для триграммного поиска
- **Мониторинг**: Настройка `pg_stat_statements` для отслеживания производительности
- **Производительность**: Оптимизация настроек PostgreSQL

## Команды сборки и развертывания

### Основные команды Makefile

```bash
# Тестовая сборка с локальными тегами
make try-build

# Сборка всех образов
make build

# Сборка отдельных образов
make build-frontend  # Nginx образ
make build-nextjs    # Next.js образ

# Отправка образов в registry
make push

# Остановка контейнеров
make down
```

### Переменные окружения

```bash
# Настройка registry и тегов
export REGISTRY=your-registry.com
export FRONT_IMAGE_NAME=rolled-metal-frontend
export FRONT_IMAGE_TAG=latest
export NEXT_IMAGE_NAME=rolled-metal-app
export NEXT_IMAGE_TAG=latest

# Сборка с кастомными параметрами
REGISTRY=your-registry.com FRONT_IMAGE_TAG=v1.0.0 make build
```

### Docker Compose команды

```bash
# Запуск всех сервисов
docker compose up -d

# Запуск с пересборкой
docker compose up --build -d

# Просмотр логов
docker compose logs -f

# Остановка сервисов
docker compose down

# Остановка с удалением volumes
docker compose down -v
```

### Полезные команды

```bash
# Просмотр статуса контейнеров
docker compose ps

# Подключение к базе данных
docker compose exec postgres psql -U rolled_metal_user -d rolled_metal

# Подключение к Redis
docker compose exec redis redis-cli

# Просмотр логов конкретного сервиса
docker compose logs -f postgres

# Перезапуск сервиса
docker compose restart postgres
```

## Production Docker Compose

### docker-compose.prod.yml

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: docker/production/node/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_S3_BUCKET=${AWS_S3_BUCKET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  nginx:
    build:
      context: .
      dockerfile: docker/production/nginx/Dockerfile
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - app
    restart: unless-stopped
    volumes:
      - ./ssl:/etc/nginx/ssl:ro

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  redis:
    image: redis:6-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

volumes:
  postgres_data:
  redis_data:
```

## Multi-stage сборка

### Оптимизированный Dockerfile

```dockerfile
# Multi-stage build для оптимизации размера образа
FROM node:18-alpine AS base

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Установка только production зависимостей
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Создание пользователя
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Установка Puppeteer зависимостей
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Настройка окружения
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

USER nextjs
EXPOSE 3000

CMD ["npm", "start"]
```

## Health Checks

### Конфигурация health checks

```dockerfile
# Добавление health check в Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

### Health check endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/database/prisma";

export async function GET() {
  try {
    // Проверка подключения к БД
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        redis: "connected",
        s3: "connected",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 500 }
    );
  }
}
```

## Оптимизация образов

### .dockerignore

```dockerignore
node_modules
npm-debug.log
.next
.git
.gitignore
README.md
.env
.env.local
.env.production.local
.env.development.local
coverage
.nyc_output
tests
*.test.ts
*.test.tsx
*.spec.ts
*.spec.tsx
```

### Оптимизация размера

```dockerfile
# Использование Alpine Linux для меньшего размера
FROM node:18-alpine

# Удаление ненужных пакетов
RUN apk del --no-cache \
    build-dependencies \
    python3 \
    make \
    g++

# Очистка кэша npm
RUN npm cache clean --force

# Удаление dev зависимостей
RUN npm prune --production
```

## Мониторинг контейнеров

### Логирование

```yaml
# docker-compose.yml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Метрики

```dockerfile
# Добавление метрик в Dockerfile
EXPOSE 9090

# Prometheus метрики
ENV PROMETHEUS_METRICS=true
```

## Безопасность

### Безопасный Dockerfile

```dockerfile
# Использование non-root пользователя
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Установка минимальных прав
RUN chmod -R 755 /app

# Удаление ненужных пакетов
RUN apk del --no-cache \
    build-dependencies \
    python3 \
    make \
    g++

# Настройка безопасности
ENV NODE_ENV=production
ENV NPM_CONFIG_PRODUCTION=true
```

### Сканирование уязвимостей

```bash
# Сканирование образа на уязвимости
docker scan rolled-metal:latest

# Использование Trivy для сканирования
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image rolled-metal:latest
```

## Развертывание

### Docker Swarm

```bash
# Инициализация Swarm
docker swarm init

# Развертывание стека
docker stack deploy -c docker-compose.prod.yml rolled-metal

# Масштабирование сервиса
docker service scale rolled-metal_app=3
```

### Portainer

```yaml
# portainer-stack.yml
version: "3.8"
services:
  portainer:
    image: portainer/portainer-ce:latest
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    restart: unless-stopped
```

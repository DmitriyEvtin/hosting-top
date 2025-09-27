# Docker конфигурация

[← Назад к документации](../README.md)

## Архитектура контейнеризации

Проект использует Docker для контейнеризации приложения с поддержкой как development, так и production окружений.

## Структура Docker файлов

```
docker/
├── production/
│   ├── nginx/
│   │   └── Dockerfile
│   └── node/
│       └── Dockerfile
├── common/
│   └── nginx/
│       └── conf.d/
│           └── default.conf
└── development/
    └── nginx/
        └── Dockerfile
```

## Production Dockerfile

### Node.js приложение
```dockerfile
# docker/production/node/Dockerfile
FROM node:18-alpine AS base

# Установка зависимостей только для production
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Сборка приложения
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production образ
FROM base AS runner
WORKDIR /app

# Создание пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копирование файлов
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Установка Puppeteer зависимостей
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Настройка Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Nginx конфигурация
```dockerfile
# docker/production/nginx/Dockerfile
FROM nginx:alpine

# Копирование конфигурации
COPY docker/common/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

# Создание директорий для логов
RUN mkdir -p /var/log/nginx

# Установка прав
RUN chown -R nginx:nginx /var/log/nginx

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

## Nginx конфигурация

### Основная конфигурация
```nginx
# docker/common/nginx/conf.d/default.conf
upstream app {
    server app:3000;
}

server {
    listen 80;
    server_name _;
    
    # Логирование
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Статические файлы
    location /_next/static/ {
        alias /app/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Изображения
    location /images/ {
        proxy_pass https://s3.amazonaws.com/your-bucket/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API routes
    location /api/ {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Основное приложение
    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Development Docker Compose

### docker-compose.dev.yml
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: docker/development/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@postgres:5432/rolled_metal_dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    command: npm run dev

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: rolled_metal_dev
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

## Production Docker Compose

### docker-compose.prod.yml
```yaml
version: '3.8'

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
import { NextResponse } from 'next/server';
import { prisma } from '@/shared/api/database/prisma';

export async function GET() {
  try {
    // Проверка подключения к БД
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        s3: 'connected'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
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
version: '3.8'
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

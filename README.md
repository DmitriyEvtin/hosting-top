# Каталог металлопроката

Веб-приложение для каталогизации и поиска металлопроката с автоматическим парсингом данных от поставщиков.

## Технологии

- **Frontend**: Next.js 15, React, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **База данных**: PostgreSQL
- **Архитектура**: Feature-Sliced Design (FSD)
- **Парсинг**: Puppeteer, Cheerio
- **Мониторинг**: Sentry

## Развертывание

### 🚀 Развертывание с Traefik

Для развертывания с доменом `metal-works.pro`:

```bash
# 1. Создание необходимых сетей
docker network create traefik-public
docker network create rolled-metal-network

# 2. Запуск с Traefik
docker-compose -f docker-compose.prod.yml up -d
```

### 📋 Альтернативные способы развертывания

- **Production с Docker**: [docs/deployment/docker.md](./docs/deployment/docker.md)
- **Docker Registry**: [docs/deployment/docker-registry.md](./docs/deployment/docker-registry.md)
- **Traefik**: [docs/deployment/traefik.md](./docs/deployment/traefik.md)

## Документация

📖 **Полная документация проекта**: [docs/README.md](./docs/README.md)

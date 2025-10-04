# Паркет CRM

Веб-приложение CRM для работы оптовой базы паркета.

## Технологии

- **Frontend**: Next.js 15, React, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **База данных**: PostgreSQL
- **Архитектура**: Feature-Sliced Design (FSD)
- **Парсинг**: Puppeteer, Cheerio
- **Облако**: AWS S3, CloudFront CDN
- **Мониторинг**: Sentry

## Развертывание

### 🚀 Развертывание с Traefik

Для развертывания с доменом `parket-crm.ru`:

```bash
# 1. Создание необходимых сетей
docker network create traefik-public
docker network create parket-crm-network

# 2. Запуск с Traefik
docker-compose -f docker-compose.prod.yml up -d
```

### 📋 Альтернативные способы развертывания

- **Production с Docker**: [docs/deployment/docker.md](./docs/deployment/docker.md)
- **Docker Registry**: [docs/deployment/docker-registry.md](./docs/deployment/docker-registry.md)
- **Traefik**: [docs/deployment/traefik.md](./docs/deployment/traefik.md)

## Документация

📖 **Полная документация проекта**: [docs/README.md](./docs/README.md)

### Быстрый старт

- **MinIO Setup (локально)**: [docs/minio-quickstart.md](./docs/minio-quickstart.md)
- **AWS S3 Setup**: [docs/aws-quickstart.md](./docs/aws-quickstart.md)
- **AWS Integration**: [docs/aws-integration.md](./docs/aws-integration.md)
- **Development Setup**: [docs/development/setup.md](./docs/development/setup.md)

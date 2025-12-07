# Hosting Top.

Веб-приложение Hosting Top — это удобный сервис для мониторинга и анализа цен на хостинг-услуги. С его помощью вы можете сравнить предложения различных хостинг-провайдеров и выбрать оптимальный вариант для вашего проекта.

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

Для развертывания с доменом `juvian.ru`:

```bash
# 1. Создание необходимых сетей
docker network create traefik-public
docker network create parket-crm-network

# 2. Запуск с Traefik
docker-compose -f docker-compose.prod.yml up -d
```

### 📋 Альтернативные способы развертывания.

- **Production с Docker**: [docs/deployment/docker.md](./docs/deployment/docker.md)
- **Docker Registry**: [docs/deployment/docker-registry.md](./docs/deployment/docker-registry.md)
- **Traefik**: [docs/deployment/traefik.md](./docs/deployment/traefik.md)

## Документация

📖 **Полная документация проекта**: [docs/README.md](./docs/README.md)

### Быстрый старт

- **🚀 Quick Start**: [docs/development/quick-start.md](./docs/development/quick-start.md)
- **🛠️ Development Environment**: [docs/development/dev-environment.md](./docs/development/dev-environment.md)
- **MinIO Setup (локально)**: [docs/minio-quickstart.md](./docs/minio-quickstart.md)
- **AWS S3 Setup**: [docs/aws-quickstart.md](./docs/aws-quickstart.md)
- **AWS Integration**: [docs/aws-integration.md](./docs/aws-integration.md)
- **Development Setup**: [docs/development/setup.md](./docs/development/setup.md)

## 🛠️ Разработка

### Быстрая настройка среды разработки

```bash
# Единственная команда для запуска всего!
make dev
```

Эта команда автоматически:

- Остановит и удалит существующие контейнеры
- Удалит старые volumes (база данных будет пересоздана)
- Запустит все контейнеры (PostgreSQL, Redis, MinIO, MailHog, Adminer)
- Выполнит миграции
- Заполнит базу тестовыми данными
- Запустит приложение

**Учетные данные для разработки:**

- Администратор: `admin@dev.ru` / `111111`
- Пользователи: `user@dev.ru`, `moderator@dev.ru`, `test@dev.ru` / `111111`

**Сервисы:**

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Adminer: http://localhost:8080 (автоматическое подключение к PostgreSQL)
- MailHog: http://localhost:8025
- MinIO: http://localhost:9001

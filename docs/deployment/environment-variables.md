# Переменные окружения для Production

## Обязательные переменные

### База данных

```bash
POSTGRES_DB=rolled_metal
POSTGRES_USER=rolled_metal_user
POSTGRES_PASSWORD=your_secure_password_here
```

### Redis

```bash
REDIS_URL=redis://redis:6379
```

### Next.js

```bash
NODE_ENV=production
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.com
```

### AWS Configuration

```bash
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
```

### Sentry

```bash
SENTRY_DSN=your_sentry_dsn_here
```

### Application

```bash
APP_URL=https://your-domain.com
API_URL=https://your-domain.com/api
```

## Настройка GitHub Secrets

Для автоматического деплоя необходимо настроить следующие секреты в GitHub:

1. Перейдите в Settings → Secrets and variables → Actions
2. Добавьте следующие секреты:

### Database Secrets

- `POSTGRES_PASSWORD` - Пароль для базы данных
- `DATABASE_URL` - Полный URL подключения к базе данных

### AWS Secrets

- `AWS_ACCESS_KEY_ID` - AWS Access Key ID
- `AWS_SECRET_ACCESS_KEY` - AWS Secret Access Key
- `AWS_S3_BUCKET` - Имя S3 bucket

### Application Secrets

- `NEXTAUTH_SECRET` - Секретный ключ для NextAuth
- `SENTRY_DSN` - DSN для Sentry мониторинга

### Deployment Secrets

- `DEPLOY_HOST` - Хост для деплоя
- `DEPLOY_USER` - Пользователь для деплоя
- `DEPLOY_KEY` - SSH ключ для деплоя

## Локальная настройка

1. Скопируйте `.env.example` в `.env.local`
2. Заполните переменные реальными значениями
3. Запустите `make dev` для development окружения

## Production настройка

1. Создайте `.env.production` файл
2. Заполните все переменные реальными значениями
3. Запустите `make prod-up` для production окружения

## Безопасность

- Никогда не коммитьте файлы с реальными секретами
- Используйте сильные пароли для базы данных
- Регулярно ротируйте AWS ключи
- Используйте HTTPS для production
- Настройте firewall для ограничения доступа

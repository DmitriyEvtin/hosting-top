# Переменные окружения для Production

## Обязательные переменные

### База данных

```bash
POSTGRES_DB=parket_crm
POSTGRES_USER=parket_crm_user
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

**⚠️ ВАЖНО**: `NEXTAUTH_URL` должен быть установлен в production окружении и не должен содержать `localhost`. Используйте полный URL вашего домена (например, `https://your-domain.com`).

### OAuth провайдеры

```bash
# Международные OAuth провайдеры
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Российские OAuth провайдеры
VK_CLIENT_ID=your_vk_client_id
VK_CLIENT_SECRET=your_vk_client_secret
OK_CLIENT_ID=your_ok_client_id
OK_CLIENT_SECRET=your_ok_client_secret
MAIL_CLIENT_ID=your_mail_client_id
MAIL_CLIENT_SECRET=your_mail_client_secret
YANDEX_CLIENT_ID=your_yandex_client_id
YANDEX_CLIENT_SECRET=your_yandex_client_secret
```

**📋 Настройка OAuth провайдеров**:

- [OAuth Setup Guide](../security/oauth-setup.md) - подробные инструкции по настройке каждого провайдера
- [OAuth Production Setup](./oauth-production.md) - быстрая настройка для production окружения

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

### OAuth Secrets

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `VK_CLIENT_ID` / `VK_CLIENT_SECRET` - VKontakte OAuth
- `OK_CLIENT_ID` / `OK_CLIENT_SECRET` - Одноклассники OAuth
- `MAIL_CLIENT_ID` / `MAIL_CLIENT_SECRET` - Mail.ru OAuth
- `YANDEX_CLIENT_ID` / `YANDEX_CLIENT_SECRET` - Yandex OAuth

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

## Устранение проблем

### Ошибка "NEXTAUTH_URL не должен содержать localhost для production"

Эта ошибка возникает, когда:

1. Переменная `NEXTAUTH_URL` не установлена в production окружении
2. В качестве fallback используется `http://localhost:3000`

**Решение:**

1. Установите переменную `NEXTAUTH_URL` в вашем production окружении:

   ```bash
   export NEXTAUTH_URL=https://your-domain.com
   ```

2. Для Docker Compose добавьте в `.env` файл:

   ```bash
   NEXTAUTH_URL=https://your-domain.com
   ```

3. Для GitHub Actions добавьте в Secrets:
   - `NEXTAUTH_URL` = `https://your-domain.com`

## Безопасность

- Никогда не коммитьте файлы с реальными секретами
- Используйте сильные пароли для базы данных
- Регулярно ротируйте AWS ключи
- Используйте HTTPS для production
- Настройте firewall для ограничения доступа

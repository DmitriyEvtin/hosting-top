# Настройка GitHub Secrets для CI/CD

## Обзор

Для автоматического деплоя и работы CI/CD pipeline необходимо настроить секреты в GitHub. Секреты используются для:

- Подключения к базе данных
- AWS сервисов
- Аутентификации
- Деплоя в production

## Настройка секретов

### 1. Переход в настройки репозитория

1. Откройте ваш репозиторий на GitHub
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**

### 2. Обязательные секреты

#### Database Secrets

```
POSTGRES_PASSWORD
Описание: Пароль для базы данных PostgreSQL
Пример: your_secure_password_here

DATABASE_URL
Описание: Полный URL подключения к базе данных
Пример: postgresql://user:password@host:5432/database
```

#### AWS Secrets

```
AWS_ACCESS_KEY_ID
Описание: AWS Access Key ID для S3 и CloudFront
Пример: AKIAIOSFODNN7EXAMPLE

AWS_SECRET_ACCESS_KEY
Описание: AWS Secret Access Key
Пример: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

AWS_S3_BUCKET
Описание: Имя S3 bucket для хранения изображений
Пример: rolled-metal-images

AWS_REGION
Описание: AWS регион
Пример: us-east-1
```

#### Application Secrets

```
NEXTAUTH_SECRET
Описание: Секретный ключ для NextAuth.js
Пример: your_nextauth_secret_here

SENTRY_DSN
Описание: DSN для Sentry мониторинга
Пример: https://your-sentry-dsn@sentry.io/project-id
```

#### Deployment Secrets

```
DEPLOY_HOST
Описание: Хост для деплоя (IP адрес или домен)
Пример: your-server.com

DEPLOY_USER
Описание: Пользователь для SSH подключения
Пример: deploy

DEPLOY_KEY
Описание: Приватный SSH ключ для деплоя
Пример: -----BEGIN OPENSSH PRIVATE KEY-----...

DEPLOY_PORT
Описание: SSH порт (опционально)
Пример: 22
```

### 3. Дополнительные секреты

#### Email Configuration

```
SMTP_HOST
Описание: SMTP сервер для отправки email
Пример: smtp.gmail.com

SMTP_PORT
Описание: SMTP порт
Пример: 587

SMTP_USER
Описание: SMTP пользователь
Пример: noreply@your-domain.com

SMTP_PASSWORD
Описание: SMTP пароль
Пример: your_smtp_password
```

#### Monitoring

```
LOG_LEVEL
Описание: Уровень логирования
Пример: info

MONITORING_WEBHOOK
Описание: Webhook для уведомлений (Slack, Discord)
Пример: https://hooks.slack.com/services/...
```

## Проверка секретов

### 1. Локальная проверка

```bash
# Проверка переменных окружения
npm run env:check

# Тестирование подключения к БД
npm run db:test

# Тестирование AWS подключения
npm run aws:test
```

### 2. GitHub Actions проверка

Создайте тестовый workflow для проверки секретов:

```yaml
name: Test Secrets
on:
  workflow_dispatch:

jobs:
  test-secrets:
    runs-on: ubuntu-latest
    steps:
      - name: Test Database Connection
        run: |
          echo "Testing database connection..."
          # Тест подключения к БД

      - name: Test AWS Connection
        run: |
          echo "Testing AWS connection..."
          # Тест AWS подключения

      - name: Test Application Secrets
        run: |
          echo "Testing application secrets..."
          # Тест приложения
```

## Безопасность

### 1. Рекомендации по безопасности

- Используйте сильные, уникальные пароли
- Регулярно ротируйте секреты
- Не коммитьте секреты в код
- Используйте минимальные права доступа
- Мониторьте использование секретов

### 2. Ротация секретов

```bash
# Пример ротации AWS ключей
aws iam create-access-key --user-name deploy-user
# Обновите секреты в GitHub
aws iam delete-access-key --user-name deploy-user --access-key-id OLD_KEY_ID
```

### 3. Мониторинг

- Настройте уведомления о использовании секретов
- Регулярно проверяйте логи доступа
- Используйте AWS CloudTrail для мониторинга AWS ключей

## Troubleshooting

### Частые проблемы

#### 1. Неверные секреты

```
Error: Invalid credentials
Решение: Проверьте правильность секретов в GitHub
```

#### 2. Отсутствующие секреты

```
Error: Secret not found
Решение: Добавьте недостающие секреты в GitHub
```

#### 3. Проблемы с правами доступа

```
Error: Access denied
Решение: Проверьте права доступа для AWS ключей
```

### Логи и отладка

```bash
# Просмотр логов GitHub Actions
gh run list
gh run view <run-id>

# Локальная отладка
docker compose logs app
docker compose logs nginx
```

## Следующие шаги

1. Настройте все обязательные секреты
2. Протестируйте CI/CD pipeline
3. Настройте мониторинг
4. Документируйте процесс ротации секретов

# Настройка окружения

## Требования к системе

### Минимальные требования
- **Node.js**: 18.17.0 или выше
- **npm**: 9.0.0 или выше
- **PostgreSQL**: 14.0 или выше
- **Redis**: 6.0 или выше (опционально)
- **Docker**: 20.10 или выше (для контейнеризации)

### Рекомендуемые требования
- **Node.js**: 20.0.0 или выше
- **RAM**: 8GB или больше
- **CPU**: 4 ядра или больше
- **Диск**: 20GB свободного места

## Установка зависимостей

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd rolled-metal
```

### 2. Установка Node.js зависимостей
```bash
npm install
```

### 3. Установка глобальных зависимостей
```bash
# Prisma CLI
npm install -g prisma

# Docker (если не установлен)
# Следуйте инструкциям на https://docs.docker.com/get-docker/
```

## Настройка базы данных

### 1. Установка PostgreSQL

#### macOS (с Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
Скачайте и установите с официального сайта: https://www.postgresql.org/download/windows/

### 2. Создание базы данных
```bash
# Подключение к PostgreSQL
psql -U postgres

# Создание базы данных
CREATE DATABASE rolled_metal_dev;
CREATE DATABASE rolled_metal_test;

# Создание пользователя
CREATE USER rolled_metal_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE rolled_metal_dev TO rolled_metal_user;
GRANT ALL PRIVILEGES ON DATABASE rolled_metal_test TO rolled_metal_user;
```

### 3. Настройка Prisma
```bash
# Генерация Prisma клиента
npx prisma generate

# Применение миграций
npx prisma migrate dev

# Заполнение тестовыми данными
npx prisma db seed
```

## Настройка переменных окружения

### 1. Создание .env файла
```bash
cp .env.example .env
```

### 2. Настройка переменных
```env
# База данных
DATABASE_URL="postgresql://rolled_metal_user:your_password@localhost:5432/rolled_metal_dev"
TEST_DATABASE_URL="postgresql://rolled_metal_user:your_password@localhost:5432/rolled_metal_test"

# Next.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"
AWS_REGION="us-east-1"

# Redis (опционально)
REDIS_URL="redis://localhost:6379"

# Парсинг
PARSING_BATCH_SIZE="50"
PARSING_DELAY_MS="1000"
MAX_CONCURRENT_REQUESTS="5"
```

## Настройка AWS S3

### 1. Создание S3 bucket
```bash
# Установка AWS CLI
npm install -g aws-cli

# Настройка credentials
aws configure

# Создание bucket
aws s3 mb s3://your-bucket-name --region us-east-1
```

### 2. Настройка CORS для S3
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
```

## Настройка Docker (опционально)

### 1. Docker Compose для разработки
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: rolled_metal_dev
      POSTGRES_USER: rolled_metal_user
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

### 2. Запуск сервисов
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## Настройка IDE

### VS Code расширения
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Настройки VS Code
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## Проверка установки

### 1. Запуск приложения
```bash
npm run dev
```

### 2. Проверка базы данных
```bash
npx prisma studio
```

### 3. Запуск тестов
```bash
npm test
```

### 4. Проверка линтинга
```bash
npm run lint
```

## Устранение проблем

### Частые проблемы

#### Ошибка подключения к БД
```bash
# Проверка статуса PostgreSQL
brew services list | grep postgresql

# Перезапуск PostgreSQL
brew services restart postgresql
```

#### Ошибки Prisma
```bash
# Очистка и перегенерация
npx prisma generate
npx prisma db push
```

#### Проблемы с Node.js
```bash
# Очистка кэша
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Проблемы с Docker
```bash
# Очистка Docker
docker system prune -a
docker-compose down -v
docker-compose up -d
```

## Дополнительные инструменты

### Полезные команды
```bash
# Анализ bundle
npm run build
npm run analyze

# Проверка типов
npm run type-check

# Форматирование кода
npm run format

# Проверка FSD архитектуры
npm run lint:fsd
```

### Полезные расширения
- **Thunder Client** - Тестирование API
- **REST Client** - HTTP запросы
- **GitLens** - Git интеграция
- **Auto Rename Tag** - Автоматическое переименование тегов
- **Bracket Pair Colorizer** - Цветные скобки

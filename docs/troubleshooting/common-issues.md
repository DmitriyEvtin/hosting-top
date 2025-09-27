# Частые проблемы и решения

[← Назад к документации](../README.md)

## Проблемы с базой данных

### Ошибка подключения к PostgreSQL

#### Симптомы

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

#### Решения

```bash
# Проверка статуса PostgreSQL
brew services list | grep postgresql

# Перезапуск PostgreSQL
brew services restart postgresql

# Проверка подключения
psql -U postgres -h localhost -p 5432
```

#### Диагностика

```bash
# Проверка портов
lsof -i :5432

# Проверка конфигурации
cat /usr/local/var/postgresql/postgresql.conf | grep port
```

### Ошибки миграций Prisma

#### Симптомы

```
Error: P3001: Database does not exist
Error: P3002: The database schema is not empty
```

#### Решения

```bash
# Сброс базы данных
npx prisma migrate reset

# Применение миграций
npx prisma migrate dev

# Генерация клиента
npx prisma generate
```

#### Диагностика

```bash
# Проверка статуса миграций
npx prisma migrate status

# Просмотр схемы
npx prisma db pull
```

## Проблемы с парсингом

### Ошибки Puppeteer

#### Симптомы

```
Error: Failed to launch the browser process
Error: Navigation timeout
```

#### Решения

```bash
# Установка зависимостей для Puppeteer
sudo apt-get update
sudo apt-get install -y wget gnupg
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Настройка переменных окружения
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

#### Конфигурация Docker

```dockerfile
# Установка Chrome в Docker
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*
```

### Ошибки загрузки изображений

#### Симптомы

```
Error: Request failed with status code 403
Error: ECONNRESET
```

#### Решения

```typescript
// Настройка retry логики
const downloadWithRetry = async (url: string, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      return response.data;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## Проблемы с AWS S3

### Ошибки доступа к S3

#### Симптомы

```
Error: Access Denied
Error: The specified bucket does not exist
```

#### Решения

```bash
# Проверка конфигурации AWS
aws configure list

# Проверка доступа к bucket
aws s3 ls s3://your-bucket-name

# Настройка CORS
aws s3api put-bucket-cors --bucket your-bucket-name --cors-configuration file://cors.json
```

#### CORS конфигурация

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

### Ошибки загрузки в S3

#### Симптомы

```
Error: Request Entity Too Large
Error: SignatureDoesNotMatch
```

#### Решения

```typescript
// Настройка multipart upload
const uploadToS3 = async (file: Buffer, key: string) => {
  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: "image/jpeg",
    ACL: "public-read",
  };

  try {
    const result = await s3.upload(uploadParams).promise();
    return result.Location;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
};
```

## Проблемы с производительностью

### Медленная загрузка страниц

#### Диагностика

```bash
# Анализ bundle
npm run build
npm run analyze

# Проверка размера изображений
find public -name "*.jpg" -exec ls -lh {} \;
```

#### Решения

```typescript
// Оптимизация изображений
import sharp from "sharp";

const optimizeImage = async (buffer: Buffer) => {
  return sharp(buffer)
    .resize(800, 600, { fit: "inside" })
    .jpeg({ quality: 80 })
    .toBuffer();
};
```

### Проблемы с памятью

#### Симптомы

```
Error: JavaScript heap out of memory
```

#### Решения

```bash
# Увеличение лимита памяти
export NODE_OPTIONS="--max-old-space-size=4096"

# Или в package.json
"scripts": {
  "dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev"
}
```

## Проблемы с Docker

### Ошибки сборки Docker

#### Симптомы

```
Error: failed to solve: failed to compute cache key
```

#### Решения

```bash
# Очистка Docker кэша
docker system prune -a

# Пересборка без кэша
docker build --no-cache -t rolled-metal .

# Очистка volumes
docker volume prune
```

### Проблемы с Docker Compose

#### Симптомы

```
Error: network not found
Error: service not found
```

#### Решения

```bash
# Остановка и удаление контейнеров
docker-compose down -v

# Пересоздание сети
docker network prune

# Запуск заново
docker-compose up -d
```

## Проблемы с Next.js

### Ошибки сборки

#### Симптомы

```
Error: Module not found
Error: Cannot resolve module
```

#### Решения

```bash
# Очистка кэша Next.js
rm -rf .next

# Переустановка зависимостей
rm -rf node_modules package-lock.json
npm install

# Проверка TypeScript
npm run type-check
```

### Ошибки импортов

#### Симптомы

```
Error: Cannot resolve '@/' in '/src/app/page.tsx'
```

#### Решения

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Проблемы с тестированием

### Ошибки Jest

#### Симптомы

```
Error: Cannot find module
Error: Test environment setup failed
```

#### Решения

```bash
# Очистка кэша Jest
npm test -- --clearCache

# Переустановка тестовых зависимостей
npm install --save-dev jest @testing-library/react
```

### Ошибки Playwright

#### Симптомы

```
Error: Browser not found
Error: Test timeout
```

#### Решения

```bash
# Установка браузеров
npx playwright install

# Установка системных зависимостей
npx playwright install-deps
```

## Проблемы с развертыванием

### Ошибки CI/CD

#### Симптомы

```
Error: Build failed
Error: Test failed
```

#### Решения

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
```

### Ошибки production

#### Симптомы

```
Error: 500 Internal Server Error
Error: Database connection failed
```

#### Решения

```bash
# Проверка логов
docker logs rolled-metal_app

# Проверка статуса сервисов
docker-compose ps

# Перезапуск сервисов
docker-compose restart
```

## Мониторинг и диагностика

### Полезные команды

```bash
# Проверка статуса сервисов
docker-compose ps

# Просмотр логов
docker-compose logs -f app

# Проверка использования ресурсов
docker stats

# Проверка подключения к БД
docker-compose exec postgres psql -U user -d rolled_metal_dev
```

### Логирование

```typescript
// Настройка логирования
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});
```

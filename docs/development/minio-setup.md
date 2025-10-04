# MinIO Setup Guide

## Обзор

MinIO - это S3-совместимое объектное хранилище для локальной разработки и тестирования. Это отличная альтернатива AWS S3 для разработки без необходимости настройки реального AWS аккаунта.

## Быстрый старт (5 минут)

```bash
# 1. Запуск MinIO
make minio-up

# 2. Настройка окружения
cp env.minio.example .env.local

# 3. Инициализация bucket
make minio-setup

# 4. Запуск приложения
make dev
```

### Что происходит

1. **MinIO запускается** на портах 9000 (API) и 9001 (Console)
2. **Создается bucket** `parket-crm-images` с CORS политикой
3. **Настраивается структура папок** для организации файлов
4. **Приложение подключается** к MinIO вместо AWS S3

### Доступ к сервисам

- **Приложение:** http://localhost:3000
- **MinIO Console:** http://localhost:9001 (minioadmin / minioadmin123)
- **MinIO API:** http://localhost:9000

## Конфигурация

### Переменные окружения для MinIO

```bash
# MinIO credentials
AWS_ACCESS_KEY_ID="minioadmin"
AWS_SECRET_ACCESS_KEY="minioadmin123"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="parket-crm-images"

# MinIO endpoint
AWS_S3_ENDPOINT="http://localhost:9000"
AWS_S3_FORCE_PATH_STYLE="true"

# CloudFront отключен для локальной разработки
CLOUDFRONT_DOMAIN=""
```

### Docker Compose конфигурация

```yaml
minio:
  image: minio/minio:latest
  container_name: parket-crm-minio
  restart: unless-stopped
  ports:
    - "9000:9000" # API порт
    - "9001:9001" # Console порт
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin123
  volumes:
    - minio_data:/data
  command: server /data --console-address ":9001"
```

## Структура bucket

После инициализации создается следующая структура:

```
parket-crm-images/
├── images/
│   ├── products/     # Изображения товаров
│   ├── categories/   # Изображения категорий
│   ├── thumbnails/   # Миниатюры (150px, 300px, 600px, 1200px)
│   └── profile-logos/ # Логотипы профилей
└── files/            # Другие файлы
```

## Команды управления

### Docker Compose команды

```bash
# Управление MinIO
make minio-up        # Запуск
make minio-down      # Остановка
make minio-restart   # Перезапуск
make minio-logs      # Логи
make minio-status    # Статус
make minio-console   # Открыть Console

# Настройка
make minio-setup     # Инициализация bucket
```

### Настройка bucket

```bash
# Автоматическая настройка
npm run minio:setup

# Ручная настройка через MinIO Console
# 1. Откройте http://localhost:9001
# 2. Создайте bucket "parket-crm-images"
# 3. Настройте CORS политику
```

## CORS конфигурация

MinIO автоматически настраивается с следующей CORS политикой:

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-request-id"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

## Публичный доступ к файлам

### Проблема с доступом

При загрузке файлов они могут быть недоступны по URL из-за отсутствия публичной политики доступа.

### Решение

Скрипт `scripts/setup-minio.cjs` автоматически настраивает публичную политику:

```javascript
const publicPolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "PublicReadGetObject",
      Effect: "Allow",
      Principal: "*",
      Action: "s3:GetObject",
      Resource: `arn:aws:s3:::${bucketName}/*`,
    },
    {
      Sid: "PublicReadListBucket",
      Effect: "Allow",
      Principal: "*",
      Action: "s3:ListBucket",
      Resource: `arn:aws:s3:::${bucketName}`,
    },
  ],
};
```

## Тестирование

### Unit тесты

```bash
# Запуск тестов с MinIO
npm run test:unit -- aws-s3
```

### Integration тесты

```bash
# Запуск API тестов
npm run test:integration -- aws-upload
```

### E2E тесты

```bash
# Запуск E2E тестов
npm run test:e2e
```

### Тестирование загрузки

```bash
# Проверка статуса MinIO
make minio-status

# Тестирование API загрузки
curl -X POST http://localhost:3000/api/upload/image \
  -F "file=@test-image.jpg" \
  -F "category=test"
```

## Troubleshooting

### MinIO не запускается

**Проблема:** Ошибка при запуске MinIO контейнера

**Решение:**

```bash
# Проверьте логи
make minio-logs

# Пересоздайте контейнер
docker-compose down minio
docker-compose up -d minio
```

### Bucket не создается

**Проблема:** Ошибка при создании bucket

**Решение:**

```bash
# Проверьте доступность MinIO
curl http://localhost:9000/minio/health/live

# Проверьте credentials
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# Запустите настройку
make minio-setup
```

### CORS ошибки

**Проблема:** CORS ошибки в браузере

**Решение:**

1. Проверьте CORS конфигурацию в MinIO Console
2. Убедитесь, что origin включен в AllowedOrigins
3. Очистите кэш браузера

### Файлы не загружаются

**Проблема:** Ошибки при загрузке файлов

**Решение:**

```bash
# Проверьте настройки endpoint
echo $AWS_S3_ENDPOINT
echo $AWS_S3_FORCE_PATH_STYLE

# Проверьте bucket
curl http://localhost:9000/parket-crm-images/
```

## Мониторинг

### Health Check

```bash
# Проверка здоровья MinIO
curl http://localhost:9000/minio/health/live

# Должен вернуть: OK
```

### Логи

```bash
# Просмотр логов в реальном времени
make minio-logs

# Просмотр последних логов
docker-compose logs --tail=100 minio
```

### Метрики

MinIO предоставляет метрики через Prometheus:

```bash
# Включение метрик (добавить в docker-compose.yml)
environment:
  MINIO_PROMETHEUS_AUTH_TYPE: public
```

## Производительность

### Оптимизация для разработки

1. **Используйте SSD** для volume
2. **Увеличьте память** для Docker
3. **Настройте кэширование** в браузере

### Настройки Docker

```yaml
minio:
  deploy:
    resources:
      limits:
        memory: 1G
      reservations:
        memory: 512M
```

## Безопасность

### Production настройки

⚠️ **Внимание:** MinIO настройки по умолчанию НЕ подходят для production!

Для production:

1. Измените пароли по умолчанию
2. Настройте SSL/TLS
3. Ограничьте доступ по IP
4. Настройте backup стратегию

### Локальная разработка

Для локальной разработки безопасно использовать:

- Публичный доступ к bucket
- Простые пароли
- HTTP вместо HTTPS

## Миграция на AWS S3

### Подготовка к production

1. **Создайте AWS аккаунт**
2. **Настройте S3 bucket**
3. **Обновите переменные окружения**
4. **Протестируйте миграцию**

### Переменные для AWS

```bash
# AWS credentials
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="eu-west-1"
AWS_S3_BUCKET="your-production-bucket"

# Удалите MinIO настройки
# AWS_S3_ENDPOINT=""
# AWS_S3_FORCE_PATH_STYLE=""
```

## Преимущества MinIO

### Для разработки

- ✅ **Быстрый старт** - 5 минут настройки
- ✅ **Локальное хранение** - без интернета
- ✅ **S3 совместимость** - 100% API совместимость
- ✅ **Бесплатно** - без AWS costs
- ✅ **Простая настройка** - Docker Compose

### Для тестирования

- ✅ **Изолированное окружение** - без внешних зависимостей
- ✅ **Быстрые тесты** - локальное выполнение
- ✅ **Детерминированные результаты** - предсказуемое поведение
- ✅ **Легкая очистка** - простое удаление данных

## Дополнительные ресурсы

- [MinIO Documentation](https://docs.min.io/)
- [MinIO Docker Hub](https://hub.docker.com/r/minio/minio)
- [S3 API Compatibility](https://docs.min.io/docs/aws-cli-with-minio)
- [MinIO Console](https://github.com/minio/console)

## FAQ

**Q: Можно ли использовать MinIO в production?**

A: Да, MinIO подходит для production, но требует дополнительной настройки безопасности.

**Q: Как мигрировать данные с MinIO на AWS S3?**

A: Используйте AWS CLI или MinIO Client (mc) для синхронизации данных.

**Q: Поддерживает ли MinIO все функции AWS S3?**

A: MinIO поддерживает большинство S3 API, но не все функции AWS (например, CloudFront).

**Q: Как настроить backup для MinIO?**

A: Используйте MinIO Client (mc) для репликации или AWS S3 для backup.

**Q: Можно ли использовать MinIO с другими S3-совместимыми сервисами?**

A: Да, MinIO совместим с любыми S3-совместимыми API (DigitalOcean Spaces, Wasabi, etc.).

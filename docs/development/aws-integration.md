# AWS Integration Guide

## Обзор

Документация по интеграции с Amazon Web Services (AWS) для хранения и обработки изображений в проекте "Паркет CRM".

## Быстрый старт

### 1. Настройка AWS аккаунта

```bash
# 1. Создайте AWS аккаунт
# 2. Настройте IAM пользователя с правами S3
# 3. Создайте S3 bucket
# 4. Настройте CloudFront (опционально)
```

### 2. Настройка переменных окружения

```bash
# AWS credentials
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="eu-west-1"
AWS_S3_BUCKET="your-bucket-name"

# CloudFront (опционально)
CLOUDFRONT_DOMAIN="your-cloudfront-domain"
```

### 3. Проверка работы

```bash
# Запуск приложения
npm run dev

# Тестирование загрузки
curl -X POST http://localhost:3000/api/upload/image \
  -F "file=@test-image.jpg" \
  -F "category=test"
```

## Архитектура

### Компоненты

1. **AWS S3** - Хранение изображений и файлов
2. **AWS CloudFront** - CDN для быстрой доставки контента
3. **AWS SDK** - Интеграция с AWS сервисами

### Структура файлов

```
src/shared/lib/
├── aws-config.ts          # Конфигурация AWS
├── s3-utils.ts            # Утилиты для работы с S3
└── image-processing.ts     # Обработка изображений

src/shared/ui/ImageUpload/
├── ImageUpload.tsx        # Компонент загрузки
└── index.ts               # Экспорты

src/app/api/upload/
├── image/route.ts         # API загрузки
└── image/[key]/route.ts   # API управления
```

## Конфигурация

### Настройка S3 Bucket

1. Создайте S3 bucket в AWS Console
2. Настройте CORS политику:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

3. Настройте публичный доступ для чтения
4. Включите версионирование (опционально)

### CloudFront настройка

1. Создайте CloudFront distribution
2. Настройте origin на ваш S3 bucket
3. Настройте кэширование
4. Получите домен CloudFront

## API Endpoints

### POST /api/upload/image

Загрузка изображения в S3.

**Параметры:**

- `file` (File) - Файл изображения
- `category` (string, optional) - Категория изображения
- `productId` (string, optional) - ID продукта
- `generateThumbnails` (boolean) - Создавать миниатюры

**Ответ:**

```json
{
  "success": true,
  "image": {
    "key": "images/product_123456_abc123.jpg",
    "url": "https://bucket.s3.region.amazonaws.com/images/product_123456_abc123.jpg",
    "size": 1024000,
    "etag": "\"abc123def456\""
  },
  "thumbnails": [
    {
      "key": "images/thumbnails/product_123456_abc123_150w.webp",
      "url": "https://bucket.s3.region.amazonaws.com/images/thumbnails/product_123456_abc123_150w.webp",
      "width": 150,
      "height": 150,
      "size": 25600
    }
  ]
}
```

### GET /api/upload/image

Получение списка загруженных изображений.

**Параметры запроса:**

- `category` (string, optional) - Фильтр по категории
- `limit` (number, optional) - Лимит результатов (по умолчанию 50)

### DELETE /api/upload/image/[key]

Удаление изображения из S3.

## Использование

### Компонент ImageUpload

```tsx
import { ImageUpload } from "@/shared/ui/ImageUpload";

function ProductForm() {
  const handleUploadComplete = result => {
    console.log("Изображение загружено:", result);
  };

  const handleUploadError = error => {
    console.error("Ошибка загрузки:", error);
  };

  return (
    <ImageUpload
      onUploadComplete={handleUploadComplete}
      onUploadError={handleUploadError}
      category="products"
      productId="123"
      generateThumbnails={true}
      maxFiles={5}
      maxSize={10 * 1024 * 1024} // 10MB
    />
  );
}
```

### Прямое использование S3Service

```typescript
import { s3Service } from "@/shared/lib/s3-utils";

// Загрузка изображения
const result = await s3Service.uploadImage(
  "product-image.jpg",
  imageBuffer,
  "image/jpeg",
  { "product-id": "123" }
);

// Получение файла
const fileBuffer = await s3Service.getFile("images/product-image.jpg");

// Удаление файла
await s3Service.deleteFile("images/product-image.jpg");
```

## Обработка изображений

### Поддерживаемые форматы

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- AVIF (.avif)

### Размеры миниатюр

По умолчанию создаются миниатюры следующих размеров:

- 150px
- 300px
- 600px
- 1200px

### Оптимизация

- Автоматическое сжатие для веб
- Конвертация в WebP для лучшего сжатия
- Responsive изображения
- Lazy loading поддержка

## Безопасность

### Аутентификация

Все API endpoints требуют аутентификации через NextAuth.js.

### Валидация файлов

- Проверка типа MIME
- Проверка размера файла
- Проверка содержимого изображения
- Санитизация имен файлов

### CORS настройки

S3 bucket настроен для работы с фронтендом через CORS.

## Мониторинг

### Логирование

Все операции логируются с уровнем детализации:

- Успешные загрузки
- Ошибки валидации
- Ошибки AWS API
- Производительность операций

### Метрики

- Количество загруженных файлов
- Размер загруженных файлов
- Время загрузки
- Ошибки загрузки

## Тестирование

### Unit тесты

```bash
npm run test:unit -- aws-s3
```

### Интеграционные тесты

```bash
npm run test:integration -- aws-upload
```

### E2E тесты

```bash
npm run test:e2e -- upload
```

## Развертывание

### Production настройки

1. Настройте AWS credentials в production окружении
2. Создайте S3 bucket с правильными настройками
3. Настройте CloudFront distribution
4. Обновите переменные окружения

### Мониторинг production

- Настройте CloudWatch для S3 метрик
- Настройте алерты для ошибок
- Мониторинг использования storage
- Отслеживание CDN производительности

## Troubleshooting

### Частые проблемы

1. **Ошибка "Access Denied"**
   - Проверьте AWS credentials
   - Проверьте права доступа к S3 bucket

2. **Ошибка CORS**
   - Проверьте CORS настройки bucket
   - Убедитесь в правильности origin

3. **Медленная загрузка**
   - Проверьте размер файлов
   - Рассмотрите использование CloudFront
   - Оптимизируйте изображения

### Логи

Проверьте логи в:

- Браузерная консоль (клиентские ошибки)
- Серверные логи (API ошибки)
- AWS CloudWatch (S3 ошибки)

## Дальнейшее развитие

### Планируемые улучшения

1. **Интеграция с Sharp** для серверной обработки изображений
2. **Автоматическое создание WebP** версий
3. **Интеграция с CloudFront** для кэширования
4. **Batch операции** для массовой загрузки
5. **Watermarking** для защиты изображений

### Оптимизация

1. **Lazy loading** для изображений
2. **Progressive JPEG** поддержка
3. **Responsive images** с srcset
4. **Image optimization** на лету

## Альтернативы для разработки

Для локальной разработки рекомендуется использовать MinIO:

- [MinIO Setup Guide](./minio-setup.md) - S3-совместимое локальное хранилище
- Быстрый старт без настройки AWS
- Полная совместимость с S3 API
- Бесплатное использование

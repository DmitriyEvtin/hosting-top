# AWS S3 Quick Start Guide

## Быстрый старт для работы с AWS S3

### 1. Настройка AWS

#### Создание S3 Bucket

1. Войдите в [AWS Console](https://console.aws.amazon.com/)
2. Перейдите в S3 сервис
3. Создайте новый bucket:
   - Название: `rolled-metal-images` (уникальное)
   - Регион: `eu-west-1` (или другой)
   - Block Public Access: Отключите для публичного доступа к изображениям
   - Versioning: Включите (опционально)

#### Настройка CORS

1. Перейдите в настройки bucket → Permissions → CORS
2. Добавьте следующую конфигурацию:

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

#### Создание IAM пользователя

1. Перейдите в IAM → Users
2. Создайте нового пользователя:
   - Название: `rolled-metal-s3-user`
   - Access type: Programmatic access
3. Attach policy: `AmazonS3FullAccess`
4. Сохраните Access Key ID и Secret Access Key

### 2. Настройка проекта

#### Переменные окружения

Добавьте в `.env.local`:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_REGION="eu-west-1"
AWS_S3_BUCKET="rolled-metal-images"

# CloudFront (опционально)
CLOUDFRONT_DOMAIN=""
```

#### Установка зависимостей

Зависимости уже установлены в package.json:

```bash
npm install
```

### 3. Использование

#### Простой пример загрузки

```typescript
import { s3Service } from '@/shared/lib/s3-utils';

// Загрузка изображения
const imageFile = /* File object */;
const arrayBuffer = await imageFile.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

const result = await s3Service.uploadImage(
  'product-image.jpg',
  buffer,
  'image/jpeg',
  { 'product-id': '123' }
);

console.log('Uploaded:', result.url);
```

#### Использование компонента

```tsx
import { ImageUpload } from "@/shared/ui/ImageUpload";

function MyComponent() {
  return (
    <ImageUpload
      onUploadComplete={result => {
        console.log("Success:", result);
      }}
      onUploadError={error => {
        console.error("Error:", error);
      }}
      category="products"
      generateThumbnails={true}
    />
  );
}
```

### 4. Проверка

#### Тестирование API

```bash
# POST /api/upload/image
curl -X POST http://localhost:3000/api/upload/image \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/image.jpg" \
  -F "category=products" \
  -F "generateThumbnails=true"

# GET /api/upload/image
curl http://localhost:3000/api/upload/image

# DELETE /api/upload/image/[key]
curl -X DELETE http://localhost:3000/api/upload/image/images%2Ftest.jpg
```

#### Проверка в S3

1. Откройте AWS Console → S3
2. Перейдите в ваш bucket
3. Проверьте папку `images/`
4. Проверьте папку `images/thumbnails/`

### 5. Troubleshooting

#### Ошибка "Access Denied"

**Проблема:** AWS credentials неверны или недостаточно прав

**Решение:**

1. Проверьте AWS_ACCESS_KEY_ID и AWS_SECRET_ACCESS_KEY
2. Убедитесь, что IAM пользователь имеет права на S3
3. Проверьте bucket policy

```bash
# Проверка credentials
aws s3 ls --profile your-profile
```

#### Ошибка CORS

**Проблема:** Браузер блокирует запросы к S3

**Решение:**

1. Проверьте CORS конфигурацию bucket
2. Убедитесь, что origin включен в AllowedOrigins
3. Очистите кэш браузера

#### Ошибка "Файл не найден"

**Проблема:** Неверный путь к файлу в S3

**Решение:**

1. Проверьте key файла
2. Используйте правильное URL encoding
3. Проверьте наличие файла в S3 Console

### 6. Производительность

#### Оптимизация загрузки

1. **Сжатие изображений:**

   ```typescript
   const optimized = await imageProcessingService.optimizeForWeb(
     buffer,
     1200, // max width
     0.8 // quality
   );
   ```

2. **Использование миниатюр:**

   ```typescript
   const thumbnails = await imageProcessingService.createThumbnails(
     "product-image.jpg",
     buffer,
     [150, 300, 600]
   );
   ```

3. **CDN (CloudFront):**
   - Настройте CloudFront distribution
   - Укажите CLOUDFRONT_DOMAIN в env
   - Используйте CloudFront URL для изображений

### 7. Безопасность

#### Проверка размера файла

```typescript
const maxSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxSize) {
  throw new Error("Файл слишком большой");
}
```

#### Проверка типа файла

```typescript
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
if (!allowedTypes.includes(file.type)) {
  throw new Error("Неподдерживаемый тип файла");
}
```

#### Санитизация имени файла

```typescript
const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
```

### 8. Мониторинг

#### AWS CloudWatch

1. Включите CloudWatch для S3
2. Настройте метрики:
   - Number of objects
   - Bucket size
   - Request metrics
3. Настройте алерты

#### Логирование

```typescript
// В коде уже реализовано
console.log("Upload success:", result);
console.error("Upload error:", error);
```

### 9. Дополнительные ресурсы

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/)
- [Проектная документация](./aws-integration.md)

### 10. FAQ

**Q: Как изменить максимальный размер файла?**

A: Измените значение в `S3_BUCKET_CONFIG.images.maxSize` в `src/shared/lib/aws-config.ts`

**Q: Как добавить водяные знаки?**

A: Реализуйте watermarking в `ImageProcessingService` используя Canvas API или Sharp

**Q: Как настроить batch загрузку?**

A: Используйте Promise.all для параллельной загрузки:

```typescript
const results = await Promise.all(
  files.map(file => s3Service.uploadImage(/* ... */))
);
```

**Q: Как удалить все изображения товара?**

A: Используйте listFiles и deleteFile:

```typescript
const images = await s3Service.listFiles(`images/product-${productId}/`);
await Promise.all(images.map(img => s3Service.deleteFile(img.key)));
```

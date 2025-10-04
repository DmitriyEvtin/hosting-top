# Исправление проблемы с публичным доступом к файлам в MinIO

## Проблема

При загрузке логотипа профиля файл загружается в MinIO, но доступ к нему по URL `http://localhost:9000/parket-crm-images/images/images/profile-logos/filename.jpg` невозможен.

## Причины проблемы

1. **Отсутствие публичной политики доступа** - MinIO по умолчанию создает приватные bucket'ы
2. **Дублирование папки `images`** - в коде происходило двойное добавление папки `images` в путь

## Решение

### 1. Настройка публичной политики доступа

Обновлен скрипт `scripts/setup-minio.cjs` для автоматической настройки публичного доступа:

```javascript
// Публичная политика доступа
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

### 2. Исправление дублирования папки `images`

**В файле `src/app/api/upload/image/route.ts`:**

```javascript
// Было:
const key = s3KeyUtils.generateImageKey(
  file.name,
  category ? `images/${category}` : "images"
);

// Стало:
const key = s3KeyUtils.generateImageKey(file.name, category || "images");
```

**В файле `src/shared/lib/s3-utils.ts`:**

```javascript
// Было:
const fullKey = `${S3_BUCKET_CONFIG.images.folder}/${key}`;

// Стало:
const fullKey = key.startsWith("images/")
  ? key
  : `${S3_BUCKET_CONFIG.images.folder}/${key}`;
```

## Запуск исправлений

### 1. Настройка MinIO с публичным доступом

```bash
# Запуск скрипта настройки MinIO
AWS_S3_ENDPOINT="http://localhost:9000" \
AWS_ACCESS_KEY_ID="minioadmin" \
AWS_SECRET_ACCESS_KEY="minioadmin123" \
AWS_REGION="us-east-1" \
AWS_S3_BUCKET="parket-crm-images" \
node scripts/setup-minio.cjs
```

### 2. Проверка доступности файлов

```bash
# Проверка доступности файла
curl -I "http://localhost:9000/parket-crm-images/images/profile-logos/filename.jpg"
```

## Результат

После применения исправлений:

1. ✅ Bucket `parket-crm-images` имеет публичную политику доступа
2. ✅ Файлы загружаются в правильную структуру папок: `images/profile-logos/`
3. ✅ Файлы доступны публично по URL: `http://localhost:9000/parket-crm-images/images/profile-logos/filename.jpg`
4. ✅ Настроены CORS политики для веб-доступа

## Структура папок в MinIO

```
parket-crm-images/
├── images/
│   ├── products/
│   ├── categories/
│   ├── thumbnails/
│   └── profile-logos/          # Логотипы профилей
└── files/
```

## Мониторинг

- **MinIO Console**: http://localhost:9001
- **MinIO API**: http://localhost:9000
- **Bucket**: parket-crm-images

## Дополнительные настройки

Для продакшена рекомендуется:

1. Настроить CloudFront CDN для ускорения доступа
2. Использовать подписанные URL для временного доступа
3. Настроить мониторинг использования хранилища
4. Реализовать автоматическое удаление неиспользуемых файлов

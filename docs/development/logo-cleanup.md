# Автоматическое удаление старого логотипа

## Описание

Реализована автоматическая очистка старого логотипа из хранилища при загрузке нового логотипа профиля.

## Проблема

При загрузке нового логотипа старый файл оставался в хранилище S3/MinIO, что приводило к:

- Накоплению неиспользуемых файлов
- Увеличению расходов на хранение
- Засорению хранилища

## Решение

### 1. Функция извлечения ключа S3 из URL

Добавлен метод `extractKeyFromUrl` в `S3Service`:

```typescript
extractKeyFromUrl(url: string): string | null {
  try {
    // CloudFront URL
    if (AWS_CONFIG.CLOUDFRONT_DOMAIN && url.includes(AWS_CONFIG.CLOUDFRONT_DOMAIN)) {
      return url.replace(`https://${AWS_CONFIG.CLOUDFRONT_DOMAIN}/`, "");
    }

    // MinIO URL для локальной разработки
    if (process.env.AWS_S3_ENDPOINT) {
      const endpoint = process.env.AWS_S3_ENDPOINT.replace(/^https?:\/\//, "");
      const minioPattern = new RegExp(`http://${endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${this.bucket}/(.+)`);
      const match = url.match(minioPattern);
      if (match) {
        return match[1];
      }
    }

    // AWS S3 URL
    const s3Pattern = new RegExp(`https://${this.bucket}\\.s3\\.${AWS_CONFIG.REGION}\\.amazonaws\\.com/(.+)`);
    const match = url.match(s3Pattern);
    if (match) {
      return match[1];
    }

    return null;
  } catch (error) {
    console.error("Ошибка извлечения ключа из URL:", error);
    return null;
  }
}
```

### 2. Обновление API профиля

Модифицирован `PATCH /api/profile` для автоматического удаления старого логотипа:

```typescript
// Получаем текущего пользователя для проверки старого логотипа
const currentUser = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { image: true },
});

// Если обновляется логотип и есть старый логотип, удаляем его из S3
if (image !== undefined && currentUser?.image && currentUser.image !== image) {
  try {
    const oldImageKey = s3Service.extractKeyFromUrl(currentUser.image);
    if (oldImageKey) {
      // Удаляем старый логотип из S3
      await s3Service.deleteFile(oldImageKey);

      // Также удаляем миниатюры старого логотипа
      try {
        const thumbnails = await s3Service.listFiles(
          `thumbnails/${oldImageKey.split("/").pop()?.split(".")[0]}`
        );
        for (const thumbnail of thumbnails) {
          await s3Service.deleteFile(thumbnail.key);
        }
      } catch (error) {
        console.error("Ошибка удаления миниатюр старого логотипа:", error);
        // Не прерываем процесс из-за ошибки удаления миниатюр
      }
    }
  } catch (error) {
    console.error("Ошибка удаления старого логотипа:", error);
    // Не прерываем обновление профиля из-за ошибки удаления файла
  }
}
```

## Преимущества

1. **Автоматическая очистка**: Старые логотипы удаляются автоматически
2. **Экономия места**: Не накапливаются неиспользуемые файлы
3. **Снижение расходов**: Меньше трат на хранение
4. **Надежность**: Ошибки удаления не прерывают обновление профиля
5. **Полная очистка**: Удаляются как основные файлы, так и миниатюры

## Поддерживаемые URL форматы

- **CloudFront**: `https://d1234567890.cloudfront.net/images/profile/logo.jpg`
- **MinIO**: `http://localhost:9000/bucket/images/profile/logo.jpg`
- **AWS S3**: `https://bucket.s3.region.amazonaws.com/images/profile/logo.jpg`

## Обработка ошибок

- Ошибки удаления файлов не прерывают обновление профиля
- Логируются ошибки для мониторинга
- Продолжается работа даже при проблемах с хранилищем

## Файлы изменены

- `src/shared/lib/s3-utils.ts` - добавлен метод `extractKeyFromUrl`
- `src/app/api/profile/route.ts` - добавлена логика удаления старого логотипа

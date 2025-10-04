# Исправление проблемы с загрузкой изображений в Next.js

## Проблема

После загрузки логотипа профиля в продакшене изображение загружается в S3, но при отображении через Next.js Image компонент возникает ошибка:

```
"url" parameter is not allowed
```

URL запроса: `https://parket-crm.ru/_next/image?url=http%3A%2F%2Fs3.ru1.storage.beget.cloud%2F1974b310d475-parket-crm%2Fimages%2Fprofile-logos%2Fqbz5nmkbr4mz7r633t6bamr1dl9otw27_1759574101215_15s952.jpeg&w=32&q=75`

## Причина

Next.js Image компонент имеет встроенную защиту от загрузки изображений с неразрешенных доменов. По умолчанию разрешены только локальные домены и домены, явно указанные в конфигурации.

## Решение

### 1. Обновление конфигурации Next.js

В файле `next.config.ts` добавлены домены и паттерны для внешних изображений:

```typescript
// Настройки для изображений
images: {
  domains: [
    "localhost",
    "s3.ru1.storage.beget.cloud",
  ],
  remotePatterns: [
    {
      protocol: "https",
      hostname: "*.s3.amazonaws.com",
      port: "",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "*.s3.*.amazonaws.com",
      port: "",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "*.cloudfront.net",
      port: "",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "s3.ru1.storage.beget.cloud",
      port: "",
      pathname: "/**",
    },
  ],
  formats: ["image/webp", "image/avif"],
},
```

### 2. Объяснение конфигурации

- **`domains`** - для простых доменов без поддоменов
- **`remotePatterns`** - для гибкой настройки с поддержкой wildcards и протоколов
- **`*.s3.amazonaws.com`** - для стандартных S3 доменов AWS
- **`*.s3.*.amazonaws.com`** - для региональных S3 доменов AWS
- **`*.cloudfront.net`** - для CloudFront CDN доменов
- **`s3.ru1.storage.beget.cloud`** - для конкретного S3 провайдера

### 3. Преимущества использования remotePatterns

- **Гибкость**: Поддержка wildcards (`*`) для любых поддоменов
- **Безопасность**: Явное указание протокола и путей
- **Масштабируемость**: Не нужно добавлять каждый новый домен вручную

## Проверка решения

После обновления конфигурации:

1. **Перезапустите приложение** (конфигурация Next.js загружается при старте)
2. **Очистите кэш браузера** для обновления изображений
3. **Проверьте загрузку логотипа** в профиле пользователя

## Дополнительные рекомендации

### Для продакшена

Если используется CloudFront CDN, убедитесь, что домен CloudFront добавлен в переменные окружения:

```bash
CLOUDFRONT_DOMAIN="your-cloudfront-domain.cloudfront.net"
```

### Для разработки

Для локальной разработки с MinIO добавьте соответствующий домен:

```typescript
domains: [
  "localhost",
  "localhost:9000", // MinIO порт
  "s3.ru1.storage.beget.cloud",
],
```

## Мониторинг

После исправления проверьте:

- ✅ Логотипы загружаются без ошибок
- ✅ Изображения отображаются корректно
- ✅ Нет ошибок в консоли браузера
- ✅ Производительность загрузки изображений

## Связанные файлы

- `next.config.ts` - основная конфигурация Next.js
- `src/views/profile/ui/UserProfile/UserProfile.tsx` - компонент профиля
- `src/views/profile/ui/ProfileLogoUpload/ProfileLogoUpload.tsx` - загрузка логотипа
- `src/shared/lib/s3-utils.ts` - утилиты для работы с S3

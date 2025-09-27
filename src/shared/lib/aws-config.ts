/**
 * Конфигурация AWS S3
 * Настройки для хранения изображений и файлов
 */

import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { env, hasAws } from "./env";

// Конфигурация AWS S3 клиента
export const s3Config: S3ClientConfig = {
  region: env.AWS_REGION,
  credentials: hasAws
    ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined,
  // Настройки для production
  ...(env.NODE_ENV === "production" && {
    maxAttempts: 3,
    retryMode: "adaptive",
  }),
};

// Создание S3 клиента
export const s3Client = new S3Client(s3Config);

// Настройки для загрузки файлов
export const uploadConfig = {
  // Максимальный размер файла (10MB)
  maxFileSize: 10 * 1024 * 1024,

  // Разрешенные типы файлов
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],

  // Настройки для изображений
  imageSettings: {
    // Максимальные размеры
    maxWidth: 2048,
    maxHeight: 2048,

    // Качество сжатия
    quality: 85,

    // Формат по умолчанию
    defaultFormat: "webp",
  },

  // Настройки для миниатюр
  thumbnailSettings: {
    width: 300,
    height: 300,
    quality: 80,
    format: "webp",
  },

  // Настройки для превью
  previewSettings: {
    width: 800,
    height: 600,
    quality: 85,
    format: "webp",
  },
};

// Настройки CloudFront CDN
export const cdnConfig = {
  domain: env.CLOUDFRONT_DOMAIN,
  enabled: !!env.CLOUDFRONT_DOMAIN,

  // Настройки кэширования
  cacheSettings: {
    // Время кэширования для изображений (7 дней)
    imageCacheTTL: 7 * 24 * 60 * 60,

    // Время кэширования для миниатюр (30 дней)
    thumbnailCacheTTL: 30 * 24 * 60 * 60,

    // Настройки для разных типов файлов
    cacheBehaviors: {
      "*.webp": { ttl: 7 * 24 * 60 * 60 },
      "*.jpg": { ttl: 7 * 24 * 60 * 60 },
      "*.png": { ttl: 7 * 24 * 60 * 60 },
    },
  },
};

// Утилиты для работы с S3
export const s3Utils = {
  // Генерация URL для файла
  getFileUrl: (key: string): string => {
    if (cdnConfig.enabled) {
      return `https://${cdnConfig.domain}/${key}`;
    }
    return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  },

  // Генерация ключа для файла
  generateKey: (prefix: string, filename: string): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = filename.split(".").pop();
    return `${prefix}/${timestamp}-${randomId}.${extension}`;
  },

  // Проверка типа файла
  isValidFileType: (mimeType: string): boolean => {
    return uploadConfig.allowedMimeTypes.includes(mimeType);
  },

  // Проверка размера файла
  isValidFileSize: (size: number): boolean => {
    return size <= uploadConfig.maxFileSize;
  },

  // Генерация ключей для разных размеров изображений
  generateImageKeys: (baseKey: string) => {
    const nameWithoutExt = baseKey.replace(/\.[^/.]+$/, "");
    const extension = baseKey.split(".").pop();

    return {
      original: baseKey,
      thumbnail: `${nameWithoutExt}-thumb.${extension}`,
      preview: `${nameWithoutExt}-preview.${extension}`,
    };
  },
};

// Настройки для разных окружений
export const environmentConfig = {
  development: {
    bucket: `${env.AWS_S3_BUCKET}-dev`,
    cdnEnabled: false,
    cacheTTL: 60, // 1 минута для разработки
  },

  staging: {
    bucket: `${env.AWS_S3_BUCKET}-staging`,
    cdnEnabled: false,
    cacheTTL: 60 * 60, // 1 час для staging
  },

  production: {
    bucket: env.AWS_S3_BUCKET!,
    cdnEnabled: cdnConfig.enabled,
    cacheTTL: cdnConfig.cacheSettings.imageCacheTTL,
  },
};

// Получение конфигурации для текущего окружения
export const getCurrentConfig = () => {
  return environmentConfig[env.NODE_ENV];
};

// Проверка доступности AWS сервисов
export const checkAwsAvailability = async (): Promise<boolean> => {
  if (!hasAws) {
    return false;
  }

  try {
    // Простая проверка доступности S3
    await s3Client.send({} as any);
    return true;
  } catch (error) {
    console.error("AWS S3 недоступен:", error);
    return false;
  }
};

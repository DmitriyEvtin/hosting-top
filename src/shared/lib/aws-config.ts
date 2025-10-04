/**
 * AWS Configuration
 * Централизованная конфигурация для AWS сервисов
 */

import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import { S3Client } from "@aws-sdk/client-s3";

// Валидация переменных окружения
const validateAwsConfig = () => {
  const requiredVars = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_REGION",
    "AWS_S3_BUCKET",
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Отсутствуют обязательные переменные окружения AWS: ${missingVars.join(", ")}`
    );
  }
};

// Ленивая валидация - выполняется только при первом использовании
let isAwsConfigValidated = false;
const lazyValidateAwsConfig = () => {
  if (!isAwsConfigValidated) {
    validateAwsConfig();
    isAwsConfigValidated = true;
  }
};

/**
 * AWS S3 Client Configuration
 * Создается с ленивой валидацией
 */
const createS3Client = () => {
  lazyValidateAwsConfig();
  return new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    // MinIO endpoint для локальной разработки
    ...(process.env.AWS_S3_ENDPOINT && {
      endpoint: process.env.AWS_S3_ENDPOINT,
      forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === "true",
    }),
    // Настройки для оптимизации производительности
    maxAttempts: 3,
    retryMode: "adaptive",
  });
};

export const s3Client = createS3Client();

/**
 * AWS CloudFront Client Configuration
 * Создается с ленивой валидацией
 */
const createCloudFrontClient = () => {
  lazyValidateAwsConfig();
  return new CloudFrontClient({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    // MinIO endpoint для локальной разработки (CloudFront не поддерживается в MinIO)
    ...(process.env.AWS_S3_ENDPOINT && {
      endpoint: process.env.AWS_S3_ENDPOINT,
    }),
    maxAttempts: 3,
    retryMode: "adaptive",
  });
};

export const cloudFrontClient = createCloudFrontClient();

/**
 * AWS Configuration Constants
 * Создается с ленивой валидацией
 */
const createAwsConfig = () => {
  lazyValidateAwsConfig();
  return {
    S3_BUCKET: process.env.AWS_S3_BUCKET!,
    REGION: process.env.AWS_REGION!,
    CLOUDFRONT_DOMAIN: process.env.CLOUDFRONT_DOMAIN || "",
  } as const;
};

export const AWS_CONFIG = createAwsConfig();

/**
 * S3 Bucket Configuration
 * Создается с ленивой валидацией
 */
const createS3BucketConfig = () => {
  lazyValidateAwsConfig();
  return {
    // Основные настройки bucket
    bucket: process.env.AWS_S3_BUCKET!,
    region: process.env.AWS_REGION!,

    // Настройки для изображений
    images: {
      folder: "images",
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
      thumbnailSizes: [150, 300, 600, 1200], // Размеры миниатюр
    },

    // Настройки для других файлов
    files: {
      folder: "files",
      maxSize: 50 * 1024 * 1024, // 50MB
    },
  } as const;
};

export const S3_BUCKET_CONFIG = createS3BucketConfig();

/**
 * CloudFront Configuration
 * Создается с ленивой валидацией
 */
const createCloudFrontConfig = () => {
  lazyValidateAwsConfig();
  return {
    domain: process.env.CLOUDFRONT_DOMAIN || "",
    cacheTtl: 31536000, // 1 год в секундах
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  } as const;
};

export const CLOUDFRONT_CONFIG = createCloudFrontConfig();

/**
 * Типы для AWS операций
 */
export type AwsRegion = string;
export type S3Bucket = string;
export type S3Key = string;
export type CloudFrontDomain = string;

/**
 * Интерфейс для AWS конфигурации
 */
export interface AwsConfig {
  region: AwsRegion;
  bucket: S3Bucket;
  cloudFrontDomain?: CloudFrontDomain;
}

/**
 * Получение текущей AWS конфигурации
 */
export const getAwsConfig = (): AwsConfig => {
  lazyValidateAwsConfig();
  return {
    region: process.env.AWS_REGION!,
    bucket: process.env.AWS_S3_BUCKET!,
    cloudFrontDomain: process.env.CLOUDFRONT_DOMAIN || undefined,
  };
};

/**
 * Проверка доступности AWS сервисов
 */
export const isAwsConfigured = (): boolean => {
  try {
    validateAwsConfig();
    return true;
  } catch {
    return false;
  }
};

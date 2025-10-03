/**
 * Упрощенная валидация переменных окружения
 * Без сложной логики Zod для отладки
 */

// Базовые переменные окружения
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_NAME: process.env.APP_NAME || "Каталог металлопроката",
  APP_VERSION: process.env.APP_VERSION || "1.0.0",

  // База данных
  DATABASE_URL: process.env.DATABASE_URL || "",

  // Redis
  REDIS_URL: process.env.REDIS_URL || "",

  // NextAuth.js
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",

  // AWS S3
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  AWS_REGION: process.env.AWS_REGION || "eu-west-1",
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || "",
  CLOUDFRONT_DOMAIN: process.env.CLOUDFRONT_DOMAIN || "",

  // Настройки парсинга
  PARSING_BATCH_SIZE: parseInt(process.env.PARSING_BATCH_SIZE || "10"),
  PARSING_DELAY_MS: parseInt(process.env.PARSING_DELAY_MS || "1000"),
  PARSING_MAX_RETRIES: parseInt(process.env.PARSING_MAX_RETRIES || "3"),
  PARSING_USER_AGENT:
    process.env.PARSING_USER_AGENT ||
    "Mozilla/5.0 (compatible; RolledMetalParser/1.0)",

  // Мониторинг
  SENTRY_DSN: process.env.SENTRY_DSN || "",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  // Email
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587"),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  SMTP_FROM: process.env.SMTP_FROM || "noreply@rolled-metal.local",

  // Безопасность
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),

  // Разработка
  DEBUG: process.env.DEBUG || "",
  VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === "true",
};

// Утилиты для проверки окружения
export const isDevelopment = env.NODE_ENV === "development";
export const isStaging = env.NODE_ENV === "staging";
export const isProduction = env.NODE_ENV === "production";

// Проверка реального production окружения (не только сборки)
// Для development сборки отключаем строгие проверки
export const isRealProduction =
  isProduction &&
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_DEV_MODE &&
  !process.env.DEV_BUILD;

// Утилиты для проверки доступности сервисов
export const hasRedis = !!env.REDIS_URL;
export const hasAws = !!(
  env.AWS_ACCESS_KEY_ID &&
  env.AWS_SECRET_ACCESS_KEY &&
  env.AWS_S3_BUCKET
);
export const hasSmtp = !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);
export const hasSentry = !!env.SENTRY_DSN;

// Утилиты для логирования
export const shouldLogVerbose = isDevelopment && env.VERBOSE_LOGGING;
export const shouldDebug = isDevelopment && !!env.DEBUG;

// Валидация критических переменных для production
export function validateProductionEnv(): void {
  if (isRealProduction) {
    const criticalVars = [
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
    ] as const;

    const missingVars = criticalVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Критические переменные окружения не установлены для production: ${missingVars.join(", ")}`
      );
    }

    // Проверка безопасности для production
    if (env.NEXTAUTH_SECRET === "your-secret-key-here-change-in-production") {
      throw new Error("NEXTAUTH_SECRET должен быть изменен для production");
    }

    if (env.NEXTAUTH_URL.includes("localhost")) {
      throw new Error(
        "NEXTAUTH_URL не должен содержать localhost для production"
      );
    }
  }
}

// Инициализация валидации при импорте модуля
if (typeof window === "undefined") {
  // Валидация только на сервере
  validateProductionEnv();
}

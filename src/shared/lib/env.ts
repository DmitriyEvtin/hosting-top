/**
 * Утилиты для работы с переменными окружения
 * Обеспечивает валидацию и типизацию переменных окружения
 */

import { z } from "zod";

// Схема валидации переменных окружения
const envSchema = z.object({
  // Основные настройки приложения
  NODE_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
  APP_NAME: z.string().default("Hosting Top"),
  APP_VERSION: z.string().default("1.0.0"),

  // База данных
  DATABASE_URL: z.string().url("DATABASE_URL должен быть валидным URL"),

  // Redis
  REDIS_URL: z.string().url("REDIS_URL должен быть валидным URL").optional(),

  // NextAuth.js
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET должен содержать минимум 32 символа"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL должен быть валидным URL"),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default("eu-west-1"),
  AWS_S3_BUCKET: z.string().optional(),
  CLOUDFRONT_DOMAIN: z.string().optional(),

  // Мониторинг
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(65535))
    .optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Безопасность
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  RATE_LIMIT_MAX: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(10000))
    .default("100"),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1000).max(3600000))
    .default("900000"),

  // Разработка (только для development)
  DEBUG: z.string().optional(),
  VERBOSE_LOGGING: z
    .string()
    .transform(val => val === "true")
    .optional(),
});

// Тип переменных окружения
export type Env = z.infer<typeof envSchema>;

// Валидация и парсинг переменных окружения
function validateEnv(): Env {
  try {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
      // Более безопасная обработка ошибок
      let errorMessages: string[] = [];

      if (
        result.error &&
        result.error.errors &&
        Array.isArray(result.error.errors)
      ) {
        errorMessages = result.error.errors.map(
          err => `${err.path.join(".")}: ${err.message}`
        );
      } else {
        // Fallback для случаев, когда структура ошибки неожиданная
        errorMessages = ["Неизвестная ошибка валидации переменных окружения"];
        console.error("Unexpected error structure:", result.error);
      }

      console.error("Environment validation errors:", errorMessages);
      console.error(
        "Available env vars:",
        Object.keys(process.env).filter(
          key =>
            key.startsWith("NODE_") ||
            key.startsWith("DATABASE_") ||
            key.startsWith("NEXTAUTH_")
        )
      );

      throw new Error(
        `Ошибка валидации переменных окружения:\n${errorMessages.join("\n")}`
      );
    }

    return result.data;
  } catch (error) {
    console.error("Error during env validation:", error);
    throw error;
  }
}

// Экспорт валидированных переменных окружения
export const env = validateEnv();

// Утилиты для проверки окружения
export const isDevelopment = env.NODE_ENV === "development";
export const isStaging = env.NODE_ENV === "staging";
export const isProduction = env.NODE_ENV === "production";

// Проверка, что мы находимся в процессе сборки Next.js
// Next.js устанавливает NODE_ENV=production во время сборки, но это не runtime production
const isBuildTime =
  // Проверка аргументов командной строки
  process.argv.some(arg => arg.includes("build")) ||
  // Проверка переменных окружения для пропуска валидации
  process.env.SKIP_ENV_VALIDATION === "true" ||
  process.env.DEV_BUILD === "true" ||
  // Проверка фазы Next.js (если доступна)
  process.env.NEXT_PHASE === "phase-production-build";

// Проверка реального production окружения (не только сборки)
// Для development сборки отключаем строгие проверки
export const isRealProduction =
  isProduction &&
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_DEV_MODE &&
  !process.env.DEV_BUILD &&
  !isBuildTime;

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
export const shouldLogVerbose = isDevelopment && env.VERBOSE_LOGGING === true;
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
        `Критические переменные окружения не установлены для production: ${missingVars.join(", ")}. Установите эти переменные в вашем production окружении.`
      );
    }

    // Проверка безопасности для production
    if (env.NEXTAUTH_SECRET === "your-secret-key-here-change-in-production") {
      throw new Error("NEXTAUTH_SECRET должен быть изменен для production");
    }

    if (env.NEXTAUTH_URL.includes("localhost")) {
      throw new Error(
        `NEXTAUTH_URL не должен содержать localhost для production. Текущее значение: ${env.NEXTAUTH_URL}. Установите правильный URL для production окружения.`
      );
    }
  }
}

// Инициализация валидации при импорте модуля
if (typeof window === "undefined") {
  // Валидация только на сервере
  validateProductionEnv();
}

/**
 * API endpoint для проверки конфигурации приложения
 * GET /api/config/check
 */

import { checkAwsAvailability } from "@/shared/lib/aws-config";
import { testDatabaseConnection } from "@/shared/lib/database-test";
import {
  env,
  hasAws,
  hasRedis,
  hasSentry,
  hasSmtp,
  isDevelopment,
} from "@/shared/lib/env-simple";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Проверка базовых переменных окружения
    const basicConfig = {
      nodeEnv: env.NODE_ENV,
      appName: env.APP_NAME,
      appVersion: env.APP_VERSION,
      isDevelopment,
    };

    // Проверка базы данных
    let databaseStatus = "unknown";
    try {
      const dbTest = await testDatabaseConnection();
      databaseStatus = dbTest.success ? "connected" : "error";
    } catch {
      databaseStatus = "error";
    }

    // Проверка Redis
    const redisStatus = hasRedis ? "configured" : "not_configured";

    // Проверка AWS S3
    let awsStatus = "not_configured";
    if (hasAws) {
      try {
        const awsAvailable = await checkAwsAvailability();
        awsStatus = awsAvailable ? "available" : "unavailable";
      } catch {
        awsStatus = "error";
      }
    }

    // Проверка SMTP
    const smtpStatus = hasSmtp ? "configured" : "not_configured";

    // Проверка Sentry
    const sentryStatus = hasSentry ? "configured" : "not_configured";

    // Общий статус конфигурации
    const criticalServices = [
      databaseStatus === "connected",
      // Redis не критичен
      // AWS не критичен для базовой работы
      // SMTP не критичен
      // Sentry не критичен
    ];

    const overallStatus = criticalServices.every(status => status)
      ? "healthy"
      : "degraded";

    // Сбор информации о конфигурации
    const configInfo = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: {
        ...basicConfig,
        database: {
          status: databaseStatus,
          url: env.DATABASE_URL ? "configured" : "not_configured",
        },
        redis: {
          status: redisStatus,
          url: env.REDIS_URL ? "configured" : "not_configured",
        },
        aws: {
          status: awsStatus,
          region: env.AWS_REGION,
          bucket: env.AWS_S3_BUCKET ? "configured" : "not_configured",
          cdn: env.CLOUDFRONT_DOMAIN ? "configured" : "not_configured",
        },
        auth: {
          nextauth: {
            secret: env.NEXTAUTH_SECRET ? "configured" : "not_configured",
            url: env.NEXTAUTH_URL,
          },
        },
        smtp: {
          status: smtpStatus,
          host: env.SMTP_HOST ? "configured" : "not_configured",
          from: env.SMTP_FROM,
        },
        monitoring: {
          sentry: sentryStatus,
          logLevel: env.LOG_LEVEL,
        },
        parsing: {
          batchSize: env.PARSING_BATCH_SIZE,
          delayMs: env.PARSING_DELAY_MS,
          maxRetries: env.PARSING_MAX_RETRIES,
        },
        security: {
          corsOrigin: env.CORS_ORIGIN,
          rateLimitMax: env.RATE_LIMIT_MAX,
          rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
        },
      },
    };

    // Логирование для development
    if (isDevelopment) {
      console.warn("Configuration check:", {
        status: overallStatus,
        database: databaseStatus,
        redis: redisStatus,
        aws: awsStatus,
        smtp: smtpStatus,
        sentry: sentryStatus,
      });
    }

    return NextResponse.json(configInfo, {
      status: overallStatus === "healthy" ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Configuration check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: {
          message: "Configuration check failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  try {
    // Быстрая проверка только критических сервисов
    const dbTest = await testDatabaseConnection();

    if (!dbTest.success) {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}

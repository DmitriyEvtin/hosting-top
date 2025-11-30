/**
 * Простой API endpoint для проверки конфигурации приложения
 * GET /api/config/simple
 */

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Простая проверка переменных окружения без сложной валидации
    const basicConfig = {
      nodeEnv: process.env.NODE_ENV || "development",
      appName: process.env.APP_NAME || "Паркет Retail",
      appVersion: process.env.APP_VERSION || "1.0.0",
    };

    // Проверка базы данных
    let databaseStatus = "unknown";
    try {
      // Простая проверка наличия DATABASE_URL
      databaseStatus = process.env.DATABASE_URL
        ? "configured"
        : "not_configured";
    } catch {
      databaseStatus = "error";
    }

    // Проверка Redis
    const redisStatus = process.env.REDIS_URL ? "configured" : "not_configured";

    // Проверка AWS S3
    const awsStatus =
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET
        ? "configured"
        : "not_configured";

    // Проверка SMTP
    const smtpStatus =
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
        ? "configured"
        : "not_configured";

    // Проверка Sentry
    const sentryStatus = process.env.SENTRY_DSN
      ? "configured"
      : "not_configured";

    // Общий статус конфигурации
    const criticalServices = [databaseStatus === "configured"];

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
          url: process.env.DATABASE_URL ? "configured" : "not_configured",
        },
        redis: {
          status: redisStatus,
          url: process.env.REDIS_URL ? "configured" : "not_configured",
        },
        aws: {
          status: awsStatus,
          region: process.env.AWS_REGION || "eu-west-1",
          bucket: process.env.AWS_S3_BUCKET ? "configured" : "not_configured",
          cdn: process.env.CLOUDFRONT_DOMAIN ? "configured" : "not_configured",
        },
        auth: {
          nextauth: {
            secret: process.env.NEXTAUTH_SECRET
              ? "configured"
              : "not_configured",
            url: process.env.NEXTAUTH_URL || "http://localhost:3000",
          },
        },
        smtp: {
          status: smtpStatus,
          host: process.env.SMTP_HOST ? "configured" : "not_configured",
          from: process.env.SMTP_FROM || "noreply@parket-crm.local",
        },
        monitoring: {
          sentry: sentryStatus,
          logLevel: process.env.LOG_LEVEL || "info",
        },
        security: {
          corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
          rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100"),
          rateLimitWindowMs: parseInt(
            process.env.RATE_LIMIT_WINDOW_MS || "900000"
          ),
        },
      },
    };

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

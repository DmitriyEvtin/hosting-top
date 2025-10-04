import { withAdminAuth } from "@/shared/lib/admin-middleware";
import { NextRequest, NextResponse } from "next/server";

async function handler() {
  try {
    const config = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        appName: process.env.APP_NAME || "Rolled Metal",
        appVersion: process.env.APP_VERSION || "1.0.0",
        isDevelopment: process.env.NODE_ENV === "development",
        database: {
          status: process.env.DATABASE_URL ? "configured" : "not_configured",
          url: process.env.DATABASE_URL ? "***настроен***" : "не настроен",
        },
        redis: {
          status: process.env.REDIS_URL ? "configured" : "not_configured",
          url: process.env.REDIS_URL ? "***настроен***" : "не настроен",
        },
        aws: {
          status: process.env.AWS_ACCESS_KEY_ID
            ? "available"
            : "not_configured",
          region: process.env.AWS_REGION || "us-east-1",
          bucket: process.env.AWS_S3_BUCKET || "не настроен",
          cdn: process.env.AWS_CLOUDFRONT_DOMAIN || "не настроен",
        },
        auth: {
          nextauth: {
            secret: process.env.NEXTAUTH_SECRET
              ? "***настроен***"
              : "не настроен",
            url: process.env.NEXTAUTH_URL || "не настроен",
          },
        },
        smtp: {
          status: process.env.SMTP_HOST ? "configured" : "not_configured",
          host: process.env.SMTP_HOST || "не настроен",
          from: process.env.SMTP_FROM || "не настроен",
        },
        monitoring: {
          sentry: process.env.SENTRY_DSN ? "configured" : "not_configured",
          logLevel: process.env.LOG_LEVEL || "info",
        },
        parsing: {
          batchSize: parseInt(process.env.PARSING_BATCH_SIZE || "10"),
          delayMs: parseInt(process.env.PARSING_DELAY_MS || "1000"),
          maxRetries: parseInt(process.env.PARSING_MAX_RETRIES || "3"),
        },
        security: {
          corsOrigin: process.env.CORS_ORIGIN || "*",
          rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100"),
          rateLimitWindowMs: parseInt(
            process.env.RATE_LIMIT_WINDOW_MS || "900000"
          ),
        },
      },
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error("Configuration check error:", error);
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Неизвестная ошибка",
        },
      },
      { status: 500 }
    );
  }
}

export const GET = (request: NextRequest) =>
  withAdminAuth(request, () => handler());

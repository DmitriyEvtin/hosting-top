import { withAdminAuth } from "@/shared/lib/admin-middleware";
import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

async function handler(request: NextRequest) {
  try {
    // Проверяем доступность Sentry
    let sentryAvailable = false;
    try {
      // Пытаемся использовать Sentry для проверки доступности
      Sentry.captureMessage("Тест диагностики Sentry", "info");
      sentryAvailable = true;
    } catch (error) {
      console.log("Sentry недоступен:", error);
    }

    const diagnosis = {
      success: true,
      message: "Диагностика Sentry выполнена успешно",
      config: {
        environment: {
          NODE_ENV: process.env.NODE_ENV || "development",
          SENTRY_DSN: process.env.SENTRY_DSN ? "***настроен***" : "не настроен",
          NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN
            ? "***настроен***"
            : "не настроен",
        },
        sentry: {
          isInitialized: sentryAvailable,
          client: typeof window !== "undefined",
          dsn: process.env.SENTRY_DSN ? "***настроен***" : "не настроен",
        },
        request: {
          url: request.url,
          method: request.method,
          userAgent: request.headers.get("user-agent") || "неизвестно",
          timestamp: new Date().toISOString(),
        },
      },
      testEvent: sentryAvailable ? "отправлено" : "не отправлено",
      timestamp: new Date().toISOString(),
    };

    // Если это POST запрос с сообщением, отправляем его в Sentry
    if (request.method === "POST") {
      try {
        const body = await request.json();
        if (body.message) {
          Sentry.captureMessage(body.message, "info");
        }
      } catch (error) {
        console.error("Error processing Sentry test message:", error);
      }
    }

    return NextResponse.json(diagnosis);
  } catch (error) {
    console.error("Sentry diagnosis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      { status: 500 }
    );
  }
}

export const GET = (request: NextRequest) => withAdminAuth(request, handler);

export const POST = (request: NextRequest) => withAdminAuth(request, handler);

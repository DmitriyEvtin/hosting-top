import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

// Принудительная инициализация Sentry для API routes
if (!Sentry.getClient()) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    debug:
      process.env.NODE_ENV === "development" ||
      process.env.SENTRY_DEBUG === "true",
  });
}

/**
 * API endpoint для диагностики Sentry
 * GET /api/sentry-diagnosis - проверка конфигурации Sentry
 */
export async function GET(request: NextRequest) {
  try {
    // Собираем информацию о конфигурации Sentry
    const sentryConfig = {
      // Проверяем переменные окружения
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SENTRY_DSN: process.env.SENTRY_DSN ? "***настроен***" : "не настроен",
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN
          ? "***настроен***"
          : "не настроен",
      },
      // Проверяем состояние Sentry
      sentry: {
        isInitialized: Sentry.getCurrentScope() !== undefined,
        client: Sentry.getClient() !== undefined,
        dsn: Sentry.getClient()?.getDsn() ? "настроен" : "не настроен",
        // Дополнительная диагностика
        scope: Sentry.getCurrentScope() !== undefined,
        clientInfo: Sentry.getClient()
          ? {
              enabled: Sentry.getClient()?.getOptions()?.enabled,
              dsn: "настроен",
              environment: Sentry.getClient()?.getOptions()?.environment,
            }
          : null,
      },
      // Информация о запросе
      request: {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get("user-agent"),
        timestamp: new Date().toISOString(),
      },
    };

    // Пытаемся отправить тестовое событие
    let testEventResult = "не выполнено";
    try {
      Sentry.captureMessage("Тестовая диагностика Sentry", {
        level: "info",
        tags: {
          component: "diagnosis",
          endpoint: "/api/sentry-diagnosis",
        },
        extra: {
          timestamp: new Date().toISOString(),
          config: sentryConfig,
        },
      });
      testEventResult = "отправлено";
    } catch (error) {
      testEventResult = `ошибка: ${error instanceof Error ? error.message : "неизвестная ошибка"}`;
    }

    return NextResponse.json({
      success: true,
      message: "Диагностика Sentry выполнена",
      config: sentryConfig,
      testEvent: testEventResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Если произошла ошибка, логируем её
    console.error("Ошибка диагностики Sentry:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Ошибка при диагностике Sentry",
        details: error instanceof Error ? error.message : "неизвестная ошибка",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sentry-diagnosis - принудительная отправка тестового события
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const testMessage = body.message || "Принудительный тест Sentry";

    // Отправляем тестовое событие с дополнительной информацией
    Sentry.captureMessage(testMessage, {
      level: "info",
      tags: {
        component: "diagnosis",
        endpoint: "/api/sentry-diagnosis",
        method: "POST",
      },
      extra: {
        message: testMessage,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get("user-agent"),
        body: body,
      },
    });

    // Также отправляем breadcrumb
    Sentry.addBreadcrumb({
      message: `Диагностический breadcrumb: ${testMessage}`,
      category: "diagnosis",
      level: "info",
      data: {
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Тестовое событие отправлено в Sentry",
      testMessage: testMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Ошибка при отправке тестового события:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Ошибка при отправке тестового события",
        details: error instanceof Error ? error.message : "неизвестная ошибка",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

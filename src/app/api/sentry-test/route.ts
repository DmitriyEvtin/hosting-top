import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint для тестирования Sentry
 * GET /api/sentry-test - тестовая ошибка
 * POST /api/sentry-test - кастомное событие
 */
export async function GET(request: NextRequest) {
  try {
    // Создаем тестовую ошибку для проверки Sentry
    throw new Error("Тестовая ошибка Sentry - GET запрос");
  } catch (error) {
    // Логируем ошибку в Sentry
    Sentry.captureException(error, {
      tags: {
        component: "api",
        endpoint: "/api/sentry-test",
        method: "GET",
      },
      extra: {
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: "Тестовая ошибка отправлена в Sentry",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Создаем кастомное событие в Sentry
    Sentry.addBreadcrumb({
      message: "Тестовое событие Sentry",
      category: "test",
      level: "info",
      data: {
        message: body.message || "Тестовое сообщение",
        timestamp: new Date().toISOString(),
      },
    });

    // Отправляем кастомное событие
    Sentry.captureMessage("Тестовое сообщение Sentry", {
      level: "info",
      tags: {
        component: "api",
        endpoint: "/api/sentry-test",
        method: "POST",
      },
      extra: {
        body: body,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Тестовое событие отправлено в Sentry",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: "api",
        endpoint: "/api/sentry-test",
        method: "POST",
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: "Ошибка при обработке запроса",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

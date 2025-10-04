import { withAdminAuth } from "@/shared/lib/admin-middleware";
import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

async function handler() {
  try {
    // Отправляем тестовую ошибку в Sentry
    const testError = new Error("Тестовая ошибка из админ-панели");
    Sentry.captureException(testError);

    return NextResponse.json({
      success: true,
      message: "Тестовая ошибка отправлена в Sentry",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Sentry test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      { status: 500 }
    );
  }
}

export const GET = (request: NextRequest) =>
  withAdminAuth(request, () => handler());

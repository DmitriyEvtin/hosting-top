/**
 * GET /api/admin/migration/test-mysql
 * Проверка подключения к MySQL базе данных
 */

import { withAdminAuth } from "@/shared/lib/admin-middleware";
import { testMySQLConnection } from "@/shared/lib/mysql-test";
import { NextRequest, NextResponse } from "next/server";

async function handler(_request: NextRequest) {
  try {
    const result = await testMySQLConnection();

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: "Подключение к MySQL установлено успешно",
        },
        { status: 200 }
      );
    } else {
      const status =
        result.error?.includes("Missing") ||
        result.error?.includes("incomplete")
          ? 400
          : 500;

      return NextResponse.json(
        {
          success: false,
          message:
            result.error?.includes("Missing") ||
            result.error?.includes("incomplete")
              ? "Конфигурация MySQL неполная"
              : "Не удалось подключиться к MySQL",
          error: result.error,
          details: result.details,
        },
        { status }
      );
    }
  } catch (error) {
    console.error("Ошибка проверки подключения к MySQL:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка проверки подключения к MySQL",
        error: errorMessage,
        details: "Проверьте конфигурацию и доступность сервера MySQL",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAdminAuth(request, handler);
}

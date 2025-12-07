/**
 * GET /api/admin/migration/status
 * Получение статуса миграции данных
 */

import { withAdminAuth } from "@/shared/lib/admin-middleware";
import { getMigrationStatus } from "@/shared/lib/migration-status";
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(_request: NextRequest) {
  try {
    const status = await getMigrationStatus();

    if (!status) {
      return NextResponse.json(
        {
          status: "idle",
          message: "Миграция не запущена",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error("Ошибка получения статуса миграции:", error);
    return NextResponse.json(
      {
        error: "Ошибка получения статуса миграции",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAdminAuth(request, handler);
}


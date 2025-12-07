/**
 * POST /api/admin/migration/rollback
 * Откат миграции данных
 * 
 * ВНИМАНИЕ: Откат миграции не реализован в текущей версии скрипта миграции.
 * Этот endpoint подготовлен для будущей реализации.
 */

import { withAdminAuth } from "@/shared/lib/admin-middleware";
import {
  getMigrationStatus,
  isMigrationRunning,
} from "@/shared/lib/migration-status";
import { NextRequest, NextResponse } from "next/server";

async function handler(request: NextRequest) {
  try {
    // Проверяем, не запущена ли миграция
    const isRunning = await isMigrationRunning();
    if (isRunning) {
      return NextResponse.json(
        { error: "Невозможно выполнить откат: миграция все еще выполняется" },
        { status: 409 }
      );
    }

    // Получаем статус последней миграции
    const status = await getMigrationStatus();
    if (!status || status.status === "idle") {
      return NextResponse.json(
        { error: "Нет завершенной миграции для отката" },
        { status: 404 }
      );
    }

    // Проверяем, есть ли результаты миграции для отката
    if (!status.results) {
      return NextResponse.json(
        { error: "Нет данных для отката: результаты миграции отсутствуют" },
        { status: 400 }
      );
    }

    // TODO: Реализовать откат миграции
    // Для отката нужно:
    // 1. Загрузить маппинги ID из файла результатов миграции
    // 2. Удалить созданные записи в обратном порядке
    // 3. Обновить статус миграции

    return NextResponse.json(
      {
        message: "Откат миграции не реализован",
        note: "Функция отката будет реализована в будущих версиях",
        status: status.status,
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Ошибка отката миграции:", error);
    return NextResponse.json(
      {
        error: "Ошибка отката миграции",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, handler);
}


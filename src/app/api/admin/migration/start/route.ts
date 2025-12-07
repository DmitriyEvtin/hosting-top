/**
 * POST /api/admin/migration/start
 * Запуск миграции данных из MySQL в PostgreSQL
 */

import { withAdminAuth } from "@/shared/lib/admin-middleware";
import {
  initializeMigrationStatus,
  isMigrationRunning,
} from "@/shared/lib/migration-status";
import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { join } from "path";
import { randomUUID } from "crypto";

async function handler(request: NextRequest) {
  try {
    // Проверяем, не запущена ли уже миграция
    const isRunning = await isMigrationRunning();
    if (isRunning) {
      return NextResponse.json(
        { error: "Миграция уже запущена" },
        { status: 409 }
      );
    }

    // Парсим параметры из body
    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;
    const skipImages = body.skipImages === true;

    // Генерируем уникальный ID миграции
    const migrationId = randomUUID();

    // Инициализируем статус миграции
    await initializeMigrationStatus(migrationId, dryRun, skipImages);

    // Подготавливаем аргументы для скрипта миграции
    const scriptPath = join(
      process.cwd(),
      "scripts",
      "migration",
      "migrate.ts"
    );
    const args: string[] = [];
    if (dryRun) {
      args.push("--dry-run");
    }
    if (skipImages) {
      args.push("--skip-images");
    }

    // Запускаем миграцию в фоновом режиме
    const migrationProcess = spawn("tsx", [scriptPath, ...args], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        MIGRATION_ID: migrationId,
      },
    });

    // Логируем вывод процесса
    migrationProcess.stdout?.on("data", (data) => {
      console.log(`[Migration ${migrationId}] stdout:`, data.toString());
    });

    migrationProcess.stderr?.on("data", (data) => {
      console.error(`[Migration ${migrationId}] stderr:`, data.toString());
    });

    // Обрабатываем завершение процесса
    migrationProcess.on("close", async (code) => {
      const {
        completeMigration,
        loadMigrationResultsFromFile,
      } = await import("@/shared/lib/migration-status");
      
      if (code === 0) {
        // Миграция завершена успешно
        // Пытаемся загрузить результаты из файла
        const results = await loadMigrationResultsFromFile(migrationId);
        await completeMigration(results, true);
      } else {
        // Миграция завершена с ошибкой
        await completeMigration(null, false);
      }
    });

    migrationProcess.on("error", async (error) => {
      console.error(`[Migration ${migrationId}] Process error:`, error);
      const { completeMigration } = await import(
        "@/shared/lib/migration-status"
      );
      await completeMigration(null, false);
    });

    // Сохраняем PID процесса для возможного отслеживания
    // В production можно использовать более продвинутое решение (Redis, очередь задач)

    return NextResponse.json(
      {
        message: "Миграция запущена",
        migrationId,
        status: "running",
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Ошибка запуска миграции:", error);
    return NextResponse.json(
      {
        error: "Ошибка запуска миграции",
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


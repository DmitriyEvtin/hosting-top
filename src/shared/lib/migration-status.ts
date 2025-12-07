/**
 * Migration Status Storage
 * Модуль для хранения статуса миграции данных
 * Использует Redis если доступен, иначе файловую систему
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Статус миграции
 */
export type MigrationStatus = "idle" | "running" | "completed" | "failed";

/**
 * Прогресс миграции
 */
export interface MigrationProgress {
  current: number;
  total: number;
  stage?: string;
}

/**
 * Результаты миграции
 */
export interface MigrationResults {
  hostings: number;
  tariffs: number;
  images: number;
  references: {
    cms: number;
    controlPanels: number;
    countries: number;
    dataStores: number;
    operationSystems: number;
    programmingLanguages: number;
  };
  tariffRelations: {
    cms: number;
    controlPanels: number;
    countries: number;
    dataStores: number;
    operationSystems: number;
    programmingLanguages: number;
  };
  contentBlocks: number;
}

/**
 * Полный статус миграции
 */
export interface MigrationStatusData {
  id: string;
  status: MigrationStatus;
  progress: MigrationProgress;
  startedAt: string | null;
  completedAt: string | null;
  errors: Array<{
    stage: string;
    message: string;
    error?: string;
  }>;
  results: MigrationResults | null;
  dryRun: boolean;
  skippedImages: boolean;
}

/**
 * Путь к файлу статуса миграции
 */
const getStatusFilePath = (): string => {
  const statusDir = join(process.cwd(), "scripts", "migration", "status");
  if (!existsSync(statusDir)) {
    mkdirSync(statusDir, { recursive: true });
  }
  return join(statusDir, "migration-status.json");
};

/**
 * Получить статус миграции
 */
export async function getMigrationStatus(): Promise<MigrationStatusData | null> {
  try {
    const filePath = getStatusFilePath();
    if (!existsSync(filePath)) {
      return null;
    }

    const fileContent = readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent) as MigrationStatusData;
  } catch (error) {
    console.error("Ошибка чтения статуса миграции:", error);
    return null;
  }
}

/**
 * Сохранить статус миграции
 */
export async function saveMigrationStatus(
  status: MigrationStatusData
): Promise<void> {
  try {
    const filePath = getStatusFilePath();
    writeFileSync(filePath, JSON.stringify(status, null, 2), "utf-8");
  } catch (error) {
    console.error("Ошибка сохранения статуса миграции:", error);
    throw error;
  }
}

/**
 * Инициализировать статус миграции
 */
export async function initializeMigrationStatus(
  id: string,
  dryRun: boolean = false,
  skipImages: boolean = false
): Promise<MigrationStatusData> {
  const status: MigrationStatusData = {
    id,
    status: "running",
    progress: {
      current: 0,
      total: 0,
      stage: "initializing",
    },
    startedAt: new Date().toISOString(),
    completedAt: null,
    errors: [],
    results: null,
    dryRun,
    skippedImages,
  };

  await saveMigrationStatus(status);
  return status;
}

/**
 * Обновить прогресс миграции
 */
export async function updateMigrationProgress(
  progress: Partial<MigrationProgress>
): Promise<void> {
  const status = await getMigrationStatus();
  if (!status) {
    return;
  }

  status.progress = {
    ...status.progress,
    ...progress,
  };

  await saveMigrationStatus(status);
}

/**
 * Добавить ошибку в статус миграции
 */
export async function addMigrationError(
  stage: string,
  message: string,
  error?: string
): Promise<void> {
  const status = await getMigrationStatus();
  if (!status) {
    return;
  }

  status.errors.push({
    stage,
    message,
    error,
  });

  await saveMigrationStatus(status);
}

/**
 * Завершить миграцию
 */
export async function completeMigration(
  results: MigrationResults | null,
  success: boolean = true
): Promise<void> {
  const status = await getMigrationStatus();
  if (!status) {
    return;
  }

  status.status = success ? "completed" : "failed";
  status.completedAt = new Date().toISOString();
  status.results = results;

  await saveMigrationStatus(status);
}

/**
 * Сбросить статус миграции
 */
export async function resetMigrationStatus(): Promise<void> {
  const filePath = getStatusFilePath();
  if (existsSync(filePath)) {
    try {
      const { unlinkSync } = await import("fs");
      unlinkSync(filePath);
    } catch (error) {
      console.error("Ошибка удаления статуса миграции:", error);
    }
  }
}

/**
 * Проверить, запущена ли миграция
 */
export async function isMigrationRunning(): Promise<boolean> {
  const status = await getMigrationStatus();
  return (status?.status === "running") ?? false;
}

/**
 * Загрузить результаты миграции из файла результатов
 */
export async function loadMigrationResultsFromFile(
  migrationId: string
): Promise<MigrationResults | null> {
  try {
    const { readdirSync, readFileSync } = await import("fs");
    const migrationDir = join(process.cwd(), "scripts", "migration");
    const files = readdirSync(migrationDir);

    // Ищем файл результатов миграции
    const resultFile = files.find(
      (file) => file.startsWith("migration-result-") && file.endsWith(".json")
    );

    if (!resultFile) {
      return null;
    }

    const resultFilePath = join(migrationDir, resultFile);
    const fileContent = readFileSync(resultFilePath, "utf-8");
    const result = JSON.parse(fileContent) as {
      statistics: {
        references: {
          cms: number;
          controlPanels: number;
          countries: number;
          dataStores: number;
          operationSystems: number;
          programmingLanguages: number;
        };
        hostings: number;
        images: number;
        tariffs: number;
        tariffRelations: {
          cms: number;
          controlPanels: number;
          countries: number;
          dataStores: number;
          operationSystems: number;
          programmingLanguages: number;
        };
        contentBlocks: number;
      };
    };

    return {
      hostings: result.statistics.hostings,
      tariffs: result.statistics.tariffs,
      images: result.statistics.images,
      references: result.statistics.references,
      tariffRelations: result.statistics.tariffRelations,
      contentBlocks: result.statistics.contentBlocks,
    };
  } catch (error) {
    console.error("Ошибка загрузки результатов миграции:", error);
    return null;
  }
}


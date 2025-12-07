/**
 * Main Migration Script
 * Главный скрипт для миграции данных из MySQL в PostgreSQL
 */

import chalk from "chalk";
import cliProgress from "cli-progress";
import { config } from "dotenv";
import { writeFileSync } from "fs";
import { join, resolve } from "path";
import { prisma } from "../../src/shared/api/database/client";
import {
  mapCMS,
  mapContentBlock,
  mapControlPanel,
  mapCountry,
  mapDataStore,
  mapHosting,
  mapOperationSystem,
  mapProgrammingLanguage,
  mapTariff,
} from "./data-mapper";

// Загрузка переменных окружения из .env.migration или .env
const envMigrationPath = resolve(process.cwd(), ".env.migration");
const envPath = resolve(process.cwd(), ".env");

// Сначала пытаемся загрузить .env.migration, если не существует - загружаем .env
config({ path: envMigrationPath });
if (!process.env.MYSQL_HOST) {
  config({ path: envPath });
}
// Ленивый импорт image-migrator для избежания загрузки AWS конфигурации при --skip-images
import { closeLogger, getLogger, initializeLogger } from "./migration-logger";
import {
  closeMySQLConnection,
  createMySQLConnection,
  queryMySQL,
  testMySQLConnection,
} from "./mysql-client";
import {
  type MySQLCMS,
  type MySQLContentBlock,
  type MySQLControlPanel,
  type MySQLCountry,
  type MySQLDataStore,
  type MySQLHosting,
  type MySQLImage,
  type MySQLOperationSystem,
  type MySQLProgrammingLanguage,
  type MySQLTariff,
} from "./types";

/**
 * Интерфейс для маппинга старых ID на новые UUID
 */
interface IdMapping {
  [oldId: number]: string; // oldId -> newUUID
}

/**
 * Интерфейс для результатов миграции
 */
interface MigrationResult {
  timestamp: string;
  dryRun: boolean;
  skippedImages: boolean;
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
  mappings: {
    cms: IdMapping;
    controlPanels: IdMapping;
    countries: IdMapping;
    dataStores: IdMapping;
    operationSystems: IdMapping;
    programmingLanguages: IdMapping;
    hostings: IdMapping;
    tariffs: IdMapping;
  };
  errors: Array<{
    stage: string;
    message: string;
    error?: string;
  }>;
}

/**
 * Глобальные маппинги ID
 */
let idMappings: MigrationResult["mappings"] = {
  cms: {},
  controlPanels: {},
  countries: {},
  dataStores: {},
  operationSystems: {},
  programmingLanguages: {},
  hostings: {},
  tariffs: {},
};

/**
 * Результаты миграции
 */
let migrationResult: MigrationResult = {
  timestamp: new Date().toISOString(),
  dryRun: false,
  skippedImages: false,
  statistics: {
    references: {
      cms: 0,
      controlPanels: 0,
      countries: 0,
      dataStores: 0,
      operationSystems: 0,
      programmingLanguages: 0,
    },
    hostings: 0,
    images: 0,
    tariffs: 0,
    tariffRelations: {
      cms: 0,
      controlPanels: 0,
      countries: 0,
      dataStores: 0,
      operationSystems: 0,
      programmingLanguages: 0,
    },
    contentBlocks: 0,
  },
  mappings: idMappings,
  errors: [],
};

/**
 * Парсит аргументы командной строки
 */
function parseArgs(): { dryRun: boolean; skipImages: boolean } {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    skipImages: args.includes("--skip-images"),
  };
}

/**
 * Проверяет подключения к базам данных
 */
async function checkConnections(): Promise<void> {
  const logger = getLogger();
  logger.section("Проверка подключений к базам данных");

  // Проверка MySQL
  logger.info("Проверка подключения к MySQL...");

  // Проверяем наличие обязательных переменных окружения
  const missingVars = [];
  if (!process.env.MYSQL_HOST) missingVars.push("MYSQL_HOST");
  if (!process.env.MYSQL_USER) missingVars.push("MYSQL_USER");
  if (!process.env.MYSQL_PASSWORD) missingVars.push("MYSQL_PASSWORD");
  if (!process.env.MYSQL_DATABASE) missingVars.push("MYSQL_DATABASE");

  if (missingVars.length > 0) {
    throw new Error(
      `Не удалось подключиться к MySQL. Отсутствуют переменные окружения: ${missingVars.join(", ")}. ` +
        `Убедитесь, что переменные MySQL заданы в docker-compose.prod.yml или .env файле.`
    );
  }

  const mysqlConnected = await testMySQLConnection();
  if (!mysqlConnected) {
    throw new Error(
      "Не удалось подключиться к MySQL. Проверьте настройки подключения и доступность сервера."
    );
  }
  logger.success("✓ Подключение к MySQL установлено");

  // Проверка PostgreSQL через Prisma
  logger.info("Проверка подключения к PostgreSQL...");
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.success("✓ Подключение к PostgreSQL установлено");
  } catch (error) {
    throw new Error(
      `Не удалось подключиться к PostgreSQL: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  logger.separator();
}

/**
 * Мигрирует справочники (CMS, ControlPanel, Country, DataStore, OperationSystem, ProgrammingLanguage)
 */
async function migrateReferences(dryRun: boolean): Promise<void> {
  const logger = getLogger();
  logger.section("Миграция справочников");

  // Миграция CMS
  logger.info("Миграция CMS...");
  const mysqlCMS = await queryMySQL<MySQLCMS>("SELECT * FROM cms ORDER BY id");
  const cmsProgressBar = new cliProgress.SingleBar(
    {
      format: "CMS |{bar}| {percentage}% | {value}/{total}",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );
  cmsProgressBar.start(mysqlCMS.length, 0);

  for (const mysqlItem of mysqlCMS) {
    try {
      const prismaItem = mapCMS(mysqlItem);

      // Проверка на дубликат по slug
      const existing = await prisma.cMS.findUnique({
        where: { slug: prismaItem.slug },
      });

      if (existing) {
        logger.warning(
          `CMS с slug "${prismaItem.slug}" уже существует, пропускаем`
        );
        idMappings.cms[mysqlItem.id] = existing.id;
      } else {
        if (!dryRun) {
          const created = await prisma.cMS.create({ data: prismaItem });
          idMappings.cms[mysqlItem.id] = created.id;
        } else {
          idMappings.cms[mysqlItem.id] = prismaItem.id;
        }
        migrationResult.statistics.references.cms++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции CMS ID ${mysqlItem.id}: ${errorMessage}`
      );
      migrationResult.errors.push({
        stage: "references.cms",
        message: `CMS ID ${mysqlItem.id}`,
        error: errorMessage,
      });
    }
    cmsProgressBar.increment();
  }
  cmsProgressBar.stop();
  logger.success(
    `✓ Мигрировано CMS: ${migrationResult.statistics.references.cms}`
  );

  // Миграция ControlPanel
  logger.info("Миграция ControlPanel...");
  let mysqlControlPanels: MySQLControlPanel[] = [];
  try {
    mysqlControlPanels = await queryMySQL<MySQLControlPanel>(
      "SELECT * FROM control_panel ORDER BY id"
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("doesn't exist")) {
      logger.warning(
        `Таблица control_panels не существует, пропускаем миграцию ControlPanel`
      );
    } else {
      throw error;
    }
  }
  const controlPanelProgressBar = new cliProgress.SingleBar(
    {
      format: "ControlPanel |{bar}| {percentage}% | {value}/{total}",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );
  controlPanelProgressBar.start(mysqlControlPanels.length, 0);

  for (const mysqlItem of mysqlControlPanels) {
    try {
      const prismaItem = mapControlPanel(mysqlItem);

      const existing = await prisma.controlPanel.findUnique({
        where: { slug: prismaItem.slug },
      });

      if (existing) {
        logger.warning(
          `ControlPanel с slug "${prismaItem.slug}" уже существует, пропускаем`
        );
        idMappings.controlPanels[mysqlItem.id] = existing.id;
      } else {
        if (!dryRun) {
          const created = await prisma.controlPanel.create({
            data: prismaItem,
          });
          idMappings.controlPanels[mysqlItem.id] = created.id;
        } else {
          idMappings.controlPanels[mysqlItem.id] = prismaItem.id;
        }
        migrationResult.statistics.references.controlPanels++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции ControlPanel ID ${mysqlItem.id}: ${errorMessage}`
      );
      migrationResult.errors.push({
        stage: "references.controlPanels",
        message: `ControlPanel ID ${mysqlItem.id}`,
        error: errorMessage,
      });
    }
    controlPanelProgressBar.increment();
  }
  controlPanelProgressBar.stop();
  logger.success(
    `✓ Мигрировано ControlPanel: ${migrationResult.statistics.references.controlPanels}`
  );

  // Миграция Country
  logger.info("Миграция Country...");
  let mysqlCountries: MySQLCountry[] = [];
  try {
    mysqlCountries = await queryMySQL<MySQLCountry>(
      "SELECT * FROM country ORDER BY id"
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("doesn't exist")) {
      logger.warning(
        `Таблица countries не существует, пропускаем миграцию Country`
      );
    } else {
      throw error;
    }
  }
  const countryProgressBar = new cliProgress.SingleBar(
    {
      format: "Country |{bar}| {percentage}% | {value}/{total}",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );
  countryProgressBar.start(mysqlCountries.length, 0);

  for (const mysqlItem of mysqlCountries) {
    try {
      const prismaItem = mapCountry(mysqlItem);

      const existing = await prisma.country.findUnique({
        where: { slug: prismaItem.slug },
      });

      if (existing) {
        logger.warning(
          `Country с slug "${prismaItem.slug}" уже существует, пропускаем`
        );
        idMappings.countries[mysqlItem.id] = existing.id;
      } else {
        if (!dryRun) {
          const created = await prisma.country.create({ data: prismaItem });
          idMappings.countries[mysqlItem.id] = created.id;
        } else {
          idMappings.countries[mysqlItem.id] = prismaItem.id;
        }
        migrationResult.statistics.references.countries++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции Country ID ${mysqlItem.id}: ${errorMessage}`
      );
      migrationResult.errors.push({
        stage: "references.countries",
        message: `Country ID ${mysqlItem.id}`,
        error: errorMessage,
      });
    }
    countryProgressBar.increment();
  }
  countryProgressBar.stop();
  logger.success(
    `✓ Мигрировано Country: ${migrationResult.statistics.references.countries}`
  );

  // Миграция DataStore
  logger.info("Миграция DataStore...");
  let mysqlDataStores: MySQLDataStore[] = [];
  try {
    mysqlDataStores = await queryMySQL<MySQLDataStore>(
      "SELECT * FROM data_store ORDER BY id"
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("doesn't exist")) {
      logger.warning(
        `Таблица data_stores не существует, пропускаем миграцию DataStore`
      );
    } else {
      throw error;
    }
  }
  const dataStoreProgressBar = new cliProgress.SingleBar(
    {
      format: "DataStore |{bar}| {percentage}% | {value}/{total}",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );
  dataStoreProgressBar.start(mysqlDataStores.length, 0);

  for (const mysqlItem of mysqlDataStores) {
    try {
      const prismaItem = mapDataStore(mysqlItem);

      const existing = await prisma.dataStore.findUnique({
        where: { slug: prismaItem.slug },
      });

      if (existing) {
        logger.warning(
          `DataStore с slug "${prismaItem.slug}" уже существует, пропускаем`
        );
        idMappings.dataStores[mysqlItem.id] = existing.id;
      } else {
        if (!dryRun) {
          const created = await prisma.dataStore.create({ data: prismaItem });
          idMappings.dataStores[mysqlItem.id] = created.id;
        } else {
          idMappings.dataStores[mysqlItem.id] = prismaItem.id;
        }
        migrationResult.statistics.references.dataStores++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции DataStore ID ${mysqlItem.id}: ${errorMessage}`
      );
      migrationResult.errors.push({
        stage: "references.dataStores",
        message: `DataStore ID ${mysqlItem.id}`,
        error: errorMessage,
      });
    }
    dataStoreProgressBar.increment();
  }
  dataStoreProgressBar.stop();
  logger.success(
    `✓ Мигрировано DataStore: ${migrationResult.statistics.references.dataStores}`
  );

  // Миграция OperationSystem
  logger.info("Миграция OperationSystem...");
  let mysqlOperationSystems: MySQLOperationSystem[] = [];
  try {
    mysqlOperationSystems = await queryMySQL<MySQLOperationSystem>(
      "SELECT * FROM operation_system ORDER BY id"
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("doesn't exist")) {
      logger.warning(
        `Таблица operation_systems не существует, пропускаем миграцию OperationSystem`
      );
    } else {
      throw error;
    }
  }
  const operationSystemProgressBar = new cliProgress.SingleBar(
    {
      format: "OperationSystem |{bar}| {percentage}% | {value}/{total}",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );
  operationSystemProgressBar.start(mysqlOperationSystems.length, 0);

  for (const mysqlItem of mysqlOperationSystems) {
    try {
      const prismaItem = mapOperationSystem(mysqlItem);

      const existing = await prisma.operationSystem.findUnique({
        where: { slug: prismaItem.slug },
      });

      if (existing) {
        logger.warning(
          `OperationSystem с slug "${prismaItem.slug}" уже существует, пропускаем`
        );
        idMappings.operationSystems[mysqlItem.id] = existing.id;
      } else {
        if (!dryRun) {
          const created = await prisma.operationSystem.create({
            data: prismaItem,
          });
          idMappings.operationSystems[mysqlItem.id] = created.id;
        } else {
          idMappings.operationSystems[mysqlItem.id] = prismaItem.id;
        }
        migrationResult.statistics.references.operationSystems++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции OperationSystem ID ${mysqlItem.id}: ${errorMessage}`
      );
      migrationResult.errors.push({
        stage: "references.operationSystems",
        message: `OperationSystem ID ${mysqlItem.id}`,
        error: errorMessage,
      });
    }
    operationSystemProgressBar.increment();
  }
  operationSystemProgressBar.stop();
  logger.success(
    `✓ Мигрировано OperationSystem: ${migrationResult.statistics.references.operationSystems}`
  );

  // Миграция ProgrammingLanguage
  logger.info("Миграция ProgrammingLanguage...");
  let mysqlProgrammingLanguages: MySQLProgrammingLanguage[] = [];
  try {
    mysqlProgrammingLanguages = await queryMySQL<MySQLProgrammingLanguage>(
      "SELECT * FROM programming_language ORDER BY id"
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("doesn't exist")) {
      logger.warning(
        `Таблица programming_languages не существует, пропускаем миграцию ProgrammingLanguage`
      );
    } else {
      throw error;
    }
  }
  const programmingLanguageProgressBar = new cliProgress.SingleBar(
    {
      format: "ProgrammingLanguage |{bar}| {percentage}% | {value}/{total}",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );
  programmingLanguageProgressBar.start(mysqlProgrammingLanguages.length, 0);

  for (const mysqlItem of mysqlProgrammingLanguages) {
    try {
      const prismaItem = mapProgrammingLanguage(mysqlItem);

      const existing = await prisma.programmingLanguage.findUnique({
        where: { slug: prismaItem.slug },
      });

      if (existing) {
        logger.warning(
          `ProgrammingLanguage с slug "${prismaItem.slug}" уже существует, пропускаем`
        );
        idMappings.programmingLanguages[mysqlItem.id] = existing.id;
      } else {
        if (!dryRun) {
          const created = await prisma.programmingLanguage.create({
            data: prismaItem,
          });
          idMappings.programmingLanguages[mysqlItem.id] = created.id;
        } else {
          idMappings.programmingLanguages[mysqlItem.id] = prismaItem.id;
        }
        migrationResult.statistics.references.programmingLanguages++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции ProgrammingLanguage ID ${mysqlItem.id}: ${errorMessage}`
      );
      migrationResult.errors.push({
        stage: "references.programmingLanguages",
        message: `ProgrammingLanguage ID ${mysqlItem.id}`,
        error: errorMessage,
      });
    }
    programmingLanguageProgressBar.increment();
  }
  programmingLanguageProgressBar.stop();
  logger.success(
    `✓ Мигрировано ProgrammingLanguage: ${migrationResult.statistics.references.programmingLanguages}`
  );

  logger.separator();
}

/**
 * Мигрирует хостинги
 */
async function migrateHostings(dryRun: boolean): Promise<void> {
  const logger = getLogger();
  logger.section("Миграция хостингов");

  const mysqlHostings = await queryMySQL<MySQLHosting>(
    "SELECT * FROM hosting ORDER BY id"
  );

  logger.info(`Найдено хостингов в MySQL: ${mysqlHostings.length}`);

  if (mysqlHostings.length === 0) {
    logger.warning("В MySQL таблице hosting нет данных для миграции");
    logger.separator();
    return;
  }

  // Загружаем логотипы из таблицы images
  logger.info("Загрузка логотипов из таблицы images...");
  const mysqlImages = await queryMySQL<MySQLImage>(
    "SELECT * FROM images WHERE owner_hash = 'hosting' AND path IS NOT NULL AND path != ''"
  );

  // Создаем маппинг owner_id -> logoUrl
  const hostingLogoMap: Record<number, string> = {};
  const baseImageUrl = "https://hosting-top.online/upload/images";

  for (const image of mysqlImages) {
    if (image.path && image.owner_id) {
      // Обеспечиваем, что path начинается с / для корректного формирования URL
      // Если path = "/51/30/44/6008844c3951a.png", то URL будет:
      // "https://hosting-top.online/upload/images/51/30/44/6008844c3951a.png"
      const cleanPath = image.path.startsWith("/")
        ? image.path
        : `/${image.path}`;
      hostingLogoMap[image.owner_id] = `${baseImageUrl}${cleanPath}`;
    }
  }

  logger.info(
    `Найдено логотипов в таблице images: ${Object.keys(hostingLogoMap).length}`
  );

  const progressBar = new cliProgress.SingleBar(
    {
      format: "Hostings |{bar}| {percentage}% | {value}/{total}",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );
  progressBar.start(mysqlHostings.length, 0);

  for (const mysqlHosting of mysqlHostings) {
    try {
      // Логируем slug из MySQL для отладки
      if (mysqlHosting.slug) {
        logger.info(
          `Хостинг ID ${mysqlHosting.id}: slug из MySQL = "${mysqlHosting.slug}"`
        );
      }
      const prismaHosting = mapHosting(mysqlHosting);

      // Обновляем logoUrl из таблицы images, если есть
      if (hostingLogoMap[mysqlHosting.id]) {
        prismaHosting.logoUrl = hostingLogoMap[mysqlHosting.id];
        logger.info(
          `Хостинг ID ${mysqlHosting.id}: логотип найден в images: ${prismaHosting.logoUrl}`
        );
      } else if (prismaHosting.logoUrl) {
        logger.info(
          `Хостинг ID ${mysqlHosting.id}: используется logoUrl из таблицы hosting: ${prismaHosting.logoUrl}`
        );
      } else {
        logger.info(`Хостинг ID ${mysqlHosting.id}: логотип не найден`);
      }
      if (prismaHosting.slug !== mysqlHosting.slug) {
        logger.info(
          `Хостинг ID ${mysqlHosting.id}: slug после маппинга = "${prismaHosting.slug}" (было "${mysqlHosting.slug || "нет"}")`
        );
      }

      // Сначала проверяем, есть ли уже маппинг для этого MySQL ID
      // (значит хостинг уже был мигрирован ранее)
      const existingId = idMappings.hostings[mysqlHosting.id];
      let existing: { id: string; slug: string } | null = null;

      if (existingId) {
        // Хостинг уже был мигрирован, получаем его данные
        existing = await prisma.hosting.findUnique({
          where: { id: existingId },
          select: { id: true, slug: true },
        });

        if (existing) {
          logger.info(
            `Хостинг ID ${mysqlHosting.id} уже мигрирован (PostgreSQL ID: ${existingId}), обновляем данные`
          );
        } else {
          // Маппинг есть, но хостинг не найден - возможно был удален
          logger.warning(
            `Хостинг ID ${mysqlHosting.id} имеет маппинг на ${existingId}, но хостинг не найден. Создаем новый.`
          );
          delete idMappings.hostings[mysqlHosting.id];
          existing = null;
        }
      }

      // Если хостинг не найден по маппингу, ищем по slug
      if (!existing) {
        existing = await prisma.hosting.findUnique({
          where: { slug: prismaHosting.slug },
          select: { id: true, slug: true },
        });

        if (existing) {
          logger.info(
            `Хостинг с slug "${prismaHosting.slug}" уже существует (PostgreSQL ID: ${existing.id})`
          );
          // Сохраняем маппинг для будущих обновлений
          idMappings.hostings[mysqlHosting.id] = existing.id;
        }
      }

      // Обновляем или создаем хостинг
      if (existing) {
        // Обновляем существующий хостинг (включая slug, если он изменился)
        if (!dryRun) {
          // Исключаем id из данных для обновления и приводим типы к Prisma формату
          const { id, createdAt, updatedAt, ...updateData } = prismaHosting;
          await prisma.hosting.update({
            where: { id: existing.id },
            data: {
              ...updateData,
              // updatedAt будет обновлен автоматически благодаря @updatedAt
            },
          });
          logger.info(
            `✓ Хостинг обновлен: ${prismaHosting.name} (slug: ${prismaHosting.slug})`
          );
        }
        // Не увеличиваем счетчик, так как не создавали новую запись
      } else {
        // Создаем новый хостинг
        if (!dryRun) {
          // Исключаем id, так как Prisma сгенерирует его автоматически
          const { id, ...createData } = prismaHosting;
          const created = await prisma.hosting.create({ data: createData });
          idMappings.hostings[mysqlHosting.id] = created.id;
          logger.info(
            `✓ Хостинг создан: ${prismaHosting.name} (slug: ${prismaHosting.slug})`
          );
        } else {
          idMappings.hostings[mysqlHosting.id] = prismaHosting.id;
        }
        migrationResult.statistics.hostings++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции хостинга ID ${mysqlHosting.id}: ${errorMessage}`
      );
      migrationResult.errors.push({
        stage: "hostings",
        message: `Hosting ID ${mysqlHosting.id}`,
        error: errorMessage,
      });
    }
    progressBar.increment();
  }

  progressBar.stop();
  logger.success(
    `✓ Мигрировано хостингов: ${migrationResult.statistics.hostings}`
  );
  logger.separator();
}

/**
 * Мигрирует изображения хостингов
 */
async function migrateImages(skipImages: boolean): Promise<void> {
  const logger = getLogger();
  logger.section("Миграция изображений хостингов");

  if (skipImages) {
    logger.warning("Пропуск миграции изображений (--skip-images)");
    logger.separator();
    return;
  }

  // Получаем все хостинги из PostgreSQL
  const hostings = await prisma.hosting.findMany({
    where: {
      logoUrl: {
        not: null,
      },
    },
  });

  if (hostings.length === 0) {
    logger.warning("Не найдено хостингов с изображениями для миграции");
    logger.separator();
    return;
  }

  const progressBar = new cliProgress.SingleBar(
    {
      format: "Images |{bar}| {percentage}% | {value}/{total}",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );
  progressBar.start(hostings.length, 0);

  for (const hosting of hostings) {
    if (!hosting.logoUrl) {
      progressBar.increment();
      continue;
    }

    try {
      logger.info(`Миграция изображения для хостинга: ${hosting.slug}`);
      // Ленивый импорт для избежания загрузки AWS конфигурации при --skip-images
      const { migrateHostingImage } = await import("./image-migrator");
      const newImageUrl = await migrateHostingImage(
        hosting.logoUrl,
        hosting.slug
      );

      // Обновляем logoUrl в базе данных
      await prisma.hosting.update({
        where: { id: hosting.id },
        data: { logoUrl: newImageUrl },
      });

      migrationResult.statistics.images++;
      logger.success(
        `✓ Изображение мигрировано для ${hosting.slug}: ${newImageUrl}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции изображения для ${hosting.slug}: ${errorMessage}`
      );
      migrationResult.errors.push({
        stage: "images",
        message: `Hosting ${hosting.slug}`,
        error: errorMessage,
      });
    }
    progressBar.increment();
  }

  progressBar.stop();
  logger.success(
    `✓ Мигрировано изображений: ${migrationResult.statistics.images}`
  );
  logger.separator();
}

/**
 * Мигрирует тарифы
 */
async function migrateTariffs(dryRun: boolean): Promise<void> {
  const logger = getLogger();
  logger.section("Миграция тарифов");

  const mysqlTariffs = await queryMySQL<MySQLTariff>(
    "SELECT * FROM tariff ORDER BY id"
  );

  logger.info(`Найдено тарифов в MySQL: ${mysqlTariffs.length}`);
  logger.info(
    `Доступно хостингов в маппинге: ${Object.keys(idMappings.hostings).length}`
  );

  if (mysqlTariffs.length === 0) {
    logger.warning("В MySQL таблице tariff нет данных для миграции");
    logger.separator();
    return;
  }

  const progressBar = new cliProgress.SingleBar(
    {
      format: "Tariffs |{bar}| {percentage}% | {value}/{total}",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );
  progressBar.start(mysqlTariffs.length, 0);

  for (const mysqlTariff of mysqlTariffs) {
    try {
      // Логируем структуру данных для отладки (только для первого элемента)
      if (mysqlTariffs.indexOf(mysqlTariff) === 0) {
        logger.info(
          `Пример данных Tariff: ${JSON.stringify(mysqlTariff, null, 2)}`
        );
        logger.info(
          `Поле price: ${mysqlTariff.price}, тип: ${typeof mysqlTariff.price}, значение: ${JSON.stringify(mysqlTariff.price)}`
        );
      }

      // Получаем новый UUID хостинга из маппинга
      const hostingId = idMappings.hostings[mysqlTariff.hosting_id];
      if (!hostingId) {
        logger.error(
          `Хостинг с ID ${mysqlTariff.hosting_id} не найден в маппинге. Доступные хостинги: ${Object.keys(idMappings.hostings).join(", ")}`
        );
        migrationResult.errors.push({
          stage: "tariffs",
          message: `Tariff ID ${mysqlTariff.id}`,
          error: `Hosting ID ${mysqlTariff.hosting_id} not found in mapping`,
        });
        progressBar.increment();
        continue;
      }

      const prismaTariff = mapTariff(mysqlTariff, hostingId);

      if (!dryRun) {
        // Исключаем id, так как Prisma сгенерирует его автоматически
        const { id, ...createData } = prismaTariff;
        const created = await prisma.tariff.create({ data: createData });
        idMappings.tariffs[mysqlTariff.id] = created.id;
      } else {
        idMappings.tariffs[mysqlTariff.id] = prismaTariff.id;
      }
      migrationResult.statistics.tariffs++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции тарифа ID ${mysqlTariff.id}: ${errorMessage}`
      );
      migrationResult.errors.push({
        stage: "tariffs",
        message: `Tariff ID ${mysqlTariff.id}`,
        error: errorMessage,
      });
    }
    progressBar.increment();
  }

  progressBar.stop();
  logger.success(
    `✓ Мигрировано тарифов: ${migrationResult.statistics.tariffs}`
  );
  logger.separator();
}

/**
 * Мигрирует связи тарифов со справочниками
 */
async function migrateTariffRelations(dryRun: boolean): Promise<void> {
  const logger = getLogger();
  logger.section("Миграция связей тарифов");

  // Миграция TariffCMS
  logger.info("Миграция связей Tariff-CMS...");
  let tariffCMS: Array<{ tariff_id: number; cms_id: number }> = [];
  try {
    tariffCMS = await queryMySQL<{ tariff_id: number; cms_id: number }>(
      "SELECT * FROM tariff_cms ORDER BY tariff_id, cms_id"
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("doesn't exist")) {
      logger.warning(
        `Таблица tariff_cms не существует, пропускаем миграцию связей Tariff-CMS`
      );
    } else {
      throw error;
    }
  }
  let created = 0;
  for (const relation of tariffCMS) {
    try {
      const tariffId = idMappings.tariffs[relation.tariff_id];
      const cmsId = idMappings.cms[relation.cms_id];

      if (!tariffId || !cmsId) {
        logger.warning(
          `Пропуск связи Tariff-CMS: tariff_id=${relation.tariff_id}, cms_id=${relation.cms_id} (не найдены в маппинге)`
        );
        continue;
      }

      if (!dryRun) {
        await prisma.tariffCMS.upsert({
          where: {
            tariffId_cmsId: {
              tariffId,
              cmsId,
            },
          },
          create: {
            tariffId,
            cmsId,
          },
          update: {},
        });
      }
      created++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Ошибка при миграции связи Tariff-CMS: ${errorMessage}`);
    }
  }
  migrationResult.statistics.tariffRelations.cms = created;
  logger.success(`✓ Создано связей Tariff-CMS: ${created}`);

  // Миграция TariffControlPanel
  logger.info("Миграция связей Tariff-ControlPanel...");
  let tariffControlPanels: Array<{
    tariff_id: number;
    control_panel_id: number;
  }> = [];
  try {
    tariffControlPanels = await queryMySQL<{
      tariff_id: number;
      control_panel_id: number;
    }>(
      "SELECT * FROM tariff_control_panel ORDER BY tariff_id, control_panel_id"
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("doesn't exist")) {
      logger.warning(
        `Таблица tariff_control_panel не существует, пропускаем миграцию связей Tariff-ControlPanel`
      );
    } else {
      throw error;
    }
  }
  created = 0;
  for (const relation of tariffControlPanels) {
    try {
      const tariffId = idMappings.tariffs[relation.tariff_id];
      const controlPanelId =
        idMappings.controlPanels[relation.control_panel_id];

      if (!tariffId || !controlPanelId) {
        logger.warning(
          `Пропуск связи Tariff-ControlPanel: tariff_id=${relation.tariff_id}, control_panel_id=${relation.control_panel_id} (не найдены в маппинге)`
        );
        continue;
      }

      if (!dryRun) {
        await prisma.tariffControlPanel.upsert({
          where: {
            tariffId_controlPanelId: {
              tariffId,
              controlPanelId,
            },
          },
          create: {
            tariffId,
            controlPanelId,
          },
          update: {},
        });
      }
      created++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции связи Tariff-ControlPanel: ${errorMessage}`
      );
    }
  }
  migrationResult.statistics.tariffRelations.controlPanels = created;
  logger.success(`✓ Создано связей Tariff-ControlPanel: ${created}`);

  // Миграция TariffCountry
  logger.info("Миграция связей Tariff-Country...");
  let tariffCountries: Array<{
    tariff_id: number;
    country_id: number;
  }> = [];
  try {
    tariffCountries = await queryMySQL<{
      tariff_id: number;
      country_id: number;
    }>("SELECT * FROM tariff_country ORDER BY tariff_id, country_id");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("doesn't exist")) {
      logger.warning(
        `Таблица tariff_country не существует, пропускаем миграцию связей Tariff-Country`
      );
    } else {
      throw error;
    }
  }
  created = 0;
  for (const relation of tariffCountries) {
    try {
      const tariffId = idMappings.tariffs[relation.tariff_id];
      const countryId = idMappings.countries[relation.country_id];

      if (!tariffId || !countryId) {
        logger.warning(
          `Пропуск связи Tariff-Country: tariff_id=${relation.tariff_id}, country_id=${relation.country_id} (не найдены в маппинге)`
        );
        continue;
      }

      if (!dryRun) {
        await prisma.tariffCountry.upsert({
          where: {
            tariffId_countryId: {
              tariffId,
              countryId,
            },
          },
          create: {
            tariffId,
            countryId,
          },
          update: {},
        });
      }
      created++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Ошибка при миграции связи Tariff-Country: ${errorMessage}`);
    }
  }
  migrationResult.statistics.tariffRelations.countries = created;
  logger.success(`✓ Создано связей Tariff-Country: ${created}`);

  // Миграция TariffDataStore
  logger.info("Миграция связей Tariff-DataStore...");
  let tariffDataStores: Array<{
    tariff_id: number;
    data_store_id: number;
  }> = [];
  try {
    tariffDataStores = await queryMySQL<{
      tariff_id: number;
      data_store_id: number;
    }>("SELECT * FROM tariff_data_store ORDER BY tariff_id, data_store_id");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("doesn't exist")) {
      logger.warning(
        `Таблица tariff_data_store не существует, пропускаем миграцию связей Tariff-DataStore`
      );
    } else {
      throw error;
    }
  }
  created = 0;
  for (const relation of tariffDataStores) {
    try {
      const tariffId = idMappings.tariffs[relation.tariff_id];
      const dataStoreId = idMappings.dataStores[relation.data_store_id];

      if (!tariffId || !dataStoreId) {
        logger.warning(
          `Пропуск связи Tariff-DataStore: tariff_id=${relation.tariff_id}, data_store_id=${relation.data_store_id} (не найдены в маппинге)`
        );
        continue;
      }

      if (!dryRun) {
        await prisma.tariffDataStore.upsert({
          where: {
            tariffId_dataStoreId: {
              tariffId,
              dataStoreId,
            },
          },
          create: {
            tariffId,
            dataStoreId,
          },
          update: {},
        });
      }
      created++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции связи Tariff-DataStore: ${errorMessage}`
      );
    }
  }
  migrationResult.statistics.tariffRelations.dataStores = created;
  logger.success(`✓ Создано связей Tariff-DataStore: ${created}`);

  // Миграция TariffOperationSystem
  logger.info("Миграция связей Tariff-OperationSystem...");
  let tariffOperationSystems: Array<{
    tariff_id: number;
    operation_system_id: number;
  }> = [];
  try {
    tariffOperationSystems = await queryMySQL<{
      tariff_id: number;
      operation_system_id: number;
    }>(
      "SELECT * FROM tariff_operation_system ORDER BY tariff_id, operation_system_id"
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("doesn't exist")) {
      logger.warning(
        `Таблица tariff_operation_system не существует, пропускаем миграцию связей Tariff-OperationSystem`
      );
    } else {
      throw error;
    }
  }
  created = 0;
  for (const relation of tariffOperationSystems) {
    try {
      const tariffId = idMappings.tariffs[relation.tariff_id];
      const operationSystemId =
        idMappings.operationSystems[relation.operation_system_id];

      if (!tariffId || !operationSystemId) {
        logger.warning(
          `Пропуск связи Tariff-OperationSystem: tariff_id=${relation.tariff_id}, operation_system_id=${relation.operation_system_id} (не найдены в маппинге)`
        );
        continue;
      }

      if (!dryRun) {
        await prisma.tariffOperationSystem.upsert({
          where: {
            tariffId_operationSystemId: {
              tariffId,
              operationSystemId,
            },
          },
          create: {
            tariffId,
            operationSystemId,
          },
          update: {},
        });
      }
      created++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции связи Tariff-OperationSystem: ${errorMessage}`
      );
    }
  }
  migrationResult.statistics.tariffRelations.operationSystems = created;
  logger.success(`✓ Создано связей Tariff-OperationSystem: ${created}`);

  // Миграция TariffProgrammingLanguage
  logger.info("Миграция связей Tariff-ProgrammingLanguage...");
  let tariffProgrammingLanguages: Array<{
    tariff_id: number;
    programming_language_id: number;
  }> = [];
  try {
    tariffProgrammingLanguages = await queryMySQL<{
      tariff_id: number;
      programming_language_id: number;
    }>(
      "SELECT * FROM tariff_programming_language ORDER BY tariff_id, programming_language_id"
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("doesn't exist")) {
      logger.warning(
        `Таблица tariff_programming_language не существует, пропускаем миграцию связей Tariff-ProgrammingLanguage`
      );
    } else {
      throw error;
    }
  }
  created = 0;
  for (const relation of tariffProgrammingLanguages) {
    try {
      const tariffId = idMappings.tariffs[relation.tariff_id];
      const programmingLanguageId =
        idMappings.programmingLanguages[relation.programming_language_id];

      if (!tariffId || !programmingLanguageId) {
        logger.warning(
          `Пропуск связи Tariff-ProgrammingLanguage: tariff_id=${relation.tariff_id}, programming_language_id=${relation.programming_language_id} (не найдены в маппинге)`
        );
        continue;
      }

      if (!dryRun) {
        await prisma.tariffProgrammingLanguage.upsert({
          where: {
            tariffId_programmingLanguageId: {
              tariffId,
              programmingLanguageId,
            },
          },
          create: {
            tariffId,
            programmingLanguageId,
          },
          update: {},
        });
      }
      created++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции связи Tariff-ProgrammingLanguage: ${errorMessage}`
      );
    }
  }
  migrationResult.statistics.tariffRelations.programmingLanguages = created;
  logger.success(`✓ Создано связей Tariff-ProgrammingLanguage: ${created}`);

  logger.separator();
}

/**
 * Мигрирует блоки контента
 */
async function migrateContentBlocks(dryRun: boolean): Promise<void> {
  const logger = getLogger();
  logger.section("Миграция блоков контента");

  const mysqlContentBlocks = await queryMySQL<MySQLContentBlock>(
    "SELECT * FROM content_block ORDER BY id"
  );

  logger.info(
    `Найдено контентных блоков в MySQL: ${mysqlContentBlocks.length}`
  );

  if (mysqlContentBlocks.length === 0) {
    logger.warning("В MySQL таблице content_block нет данных для миграции");
    logger.separator();
    return;
  }

  const progressBar = new cliProgress.SingleBar(
    {
      format: "ContentBlocks |{bar}| {percentage}% | {value}/{total}",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );
  progressBar.start(mysqlContentBlocks.length, 0);

  for (const mysqlContentBlock of mysqlContentBlocks) {
    try {
      // Логируем структуру данных для отладки (только для первого элемента)
      if (mysqlContentBlocks.indexOf(mysqlContentBlock) === 0) {
        logger.info(
          `Пример данных ContentBlock: ${JSON.stringify(mysqlContentBlock, null, 2)}`
        );
        logger.info(
          `Поле type: ${mysqlContentBlock.type}, тип: ${typeof mysqlContentBlock.type}`
        );
      }

      const prismaContentBlock = mapContentBlock(mysqlContentBlock);

      // Логируем результат маппинга для первого элемента
      if (mysqlContentBlocks.indexOf(mysqlContentBlock) === 0) {
        logger.info(`Результат маппинга type: ${prismaContentBlock.type}`);
      }

      // Проверка на дубликат по key
      const existing = await prisma.contentBlock.findUnique({
        where: { key: prismaContentBlock.key },
      });

      if (existing) {
        // Обновляем существующий блок, если поле type отсутствует или отличается
        if (!dryRun && prismaContentBlock.type !== null) {
          if (existing.type !== prismaContentBlock.type) {
            await prisma.contentBlock.update({
              where: { key: prismaContentBlock.key },
              data: { type: prismaContentBlock.type },
            });
            logger.info(
              `ContentBlock с key "${prismaContentBlock.key}" обновлен: type = ${prismaContentBlock.type}`
            );
          }
        }
        logger.warning(
          `ContentBlock с key "${prismaContentBlock.key}" уже существует, пропускаем создание`
        );

        // Обновляем hostingId для существующего блока, если указан hosting_id
        if (mysqlContentBlock.hosting_id) {
          const hostingId = idMappings.hostings[mysqlContentBlock.hosting_id];
          if (hostingId) {
            if (!dryRun && existing.hostingId !== hostingId) {
              try {
                await prisma.contentBlock.update({
                  where: { id: existing.id },
                  data: { hostingId },
                });
                logger.info(
                  `✓ Связь обновлена: ContentBlock "${prismaContentBlock.key}" -> Hosting ID ${mysqlContentBlock.hosting_id}`
                );
              } catch (updateError) {
                const errorMessage =
                  updateError instanceof Error
                    ? updateError.message
                    : String(updateError);
                logger.warning(
                  `Ошибка обновления связи ContentBlock "${prismaContentBlock.key}" с хостингом: ${errorMessage}`
                );
              }
            }
          } else {
            logger.warning(
              `Хостинг с MySQL ID ${mysqlContentBlock.hosting_id} не найден в маппинге для ContentBlock "${prismaContentBlock.key}"`
            );
          }
        } else if (prismaContentBlock.type) {
          // Если hosting_id не указан, но есть type, пытаемся найти хостинг по type (может быть UUID)
          const hosting = await prisma.hosting.findUnique({
            where: { id: prismaContentBlock.type },
          });
          if (hosting && !dryRun && existing.hostingId !== hosting.id) {
            try {
              await prisma.contentBlock.update({
                where: { id: existing.id },
                data: { hostingId: hosting.id },
              });
              logger.info(
                `✓ Связь обновлена: ContentBlock "${prismaContentBlock.key}" -> Hosting "${hosting.name}"`
              );
            } catch (updateError) {
              // Игнорируем ошибку
            }
          }
        }
      } else {
        // Определяем hostingId перед созданием
        let hostingIdToSet: string | null = null;
        if (mysqlContentBlock.hosting_id) {
          hostingIdToSet =
            idMappings.hostings[mysqlContentBlock.hosting_id] || null;
          if (!hostingIdToSet) {
            logger.warning(
              `Хостинг с MySQL ID ${mysqlContentBlock.hosting_id} не найден в маппинге для ContentBlock "${prismaContentBlock.key}"`
            );
          }
        } else if (prismaContentBlock.type) {
          // Если hosting_id не указан, но есть type, пытаемся найти хостинг по type (может быть UUID)
          const hosting = await prisma.hosting.findUnique({
            where: { id: prismaContentBlock.type },
          });
          if (hosting) {
            hostingIdToSet = hosting.id;
          }
        }

        // Добавляем hostingId к данным для создания
        const contentBlockData = {
          ...prismaContentBlock,
          hostingId: hostingIdToSet,
        };

        if (!dryRun) {
          try {
            const created = await prisma.contentBlock.create({
              data: contentBlockData,
            });
            logger.info(
              `✓ ContentBlock создан: key="${prismaContentBlock.key}", type="${prismaContentBlock.type}", hostingId="${hostingIdToSet || "нет"}"`
            );
          } catch (createError) {
            const errorMessage =
              createError instanceof Error
                ? createError.message
                : String(createError);
            logger.error(
              `Ошибка создания ContentBlock key="${prismaContentBlock.key}": ${errorMessage}`
            );
            throw createError;
          }
        }
        migrationResult.statistics.contentBlocks++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Ошибка при миграции ContentBlock ID ${mysqlContentBlock.id}: ${errorMessage}`
      );
      migrationResult.errors.push({
        stage: "contentBlocks",
        message: `ContentBlock ID ${mysqlContentBlock.id}`,
        error: errorMessage,
      });
    }
    progressBar.increment();
  }

  progressBar.stop();
  logger.success(
    `✓ Мигрировано блоков контента: ${migrationResult.statistics.contentBlocks}`
  );
  logger.separator();
}

/**
 * Сохраняет результаты миграции в JSON файл
 */
function saveMigrationResult(): void {
  const logger = getLogger();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const resultFilePath = join(
    process.cwd(),
    "scripts",
    "migration",
    `migration-result-${timestamp}.json`
  );

  try {
    writeFileSync(
      resultFilePath,
      JSON.stringify(migrationResult, null, 2),
      "utf-8"
    );
    logger.success(`✓ Результаты миграции сохранены: ${resultFilePath}`);
  } catch (error) {
    logger.error(
      `Ошибка при сохранении результатов миграции: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Главная функция миграции
 */
async function runMigration(): Promise<void> {
  const logger = initializeLogger();
  const { dryRun, skipImages } = parseArgs();

  migrationResult.dryRun = dryRun;
  migrationResult.skippedImages = skipImages;

  try {
    logger.section("Запуск миграции данных из MySQL в PostgreSQL");
    if (dryRun) {
      logger.warning("⚠️  DRY-RUN режим: изменения не будут сохранены в БД");
    }
    if (skipImages) {
      logger.warning("⚠️  Пропуск миграции изображений");
    }
    logger.separator();

    // Проверка подключений
    await checkConnections();

    // Инициализация MySQL подключения
    createMySQLConnection();

    // Миграция в правильном порядке
    await migrateReferences(dryRun);
    await migrateHostings(dryRun);
    if (!skipImages) {
      await migrateImages(skipImages);
    }
    await migrateTariffs(dryRun);
    await migrateTariffRelations(dryRun);
    await migrateContentBlocks(dryRun);

    // Сохранение результатов
    saveMigrationResult();

    // Итоговая статистика
    logger.section("Итоговая статистика миграции");
    logger.info(
      `Справочники: CMS=${migrationResult.statistics.references.cms}, ControlPanel=${migrationResult.statistics.references.controlPanels}, Country=${migrationResult.statistics.references.countries}, DataStore=${migrationResult.statistics.references.dataStores}, OperationSystem=${migrationResult.statistics.references.operationSystems}, ProgrammingLanguage=${migrationResult.statistics.references.programmingLanguages}`
    );
    logger.info(`Хостинги: ${migrationResult.statistics.hostings}`);
    logger.info(`Изображения: ${migrationResult.statistics.images}`);
    logger.info(`Тарифы: ${migrationResult.statistics.tariffs}`);
    logger.info(
      `Связи тарифов: CMS=${migrationResult.statistics.tariffRelations.cms}, ControlPanel=${migrationResult.statistics.tariffRelations.controlPanels}, Country=${migrationResult.statistics.tariffRelations.countries}, DataStore=${migrationResult.statistics.tariffRelations.dataStores}, OperationSystem=${migrationResult.statistics.tariffRelations.operationSystems}, ProgrammingLanguage=${migrationResult.statistics.tariffRelations.programmingLanguages}`
    );
    logger.info(`Блоки контента: ${migrationResult.statistics.contentBlocks}`);
    logger.info(`Ошибок: ${migrationResult.errors.length}`);
    logger.separator();

    if (migrationResult.errors.length > 0) {
      logger.warning(
        `⚠️  Миграция завершена с ${migrationResult.errors.length} ошибками. Проверьте лог для деталей.`
      );
    } else {
      logger.success("✅ Миграция успешно завершена!");
    }
  } catch (error) {
    logger.error(
      "Критическая ошибка при выполнении миграции",
      error instanceof Error ? error : new Error(String(error))
    );
    migrationResult.errors.push({
      stage: "migration",
      message: "Критическая ошибка",
      error: error instanceof Error ? error.message : String(error),
    });
    saveMigrationResult();
    throw error;
  } finally {
    // Закрытие подключений
    logger.info("Закрытие подключений...");
    await closeMySQLConnection();
    await prisma.$disconnect();
    closeLogger();
    logger.info("✓ Подключения закрыты");
  }
}

// Запуск миграции
runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error(chalk.red("\n💥 Критическая ошибка миграции:"), error);
    process.exit(1);
  });

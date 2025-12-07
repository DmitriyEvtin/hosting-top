/**
 * Маппер данных из MySQL (Yii2) в PostgreSQL (Prisma) формат
 */

import { Decimal } from "@prisma/client/runtime/library";
import { randomUUID } from "crypto";
import { ZodSchema } from "zod";
import { generateSlug } from "../../src/shared/lib/slug-utils";
import {
  TariffPeriod,
  type MySQLCMS,
  type MySQLContentBlock,
  type MySQLControlPanel,
  type MySQLCountry,
  type MySQLDataStore,
  type MySQLHosting,
  type MySQLOperationSystem,
  type MySQLProgrammingLanguage,
  type MySQLTariff,
  type PrismaCMS,
  type PrismaContentBlock,
  type PrismaControlPanel,
  type PrismaCountry,
  type PrismaDataStore,
  type PrismaHosting,
  type PrismaOperationSystem,
  type PrismaProgrammingLanguage,
  type PrismaTariff,
} from "./types";

/**
 * Преобразует MySQL boolean (0/1) в JavaScript boolean
 */
function toBoolean(value: number | boolean | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return false;
}

/**
 * Преобразует строку, Date или Unix timestamp в Date объект
 */
function toDate(value: string | Date | number | null | undefined): Date {
  if (!value) {
    return new Date();
  }
  if (value instanceof Date) {
    return value;
  }
  // Если это число, считаем его Unix timestamp (секунды)
  if (typeof value === "number") {
    // Если число меньше 10000000000, это секунды, иначе миллисекунды
    return new Date(value < 10000000000 ? value * 1000 : value);
  }
  return new Date(value);
}

/**
 * Преобразует строку периода в TariffPeriod enum
 */
function toTariffPeriod(period: string): TariffPeriod {
  const normalized = period.toLowerCase().trim();
  if (normalized === "year" || normalized === "год") {
    return TariffPeriod.YEAR;
  }
  return TariffPeriod.MONTH;
}

/**
 * Генерирует key из title для ContentBlock
 * Преобразует в snake_case формат
 */
function generateKeyFromTitle(title: string | null | undefined): string {
  if (!title) {
    throw new Error("Cannot generate key: title is required");
  }

  // Генерируем slug из title
  let key = generateSlug(title);

  // Преобразуем в snake_case (заменяем дефисы на подчеркивания)
  key = key.replace(/-/g, "_");

  // Удаляем все символы, которые не являются буквами, цифрами или подчеркиваниями
  key = key.replace(/[^a-z0-9_]/gi, "");

  // Удаляем множественные подчеркивания
  key = key.replace(/_+/g, "_");

  // Удаляем подчеркивания в начале и конце
  key = key.replace(/^_+|_+$/g, "");

  if (!key) {
    throw new Error("Cannot generate key: title resulted in empty key");
  }

  return key;
}

/**
 * Валидирует key формат (snake_case)
 */
function validateKeyFormat(key: string): boolean {
  // Проверяем, что key соответствует формату snake_case
  // Разрешаем только строчные буквы, цифры и подчеркивания
  // Не может начинаться или заканчиваться подчеркиванием
  const snakeCaseRegex = /^[a-z][a-z0-9_]*[a-z0-9]$|^[a-z]$/;
  return snakeCaseRegex.test(key);
}

/**
 * Валидирует данные перед маппингом
 */
export function validateMappedData<T>(data: T, schema: ZodSchema<T>): T {
  return schema.parse(data);
}

/**
 * Маппит данные хостинга из MySQL в Prisma формат
 */
export function mapHosting(mysqlHosting: MySQLHosting): PrismaHosting {
  if (!mysqlHosting.name) {
    throw new Error("Hosting name is required");
  }

  // Используем slug из MySQL, если есть и не пустой, иначе генерируем из name
  // Важно: если slug из MySQL существует, используем его как есть (сохраняем точки и другие символы доменов)
  let slug: string;
  if (mysqlHosting.slug && mysqlHosting.slug.trim()) {
    slug = mysqlHosting.slug.trim();
  } else {
    slug = generateSlug(mysqlHosting.name);
  }

  return {
    id: randomUUID(),
    name: mysqlHosting.name.trim(),
    slug,
    description: mysqlHosting.description?.trim() || null,
    logoUrl: mysqlHosting.logo_url?.trim() || null,
    // При переносе websiteUrl = slug
    websiteUrl: slug,
    startYear: mysqlHosting.start_year?.trim() || null,
    testPeriod: mysqlHosting.test_period ?? null,
    clients: mysqlHosting.clients ?? null,
    // Устанавливаем isActive на основе status: is_active = status === 1
    // Если status не указан, используем is_active из MySQL, иначе проверяем status
    isActive:
      mysqlHosting.status !== null && mysqlHosting.status !== undefined
        ? mysqlHosting.status === 1
        : toBoolean(mysqlHosting.is_active),
    createdAt: toDate(mysqlHosting.created_at),
    updatedAt: toDate(mysqlHosting.updated_at),
  };
}

/**
 * Преобразует значение цены в Decimal
 */
function toDecimal(value: string | number | null | undefined): Decimal | null {
  if (value === null || value === undefined) {
    return null;
  }

  let priceValue: string;
  if (typeof value === "string") {
    priceValue = value.trim();
    if (priceValue === "") {
      return null;
    }
  } else {
    priceValue = value.toString();
  }

  try {
    const decimal = new Decimal(priceValue);
    // Валидируем, что price не отрицательное число (0 разрешен)
    if (decimal.lessThan(0)) {
      return null;
    }
    return decimal;
  } catch {
    return null;
  }
}

/**
 * Маппит данные тарифа из MySQL в Prisma формат
 */
export function mapTariff(
  mysqlTariff: MySQLTariff,
  hostingId: string
): PrismaTariff {
  if (!mysqlTariff.name) {
    throw new Error("Tariff name is required");
  }

  // Определяем period на основе price_month и price_year
  let period: TariffPeriod | null = null;
  if (
    mysqlTariff.price_month !== null &&
    mysqlTariff.price_month !== undefined
  ) {
    period = TariffPeriod.MONTH;
  } else if (
    mysqlTariff.price_year !== null &&
    mysqlTariff.price_year !== undefined
  ) {
    period = TariffPeriod.YEAR;
  } else if (mysqlTariff.period) {
    // Используем старое поле period, если оно есть
    period = toTariffPeriod(mysqlTariff.period);
  }

  // Определяем price на основе period
  let price: Decimal | null = null;
  if (period === TariffPeriod.MONTH && mysqlTariff.price_month) {
    price = toDecimal(mysqlTariff.price_month);
  } else if (period === TariffPeriod.YEAR && mysqlTariff.price_year) {
    price = toDecimal(mysqlTariff.price_year);
  } else if (mysqlTariff.price) {
    // Используем старое поле price, если оно есть
    price = toDecimal(mysqlTariff.price);
  }

  return {
    id: randomUUID(),
    hostingId,
    type: mysqlTariff.type ?? null,
    name: mysqlTariff.name.trim(),
    subtitle: mysqlTariff.subtitle?.trim() || null,
    link: mysqlTariff.link?.trim() || null,
    domains: mysqlTariff.domains ?? null,
    diskSpace: mysqlTariff.disk_space ?? null,
    sites: mysqlTariff.sites ?? null,
    ftpAccounts: mysqlTariff.ftp_accounts ?? null,
    traffic: mysqlTariff.traffic ?? null,
    mailboxes: mysqlTariff.mailboxes ?? null,
    automaticCms:
      mysqlTariff.automatic_cms !== null &&
      mysqlTariff.automatic_cms !== undefined
        ? toBoolean(mysqlTariff.automatic_cms)
        : null,
    ssl:
      mysqlTariff.ssl !== null && mysqlTariff.ssl !== undefined
        ? toBoolean(mysqlTariff.ssl)
        : null,
    backup:
      mysqlTariff.backup !== null && mysqlTariff.backup !== undefined
        ? toBoolean(mysqlTariff.backup)
        : null,
    ssh:
      mysqlTariff.ssh !== null && mysqlTariff.ssh !== undefined
        ? toBoolean(mysqlTariff.ssh)
        : null,
    additionalId:
      mysqlTariff.additional_id !== null &&
      mysqlTariff.additional_id !== undefined
        ? toBoolean(mysqlTariff.additional_id)
        : null,
    priceMonth: toDecimal(mysqlTariff.price_month),
    priceYear: toDecimal(mysqlTariff.price_year),
    status: mysqlTariff.status ?? 1,
    countTestDays: mysqlTariff.count_test_days ?? null,
    isTemplate:
      mysqlTariff.is_template !== null && mysqlTariff.is_template !== undefined
        ? toBoolean(mysqlTariff.is_template)
        : null,
    ddosDef:
      mysqlTariff.ddos_def !== null && mysqlTariff.ddos_def !== undefined
        ? toBoolean(mysqlTariff.ddos_def)
        : null,
    diskType: mysqlTariff.disk_type ?? null,
    antivirus:
      mysqlTariff.antivirus !== null && mysqlTariff.antivirus !== undefined
        ? toBoolean(mysqlTariff.antivirus)
        : null,
    countDb: mysqlTariff.count_db ?? null,
    infoDiskArea: mysqlTariff.info_disk_area?.trim() || null,
    infoPlatforms: mysqlTariff.info_platforms?.trim() || null,
    infoPanels: mysqlTariff.info_panels?.trim() || null,
    infoPrice: mysqlTariff.info_price?.trim() || null,
    infoOzu: mysqlTariff.info_ozu?.trim() || null,
    infoCpu: mysqlTariff.info_cpu?.trim() || null,
    infoCpuCore: mysqlTariff.info_cpu_core?.trim() || null,
    infoDomains: mysqlTariff.info_domains?.trim() || null,
    // Старые поля для обратной совместимости
    price,
    currency: mysqlTariff.currency?.trim() || "RUB",
    period,
    bandwidth: mysqlTariff.bandwidth ?? null,
    domainsCount: mysqlTariff.domains_count ?? null,
    databasesCount: mysqlTariff.databases_count ?? null,
    emailAccounts: mysqlTariff.email_accounts ?? null,
    isActive: toBoolean(mysqlTariff.is_active ?? 1),
    createdAt: toDate(mysqlTariff.created_at),
    updatedAt: toDate(mysqlTariff.updated_at),
  };
}

/**
 * Маппит данные CMS из MySQL в Prisma формат
 */
export function mapCMS(mysqlCMS: MySQLCMS): PrismaCMS {
  if (!mysqlCMS.name) {
    throw new Error("CMS name is required");
  }

  return {
    id: randomUUID(),
    name: mysqlCMS.name.trim(),
    slug: generateSlug(mysqlCMS.name),
  };
}

/**
 * Маппит данные ControlPanel из MySQL в Prisma формат
 */
export function mapControlPanel(
  mysqlControlPanel: MySQLControlPanel
): PrismaControlPanel {
  if (!mysqlControlPanel.name) {
    throw new Error("ControlPanel name is required");
  }

  return {
    id: randomUUID(),
    name: mysqlControlPanel.name.trim(),
    slug: generateSlug(mysqlControlPanel.name),
  };
}

/**
 * Маппит данные Country из MySQL в Prisma формат
 */
export function mapCountry(mysqlCountry: MySQLCountry): PrismaCountry {
  if (!mysqlCountry.name) {
    throw new Error("Country name is required");
  }

  return {
    id: randomUUID(),
    name: mysqlCountry.name.trim(),
    slug: generateSlug(mysqlCountry.name),
  };
}

/**
 * Маппит данные DataStore из MySQL в Prisma формат
 */
export function mapDataStore(mysqlDataStore: MySQLDataStore): PrismaDataStore {
  if (!mysqlDataStore.name) {
    throw new Error("DataStore name is required");
  }

  return {
    id: randomUUID(),
    name: mysqlDataStore.name.trim(),
    slug: generateSlug(mysqlDataStore.name),
  };
}

/**
 * Маппит данные OperationSystem из MySQL в Prisma формат
 */
export function mapOperationSystem(
  mysqlOperationSystem: MySQLOperationSystem
): PrismaOperationSystem {
  if (!mysqlOperationSystem.name) {
    throw new Error("OperationSystem name is required");
  }

  return {
    id: randomUUID(),
    name: mysqlOperationSystem.name.trim(),
    slug: generateSlug(mysqlOperationSystem.name),
  };
}

/**
 * Маппит данные ProgrammingLanguage из MySQL в Prisma формат
 */
export function mapProgrammingLanguage(
  mysqlProgrammingLanguage: MySQLProgrammingLanguage
): PrismaProgrammingLanguage {
  if (!mysqlProgrammingLanguage.name) {
    throw new Error("ProgrammingLanguage name is required");
  }

  return {
    id: randomUUID(),
    name: mysqlProgrammingLanguage.name.trim(),
    slug: generateSlug(mysqlProgrammingLanguage.name),
  };
}

/**
 * Маппит данные ContentBlock из MySQL в Prisma формат
 */
export function mapContentBlock(
  mysqlContentBlock: MySQLContentBlock
): PrismaContentBlock {
  // Генерируем key из title, если key отсутствует
  let key = mysqlContentBlock.key?.trim() || null;

  if (!key) {
    if (mysqlContentBlock.title) {
      // Генерируем key из title
      key = generateKeyFromTitle(mysqlContentBlock.title);
    } else {
      // Если нет ни key, ни title, генерируем key на основе ID
      key = `content_block_${mysqlContentBlock.id}`;
    }
  }

  // Валидируем формат key
  if (!validateKeyFormat(key)) {
    // Если key не соответствует формату, генерируем новый на основе ID
    key = `content_block_${mysqlContentBlock.id}`;
  }

  // Обрабатываем поле type - может быть строкой, числом или null
  let typeValue: string | null = null;
  if (mysqlContentBlock.type !== null && mysqlContentBlock.type !== undefined) {
    if (typeof mysqlContentBlock.type === "string") {
      typeValue = mysqlContentBlock.type.trim() || null;
    } else {
      // Если type не строка, преобразуем в строку
      typeValue = String(mysqlContentBlock.type);
    }
  }

  return {
    id: randomUUID(),
    key,
    title: mysqlContentBlock.title?.trim() || null,
    content: mysqlContentBlock.content?.trim() || null,
    type: typeValue,
    isActive: toBoolean(mysqlContentBlock.is_active),
    createdAt: toDate(mysqlContentBlock.created_at),
    updatedAt: toDate(mysqlContentBlock.updated_at),
  };
}

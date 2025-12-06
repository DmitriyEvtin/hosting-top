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
  return value === 1 || value === true;
}

/**
 * Преобразует строку или Date в Date объект
 */
function toDate(value: string | Date | null | undefined): Date {
  if (!value) {
    return new Date();
  }
  if (value instanceof Date) {
    return value;
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

  const slug = generateSlug(mysqlHosting.name);

  return {
    id: randomUUID(),
    name: mysqlHosting.name.trim(),
    slug,
    description: mysqlHosting.description?.trim() || null,
    logoUrl: mysqlHosting.logo_url?.trim() || null,
    websiteUrl: mysqlHosting.website_url?.trim() || null,
    isActive: toBoolean(mysqlHosting.is_active),
    createdAt: toDate(mysqlHosting.created_at),
    updatedAt: toDate(mysqlHosting.updated_at),
  };
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

  if (!mysqlTariff.price) {
    throw new Error("Tariff price is required");
  }

  if (!mysqlTariff.period) {
    throw new Error("Tariff period is required");
  }

  // Преобразуем price в Decimal
  const priceValue =
    typeof mysqlTariff.price === "string"
      ? mysqlTariff.price
      : mysqlTariff.price.toString();
  const price = new Decimal(priceValue);

  // Валидируем, что price положительное число
  if (price.lessThanOrEqualTo(0)) {
    throw new Error("Tariff price must be greater than 0");
  }

  return {
    id: randomUUID(),
    hostingId,
    name: mysqlTariff.name.trim(),
    price,
    currency: mysqlTariff.currency?.trim() || "RUB",
    period: toTariffPeriod(mysqlTariff.period),
    diskSpace: mysqlTariff.disk_space ?? null,
    bandwidth: mysqlTariff.bandwidth ?? null,
    domainsCount: mysqlTariff.domains_count ?? null,
    databasesCount: mysqlTariff.databases_count ?? null,
    emailAccounts: mysqlTariff.email_accounts ?? null,
    isActive: toBoolean(mysqlTariff.is_active),
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
    if (!mysqlContentBlock.title) {
      throw new Error("ContentBlock key or title is required to generate key");
    }
    key = generateKeyFromTitle(mysqlContentBlock.title);
  }

  // Валидируем формат key
  if (!validateKeyFormat(key)) {
    throw new Error(`ContentBlock key must be in snake_case format: ${key}`);
  }

  return {
    id: randomUUID(),
    key,
    title: mysqlContentBlock.title?.trim() || null,
    content: mysqlContentBlock.content?.trim() || null,
    isActive: toBoolean(mysqlContentBlock.is_active),
    createdAt: toDate(mysqlContentBlock.created_at),
    updatedAt: toDate(mysqlContentBlock.updated_at),
  };
}

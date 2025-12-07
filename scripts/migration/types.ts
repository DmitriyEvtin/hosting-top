/**
 * Типы для миграции данных из MySQL (Yii2) в PostgreSQL (Prisma)
 */

import { Decimal } from "@prisma/client/runtime/library";

/**
 * Enum для периода тарифа
 */
export enum TariffPeriod {
  MONTH = "MONTH",
  YEAR = "YEAR",
}

/**
 * MySQL структуры (на основе Yii2 таблиц)
 */

export interface MySQLHosting {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  start_year?: string | null;
  test_period?: number | null;
  status?: number | null;
  clients?: number | null;
  is_active?: number | boolean | null; // MySQL может возвращать 0/1 или boolean
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface MySQLTariff {
  id: number;
  hosting_id: number;
  type?: number | null;
  name: string;
  subtitle?: string | null;
  link?: string | null;
  domains?: number | null;
  disk_space?: number | null;
  sites?: number | null;
  ftp_accounts?: number | null;
  traffic?: number | null;
  mailboxes?: number | null;
  automatic_cms?: number | boolean | null;
  ssl?: number | boolean | null;
  backup?: number | boolean | null;
  ssh?: number | boolean | null;
  additional_id?: number | boolean | null;
  price_month?: string | number | null; // MySQL DECIMAL возвращается как string
  price_year?: string | number | null; // MySQL DECIMAL возвращается как string
  status?: number | null;
  count_test_days?: number | null;
  is_template?: number | boolean | null;
  ddos_def?: number | boolean | null;
  disk_type?: number | null;
  antivirus?: number | boolean | null;
  count_db?: number | null;
  info_disk_area?: string | null;
  info_platforms?: string | null;
  info_panels?: string | null;
  info_price?: string | null;
  info_ozu?: string | null;
  info_cpu?: string | null;
  info_cpu_core?: string | null;
  info_domains?: string | null;
  // Старые поля для обратной совместимости
  price?: string | number | null;
  currency?: string | null;
  period?: string | null; // "month" | "year"
  bandwidth?: number | null;
  domains_count?: number | null;
  databases_count?: number | null;
  email_accounts?: number | null;
  is_active?: number | boolean | null;
  created_at?: number | string | Date | null; // Unix timestamp или Date
  updated_at?: number | string | Date | null; // Unix timestamp или Date
}

export interface MySQLCMS {
  id: number;
  name: string;
}

export interface MySQLControlPanel {
  id: number;
  name: string;
}

export interface MySQLCountry {
  id: number;
  name: string;
}

export interface MySQLDataStore {
  id: number;
  name: string;
}

export interface MySQLOperationSystem {
  id: number;
  name: string;
}

export interface MySQLProgrammingLanguage {
  id: number;
  name: string;
}

export interface MySQLContentBlock {
  id: number;
  hosting_id?: number | null;
  key?: string | null;
  title?: string | null;
  content?: string | null;
  type?: string | null;
  is_active?: number | boolean | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

/**
 * Prisma структуры (на основе Prisma схемы)
 */

export interface PrismaHosting {
  id: string; // UUID
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  startYear?: string | null;
  testPeriod?: number | null;
  clients?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrismaTariff {
  id: string; // UUID
  hostingId: string; // UUID
  type?: number | null;
  name: string;
  subtitle?: string | null;
  link?: string | null;
  domains?: number | null;
  diskSpace?: number | null;
  sites?: number | null;
  ftpAccounts?: number | null;
  traffic?: number | null;
  mailboxes?: number | null;
  automaticCms?: boolean | null;
  ssl?: boolean | null;
  backup?: boolean | null;
  ssh?: boolean | null;
  additionalId?: boolean | null;
  priceMonth?: Decimal | null;
  priceYear?: Decimal | null;
  status: number; // Не может быть null, всегда число (default: 1)
  countTestDays?: number | null;
  isTemplate?: boolean | null;
  ddosDef?: boolean | null;
  diskType?: number | null;
  antivirus?: boolean | null;
  countDb?: number | null;
  // Старые поля для обратной совместимости
  currency: string; // Не может быть null, всегда строка (default: "RUB")
  bandwidth?: number | null;
  domainsCount?: number | null;
  databasesCount?: number | null;
  emailAccounts?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrismaCMS {
  id: string; // UUID
  name: string;
  slug: string;
}

export interface PrismaControlPanel {
  id: string; // UUID
  name: string;
  slug: string;
}

export interface PrismaCountry {
  id: string; // UUID
  name: string;
  slug: string;
}

export interface PrismaDataStore {
  id: string; // UUID
  name: string;
  slug: string;
}

export interface PrismaOperationSystem {
  id: string; // UUID
  name: string;
  slug: string;
}

export interface PrismaProgrammingLanguage {
  id: string; // UUID
  name: string;
  slug: string;
}

export interface PrismaContentBlock {
  id: string; // UUID
  key: string;
  title?: string | null;
  content?: string | null;
  type?: string | null;
  hostingId?: string | null; // Связь many-to-one с Hosting
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

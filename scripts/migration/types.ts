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
  description?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  is_active?: number | boolean | null; // MySQL может возвращать 0/1 или boolean
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface MySQLTariff {
  id: number;
  hosting_id: number;
  name: string;
  price: string | number; // MySQL DECIMAL возвращается как string
  currency?: string | null;
  period: string; // "month" | "year"
  disk_space?: number | null;
  bandwidth?: number | null;
  domains_count?: number | null;
  databases_count?: number | null;
  email_accounts?: number | null;
  is_active?: number | boolean | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrismaTariff {
  id: string; // UUID
  hostingId: string; // UUID
  name: string;
  price: Decimal;
  currency: string;
  period: TariffPeriod;
  diskSpace?: number | null;
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

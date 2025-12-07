/**
 * Unit тесты для маппера данных из MySQL в PostgreSQL формат
 */

import { Decimal } from "@prisma/client/runtime/library";
import { randomUUID } from "crypto";
import {
  mapHosting,
  mapTariff,
  mapCMS,
  mapControlPanel,
  mapCountry,
  mapDataStore,
  mapOperationSystem,
  mapProgrammingLanguage,
  mapContentBlock,
  validateMappedData,
} from "../data-mapper";
import type {
  MySQLHosting,
  MySQLTariff,
  MySQLCMS,
  MySQLControlPanel,
  MySQLCountry,
  MySQLDataStore,
  MySQLOperationSystem,
  MySQLProgrammingLanguage,
  MySQLContentBlock,
} from "../types";
import { z } from "zod";
import { TariffPeriod } from "../types";

describe("Data Mapper", () => {
  describe("mapHosting", () => {
    it("should map hosting with Russian name and generate slug", () => {
      const mysqlHosting: MySQLHosting = {
        id: 1,
        name: "Хостинг Тест",
        description: "Описание хостинга",
        logo_url: "https://example.com/logo.png",
        website_url: "https://example.com",
        is_active: 1,
        created_at: "2024-01-01 00:00:00",
        updated_at: "2024-01-02 00:00:00",
      };

      const result = mapHosting(mysqlHosting);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(result.name).toBe("Хостинг Тест");
      expect(result.slug).toBe("khosting-test");
      expect(result.description).toBe("Описание хостинга");
      expect(result.logoUrl).toBe("https://example.com/logo.png");
      expect(result.websiteUrl).toBe("khosting-test"); // websiteUrl = slug при переносе
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should handle NULL values", () => {
      const mysqlHosting: MySQLHosting = {
        id: 1,
        name: "Test Hosting",
        description: null,
        logo_url: null,
        website_url: null,
        is_active: 0,
        created_at: null,
        updated_at: null,
      };

      const result = mapHosting(mysqlHosting);

      expect(result.description).toBeNull();
      expect(result.logoUrl).toBeNull();
      expect(result.websiteUrl).toBe("test-hosting"); // websiteUrl = slug при переносе
      expect(result.isActive).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should trim whitespace from name", () => {
      const mysqlHosting: MySQLHosting = {
        id: 1,
        name: "  Test Hosting  ",
      };

      const result = mapHosting(mysqlHosting);

      expect(result.name).toBe("Test Hosting");
    });

    it("should throw error if name is missing", () => {
      const mysqlHosting: MySQLHosting = {
        id: 1,
        name: "",
      };

      expect(() => mapHosting(mysqlHosting)).toThrow("Hosting name is required");
    });

    it("should handle boolean is_active", () => {
      const mysqlHosting: MySQLHosting = {
        id: 1,
        name: "Test",
        is_active: true,
      };

      const result = mapHosting(mysqlHosting);
      expect(result.isActive).toBe(true);
    });

    it("should handle Date objects in created_at and updated_at", () => {
      const mysqlHosting: MySQLHosting = {
        id: 1,
        name: "Test",
        created_at: new Date("2024-01-01"),
        updated_at: new Date("2024-01-02"),
      };

      const result = mapHosting(mysqlHosting);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt.getTime()).toBe(new Date("2024-01-01").getTime());
      expect(result.updatedAt.getTime()).toBe(new Date("2024-01-02").getTime());
    });

    it("should use slug from MySQL if provided (preserving dots for domains)", () => {
      const mysqlHosting: MySQLHosting = {
        id: 1,
        name: "Example Hosting",
        slug: "example.com",
      };

      const result = mapHosting(mysqlHosting);
      expect(result.slug).toBe("example.com"); // Slug из MySQL сохраняется как есть
      expect(result.websiteUrl).toBe("example.com"); // websiteUrl = slug при переносе
    });

    it("should use slug from MySQL with subdomain", () => {
      const mysqlHosting: MySQLHosting = {
        id: 1,
        name: "Subdomain Hosting",
        slug: "sub.example.com",
      };

      const result = mapHosting(mysqlHosting);
      expect(result.slug).toBe("sub.example.com"); // Множественные точки сохраняются
      expect(result.websiteUrl).toBe("sub.example.com"); // websiteUrl = slug при переносе
    });

    it("should generate slug if MySQL slug is empty or null", () => {
      const mysqlHosting1: MySQLHosting = {
        id: 1,
        name: "Test Hosting",
        slug: null,
      };

      const result1 = mapHosting(mysqlHosting1);
      expect(result1.slug).toBe("test-hosting"); // Генерируется из name

      const mysqlHosting2: MySQLHosting = {
        id: 2,
        name: "Test Hosting",
        slug: "",
      };

      const result2 = mapHosting(mysqlHosting2);
      expect(result2.slug).toBe("test-hosting"); // Генерируется из name

      const mysqlHosting3: MySQLHosting = {
        id: 3,
        name: "Test Hosting",
        slug: "   ", // Только пробелы
      };

      const result3 = mapHosting(mysqlHosting3);
      expect(result3.slug).toBe("test-hosting"); // Генерируется из name
    });

    it("should set isActive based on status: is_active = status === 1", () => {
      // Если status === 1, то isActive = true
      const mysqlHosting1: MySQLHosting = {
        id: 1,
        name: "Test Hosting",
        status: 1,
      };

      const result1 = mapHosting(mysqlHosting1);
      expect(result1.isActive).toBe(true);

      // Если status !== 1, то isActive = false
      const mysqlHosting2: MySQLHosting = {
        id: 2,
        name: "Test Hosting",
        status: 0,
      };

      const result2 = mapHosting(mysqlHosting2);
      expect(result2.isActive).toBe(false);

      // Если status === 2, то isActive = false
      const mysqlHosting3: MySQLHosting = {
        id: 3,
        name: "Test Hosting",
        status: 2,
      };

      const result3 = mapHosting(mysqlHosting3);
      expect(result3.isActive).toBe(false);

      // Если status не указан, используем is_active из MySQL
      const mysqlHosting4: MySQLHosting = {
        id: 4,
        name: "Test Hosting",
        is_active: 1,
      };

      const result4 = mapHosting(mysqlHosting4);
      expect(result4.isActive).toBe(true);

      const mysqlHosting5: MySQLHosting = {
        id: 5,
        name: "Test Hosting",
        is_active: 0,
      };

      const result5 = mapHosting(mysqlHosting5);
      expect(result5.isActive).toBe(false);
    });
  });

  describe("mapTariff", () => {
    const hostingId = randomUUID();

    it("should map tariff with price as string and period as month", () => {
      const mysqlTariff: MySQLTariff = {
        id: 1,
        hosting_id: 1,
        name: "Базовый тариф",
        price: "500.00",
        currency: "RUB",
        period: "month",
        disk_space: 10000,
        bandwidth: 100000,
        domains_count: 5,
        databases_count: 5,
        email_accounts: 10,
        is_active: 1,
        created_at: "2024-01-01 00:00:00",
        updated_at: "2024-01-02 00:00:00",
      };

      const result = mapTariff(mysqlTariff, hostingId);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(result.hostingId).toBe(hostingId);
      expect(result.name).toBe("Базовый тариф");
      expect(result.price).toBeInstanceOf(Decimal);
      expect(result.price.toNumber()).toBe(500);
      expect(result.currency).toBe("RUB");
      expect(result.period).toBe(TariffPeriod.MONTH);
      expect(result.diskSpace).toBe(10000);
      expect(result.bandwidth).toBe(100000);
      expect(result.domainsCount).toBe(5);
      expect(result.databasesCount).toBe(5);
      expect(result.emailAccounts).toBe(10);
      expect(result.isActive).toBe(true);
    });

    it("should map tariff with price as number and period as year", () => {
      const mysqlTariff: MySQLTariff = {
        id: 1,
        hosting_id: 1,
        name: "Годовой тариф",
        price: 5000,
        currency: "USD",
        period: "year",
        is_active: 1,
      };

      const result = mapTariff(mysqlTariff, hostingId);

      expect(result.price).toBeInstanceOf(Decimal);
      expect(result.price.toString()).toBe("5000");
      expect(result.currency).toBe("USD");
      expect(result.period).toBe(TariffPeriod.YEAR);
    });

    it("should default currency to RUB if not provided", () => {
      const mysqlTariff: MySQLTariff = {
        id: 1,
        hosting_id: 1,
        name: "Test Tariff",
        price: "100.00",
        period: "month",
      };

      const result = mapTariff(mysqlTariff, hostingId);

      expect(result.currency).toBe("RUB");
    });

    it("should handle NULL optional fields", () => {
      const mysqlTariff: MySQLTariff = {
        id: 1,
        hosting_id: 1,
        name: "Test Tariff",
        price: "100.00",
        period: "month",
        disk_space: null,
        bandwidth: null,
        domains_count: null,
        databases_count: null,
        email_accounts: null,
      };

      const result = mapTariff(mysqlTariff, hostingId);

      expect(result.diskSpace).toBeNull();
      expect(result.bandwidth).toBeNull();
      expect(result.domainsCount).toBeNull();
      expect(result.databasesCount).toBeNull();
      expect(result.emailAccounts).toBeNull();
    });

    it("should throw error if name is missing", () => {
      const mysqlTariff: MySQLTariff = {
        id: 1,
        hosting_id: 1,
        name: "",
        price: "100.00",
        period: "month",
      };

      expect(() => mapTariff(mysqlTariff, hostingId)).toThrow(
        "Tariff name is required",
      );
    });

    it("should throw error if price is missing", () => {
      const mysqlTariff: MySQLTariff = {
        id: 1,
        hosting_id: 1,
        name: "Test",
        price: "",
        period: "month",
      };

      expect(() => mapTariff(mysqlTariff, hostingId)).toThrow(
        "Tariff price is required",
      );
    });

    it("should throw error if price is zero or negative", () => {
      const mysqlTariff: MySQLTariff = {
        id: 1,
        hosting_id: 1,
        name: "Test",
        price: "0",
        period: "month",
      };

      expect(() => mapTariff(mysqlTariff, hostingId)).toThrow(
        "Tariff price must be greater than 0",
      );
    });

    it("should handle period in Russian", () => {
      const mysqlTariff: MySQLTariff = {
        id: 1,
        hosting_id: 1,
        name: "Test",
        price: "100.00",
        period: "год",
      };

      const result = mapTariff(mysqlTariff, hostingId);
      expect(result.period).toBe(TariffPeriod.YEAR);
    });

    it("should throw error if period is missing", () => {
      const mysqlTariff: MySQLTariff = {
        id: 1,
        hosting_id: 1,
        name: "Test",
        price: "100.00",
        period: "",
      };

      expect(() => mapTariff(mysqlTariff, hostingId)).toThrow(
        "Tariff period is required",
      );
    });

    it("should handle Date objects in created_at and updated_at", () => {
      const mysqlTariff: MySQLTariff = {
        id: 1,
        hosting_id: 1,
        name: "Test",
        price: "100.00",
        period: "month",
        created_at: new Date("2024-01-01"),
        updated_at: new Date("2024-01-02"),
      };

      const result = mapTariff(mysqlTariff, hostingId);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt.getTime()).toBe(new Date("2024-01-01").getTime());
      expect(result.updatedAt.getTime()).toBe(new Date("2024-01-02").getTime());
    });
  });

  describe("mapCMS", () => {
    it("should map CMS with Russian name and generate slug", () => {
      const mysqlCMS: MySQLCMS = {
        id: 1,
        name: "WordPress",
      };

      const result = mapCMS(mysqlCMS);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(result.name).toBe("WordPress");
      expect(result.slug).toBe("wordpress");
    });

    it("should generate slug from Russian name", () => {
      const mysqlCMS: MySQLCMS = {
        id: 1,
        name: "Друпал",
      };

      const result = mapCMS(mysqlCMS);

      expect(result.slug).toBe("drupal");
    });

    it("should throw error if name is missing", () => {
      const mysqlCMS: MySQLCMS = {
        id: 1,
        name: "",
      };

      expect(() => mapCMS(mysqlCMS)).toThrow("CMS name is required");
    });
  });

  describe("mapControlPanel", () => {
    it("should map ControlPanel with Russian name and generate slug", () => {
      const mysqlControlPanel: MySQLControlPanel = {
        id: 1,
        name: "cPanel",
      };

      const result = mapControlPanel(mysqlControlPanel);

      expect(result.id).toBeDefined();
      expect(result.name).toBe("cPanel");
      expect(result.slug).toBe("cpanel");
    });

    it("should generate slug from Russian name", () => {
      const mysqlControlPanel: MySQLControlPanel = {
        id: 1,
        name: "Панель управления",
      };

      const result = mapControlPanel(mysqlControlPanel);

      expect(result.slug).toBe("panel-upravleniya");
    });
  });

  describe("mapCountry", () => {
    it("should map Country with Russian name and generate slug", () => {
      const mysqlCountry: MySQLCountry = {
        id: 1,
        name: "Россия",
      };

      const result = mapCountry(mysqlCountry);

      expect(result.id).toBeDefined();
      expect(result.name).toBe("Россия");
      expect(result.slug).toBe("rossiya");
    });
  });

  describe("mapDataStore", () => {
    it("should map DataStore with Russian name and generate slug", () => {
      const mysqlDataStore: MySQLDataStore = {
        id: 1,
        name: "MySQL",
      };

      const result = mapDataStore(mysqlDataStore);

      expect(result.id).toBeDefined();
      expect(result.name).toBe("MySQL");
      expect(result.slug).toBe("mysql");
    });
  });

  describe("mapOperationSystem", () => {
    it("should map OperationSystem with Russian name and generate slug", () => {
      const mysqlOperationSystem: MySQLOperationSystem = {
        id: 1,
        name: "Linux",
      };

      const result = mapOperationSystem(mysqlOperationSystem);

      expect(result.id).toBeDefined();
      expect(result.name).toBe("Linux");
      expect(result.slug).toBe("linux");
    });
  });

  describe("mapProgrammingLanguage", () => {
    it("should map ProgrammingLanguage with Russian name and generate slug", () => {
      const mysqlProgrammingLanguage: MySQLProgrammingLanguage = {
        id: 1,
        name: "PHP",
      };

      const result = mapProgrammingLanguage(mysqlProgrammingLanguage);

      expect(result.id).toBeDefined();
      expect(result.name).toBe("PHP");
      expect(result.slug).toBe("php");
    });
  });

  describe("mapContentBlock", () => {
    it("should map ContentBlock with existing key", () => {
      const mysqlContentBlock: MySQLContentBlock = {
        id: 1,
        key: "home_page_title",
        title: "Главная страница",
        content: "Контент",
        is_active: 1,
        created_at: "2024-01-01 00:00:00",
        updated_at: "2024-01-02 00:00:00",
      };

      const result = mapContentBlock(mysqlContentBlock);

      expect(result.id).toBeDefined();
      expect(result.key).toBe("home_page_title");
      expect(result.title).toBe("Главная страница");
      expect(result.content).toBe("Контент");
      expect(result.isActive).toBe(true);
    });

    it("should generate key from title if key is missing", () => {
      const mysqlContentBlock: MySQLContentBlock = {
        id: 1,
        key: null,
        title: "Главная страница",
        content: "Контент",
        is_active: 1,
      };

      const result = mapContentBlock(mysqlContentBlock);

      expect(result.key).toBe("glavnaya_stranitsa");
      expect(result.title).toBe("Главная страница");
    });

    it("should generate key from English title", () => {
      const mysqlContentBlock: MySQLContentBlock = {
        id: 1,
        key: null,
        title: "Home Page Title",
        content: "Content",
        is_active: 1,
      };

      const result = mapContentBlock(mysqlContentBlock);

      expect(result.key).toBe("home_page_title");
    });

    it("should throw error if both key and title are missing", () => {
      const mysqlContentBlock: MySQLContentBlock = {
        id: 1,
        key: null,
        title: null,
        content: "Content",
      };

      expect(() => mapContentBlock(mysqlContentBlock)).toThrow(
        "ContentBlock key or title is required to generate key",
      );
    });

    it("should throw error if key format is invalid", () => {
      const mysqlContentBlock: MySQLContentBlock = {
        id: 1,
        key: "invalid-key-format", // содержит дефисы вместо подчеркиваний
        title: "Title",
        content: "Content",
      };

      expect(() => mapContentBlock(mysqlContentBlock)).toThrow(
        "ContentBlock key must be in snake_case format",
      );
    });

    it("should throw error if generated key is empty", () => {
      const mysqlContentBlock: MySQLContentBlock = {
        id: 1,
        key: null,
        title: "!!!", // Символы, которые будут удалены, оставив пустую строку
        content: "Content",
      };

      expect(() => mapContentBlock(mysqlContentBlock)).toThrow(
        "Cannot generate key: title resulted in empty key",
      );
    });

    it("should handle Date objects in created_at and updated_at", () => {
      const mysqlContentBlock: MySQLContentBlock = {
        id: 1,
        key: "test_key",
        title: "Title",
        content: "Content",
        created_at: new Date("2024-01-01"),
        updated_at: new Date("2024-01-02"),
      };

      const result = mapContentBlock(mysqlContentBlock);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt.getTime()).toBe(new Date("2024-01-01").getTime());
      expect(result.updatedAt.getTime()).toBe(new Date("2024-01-02").getTime());
    });

    it("should handle NULL values", () => {
      const mysqlContentBlock: MySQLContentBlock = {
        id: 1,
        key: "test_key",
        title: null,
        content: null,
        is_active: 0,
        created_at: null,
        updated_at: null,
      };

      const result = mapContentBlock(mysqlContentBlock);

      expect(result.title).toBeNull();
      expect(result.content).toBeNull();
      expect(result.isActive).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("validateMappedData", () => {
    it("should validate data with valid schema", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = {
        name: "Test",
        age: 25,
      };

      const result = validateMappedData(data, schema);

      expect(result).toEqual(data);
    });

    it("should throw error for invalid data", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = {
        name: "Test",
        age: "not a number",
      };

      expect(() => validateMappedData(data, schema)).toThrow();
    });
  });
});


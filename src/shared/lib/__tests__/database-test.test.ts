import { getDatabaseStats, testDatabaseConnection } from "../database-test";

// Мокаем Prisma клиент
jest.mock("../../api/database", () => ({
  prisma: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      count: jest.fn(),
    },
    category: {
      count: jest.fn(),
    },
    product: {
      count: jest.fn(),
    },
    parsingSession: {
      count: jest.fn(),
    },
  },
}));

import { prisma } from "../../api/database";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("database-test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Мокаем console.log и console.error для тестов
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("testDatabaseConnection", () => {
    it("should return success with stats when connection is successful", async () => {
      // Настраиваем моки
      mockPrisma.$connect.mockResolvedValue(undefined);
      mockPrisma.$disconnect.mockResolvedValue(undefined);
      mockPrisma.user.count.mockResolvedValue(5);
      mockPrisma.category.count.mockResolvedValue(10);
      mockPrisma.product.count.mockResolvedValue(25);
      mockPrisma.parsingSession.count.mockResolvedValue(3);

      const result = await testDatabaseConnection();

      expect(result).toEqual({
        success: true,
        stats: {
          users: 5,
          categories: 10,
          products: 25,
          sessions: 3,
        },
      });

      expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.count).toHaveBeenCalledTimes(1);
      expect(mockPrisma.category.count).toHaveBeenCalledTimes(1);
      expect(mockPrisma.product.count).toHaveBeenCalledTimes(1);
      expect(mockPrisma.parsingSession.count).toHaveBeenCalledTimes(1);
    });

    it("should return error when connection fails", async () => {
      const error = new Error("Connection failed");
      mockPrisma.$connect.mockRejectedValue(error);

      const result = await testDatabaseConnection();

      expect(result).toEqual({
        success: false,
        error: "Connection failed",
      });

      expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
    });

    it("should return error when query fails", async () => {
      mockPrisma.$connect.mockResolvedValue(undefined);
      mockPrisma.$disconnect.mockResolvedValue(undefined);
      mockPrisma.user.count.mockRejectedValue(new Error("Query failed"));

      const result = await testDatabaseConnection();

      expect(result).toEqual({
        success: false,
        error: "Query failed",
      });

      expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
    });

    it("should handle unknown error types", async () => {
      mockPrisma.$connect.mockRejectedValue("String error");

      const result = await testDatabaseConnection();

      expect(result).toEqual({
        success: false,
        error: "Неизвестная ошибка",
      });
    });

    it("should always disconnect from database", async () => {
      mockPrisma.$connect.mockResolvedValue(undefined);
      mockPrisma.$disconnect.mockResolvedValue(undefined);
      mockPrisma.user.count.mockRejectedValue(new Error("Query failed"));

      await testDatabaseConnection();

      expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe("getDatabaseStats", () => {
    it("should return database statistics", async () => {
      mockPrisma.user.count.mockResolvedValue(5);
      mockPrisma.category.count.mockResolvedValue(10);
      mockPrisma.product.count.mockResolvedValue(25);
      mockPrisma.parsingSession.count.mockResolvedValue(3);

      const result = await getDatabaseStats();

      expect(result).toEqual({
        users: 5,
        categories: 10,
        products: 25,
        sessions: 3,
      });

      expect(mockPrisma.user.count).toHaveBeenCalledTimes(1);
      expect(mockPrisma.category.count).toHaveBeenCalledTimes(1);
      expect(mockPrisma.product.count).toHaveBeenCalledTimes(1);
      expect(mockPrisma.parsingSession.count).toHaveBeenCalledTimes(1);
    });

    it("should throw error when query fails", async () => {
      const error = new Error("Database error");
      mockPrisma.user.count.mockRejectedValue(error);

      await expect(getDatabaseStats()).rejects.toThrow("Database error");
    });

    it("should handle zero counts", async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.category.count.mockResolvedValue(0);
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.parsingSession.count.mockResolvedValue(0);

      const result = await getDatabaseStats();

      expect(result).toEqual({
        users: 0,
        categories: 0,
        products: 0,
        sessions: 0,
      });
    });

    it("should handle large counts", async () => {
      mockPrisma.user.count.mockResolvedValue(1000);
      mockPrisma.category.count.mockResolvedValue(500);
      mockPrisma.product.count.mockResolvedValue(10000);
      mockPrisma.parsingSession.count.mockResolvedValue(100);

      const result = await getDatabaseStats();

      expect(result).toEqual({
        users: 1000,
        categories: 500,
        products: 10000,
        sessions: 100,
      });
    });
  });
});

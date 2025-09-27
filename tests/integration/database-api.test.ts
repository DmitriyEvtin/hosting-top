// Мокаем зависимости
jest.mock("@/shared/lib", () => ({
  testDatabaseConnection: jest.fn(),
}));

import { GET as databaseTestGet } from "@/app/api/database/test/route";
import { testDatabaseConnection } from "@/shared/lib";

const mockTestDatabaseConnection =
  testDatabaseConnection as jest.MockedFunction<typeof testDatabaseConnection>;

describe("Database API Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("/api/database/test", () => {
    describe("GET", () => {
      it("should return success when database connection is working", async () => {
        mockTestDatabaseConnection.mockResolvedValue({
          success: true,
          stats: {
            users: 5,
            categories: 10,
            products: 25,
            sessions: 3,
          },
        });

        const response = await databaseTestGet();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe("База данных работает корректно");
        expect(data.stats).toEqual({
          users: 5,
          categories: 10,
          products: 25,
          sessions: 3,
        });
      });

      it("should return error when database connection fails", async () => {
        mockTestDatabaseConnection.mockResolvedValue({
          success: false,
          error: "Connection timeout",
        });

        const response = await databaseTestGet();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toBe("Ошибка подключения к базе данных");
        expect(data.error).toBe("Connection timeout");
      });

      it("should return error when database test throws exception", async () => {
        mockTestDatabaseConnection.mockRejectedValue(
          new Error("Database unavailable")
        );

        const response = await databaseTestGet();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toBe("Внутренняя ошибка сервера");
        expect(data.error).toBe("Database unavailable");
      });

      it("should handle unknown error types", async () => {
        mockTestDatabaseConnection.mockRejectedValue("String error");

        const response = await databaseTestGet();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toBe("Внутренняя ошибка сервера");
        expect(data.error).toBe("Неизвестная ошибка");
      });

      it("should handle database connection with zero stats", async () => {
        mockTestDatabaseConnection.mockResolvedValue({
          success: true,
          stats: {
            users: 0,
            categories: 0,
            products: 0,
            sessions: 0,
          },
        });

        const response = await databaseTestGet();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats).toEqual({
          users: 0,
          categories: 0,
          products: 0,
          sessions: 0,
        });
      });

      it("should handle database connection with large stats", async () => {
        mockTestDatabaseConnection.mockResolvedValue({
          success: true,
          stats: {
            users: 1000,
            categories: 500,
            products: 10000,
            sessions: 100,
          },
        });

        const response = await databaseTestGet();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats).toEqual({
          users: 1000,
          categories: 500,
          products: 10000,
          sessions: 100,
        });
      });
    });
  });
});

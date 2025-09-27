import { NextRequest } from "next/server";

// Мокаем зависимости
jest.mock("@/shared/lib/aws-config", () => ({
  checkAwsAvailability: jest.fn(),
}));

jest.mock("@/shared/lib/database-test", () => ({
  testDatabaseConnection: jest.fn(),
}));

jest.mock("@/shared/lib/env-simple", () => ({
  env: {
    NODE_ENV: "test",
    APP_NAME: "Test App",
    APP_VERSION: "1.0.0",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    AWS_ACCESS_KEY_ID: "test-key",
    AWS_SECRET_ACCESS_KEY: "test-secret",
    AWS_S3_BUCKET: "test-bucket",
    AWS_REGION: "eu-west-1",
    CLOUDFRONT_DOMAIN: "test.cloudfront.net",
    NEXTAUTH_SECRET: "test-secret",
    NEXTAUTH_URL: "http://localhost:3000",
    SMTP_HOST: "smtp.test.com",
    SMTP_FROM: "test@test.com",
    SENTRY_DSN: "https://test@sentry.io/test",
    LOG_LEVEL: "info",
    PARSING_BATCH_SIZE: 10,
    PARSING_DELAY_MS: 1000,
    PARSING_MAX_RETRIES: 3,
    CORS_ORIGIN: "http://localhost:3000",
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW_MS: 900000,
  },
  hasAws: true,
  hasRedis: true,
  hasSentry: true,
  hasSmtp: true,
  isDevelopment: true,
}));

import {
  GET as configCheckGet,
  HEAD as configCheckHead,
} from "@/app/api/config/check/route";
import { GET as configSimpleGet } from "@/app/api/config/simple/route";
import { checkAwsAvailability } from "@/shared/lib/aws-config";
import { testDatabaseConnection } from "@/shared/lib/database-test";

const mockCheckAwsAvailability = checkAwsAvailability as jest.MockedFunction<
  typeof checkAwsAvailability
>;
const mockTestDatabaseConnection =
  testDatabaseConnection as jest.MockedFunction<typeof testDatabaseConnection>;

describe("Config API Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Мокаем console.log и console.error
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("/api/config/check", () => {
    describe("GET", () => {
      it("should return healthy status when all services are working", async () => {
        mockTestDatabaseConnection.mockResolvedValue({
          success: true,
          stats: {
            users: 5,
            categories: 10,
            products: 25,
            sessions: 3,
          },
        });
        mockCheckAwsAvailability.mockResolvedValue(true);

        const request = new NextRequest(
          "http://localhost:3000/api/config/check"
        );
        const response = await configCheckGet(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe("healthy");
        expect(data.timestamp).toBeDefined();
        expect(data.environment).toBeDefined();
        expect(data.environment.database.status).toBe("connected");
        expect(data.environment.redis.status).toBe("configured");
        expect(data.environment.aws.status).toBe("available");
        expect(data.environment.smtp.status).toBe("configured");
        expect(data.environment.monitoring.sentry).toBe("configured");
      });

      it("should return degraded status when database is not working", async () => {
        mockTestDatabaseConnection.mockResolvedValue({
          success: false,
          error: "Connection failed",
        });
        mockCheckAwsAvailability.mockResolvedValue(true);

        const request = new NextRequest(
          "http://localhost:3000/api/config/check"
        );
        const response = await configCheckGet(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.status).toBe("degraded");
        expect(data.environment.database.status).toBe("error");
      });

      it("should return degraded status when AWS is not available", async () => {
        mockTestDatabaseConnection.mockResolvedValue({
          success: true,
          stats: { users: 0, categories: 0, products: 0, sessions: 0 },
        });
        mockCheckAwsAvailability.mockRejectedValue(
          new Error("AWS unavailable")
        );

        const request = new NextRequest(
          "http://localhost:3000/api/config/check"
        );
        const response = await configCheckGet(request);
        const data = await response.json();

        expect(response.status).toBe(200); // AWS не критичен
        expect(data.status).toBe("healthy");
        expect(data.environment.aws.status).toBe("error");
      });

      it("should handle errors gracefully", async () => {
        mockTestDatabaseConnection.mockRejectedValue(
          new Error("Database error")
        );

        const request = new NextRequest(
          "http://localhost:3000/api/config/check"
        );
        const response = await configCheckGet(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.status).toBe("degraded");
        expect(data.environment.database.status).toBe("error");
      });

      it("should include proper cache headers", async () => {
        mockTestDatabaseConnection.mockResolvedValue({
          success: true,
          stats: { users: 0, categories: 0, products: 0, sessions: 0 },
        });
        mockCheckAwsAvailability.mockResolvedValue(true);

        const request = new NextRequest(
          "http://localhost:3000/api/config/check"
        );
        const response = await configCheckGet(request);

        expect(response.headers.get("Cache-Control")).toBe(
          "no-cache, no-store, must-revalidate"
        );
        expect(response.headers.get("Pragma")).toBe("no-cache");
        expect(response.headers.get("Expires")).toBe("0");
      });
    });

    describe("HEAD", () => {
      it("should return 200 when database is working", async () => {
        mockTestDatabaseConnection.mockResolvedValue({
          success: true,
          stats: { users: 0, categories: 0, products: 0, sessions: 0 },
        });

        const request = new NextRequest(
          "http://localhost:3000/api/config/check"
        );
        const response = await configCheckHead(request);

        expect(response.status).toBe(200);
      });

      it("should return 503 when database is not working", async () => {
        mockTestDatabaseConnection.mockResolvedValue({
          success: false,
          error: "Connection failed",
        });

        const request = new NextRequest(
          "http://localhost:3000/api/config/check"
        );
        const response = await configCheckHead(request);

        expect(response.status).toBe(503);
      });

      it("should return 503 when database test throws error", async () => {
        mockTestDatabaseConnection.mockRejectedValue(
          new Error("Database error")
        );

        const request = new NextRequest(
          "http://localhost:3000/api/config/check"
        );
        const response = await configCheckHead(request);

        expect(response.status).toBe(503);
      });
    });
  });

  describe("/api/config/simple", () => {
    describe("GET", () => {
      it("should return configuration info", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/config/simple"
        );
        const response = await configSimpleGet(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe("healthy");
        expect(data.timestamp).toBeDefined();
        expect(data.environment).toBeDefined();
        expect(data.environment.nodeEnv).toBe("test");
        expect(data.environment.appName).toBe("Test App");
        expect(data.environment.appVersion).toBe("1.0.0");
        expect(data.environment.database.status).toBe("configured");
        expect(data.environment.redis.status).toBe("configured");
        expect(data.environment.aws.status).toBe("configured");
        expect(data.environment.smtp.status).toBe("configured");
        expect(data.environment.monitoring.sentry).toBe("configured");
      });

      it("should return degraded status when database is not configured", async () => {
        // Мокаем process.env для этого теста
        const originalEnv = process.env;
        process.env = { ...originalEnv, DATABASE_URL: "" };

        jest.resetModules();
        const { GET: configSimpleGetFresh } = await import(
          "@/app/api/config/simple/route"
        );

        const request = new NextRequest(
          "http://localhost:3000/api/config/simple"
        );
        const response = await configSimpleGetFresh(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.status).toBe("degraded");
        expect(data.environment.database.status).toBe("not_configured");

        // Восстанавливаем process.env
        process.env = originalEnv;
      });

      it("should handle errors gracefully", async () => {
        // Мокаем ошибку в процессе выполнения
        jest.spyOn(console, "error").mockImplementation(() => {
          throw new Error("Test error");
        });

        const request = new NextRequest(
          "http://localhost:3000/api/config/simple"
        );
        const response = await configSimpleGet(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.status).toBe("error");
        expect(data.error).toBeDefined();
        expect(data.error.message).toBe("Configuration check failed");
      });

      it("should include proper cache headers", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/config/simple"
        );
        const response = await configSimpleGet(request);

        expect(response.headers.get("Cache-Control")).toBe(
          "no-cache, no-store, must-revalidate"
        );
        expect(response.headers.get("Pragma")).toBe("no-cache");
        expect(response.headers.get("Expires")).toBe("0");
      });
    });
  });
});

// Мокаем process.env для тестов
const originalEnv = process.env;

describe("env-simple", () => {
  beforeEach(() => {
    // Очищаем process.env перед каждым тестом
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Восстанавливаем оригинальный process.env
    process.env = originalEnv;
  });

  describe("env object", () => {
    it("should have default values when env vars are not set", () => {
      // Очищаем все переменные окружения
      process.env = {};

      // Перезагружаем модуль для получения новых значений
      jest.resetModules();
      const { env: freshEnv } = require("../env-simple");

      expect(freshEnv.NODE_ENV).toBe("development");
      expect(freshEnv.APP_NAME).toBe("Паркет CRM");
      expect(freshEnv.APP_VERSION).toBe("1.0.0");
      expect(freshEnv.DATABASE_URL).toBe("");
      expect(freshEnv.REDIS_URL).toBe("");
      expect(freshEnv.NEXTAUTH_SECRET).toBe("");
      expect(freshEnv.NEXTAUTH_URL).toBe("http://localhost:3000");
      expect(freshEnv.AWS_REGION).toBe("eu-west-1");
      expect(freshEnv.PARSING_BATCH_SIZE).toBe(10);
      expect(freshEnv.PARSING_DELAY_MS).toBe(1000);
      expect(freshEnv.PARSING_MAX_RETRIES).toBe(3);
      expect(freshEnv.LOG_LEVEL).toBe("info");
      expect(freshEnv.SMTP_PORT).toBe(587);
      expect(freshEnv.CORS_ORIGIN).toBe("http://localhost:3000");
      expect(freshEnv.RATE_LIMIT_MAX).toBe(100);
      expect(freshEnv.RATE_LIMIT_WINDOW_MS).toBe(900000);
      expect(freshEnv.VERBOSE_LOGGING).toBe(false);
    });

    it("should use environment variables when set", () => {
      process.env.NODE_ENV = "production";
      process.env.APP_NAME = "Test App";
      process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.NEXTAUTH_SECRET = "test-secret-key";
      process.env.AWS_ACCESS_KEY_ID = "test-key";
      process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
      process.env.AWS_S3_BUCKET = "test-bucket";
      process.env.SENTRY_DSN = "https://test@sentry.io/test";
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_USER = "test@test.com";
      process.env.SMTP_PASSWORD = "test-password";
      process.env.DEBUG = "true";
      process.env.VERBOSE_LOGGING = "true";

      jest.resetModules();
      const { env: freshEnv } = require("../env-simple");

      expect(freshEnv.NODE_ENV).toBe("production");
      expect(freshEnv.APP_NAME).toBe("Test App");
      expect(freshEnv.DATABASE_URL).toBe(
        "postgresql://test:test@localhost:5432/test"
      );
      expect(freshEnv.REDIS_URL).toBe("redis://localhost:6379");
      expect(freshEnv.NEXTAUTH_SECRET).toBe("test-secret-key");
      expect(freshEnv.AWS_ACCESS_KEY_ID).toBe("test-key");
      expect(freshEnv.AWS_SECRET_ACCESS_KEY).toBe("test-secret");
      expect(freshEnv.AWS_S3_BUCKET).toBe("test-bucket");
      expect(freshEnv.SENTRY_DSN).toBe("https://test@sentry.io/test");
      expect(freshEnv.SMTP_HOST).toBe("smtp.test.com");
      expect(freshEnv.SMTP_USER).toBe("test@test.com");
      expect(freshEnv.SMTP_PASSWORD).toBe("test-password");
      expect(freshEnv.DEBUG).toBe("true");
      expect(freshEnv.VERBOSE_LOGGING).toBe(true);
    });
  });

  describe("environment check functions", () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it("should correctly identify development environment", () => {
      process.env.NODE_ENV = "development";
      const { isDevelopment: isDev } = require("../env-simple");
      expect(isDev).toBe(true);
    });

    it("should correctly identify staging environment", () => {
      process.env.NODE_ENV = "staging";
      const { isStaging: isStag } = require("../env-simple");
      expect(isStag).toBe(true);
    });

    it("should correctly identify production environment", () => {
      process.env.NODE_ENV = "production";
      const { isProduction: isProd } = require("../env-simple");
      expect(isProd).toBe(true);
    });
  });

  describe("service availability functions", () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it("should detect Redis availability", () => {
      process.env.REDIS_URL = "redis://localhost:6379";
      const { hasRedis: hasRedisService } = require("../env-simple");
      expect(hasRedisService).toBe(true);

      process.env.REDIS_URL = "";
      jest.resetModules();
      const { hasRedis: hasRedisServiceEmpty } = require("../env-simple");
      expect(hasRedisServiceEmpty).toBe(false);
    });

    it("should detect AWS availability", () => {
      process.env.AWS_ACCESS_KEY_ID = "test-key";
      process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
      process.env.AWS_S3_BUCKET = "test-bucket";
      const { hasAws } = require("../env-simple");
      expect(hasAws).toBe(true);

      process.env.AWS_ACCESS_KEY_ID = "";
      jest.resetModules();
      const { hasAws: hasAwsEmpty } = require("../env-simple");
      expect(hasAwsEmpty).toBe(false);
    });

    it("should detect SMTP availability", () => {
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_USER = "test@test.com";
      process.env.SMTP_PASSWORD = "test-password";
      const { hasSmtp } = require("../env-simple");
      expect(hasSmtp).toBe(true);

      process.env.SMTP_HOST = "";
      jest.resetModules();
      const { hasSmtp: hasSmtpEmpty } = require("../env-simple");
      expect(hasSmtpEmpty).toBe(false);
    });

    it("should detect Sentry availability", () => {
      process.env.SENTRY_DSN = "https://test@sentry.io/test";
      const { hasSentry } = require("../env-simple");
      expect(hasSentry).toBe(true);

      process.env.SENTRY_DSN = "";
      jest.resetModules();
      const { hasSentry: hasSentryEmpty } = require("../env-simple");
      expect(hasSentryEmpty).toBe(false);
    });
  });

  describe("logging functions", () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it("should detect verbose logging in development", () => {
      process.env.NODE_ENV = "development";
      process.env.VERBOSE_LOGGING = "true";
      const { shouldLogVerbose } = require("../env-simple");
      expect(shouldLogVerbose).toBe(true);

      process.env.NODE_ENV = "production";
      jest.resetModules();
      const {
        shouldLogVerbose: shouldLogVerboseProd,
      } = require("../env-simple");
      expect(shouldLogVerboseProd).toBe(false);
    });

    it("should detect debug mode in development", () => {
      process.env.NODE_ENV = "development";
      process.env.DEBUG = "true";
      const { shouldDebug } = require("../env-simple");
      expect(shouldDebug).toBe(true);

      process.env.DEBUG = "";
      jest.resetModules();
      const { shouldDebug: shouldDebugEmpty } = require("../env-simple");
      expect(shouldDebugEmpty).toBe(false);
    });
  });

  describe("validateProductionEnv", () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it("should not throw error in non-production environment", () => {
      process.env.NODE_ENV = "development";
      expect(() => {
        const { validateProductionEnv } = require("../env-simple");
        validateProductionEnv();
      }).not.toThrow();
    });

    it("should throw error for missing critical variables in production", () => {
      process.env.NODE_ENV = "production";
      process.env.DATABASE_URL = "";
      process.env.NEXTAUTH_SECRET = "";
      process.env.NEXTAUTH_URL = "";

      expect(() => {
        const { validateProductionEnv } = require("../env-simple");
        validateProductionEnv();
      }).toThrow(
        "Критические переменные окружения не установлены для production"
      );
    });

    it("should throw error for default secret in production", () => {
      process.env.NODE_ENV = "production";
      process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
      process.env.NEXTAUTH_SECRET = "your-secret-key-here-change-in-production";
      process.env.NEXTAUTH_URL = "https://example.com";

      expect(() => {
        const { validateProductionEnv } = require("../env-simple");
        validateProductionEnv();
      }).toThrow("NEXTAUTH_SECRET должен быть изменен для production");
    });

    it("should throw error for localhost URL in production", () => {
      process.env.NODE_ENV = "production";
      process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
      process.env.NEXTAUTH_SECRET = "secure-secret-key";
      process.env.NEXTAUTH_URL = "http://localhost:3000";

      expect(() => {
        const { validateProductionEnv } = require("../env-simple");
        validateProductionEnv();
      }).toThrow("NEXTAUTH_URL не должен содержать localhost для production");
    });

    it("should not throw error for valid production environment", () => {
      process.env.NODE_ENV = "production";
      process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
      process.env.NEXTAUTH_SECRET = "secure-secret-key";
      process.env.NEXTAUTH_URL = "https://example.com";

      expect(() => {
        const { validateProductionEnv } = require("../env-simple");
        validateProductionEnv();
      }).not.toThrow();
    });
  });
});

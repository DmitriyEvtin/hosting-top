import { initSentry, sentryTestUtils } from "../sentry-config";

// Mock Sentry
jest.mock("@sentry/nextjs", () => ({
  init: jest.fn(),
  getCurrentScope: jest.fn(() => ({
    clear: jest.fn(),
  })),
  BrowserTracing: jest.fn(),
  nextjsRouterInstrumentation: jest.fn(() => ({
    instrumentNavigation: true,
    instrumentPageLoad: true,
  })),
}));

describe("Sentry Configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Устанавливаем тестовое окружение
    process.env.NODE_ENV = "test";
    process.env.SENTRY_DSN = "https://test@sentry.io/test";
  });

  afterEach(() => {
    // Очищаем переменные окружения
    delete process.env.SENTRY_DSN;
  });

  describe("initSentry", () => {
    it("should initialize Sentry with test configuration", () => {
      const { init } = require("@sentry/nextjs");

      initSentry();

      expect(init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: "https://test@sentry.io/test",
          environment: "test",
          enabled: true,
          tracesSampleRate: 0.1,
          debug: false,
          beforeSend: expect.any(Function),
        })
      );
    });

    it("should not send events in test environment", () => {
      const { init } = require("@sentry/nextjs");

      initSentry();

      const initCall = init.mock.calls[0][0];
      const beforeSend = initCall.beforeSend;

      const result = beforeSend({ message: "test error" });
      expect(result).toBeNull();
    });

    it("should initialize with production configuration when not in test", () => {
      process.env.NODE_ENV = "production";
      process.env.SENTRY_DSN = "https://prod@sentry.io/prod";

      const { init } = require("@sentry/nextjs");

      initSentry();

      expect(init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: "https://prod@sentry.io/prod",
          environment: "production",
          enabled: true,
          tracesSampleRate: 0.1,
          debug: false,
        })
      );
    });

    it("should not initialize when SENTRY_DSN is not provided", () => {
      delete process.env.SENTRY_DSN;

      const { init } = require("@sentry/nextjs");

      initSentry();

      expect(init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: "",
          enabled: false,
        })
      );
    });
  });

  describe("sentryTestUtils", () => {
    it("should clear Sentry scope in test environment", () => {
      const { getCurrentScope } = require("@sentry/nextjs");
      const mockScope = { clear: jest.fn() };
      getCurrentScope.mockReturnValue(mockScope);

      sentryTestUtils.clearSentry();

      expect(mockScope.clear).toHaveBeenCalled();
    });

    it("should not clear Sentry scope in non-test environment", () => {
      process.env.NODE_ENV = "production";

      const { getCurrentScope } = require("@sentry/nextjs");
      const mockScope = { clear: jest.fn() };
      getCurrentScope.mockReturnValue(mockScope);

      sentryTestUtils.clearSentry();

      expect(mockScope.clear).not.toHaveBeenCalled();
    });

    it("should return null for getLastEvent in test environment", () => {
      const result = sentryTestUtils.getLastEvent();
      expect(result).toBeNull();
    });

    it("should check if Sentry is initialized", () => {
      const { getCurrentScope } = require("@sentry/nextjs");
      getCurrentScope.mockReturnValue({});

      const result = sentryTestUtils.isInitialized();
      expect(result).toBe(true);
    });

    it("should return false when Sentry is not initialized", () => {
      const { getCurrentScope } = require("@sentry/nextjs");
      getCurrentScope.mockReturnValue(undefined);

      const result = sentryTestUtils.isInitialized();
      expect(result).toBe(false);
    });
  });
});

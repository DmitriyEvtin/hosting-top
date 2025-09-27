import * as Sentry from "@sentry/nextjs";

/**
 * Конфигурация Sentry для мониторинга тестов и приложения
 */
export const initSentry = () => {
  if (process.env.NODE_ENV === "test") {
    // В тестовом окружении используем минимальную конфигурацию
    Sentry.init({
      dsn: process.env.SENTRY_DSN || "",
      environment: "test",
      enabled: !!process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      debug: false,
      beforeSend(event) {
        // В тестах не отправляем события в Sentry
        return null;
      },
    });
  } else {
    // В production/development используем полную конфигурацию
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      enabled: !!process.env.SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === "development",
      integrations: [
        new Sentry.BrowserTracing({
          // Настройка трассировки для Next.js
          routingInstrumentation: Sentry.nextjsRouterInstrumentation({
            instrumentNavigation: true,
            instrumentPageLoad: true,
          }),
        }),
      ],
    });
  }
};

/**
 * Утилиты для тестирования с Sentry
 */
export const sentryTestUtils = {
  /**
   * Очищает Sentry для тестов
   */
  clearSentry: () => {
    if (process.env.NODE_ENV === "test") {
      Sentry.getCurrentScope().clear();
    }
  },

  /**
   * Получает последние события Sentry (для тестирования)
   */
  getLastEvent: () => {
    if (process.env.NODE_ENV === "test") {
      // В тестах возвращаем mock данные
      return null;
    }
    return null;
  },

  /**
   * Проверяет, инициализирован ли Sentry
   */
  isInitialized: () => {
    return Sentry.getCurrentScope() !== undefined;
  },
};

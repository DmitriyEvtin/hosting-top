import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === "development" || process.env.SENTRY_DEBUG === "true",
  integrations: [
    new Sentry.BrowserTracing({
      // Настройка трассировки для Next.js
      routingInstrumentation: Sentry.nextjsRouterInstrumentation({
        instrumentNavigation: true,
        instrumentPageLoad: true,
      }),
    }),
  ],
  beforeSend(event) {
    // Логируем события в консоль для диагностики
    console.log("Sentry Client Event:", {
      eventId: event.event_id,
      level: event.level,
      message: event.message,
      exception: event.exception,
      timestamp: event.timestamp,
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? "настроен" : "не настроен",
    });
    
    // В development режиме показываем полную информацию
    if (process.env.NODE_ENV === "development") {
      console.log("Sentry Client Full Event:", event);
    }
    
    return event;
  },
});

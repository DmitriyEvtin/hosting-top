import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === "development",
  beforeSend(event) {
    // В development режиме логируем события в консоль
    if (process.env.NODE_ENV === "development") {
      console.log("Sentry Server Event:", event);
    }
    return event;
  },
});

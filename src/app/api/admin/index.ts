// Админские API роуты
// Все роуты в этой папке защищены middleware с проверкой прав администратора

export const ADMIN_ROUTES = {
  DATABASE_TEST: "/api/admin/database/test",
  CONFIGURATION_SIMPLE: "/api/admin/configuration/simple",
  SENTRY_DIAGNOSIS: "/api/admin/sentry-diagnosis",
  SENTRY_TEST: "/api/admin/sentry-test",
} as const;

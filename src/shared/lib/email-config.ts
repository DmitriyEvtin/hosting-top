/**
 * Безопасная проверка конфигурации email сервиса
 * Работает одинаково на сервере и клиенте
 */

export function isEmailConfigured(): boolean {
  // Проверяем только в браузере или если переменные окружения доступны
  if (typeof window !== "undefined") {
    // На клиенте проверяем через API
    return false; // Будет обновлено через useEffect
  }

  // На сервере проверяем переменные окружения
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );
}

export function getEmailConfig() {
  return {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587"),
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    from: process.env.SMTP_FROM || "noreply@localhost",
  };
}

/**
 * Обертка для проверки подключения к MySQL
 * Использует функции из scripts/migration/mysql-client
 */

/**
 * Проверяет подключение к MySQL базе данных
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function testMySQLConnection(): Promise<{
  success: boolean;
  error?: string;
  details?: string;
}> {
  try {
    // Динамический импорт для избежания проблем с путями
    const { testMySQLConnection: testConnection, createMySQLConnection } =
      await import("../../scripts/migration/mysql-client");

    // Создаем подключение (если еще не создано)
    try {
      createMySQLConnection();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      // Проверяем, является ли ошибка проблемой конфигурации
      if (
        errorMessage.includes("Missing") ||
        errorMessage.includes("incomplete")
      ) {
        return {
          success: false,
          error: errorMessage,
          details:
            "Проверьте наличие переменных окружения: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE",
        };
      }

      throw error;
    }

    // Проверяем подключение
    const isConnected = await testConnection();

    if (isConnected) {
      return { success: true };
    } else {
      return {
        success: false,
        error: "Тест подключения вернул false",
        details: "Не удалось выполнить тестовый запрос к MySQL",
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    // Определяем тип ошибки для более информативного ответа
    let details = "";

    if (
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("connection refused")
    ) {
      details =
        "Сервер MySQL недоступен. Проверьте, запущен ли сервер и правильность хоста/порта.";
    } else if (
      errorMessage.includes("ER_ACCESS_DENIED_ERROR") ||
      errorMessage.includes("access denied")
    ) {
      details =
        "Ошибка доступа. Проверьте правильность имени пользователя и пароля.";
    } else if (
      errorMessage.includes("ER_BAD_DB_ERROR") ||
      errorMessage.includes("database not found")
    ) {
      details =
        "База данных не найдена. Проверьте правильность имени базы данных.";
    } else if (
      errorMessage.includes("ETIMEDOUT") ||
      errorMessage.includes("timeout")
    ) {
      details =
        "Таймаут подключения. Проверьте сетевую связность и доступность сервера MySQL.";
    } else if (
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("getaddrinfo")
    ) {
      details =
        "Хост не найден. Проверьте правильность адреса сервера MySQL.";
    }

    return {
      success: false,
      error: errorMessage,
      details: details || "Проверьте конфигурацию и доступность сервера MySQL",
    };
  }
}


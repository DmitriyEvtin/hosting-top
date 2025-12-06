import * as mysql from "mysql2/promise";

/**
 * Интерфейс для конфигурации подключения к MySQL
 */
interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  queueLimit?: number;
  enableKeepAlive?: boolean;
  keepAliveInitialDelay?: number;
}

/**
 * Глобальная переменная для хранения connection pool
 */
const globalForMySQL = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

/**
 * Создает и возвращает connection pool для MySQL
 * Использует singleton паттерн для переиспользования соединения
 */
export function createMySQLConnection(): mysql.Pool {
  if (globalForMySQL.mysqlPool) {
    return globalForMySQL.mysqlPool;
  }

  // Чтение переменных окружения
  const host = process.env.MYSQL_HOST;
  const port = parseInt(process.env.MYSQL_PORT || "3306", 10);
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;

  // Валидация обязательных переменных
  if (!host || !user || !password || !database) {
    const missing = [];
    if (!host) missing.push("MYSQL_HOST");
    if (!user) missing.push("MYSQL_USER");
    if (!password) missing.push("MYSQL_PASSWORD");
    if (!database) missing.push("MYSQL_DATABASE");

    throw new Error(
      `MySQL connection configuration is incomplete. Missing: ${missing.join(", ")}`
    );
  }

  const config: MySQLConfig = {
    host,
    port,
    user,
    password,
    database,
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || "10", 10),
    queueLimit: parseInt(process.env.MYSQL_QUEUE_LIMIT || "0", 10),
    enableKeepAlive: process.env.MYSQL_ENABLE_KEEP_ALIVE !== "false",
    keepAliveInitialDelay: parseInt(
      process.env.MYSQL_KEEP_ALIVE_INITIAL_DELAY || "0",
      10
    ),
  };

  console.log(`[MySQL] Creating connection pool to ${host}:${port}/${database}`);

  // Создание connection pool
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: config.connectionLimit,
    queueLimit: config.queueLimit,
    enableKeepAlive: config.enableKeepAlive,
    keepAliveInitialDelay: config.keepAliveInitialDelay,
    // Настройки таймаутов
    connectTimeout: 10000, // 10 секунд
    // Поддержка множественных запросов
    multipleStatements: false,
  });

  // Обработчик ошибок подключения
  pool.on("connection", (connection) => {
    console.log(`[MySQL] New connection established (ID: ${connection.threadId})`);
    
    // Обработка ошибок на уровне соединения
    connection.on("error", (err: NodeJS.ErrnoException) => {
      console.error("[MySQL] Connection error:", err);
      if (err.code === "PROTOCOL_CONNECTION_LOST") {
        console.warn("[MySQL] Connection lost, pool will attempt to reconnect");
      } else if (err.code === "ECONNREFUSED") {
        console.error("[MySQL] Connection refused. Check if MySQL server is running.");
      } else {
        console.error("[MySQL] Unexpected connection error:", err.message || String(err));
      }
    });
  });

  // Сохранение pool в глобальной переменной для переиспользования
  globalForMySQL.mysqlPool = pool;

  return pool;
}

/**
 * Получает существующий connection pool или создает новый
 */
export function getMySQLPool(): mysql.Pool {
  if (!globalForMySQL.mysqlPool) {
    return createMySQLConnection();
  }
  return globalForMySQL.mysqlPool;
}

/**
 * Выполняет SQL запрос и возвращает типизированный результат
 * @param sql - SQL запрос (может содержать плейсхолдеры ?)
 * @param params - Параметры для плейсхолдеров
 * @returns Promise с массивом результатов
 */
export async function queryMySQL<T = unknown>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const pool = getMySQLPool();
  const startTime = Date.now();

  try {
    console.log(`[MySQL] Executing query: ${sql.substring(0, 100)}${sql.length > 100 ? "..." : ""}`);
    if (params && params.length > 0) {
      console.log(`[MySQL] Query params:`, params);
    }

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params || []);

    const duration = Date.now() - startTime;
    console.log(`[MySQL] Query completed in ${duration}ms, returned ${Array.isArray(rows) ? rows.length : 0} rows`);

    return rows as T[];
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[MySQL] Query failed after ${duration}ms:`, error);

    if (error instanceof Error) {
      // Улучшенная обработка ошибок MySQL
      if (error.message.includes("ECONNREFUSED")) {
        throw new Error("MySQL connection refused. Check if server is running.");
      } else if (error.message.includes("ER_ACCESS_DENIED_ERROR")) {
        throw new Error("MySQL access denied. Check credentials.");
      } else if (error.message.includes("ER_BAD_DB_ERROR")) {
        throw new Error(`MySQL database not found: ${process.env.MYSQL_DATABASE}`);
      } else if (error.message.includes("ETIMEDOUT")) {
        throw new Error("MySQL connection timeout. Check network connectivity.");
      }
    }

    throw error;
  }
}

/**
 * Закрывает все соединения в pool (graceful shutdown)
 * Должна вызываться при завершении работы приложения
 */
export async function closeMySQLConnection(): Promise<void> {
  if (globalForMySQL.mysqlPool) {
    console.log("[MySQL] Closing connection pool...");
    try {
      await globalForMySQL.mysqlPool.end();
      console.log("[MySQL] Connection pool closed successfully");
    } catch (error) {
      console.error("[MySQL] Error closing connection pool:", error);
      throw error;
    } finally {
      globalForMySQL.mysqlPool = undefined;
    }
  } else {
    console.log("[MySQL] No connection pool to close");
  }
}

/**
 * Проверяет подключение к MySQL базе данных
 * @returns Promise<boolean> - true если подключение успешно
 */
export async function testMySQLConnection(): Promise<boolean> {
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.execute<mysql.RowDataPacket[]>("SELECT 1 as test");
    const result = rows[0]?.test === 1;
    console.log(`[MySQL] Connection test: ${result ? "SUCCESS" : "FAILED"}`);
    return result;
  } catch (error) {
    console.error("[MySQL] Connection test failed:", error);
    return false;
  }
}


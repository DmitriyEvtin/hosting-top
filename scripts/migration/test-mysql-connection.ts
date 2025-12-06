#!/usr/bin/env tsx

/**
 * Тестовый скрипт для проверки подключения к MySQL базе данных
 * 
 * Использование:
 *   npm run migration:test-mysql
 * 
 * Требует наличия файла .env.migration с переменными:
 *   MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
 */

import { config } from "dotenv";
import { resolve } from "path";
import {
  createMySQLConnection,
  testMySQLConnection,
  queryMySQL,
  closeMySQLConnection,
} from "./mysql-client.js";

// Загрузка переменных окружения из .env.migration
const envPath = resolve(process.cwd(), ".env.migration");
config({ path: envPath });

async function main() {
  console.log("=".repeat(60));
  console.log("MySQL Connection Test");
  console.log("=".repeat(60));
  console.log(`Loading environment from: ${envPath}`);
  console.log("");

  try {
    // Проверка переменных окружения
    const requiredVars = [
      "MYSQL_HOST",
      "MYSQL_PORT",
      "MYSQL_USER",
      "MYSQL_PASSWORD",
      "MYSQL_DATABASE",
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error("❌ Missing required environment variables:");
      missingVars.forEach((varName) => console.error(`   - ${varName}`));
      console.error("");
      console.error(
        `Please create .env.migration file based on .env.migration.example`
      );
      process.exit(1);
    }

    console.log("✓ Environment variables loaded");
    console.log(`  Host: ${process.env.MYSQL_HOST}`);
    console.log(`  Port: ${process.env.MYSQL_PORT}`);
    console.log(`  User: ${process.env.MYSQL_USER}`);
    console.log(`  Database: ${process.env.MYSQL_DATABASE}`);
    console.log("");

    // Создание подключения
    console.log("Creating MySQL connection pool...");
    const pool = createMySQLConnection();
    console.log("✓ Connection pool created");
    console.log("");

    // Тест подключения
    console.log("Testing connection...");
    const connectionTest = await testMySQLConnection();
    if (!connectionTest) {
      throw new Error("Connection test failed");
    }
    console.log("✓ Connection test passed");
    console.log("");

    // Тестовый запрос
    console.log("Executing test query (SELECT NOW())...");
    const result = await queryMySQL<{ now: Date }>("SELECT NOW() as now");
    console.log("✓ Query executed successfully");
    console.log(`  Result: ${result[0]?.now}`);
    console.log("");

    // Получение информации о версии MySQL
    console.log("Getting MySQL version...");
    const versionResult = await queryMySQL<{ version: string }>(
      "SELECT VERSION() as version"
    );
    console.log(`✓ MySQL version: ${versionResult[0]?.version}`);
    console.log("");

    // Получение списка таблиц
    console.log("Getting list of tables...");
    const tables = await queryMySQL<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
      [process.env.MYSQL_DATABASE]
    );
    console.log(`✓ Found ${tables.length} tables in database`);
    if (tables.length > 0) {
      console.log("  First 10 tables:");
      tables.slice(0, 10).forEach((table) => {
        console.log(`    - ${table.table_name}`);
      });
      if (tables.length > 10) {
        console.log(`    ... and ${tables.length - 10} more`);
      }
    }
    console.log("");

    console.log("=".repeat(60));
    console.log("✅ All tests passed successfully!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("");
    console.error("=".repeat(60));
    console.error("❌ Test failed with error:");
    console.error("=".repeat(60));
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      if (error.stack) {
        console.error("\nStack trace:");
        console.error(error.stack);
      }
    } else {
      console.error("Unknown error:", error);
    }
    console.error("");
    process.exit(1);
  } finally {
    // Graceful shutdown
    console.log("Closing connection...");
    await closeMySQLConnection();
    console.log("✓ Connection closed");
  }
}

// Обработка сигналов для graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT, closing connections...");
  await closeMySQLConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM, closing connections...");
  await closeMySQLConnection();
  process.exit(0);
});

// Запуск скрипта
main().catch(async (error) => {
  console.error("Unhandled error:", error);
  await closeMySQLConnection();
  process.exit(1);
});


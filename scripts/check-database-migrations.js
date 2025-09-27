#!/usr/bin/env node

/**
 * Скрипт для проверки и применения миграций базы данных в production
 * Помогает диагностировать и исправлять проблемы с миграциями
 */

const { execSync } = require("child_process");
const path = require("path");

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: "utf8",
      stdio: "pipe",
      ...options,
    });
    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || "",
      stderr: error.stderr || "",
    };
  }
}

function checkDatabaseConnection() {
  console.log("🔍 Проверка подключения к базе данных...");

  const result = runCommand("npx prisma db execute --stdin", {
    input: "SELECT 1 as test;",
  });

  if (result.success) {
    console.log("✅ Подключение к базе данных успешно");
    return true;
  } else {
    console.log("❌ Ошибка подключения к базе данных:");
    console.log(result.error);
    return false;
  }
}

function checkMigrationStatus() {
  console.log("\n📊 Проверка статуса миграций...");

  const result = runCommand("npx prisma migrate status");

  if (result.success) {
    console.log("✅ Статус миграций:");
    console.log(result.output);
    return true;
  } else {
    console.log("❌ Ошибка при проверке статуса миграций:");
    console.log(result.error);
    return false;
  }
}

function checkTablesExist() {
  console.log("\n🗃️  Проверка существования таблиц...");

  const tables = ["users", "categories", "products", "parsing_sessions"];
  const missingTables = [];

  for (const table of tables) {
    const result = runCommand(`npx prisma db execute --stdin`, {
      input: `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}');`,
    });

    if (result.success) {
      const exists =
        result.output.includes("t") || result.output.includes("true");
      if (exists) {
        console.log(`✅ Таблица ${table} существует`);
      } else {
        console.log(`❌ Таблица ${table} НЕ существует`);
        missingTables.push(table);
      }
    } else {
      console.log(`❌ Ошибка при проверке таблицы ${table}:`);
      console.log(result.error);
      missingTables.push(table);
    }
  }

  return missingTables;
}

function applyMigrations() {
  console.log("\n🚀 Применение миграций...");

  const result = runCommand("npx prisma migrate deploy");

  if (result.success) {
    console.log("✅ Миграции успешно применены:");
    console.log(result.output);
    return true;
  } else {
    console.log("❌ Ошибка при применении миграций:");
    console.log(result.error);
    console.log("STDOUT:", result.output);
    console.log("STDERR:", result.stderr);
    return false;
  }
}

function generatePrismaClient() {
  console.log("\n🔧 Генерация Prisma клиента...");

  const result = runCommand("npx prisma generate");

  if (result.success) {
    console.log("✅ Prisma клиент успешно сгенерирован");
    return true;
  } else {
    console.log("❌ Ошибка при генерации Prisma клиента:");
    console.log(result.error);
    return false;
  }
}

function checkDatabaseHealth() {
  console.log("\n🏥 Проверка здоровья базы данных...");

  const result = runCommand("npx prisma db execute --stdin", {
    input: `
      SELECT 
        'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 
        'categories' as table_name, COUNT(*) as count FROM categories
      UNION ALL
      SELECT 
        'products' as table_name, COUNT(*) as count FROM products
      UNION ALL
      SELECT 
        'parsing_sessions' as table_name, COUNT(*) as count FROM parsing_sessions;
    `,
  });

  if (result.success) {
    console.log("✅ Статистика таблиц:");
    console.log(result.output);
    return true;
  } else {
    console.log("❌ Ошибка при проверке статистики:");
    console.log(result.error);
    return false;
  }
}

function main() {
  console.log("🔧 Проверка и исправление миграций базы данных\n");

  // Проверка подключения
  if (!checkDatabaseConnection()) {
    console.log("\n❌ Не удалось подключиться к базе данных");
    console.log("💡 Решение:");
    console.log("1. Проверьте переменную DATABASE_URL");
    console.log("2. Убедитесь, что база данных запущена");
    console.log("3. Проверьте права доступа к базе данных");
    process.exit(1);
  }

  // Проверка статуса миграций
  if (!checkMigrationStatus()) {
    console.log("\n⚠️  Не удалось проверить статус миграций");
  }

  // Проверка существования таблиц
  const missingTables = checkTablesExist();

  if (missingTables.length > 0) {
    console.log(`\n❌ Отсутствуют таблицы: ${missingTables.join(", ")}`);
    console.log("\n🔧 Попытка исправления...");

    // Генерация Prisma клиента
    if (!generatePrismaClient()) {
      console.log("\n❌ Не удалось сгенерировать Prisma клиент");
      process.exit(1);
    }

    // Применение миграций
    if (!applyMigrations()) {
      console.log("\n❌ Не удалось применить миграции");
      console.log("\n💡 Ручное решение:");
      console.log("1. Запустите: make db-migrate");
      console.log(
        "2. Или: docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy"
      );
      process.exit(1);
    }

    // Повторная проверка таблиц
    console.log("\n🔄 Повторная проверка таблиц...");
    const stillMissing = checkTablesExist();

    if (stillMissing.length > 0) {
      console.log(
        `\n❌ Все еще отсутствуют таблицы: ${stillMissing.join(", ")}`
      );
      console.log("\n💡 Возможные решения:");
      console.log("1. Проверьте права доступа к базе данных");
      console.log("2. Убедитесь, что миграции корректны");
      console.log("3. Попробуйте сбросить и пересоздать базу данных");
      process.exit(1);
    }
  }

  // Финальная проверка здоровья
  if (checkDatabaseHealth()) {
    console.log("\n✅ База данных в порядке");
    console.log("🚀 Приложение готово к работе");
  } else {
    console.log("\n⚠️  Не удалось проверить статистику таблиц");
  }
}

// Запуск проверки
if (require.main === module) {
  main();
}

module.exports = {
  checkDatabaseConnection,
  checkMigrationStatus,
  checkTablesExist,
  applyMigrations,
  generatePrismaClient,
  checkDatabaseHealth,
};

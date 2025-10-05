#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🚀 Настройка среды разработки...");

// Функция для выполнения команд
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✅ ${description} завершено`);
  } catch (error) {
    console.error(`❌ Ошибка при ${description.toLowerCase()}:`, error.message);
    process.exit(1);
  }
}

// Функция для проверки существования файла
function fileExists(filePath) {
  return fs.existsSync(path.resolve(filePath));
}

async function main() {
  try {
    // 1. Ждем пока база данных будет готова
    console.log("⏳ Ждем готовности базы данных...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. Генерируем Prisma клиент
    console.log("🔧 Генерируем Prisma клиент...");
    runCommand("npm run db:generate", "Генерация Prisma клиента");

    // 3. Выполняем миграции
    console.log("📊 Выполняем миграции...");
    runCommand("npm run db:migrate", "Выполнение миграций");

    // 4. Заполняем базу тестовыми данными
    console.log("🌱 Заполняем базу тестовыми данными...");
    runCommand(
      "npx tsx prisma/seed-dev.ts",
      "Заполнение базы тестовыми данными"
    );

    console.log("🎉 Среда разработки готова!");
    console.log("");
    console.log("📋 Доступные сервисы:");
    console.log("   🐘 PostgreSQL: localhost:5432");
    console.log("   🔴 Redis: localhost:6379");
    console.log("   📊 Adminer: http://localhost:8080");
    console.log("   📧 MailHog: http://localhost:8025");
    console.log("   🗄️  MinIO: http://localhost:9001");
    console.log("");
    console.log("🔑 Учетные данные:");
    console.log("   👤 Администратор: admin@dev.ru / 111111");
    console.log(
      "   👥 Пользователи: user@dev.ru, moderator@dev.ru, test@dev.ru / 111111"
    );
    console.log("");
    console.log("💡 Для запуска приложения выполните: npm run dev");
  } catch (error) {
    console.error("❌ Ошибка при настройке среды разработки:", error.message);
    process.exit(1);
  }
}

main();

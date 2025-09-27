#!/usr/bin/env node

/**
 * Скрипт для проверки конфигурации Sentry
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Проверка конфигурации Sentry...\n");

// Проверяем наличие файлов конфигурации
const configFiles = [
  "sentry.client.config.ts",
  "sentry.server.config.ts",
  "next.config.ts",
];

console.log("📁 Проверка файлов конфигурации:");
configFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? "✅" : "❌"} ${file}`);
});

// Проверяем переменные окружения
console.log("\n🔧 Проверка переменных окружения:");

const requiredEnvVars = ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN"];

const optionalEnvVars = ["SENTRY_ORG", "SENTRY_PROJECT"];

// Загружаем переменные из .env.local если существует
const envFile = ".env.local";
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, "utf8");
  const envVars = {};

  envContent.split("\n").forEach(line => {
    const [key, value] = line.split("=");
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/"/g, "");
    }
  });

  // Проверяем обязательные переменные
  requiredEnvVars.forEach(varName => {
    const value = envVars[varName];
    if (value && value !== "") {
      console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`  ❌ ${varName}: не установлена`);
    }
  });

  // Проверяем опциональные переменные
  optionalEnvVars.forEach(varName => {
    const value = envVars[varName];
    if (value && value !== "") {
      console.log(`  ✅ ${varName}: ${value}`);
    } else {
      console.log(`  ⚠️  ${varName}: не установлена (опционально)`);
    }
  });
} else {
  console.log("  ⚠️  Файл .env.local не найден");
  console.log("  💡 Создайте .env.local на основе .env.example");
}

// Проверяем формат DSN
console.log("\n🔗 Проверка формата DSN:");
if (process.env.SENTRY_DSN) {
  const dsn = process.env.SENTRY_DSN;
  if (
    dsn.startsWith("https://") &&
    dsn.includes("@") &&
    dsn.includes("ingest.sentry.io")
  ) {
    console.log("  ✅ SENTRY_DSN имеет правильный формат");
  } else {
    console.log("  ❌ SENTRY_DSN имеет неправильный формат");
    console.log(
      "  💡 Правильный формат: https://key@org.ingest.sentry.io/project"
    );
  }
} else {
  console.log("  ⚠️  SENTRY_DSN не установлена");
}

// Проверяем API endpoint
console.log("\n🧪 Проверка тестового API:");
const apiFile = "src/app/api/sentry-test/route.ts";
if (fs.existsSync(apiFile)) {
  console.log("  ✅ Тестовый API endpoint создан");
  console.log("  💡 Тест: GET http://localhost:3000/api/sentry-test");
} else {
  console.log("  ❌ Тестовый API endpoint не найден");
}

console.log("\n📋 Следующие шаги:");
console.log("1. Установите правильные переменные окружения в .env.local");
console.log("2. Получите DSN из вашего проекта Sentry");
console.log("3. Запустите приложение: npm run dev");
console.log("4. Протестируйте: http://localhost:3000/api/sentry-test");
console.log("5. Проверьте события в Sentry Dashboard");

console.log("\n✨ Проверка завершена!");

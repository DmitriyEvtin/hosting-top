#!/usr/bin/env node

/**
 * Скрипт для проверки конфигурации Sentry
 */

import fs from "fs";

console.warn("🔍 Проверка конфигурации Sentry...\n");

// Проверяем наличие файлов конфигурации
const configFiles = [
  "sentry.client.config.ts",
  "sentry.server.config.ts",
  "next.config.ts",
];

console.warn("📁 Проверка файлов конфигурации:");
configFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.warn(`  ${exists ? "✅" : "❌"} ${file}`);
});

// Проверяем переменные окружения
console.warn("\n🔧 Проверка переменных окружения:");

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
      console.warn(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.warn(`  ❌ ${varName}: не установлена`);
    }
  });

  // Проверяем опциональные переменные
  optionalEnvVars.forEach(varName => {
    const value = envVars[varName];
    if (value && value !== "") {
      console.warn(`  ✅ ${varName}: ${value}`);
    } else {
      console.warn(`  ⚠️  ${varName}: не установлена (опционально)`);
    }
  });
} else {
  console.warn("  ⚠️  Файл .env.local не найден");
  console.warn("  💡 Создайте .env.local на основе .env.example");
}

// Проверяем формат DSN
console.warn("\n🔗 Проверка формата DSN:");
if (process.env.SENTRY_DSN) {
  const dsn = process.env.SENTRY_DSN;
  if (
    dsn.startsWith("https://") &&
    dsn.includes("@") &&
    dsn.includes("ingest.sentry.io")
  ) {
    console.warn("  ✅ SENTRY_DSN имеет правильный формат");
  } else {
    console.warn("  ❌ SENTRY_DSN имеет неправильный формат");
    console.warn(
      "  💡 Правильный формат: https://key@org.ingest.sentry.io/project"
    );
  }
} else {
  console.warn("  ⚠️  SENTRY_DSN не установлена");
}

// Проверяем API endpoint
console.warn("\n🧪 Проверка тестового API:");
const apiFile = "src/app/api/sentry-test/route.ts";
if (fs.existsSync(apiFile)) {
  console.warn("  ✅ Тестовый API endpoint создан");
  console.warn("  💡 Тест: GET http://localhost:3000/api/sentry-test");
} else {
  console.warn("  ❌ Тестовый API endpoint не найден");
}

console.warn("\n📋 Следующие шаги:");
console.warn("1. Установите правильные переменные окружения в .env.local");
console.warn("2. Получите DSN из вашего проекта Sentry");
console.warn("3. Запустите приложение: npm run dev");
console.warn("4. Протестируйте: http://localhost:3000/api/sentry-test");
console.warn("5. Проверьте события в Sentry Dashboard");

console.warn("\n✨ Проверка завершена!");

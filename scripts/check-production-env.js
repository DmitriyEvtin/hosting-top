#!/usr/bin/env node

/**
 * Скрипт для проверки переменных окружения в production
 * Помогает диагностировать проблемы с конфигурацией
 */

const requiredVars = [
  "NODE_ENV",
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
];

const securityChecks = [
  {
    name: "NEXTAUTH_SECRET",
    check: value => value !== "your-secret-key-here-change-in-production",
    message: "NEXTAUTH_SECRET должен быть изменен для production",
  },
  {
    name: "NEXTAUTH_URL",
    check: value => !value.includes("localhost"),
    message: "NEXTAUTH_URL не должен содержать localhost для production",
  },
];

function checkProductionEnv() {
  console.log("🔍 Проверка переменных окружения для production...\n");

  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    console.log(
      "⚠️  NODE_ENV не установлен в production. Пропускаем проверки."
    );
    return;
  }

  console.log("✅ NODE_ENV = production\n");

  // Проверка обязательных переменных
  console.log("📋 Проверка обязательных переменных:");
  const missingVars = [];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
      console.log(`❌ ${varName}: НЕ УСТАНОВЛЕНА`);
    } else {
      // Скрываем чувствительные данные
      const displayValue =
        varName.includes("SECRET") || varName.includes("PASSWORD")
          ? "***скрыто***"
          : value;
      console.log(`✅ ${varName}: ${displayValue}`);
    }
  });

  if (missingVars.length > 0) {
    console.log(
      `\n❌ Ошибка: Отсутствуют обязательные переменные: ${missingVars.join(", ")}`
    );
    console.log("\n💡 Решение:");
    console.log("1. Установите переменные в вашем production окружении");
    console.log("2. Для Docker Compose добавьте в .env файл");
    console.log("3. Для GitHub Actions добавьте в Secrets");
    process.exit(1);
  }

  console.log("\n✅ Все обязательные переменные установлены\n");

  // Проверка безопасности
  console.log("🔒 Проверка безопасности:");
  let hasErrors = false;

  securityChecks.forEach(check => {
    const value = process.env[check.name];
    if (value && !check.check(value)) {
      console.log(`❌ ${check.name}: ${check.message}`);
      console.log(`   Текущее значение: ${value}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${check.name}: OK`);
    }
  });

  if (hasErrors) {
    console.log("\n❌ Обнаружены проблемы безопасности");
    console.log("\n💡 Решение:");
    console.log("1. Измените NEXTAUTH_SECRET на уникальное значение");
    console.log(
      "2. Установите NEXTAUTH_URL на ваш production домен (например, https://your-domain.com)"
    );
    process.exit(1);
  }

  console.log("\n✅ Все проверки пройдены успешно!");
  console.log("🚀 Приложение готово к запуску в production");
}

// Запуск проверки
if (require.main === module) {
  checkProductionEnv();
}

module.exports = { checkProductionEnv };

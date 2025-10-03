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
  console.warn("🔍 Проверка переменных окружения для production...\n");

  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    console.warn(
      "⚠️  NODE_ENV не установлен в production. Пропускаем проверки."
    );
    return;
  }

  console.warn("✅ NODE_ENV = production\n");

  // Проверка обязательных переменных
  console.warn("📋 Проверка обязательных переменных:");
  const missingVars = [];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
      console.warn(`❌ ${varName}: НЕ УСТАНОВЛЕНА`);
    } else {
      // Скрываем чувствительные данные
      const displayValue =
        varName.includes("SECRET") || varName.includes("PASSWORD")
          ? "***скрыто***"
          : value;
      console.warn(`✅ ${varName}: ${displayValue}`);
    }
  });

  if (missingVars.length > 0) {
    console.warn(
      `\n❌ Ошибка: Отсутствуют обязательные переменные: ${missingVars.join(", ")}`
    );
    console.warn("\n💡 Решение:");
    console.warn("1. Установите переменные в вашем production окружении");
    console.warn("2. Для Docker Compose добавьте в .env файл");
    console.warn("3. Для GitHub Actions добавьте в Secrets");
    process.exit(1);
  }

  console.warn("\n✅ Все обязательные переменные установлены\n");

  // Проверка безопасности
  console.warn("🔒 Проверка безопасности:");
  let hasErrors = false;

  securityChecks.forEach(check => {
    const value = process.env[check.name];
    if (value && !check.check(value)) {
      console.warn(`❌ ${check.name}: ${check.message}`);
      console.warn(`   Текущее значение: ${value}`);
      hasErrors = true;
    } else {
      console.warn(`✅ ${check.name}: OK`);
    }
  });

  if (hasErrors) {
    console.warn("\n❌ Обнаружены проблемы безопасности");
    console.warn("\n💡 Решение:");
    console.warn("1. Измените NEXTAUTH_SECRET на уникальное значение");
    console.warn(
      "2. Установите NEXTAUTH_URL на ваш production домен (например, https://your-domain.com)"
    );
    process.exit(1);
  }

  console.warn("\n✅ Все проверки пройдены успешно!");
  console.warn("🚀 Приложение готово к запуску в production");
}

// Запуск проверки
if (import.meta.url === `file://${process.argv[1]}`) {
  checkProductionEnv();
}

export { checkProductionEnv };

#!/usr/bin/env node

/**
 * Скрипт для проверки конфигурации проекта
 * Проверяет переменные окружения, подключения к сервисам и готовность к деплою
 */

import { execSync } from "child_process";
import fs from "fs";

// Цвета для консоли
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.warn(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      log(`✓ ${description}`, "green");
      return true;
    } else {
      log(`✗ ${description} - файл не найден`, "red");
      return false;
    }
  } catch {
    log(`✗ ${description} - ошибка`, "red");
    return false;
  }
}

function checkEnvironment() {
  log("\n🔍 Проверка переменных окружения...", "cyan");

  const requiredEnvVars = [
    "NODE_ENV",
    "DATABASE_URL",
    "REDIS_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
  ];

  const optionalEnvVars = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET",
    "SENTRY_DSN",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
  ];

  let allRequired = true;
  let allOptional = true;

  // Проверка обязательных переменных
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      log(`✓ ${envVar}`, "green");
    } else {
      log(`✗ ${envVar} - не установлена`, "red");
      allRequired = false;
    }
  });

  // Проверка опциональных переменных
  optionalEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      log(`✓ ${envVar}`, "green");
    } else {
      log(`⚠ ${envVar} - не установлена (опционально)`, "yellow");
      allOptional = false;
    }
  });

  return { allRequired, allOptional };
}

function checkDocker() {
  log("\n🐳 Проверка Docker...", "cyan");

  try {
    execSync("docker --version", { stdio: "pipe" });
    log("✓ Docker установлен", "green");

    execSync("docker compose version", { stdio: "pipe" });
    log("✓ Docker Compose установлен", "green");

    return true;
  } catch {
    log("✗ Docker не установлен или не работает", "red");
    return false;
  }
}

function checkDatabase() {
  log("\n🗄️ Проверка подключения к базе данных...", "cyan");

  try {
    // Проверяем, что DATABASE_URL установлен
    if (!process.env.DATABASE_URL) {
      log("✗ DATABASE_URL не установлен", "red");
      return false;
    }

    // Пытаемся подключиться к базе данных
    execSync("npx prisma db pull --schema=./prisma/schema.prisma", {
      stdio: "pipe",
      timeout: 10000,
    });

    log("✓ Подключение к базе данных успешно", "green");
    return true;
  } catch {
    log(`✗ Ошибка подключения к базе данных`, "red");
    return false;
  }
}

function checkBuild() {
  log("\n🔨 Проверка сборки приложения...", "cyan");

  try {
    execSync("npm run build", { stdio: "pipe" });
    log("✓ Сборка приложения успешна", "green");
    return true;
  } catch {
    log(`✗ Ошибка сборки`, "red");
    return false;
  }
}

function checkTests() {
  log("\n🧪 Проверка тестов...", "cyan");

  try {
    execSync("npm run test:unit", { stdio: "pipe" });
    log("✓ Unit тесты прошли успешно", "green");

    execSync("npm run test:integration", { stdio: "pipe" });
    log("✓ Integration тесты прошли успешно", "green");

    return true;
  } catch {
    log(`✗ Ошибка в тестах`, "red");
    return false;
  }
}

function checkDockerCompose() {
  log("\n🐳 Проверка Docker Compose конфигурации...", "cyan");

  const composeFiles = ["docker-compose.yml", "docker-compose.prod.yml"];

  let allFilesExist = true;

  composeFiles.forEach(file => {
    if (checkFile(file, `Docker Compose файл: ${file}`)) {
      // Проверяем синтаксис
      try {
        execSync(`docker compose -f ${file} config`, { stdio: "pipe" });
        log(`✓ ${file} - синтаксис корректен`, "green");
      } catch {
        log(`✗ ${file} - ошибка синтаксиса`, "red");
        allFilesExist = false;
      }
    } else {
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

function checkGitHubWorkflows() {
  log("\n🚀 Проверка GitHub Actions workflows...", "cyan");

  const workflowFiles = [
    ".github/workflows/code-quality.yml",
    ".github/workflows/docker-build.yml",
    ".github/workflows/deploy.yml",
    ".github/workflows/monitoring.yml",
    ".github/workflows/test.yml",
    ".github/workflows/fsd-check.yml",
  ];

  let allWorkflowsExist = true;

  workflowFiles.forEach(file => {
    if (!checkFile(file, `GitHub workflow: ${file}`)) {
      allWorkflowsExist = false;
    }
  });

  return allWorkflowsExist;
}

function checkProjectStructure() {
  log("\n📁 Проверка структуры проекта...", "cyan");

  const requiredFiles = [
    "package.json",
    "next.config.ts",
    "tsconfig.json",
    "tailwind.config.ts",
    "prisma/schema.prisma",
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/shared/lib/env.ts",
    "src/shared/api/database/client.ts",
  ];

  let allFilesExist = true;

  requiredFiles.forEach(file => {
    if (!checkFile(file, `Файл: ${file}`)) {
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

function generateReport(results) {
  log("\n📊 Отчет о проверке конфигурации:", "bright");
  log("=" * 50, "blue");

  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const failedChecks = totalChecks - passedChecks;

  log(`Всего проверок: ${totalChecks}`, "blue");
  log(`Успешно: ${passedChecks}`, "green");
  log(`Ошибок: ${failedChecks}`, failedChecks > 0 ? "red" : "green");

  if (failedChecks > 0) {
    log("\n❌ Обнаружены проблемы:", "red");
    Object.entries(results).forEach(([check, passed]) => {
      if (!passed) {
        log(`  - ${check}`, "red");
      }
    });
  } else {
    log("\n✅ Все проверки пройдены успешно!", "green");
  }

  log("\n📝 Рекомендации:", "yellow");

  if (!results.environment) {
    log("  - Настройте переменные окружения в .env.local", "yellow");
  }

  if (!results.docker) {
    log("  - Установите Docker и Docker Compose", "yellow");
  }

  if (!results.database) {
    log("  - Запустите базу данных: make dev", "yellow");
  }

  if (!results.build) {
    log("  - Исправьте ошибки сборки", "yellow");
  }

  if (!results.tests) {
    log("  - Исправьте ошибки в тестах", "yellow");
  }
}

// Основная функция
async function main() {
  log('🚀 Проверка конфигурации проекта "Паркет Retail"', "bright");
  log("=" * 60, "blue");

  const results = {
    "Структура проекта": checkProjectStructure(),
    "GitHub Workflows": checkGitHubWorkflows(),
    "Docker Compose": checkDockerCompose(),
    Docker: checkDocker(),
    "Переменные окружения": checkEnvironment().allRequired,
    "База данных": checkDatabase(),
    Сборка: checkBuild(),
    Тесты: checkTests(),
  };

  generateReport(results);

  // Выход с кодом ошибки, если есть проблемы
  const hasErrors = Object.values(results).some(result => !result);
  process.exit(hasErrors ? 1 : 0);
}

// Запуск скрипта
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`❌ Критическая ошибка: ${error.message}`, "red");
    process.exit(1);
  });
}

export { main };

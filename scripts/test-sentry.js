#!/usr/bin/env node

/**
 * Скрипт для тестирования Sentry с выводом логов
 */

import fs from "fs";
import http from "http";
import path from "path";

// Загружаем переменные окружения из .env файла
function loadEnvFile() {
  const envFiles = [".env.local", ".env", ".env.sentry"];

  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.warn(`📁 Загружаем переменные из ${envFile}...`);
      const envContent = fs.readFileSync(envPath, "utf8");
      const envLines = envContent.split("\n");

      envLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith("#")) {
          const [key, ...valueParts] = trimmedLine.split("=");
          if (key && valueParts.length > 0) {
            const value = valueParts.join("=").replace(/^["']|["']$/g, "");
            process.env[key] = value;
          }
        }
      });
      break;
    }
  }
}

// Загружаем переменные окружения
loadEnvFile();

console.warn("🧪 Тестирование Sentry...");
console.warn(
  `SENTRY_DSN: ${process.env.SENTRY_DSN ? "настроен" : "не настроен"}`
);
console.warn(
  `NEXT_PUBLIC_SENTRY_DSN: ${process.env.NEXT_PUBLIC_SENTRY_DSN ? "настроен" : "не настроен"}`
);
console.warn(`NODE_ENV: ${process.env.NODE_ENV}`);

// Тестируем API endpoints
const baseUrl = "http://localhost:3000";

async function testEndpoint(endpoint, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Sentry-Test-Script/1.0",
      },
    };

    const req = http.request(options, res => {
      let responseData = "";

      res.on("data", chunk => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers,
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers,
            error: error.message,
          });
        }
      });
    });

    req.on("error", error => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.warn("\n🔍 1. Проверка диагностики Sentry...");
  try {
    const diagnosis = await testEndpoint("/api/sentry-diagnosis");
    console.warn(`Статус: ${diagnosis.status}`);
    console.warn(
      `Sentry инициализирован: ${diagnosis.data.config?.sentry?.isInitialized}`
    );
    console.warn(
      `DSN настроен: ${diagnosis.data.config?.environment?.SENTRY_DSN}`
    );
    console.warn(`Тестовое событие: ${diagnosis.data.testEvent}`);
  } catch (error) {
    console.error("❌ Ошибка диагностики:", error.message);
  }

  console.warn("\n🚨 2. Тестирование отправки ошибки...");
  try {
    const errorTest = await testEndpoint("/api/sentry-test");
    console.warn(`Статус: ${errorTest.status}`);
    console.warn(
      `Результат: ${errorTest.data.error || errorTest.data.message}`
    );
  } catch (error) {
    console.error("❌ Ошибка тестирования:", error.message);
  }

  console.warn("\n📝 3. Тестирование отправки сообщения...");
  try {
    const messageTest = await testEndpoint("/api/sentry-diagnosis", "POST", {
      message: "Тестовое сообщение из скрипта",
    });
    console.warn(`Статус: ${messageTest.status}`);
    console.warn(`Результат: ${messageTest.data.message}`);
  } catch (error) {
    console.error("❌ Ошибка тестирования:", error.message);
  }

  console.warn("\n✅ Тестирование завершено!");
  console.warn("\n📋 Рекомендации:");
  console.warn("1. Проверьте логи приложения на наличие сообщений Sentry");
  console.warn("2. Проверьте Sentry сервер на наличие новых событий");
  console.warn("3. Убедитесь, что DSN правильно настроен в production");
}

// Запускаем тесты
runTests().catch(console.error);

#!/usr/bin/env node

/**
 * Скрипт для тестирования Sentry с выводом логов
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// Загружаем переменные окружения из .env файла
function loadEnvFile() {
  const envFiles = [".env.local", ".env", ".env.sentry"];

  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`📁 Загружаем переменные из ${envFile}...`);
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

console.log("🧪 Тестирование Sentry...");
console.log(
  `SENTRY_DSN: ${process.env.SENTRY_DSN ? "настроен" : "не настроен"}`
);
console.log(
  `NEXT_PUBLIC_SENTRY_DSN: ${process.env.NEXT_PUBLIC_SENTRY_DSN ? "настроен" : "не настроен"}`
);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

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
  console.log("\n🔍 1. Проверка диагностики Sentry...");
  try {
    const diagnosis = await testEndpoint("/api/sentry-diagnosis");
    console.log(`Статус: ${diagnosis.status}`);
    console.log(
      `Sentry инициализирован: ${diagnosis.data.config?.sentry?.isInitialized}`
    );
    console.log(
      `DSN настроен: ${diagnosis.data.config?.environment?.SENTRY_DSN}`
    );
    console.log(`Тестовое событие: ${diagnosis.data.testEvent}`);
  } catch (error) {
    console.error("❌ Ошибка диагностики:", error.message);
  }

  console.log("\n🚨 2. Тестирование отправки ошибки...");
  try {
    const errorTest = await testEndpoint("/api/sentry-test");
    console.log(`Статус: ${errorTest.status}`);
    console.log(`Результат: ${errorTest.data.error || errorTest.data.message}`);
  } catch (error) {
    console.error("❌ Ошибка тестирования:", error.message);
  }

  console.log("\n📝 3. Тестирование отправки сообщения...");
  try {
    const messageTest = await testEndpoint("/api/sentry-diagnosis", "POST", {
      message: "Тестовое сообщение из скрипта",
    });
    console.log(`Статус: ${messageTest.status}`);
    console.log(`Результат: ${messageTest.data.message}`);
  } catch (error) {
    console.error("❌ Ошибка тестирования:", error.message);
  }

  console.log("\n✅ Тестирование завершено!");
  console.log("\n📋 Рекомендации:");
  console.log("1. Проверьте логи приложения на наличие сообщений Sentry");
  console.log("2. Проверьте Sentry сервер на наличие новых событий");
  console.log("3. Убедитесь, что DSN правильно настроен в production");
}

// Запускаем тесты
runTests().catch(console.error);

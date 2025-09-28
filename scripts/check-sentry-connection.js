#!/usr/bin/env node

/**
 * Скрипт для проверки подключения к Sentry серверу
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");

// Загружаем переменные окружения из .env файла если он существует
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

// Получаем DSN из переменных окружения
const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (!sentryDsn) {
  console.error("❌ SENTRY_DSN или NEXT_PUBLIC_SENTRY_DSN не настроен");
  process.exit(1);
}

console.log("🔍 Проверка подключения к Sentry...");
console.log(`DSN: ${sentryDsn.replace(/\/\d+$/, "/***")}`);

// Парсим DSN
try {
  const dsnUrl = new URL(sentryDsn);
  const hostname = dsnUrl.hostname;
  const port = dsnUrl.port || (dsnUrl.protocol === "https:" ? 443 : 80);
  const protocol = dsnUrl.protocol === "https:" ? https : http;

  console.log(`🌐 Хост: ${hostname}`);
  console.log(`🔌 Порт: ${port}`);
  console.log(`🔒 Протокол: ${dsnUrl.protocol}`);

  // Проверяем доступность сервера
  const options = {
    hostname,
    port,
    path: "/",
    method: "GET",
    timeout: 10000,
  };

  const req = protocol.request(options, res => {
    console.log(`✅ Сервер доступен! Статус: ${res.statusCode}`);
    console.log(`📊 Заголовки ответа:`, res.headers);

    let data = "";
    res.on("data", chunk => {
      data += chunk;
    });

    res.on("end", () => {
      console.log(`📝 Ответ сервера (первые 200 символов):`);
      console.log(data.substring(0, 200));

      if (res.statusCode >= 200 && res.statusCode < 400) {
        console.log("✅ Sentry сервер отвечает корректно");
        if (res.statusCode === 302) {
          console.log(
            "ℹ️  Сервер перенаправляет на аутентификацию (это нормально для Sentry)"
          );
        }
        process.exit(0);
      } else {
        console.log(
          `⚠️  Сервер отвечает с неожиданным статусом: ${res.statusCode}`
        );
        process.exit(1);
      }
    });
  });

  req.on("error", error => {
    console.error(`❌ Ошибка подключения к Sentry серверу:`, error.message);
    console.error(`🔧 Возможные причины:`);
    console.error(`   - Сервер недоступен`);
    console.error(`   - Неправильный адрес или порт`);
    console.error(`   - Проблемы с сетью`);
    console.error(`   - Firewall блокирует соединение`);
    process.exit(1);
  });

  req.on("timeout", () => {
    console.error(`⏰ Таймаут подключения к серверу (10 секунд)`);
    req.destroy();
    process.exit(1);
  });

  req.end();
} catch (error) {
  console.error(`❌ Ошибка парсинга DSN:`, error.message);
  console.error(`🔧 Проверьте правильность формата DSN`);
  console.error(`📝 Ожидаемый формат: http://key@host:port/project_id`);
  process.exit(1);
}

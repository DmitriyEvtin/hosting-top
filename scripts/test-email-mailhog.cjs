#!/usr/bin/env node

/**
 * Скрипт для тестирования email с MailHog
 */

const https = require("https");
const http = require("http");

// Функция для отправки HTTP запроса
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    const req = client.request(
      url,
      {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      },
      res => {
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      }
    );

    req.on("error", reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Тестирование email функциональности
async function testEmail() {
  console.log("🧪 Тестирование email функциональности с MailHog...\n");

  try {
    // 1. Проверка статуса MailHog
    console.log("1. Проверка MailHog...");
    const mailhogStatus = await makeRequest(
      "http://localhost:8025/api/v1/messages"
    );
    console.log(`   ✅ MailHog доступен (писем: ${mailhogStatus.data.length})`);

    // 2. Проверка статуса email сервиса
    console.log("\n2. Проверка email сервиса...");
    const emailStatus = await makeRequest(
      "http://localhost:3000/api/email/status"
    );
    console.log(
      `   📧 Email сервис: ${emailStatus.data.configured ? "настроен" : "не настроен"}`
    );

    if (!emailStatus.data.configured) {
      console.log(
        "   ⚠️  Email сервис не настроен. Настройте переменные окружения:"
      );
      console.log('      SMTP_HOST="localhost"');
      console.log('      SMTP_PORT="1025"');
      console.log('      SMTP_FROM="noreply@parket-crm.local"');
      return;
    }

    // 3. Отправка тестового письма
    console.log("\n3. Отправка тестового письма...");
    const testEmail = await makeRequest(
      "http://localhost:3000/api/email/send",
      {
        method: "POST",
        body: {
          to: "test@example.com",
          subject: "Тестовое письмо из скрипта",
          text: "Это тестовое письмо, отправленное через скрипт тестирования.",
          html: "<p>Это <strong>тестовое письмо</strong>, отправленное через скрипт тестирования.</p>",
        },
      }
    );

    if (testEmail.status === 200) {
      console.log("   ✅ Письмо отправлено успешно");
    } else {
      console.log(
        `   ❌ Ошибка отправки: ${testEmail.data.error || "Неизвестная ошибка"}`
      );
      return;
    }

    // 4. Отправка письма по шаблону
    console.log("\n4. Отправка письма по шаблону...");
    const templateEmail = await makeRequest(
      "http://localhost:3000/api/email/template",
      {
        method: "POST",
        body: {
          template: "welcome",
          to: "user@example.com",
          data: {
            userName: "Тестовый пользователь",
            loginUrl: "http://localhost:3000/auth/signin",
          },
        },
      }
    );

    if (templateEmail.status === 200) {
      console.log("   ✅ Шаблон отправлен успешно");
    } else {
      console.log(
        `   ❌ Ошибка отправки шаблона: ${templateEmail.data.error || "Неизвестная ошибка"}`
      );
    }

    // 5. Проверка писем в MailHog
    console.log("\n5. Проверка писем в MailHog...");
    const messages = await makeRequest("http://localhost:8025/api/v1/messages");
    console.log(`   📬 Найдено писем: ${messages.data.length}`);

    if (messages.data.length > 0) {
      console.log("\n   📋 Последние письма:");
      messages.data.slice(0, 3).forEach((msg, index) => {
        console.log(
          `      ${index + 1}. От: ${msg.From.Address} | Тема: ${msg.Content.Headers.Subject?.[0] || "Без темы"}`
        );
      });
    }

    console.log("\n🎉 Тестирование завершено!");
    console.log("\n📱 Откройте MailHog UI: http://localhost:8025");
    console.log("🔗 Откройте приложение: http://localhost:3000/admin/email");
  } catch (error) {
    console.error("❌ Ошибка тестирования:", error.message);
    process.exit(1);
  }
}

// Запуск тестирования
if (require.main === module) {
  testEmail();
}

module.exports = { testEmail };

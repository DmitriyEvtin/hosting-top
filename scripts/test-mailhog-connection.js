#!/usr/bin/env node

/**
 * Тест подключения к MailHog
 */

const nodemailer = require("nodemailer");

async function testMailHogConnection() {
  console.log("🧪 Тестирование подключения к MailHog...\n");

  try {
    // Создаем транспортер для MailHog
    const transporter = nodemailer.createTransport({
      host: "localhost",
      port: 1025,
      secure: false, // MailHog не использует SSL
      auth: {
        user: "", // MailHog не требует аутентификации
        pass: "",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log("1. Транспортер создан");

    // Проверяем подключение
    await transporter.verify();
    console.log("2. ✅ Подключение к MailHog успешно");

    // Отправляем тестовое письмо
    const info = await transporter.sendMail({
      from: "test@example.com",
      to: "test@example.com",
      subject: "Тест подключения к MailHog",
      text: "Это тестовое письмо для проверки подключения к MailHog.",
      html: "<p>Это <strong>тестовое письмо</strong> для проверки подключения к MailHog.</p>",
    });

    console.log("3. ✅ Письмо отправлено успешно");
    console.log("   Message ID:", info.messageId);

    // Проверяем, что письмо попало в MailHog
    const https = require("https");
    const http = require("http");

    const checkMessages = () => {
      return new Promise((resolve, reject) => {
        const req = http.request(
          "http://localhost:8025/api/v1/messages",
          res => {
            let data = "";
            res.on("data", chunk => (data += chunk));
            res.on("end", () => {
              try {
                const messages = JSON.parse(data);
                resolve(messages);
              } catch (e) {
                reject(e);
              }
            });
          }
        );
        req.on("error", reject);
        req.end();
      });
    };

    // Ждем немного и проверяем сообщения
    setTimeout(async () => {
      try {
        const messages = await checkMessages();
        console.log(`4. 📬 Найдено писем в MailHog: ${messages.length}`);

        if (messages.length > 0) {
          console.log("   📋 Последнее письмо:");
          const lastMessage = messages[0];
          console.log(`      От: ${lastMessage.From.Address}`);
          console.log(
            `      Тема: ${lastMessage.Content.Headers.Subject?.[0] || "Без темы"}`
          );
        }

        console.log("\n🎉 Тестирование завершено успешно!");
        console.log("📱 Откройте MailHog UI: http://localhost:8025");
      } catch (error) {
        console.error("❌ Ошибка проверки сообщений:", error.message);
      }
    }, 1000);
  } catch (error) {
    console.error("❌ Ошибка подключения к MailHog:", error.message);
    console.error(
      "   Убедитесь, что MailHog запущен: docker compose up -d mailer"
    );
    process.exit(1);
  }
}

// Запуск тестирования
if (require.main === module) {
  testMailHogConnection();
}

module.exports = { testMailHogConnection };

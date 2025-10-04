"use client";

import { useEmail } from "@/shared/lib/use-email";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { Label } from "@/shared/ui/Label";
import { useState } from "react";

export function EmailTest() {
  const { sendEmail, sendTemplate, isLoading, error, isConfigured } =
    useEmail();
  const [testEmail, setTestEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSendTestEmail = async () => {
    if (!testEmail) return;

    try {
      await sendEmail({
        to: testEmail,
        subject: "Тестовое письмо",
        text: "Это тестовое письмо из системы Паркет CRM.",
        html: "<p>Это <strong>тестовое письмо</strong> из системы Паркет CRM.</p>",
      });
      setMessage("Письмо отправлено успешно!");
    } catch (err) {
      setMessage(
        `Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`
      );
    }
  };

  const handleSendTemplate = async (template: string) => {
    if (!testEmail) return;

    try {
      await sendTemplate(template, testEmail, {
        userName: "Тестовый пользователь",
        userEmail: testEmail,
        userRole: "USER",
        loginUrl: `${window.location.origin}/auth/signin`,
        resetLink: `${window.location.origin}/auth/reset-password?token=test-token`,
        profileUrl: `${window.location.origin}/profile`,
      });
      setMessage(`Шаблон '${template}' отправлен успешно!`);
    } catch (err) {
      setMessage(
        `Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`
      );
    }
  };

  // Показываем загрузку пока проверяем конфигурацию
  if (!isConfigured && !error) {
    return (
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Загрузка...</h2>
          <p className="text-gray-600">
            Проверка конфигурации email сервиса...
          </p>
        </div>
      </Card>
    );
  }

  if (!isConfigured) {
    return (
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Email сервис не настроен
          </h2>
          <p className="text-gray-600 mb-4">
            Для настройки email сервиса укажите SMTP параметры в переменных
            окружения:
          </p>
          <div className="bg-gray-100 p-4 rounded-md">
            <code className="text-sm">
              SMTP_HOST=&quot;smtp.gmail.com&quot;
              <br />
              SMTP_PORT=&quot;587&quot;
              <br />
              SMTP_USER=&quot;your-email@gmail.com&quot;
              <br />
              SMTP_PASSWORD=&quot;your-app-password&quot;
              <br />
              SMTP_FROM=&quot;noreply@yourdomain.com&quot;
            </code>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Тестирование Email сервиса
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="test-email">Email для тестирования</Label>
            <Input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleSendTestEmail}
              disabled={isLoading || !testEmail}
              className="w-full"
            >
              {isLoading ? "Отправка..." : "Отправить тестовое письмо"}
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                onClick={() => handleSendTemplate("welcome")}
                disabled={isLoading || !testEmail}
                variant="outline"
              >
                Шаблон Welcome
              </Button>

              <Button
                onClick={() => handleSendTemplate("userCreated")}
                disabled={isLoading || !testEmail}
                variant="outline"
              >
                Шаблон User Created
              </Button>

              <Button
                onClick={() => handleSendTemplate("passwordReset")}
                disabled={isLoading || !testEmail}
                variant="outline"
              >
                Шаблон Password Reset
              </Button>

              <Button
                onClick={() => handleSendTemplate("userUpdated")}
                disabled={isLoading || !testEmail}
                variant="outline"
              >
                Шаблон User Updated
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded border border-red-200">
              <strong>Ошибка:</strong> {error}
            </div>
          )}

          {message && (
            <div className="text-green-600 bg-green-50 p-3 rounded border border-green-200">
              {message}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

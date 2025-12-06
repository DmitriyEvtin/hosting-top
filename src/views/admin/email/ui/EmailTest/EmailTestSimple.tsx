"use client";

import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { Label } from "@/shared/ui/Label";
import { useState } from "react";

export function EmailTestSimple() {
  const [testEmail, setTestEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendTestEmail = async () => {
    if (!testEmail) return;

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: testEmail,
          subject: "Тестовое письмо",
          text: "Это тестовое письмо из системы Hosting Top.",
          html: "<p>Это <strong>тестовое письмо</strong> из системы Hosting Top.</p>",
        }),
      });

      if (response.ok) {
        setMessage("Письмо отправлено успешно!");
      } else {
        const errorData = await response.json();
        setMessage(`Ошибка: ${errorData.error || "Неизвестная ошибка"}`);
      }
    } catch (err) {
      setMessage(
        `Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTemplate = async (template: string) => {
    if (!testEmail) return;

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/email/template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template,
          to: testEmail,
          data: {
            userName: "Тестовый пользователь",
            userEmail: testEmail,
            userRole: "USER",
            loginUrl: `${window.location.origin}/auth/signin`,
            resetLink: `${window.location.origin}/auth/reset-password?token=test-token`,
            profileUrl: `${window.location.origin}/profile`,
          },
        }),
      });

      if (response.ok) {
        setMessage(`Шаблон '${template}' отправлен успешно!`);
      } else {
        const errorData = await response.json();
        setMessage(`Ошибка: ${errorData.error || "Неизвестная ошибка"}`);
      }
    } catch (err) {
      setMessage(
        `Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

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

          {message && (
            <div
              className={`p-3 rounded border ${
                message.includes("Ошибка")
                  ? "text-red-600 bg-red-50 border-red-200"
                  : "text-green-600 bg-green-50 border-green-200"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { Button } from "@/shared/ui/Button";
import { AlertCircle, CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface SentryDiagnosis {
  success: boolean;
  message: string;
  config: {
    environment: {
      NODE_ENV: string;
      SENTRY_DSN: string;
      NEXT_PUBLIC_SENTRY_DSN: string;
    };
    sentry: {
      isInitialized: boolean;
      client: boolean;
      dsn: string;
    };
    request: {
      url: string;
      method: string;
      userAgent: string;
      timestamp: string;
    };
  };
  testEvent: string;
  timestamp: string;
}

export function SentryStatus() {
  const [diagnosis, setDiagnosis] = useState<SentryDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    error: boolean;
    message: boolean;
  }>({ error: false, message: false });

  const fetchDiagnosis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/sentry-diagnosis");
      const data = await response.json();

      if (data.success) {
        setDiagnosis(data);
      } else {
        setError(data.error || "Ошибка диагностики Sentry");
      }
    } catch (err) {
      setError("Не удалось подключиться к API диагностики");
    } finally {
      setLoading(false);
    }
  };

  const testError = async () => {
    try {
      const response = await fetch("/api/sentry-test");
      setTestResults(prev => ({ ...prev, error: true }));
    } catch (err) {
      console.error("Ошибка тестирования:", err);
    }
  };

  const testMessage = async () => {
    try {
      const response = await fetch("/api/sentry-diagnosis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Тестовое сообщение с главной страницы",
        }),
      });
      setTestResults(prev => ({ ...prev, message: true }));
    } catch (err) {
      console.error("Ошибка тестирования:", err);
    }
  };

  useEffect(() => {
    fetchDiagnosis();
  }, []);

  const getStatusIcon = (status: boolean | string) => {
    if (typeof status === "boolean") {
      return status ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      );
    }

    // Для строковых статусов (как в ConfigStatus)
    switch (status) {
      case "configured":
      case "available":
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
      case "unavailable":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "not_configured":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: boolean | string) => {
    if (typeof status === "boolean") {
      return status ? "text-green-600" : "text-red-600";
    }

    // Для строковых статусов (как в ConfigStatus)
    switch (status) {
      case "configured":
      case "available":
      case "connected":
        return "text-green-600";
      case "error":
      case "unavailable":
        return "text-red-600";
      case "not_configured":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>🔍</span>
              Статус Sentry
            </CardTitle>
            <CardDescription>
              Мониторинг и диагностика системы логирования
            </CardDescription>
          </div>
          <Button
            onClick={fetchDiagnosis}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Обновить
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">
              Проверка конфигурации Sentry...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Ошибка диагностики</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {diagnosis && (
          <div className="space-y-4">
            {/* Основная информация */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Окружение:</span>
                <span className="ml-2">
                  {diagnosis.config.environment.NODE_ENV}
                </span>
              </div>
              <div>
                <span className="font-medium">Время:</span>
                <span className="ml-2">
                  {new Date(diagnosis.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Сервисы */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Сервисы:</h4>

              {/* SENTRY_DSN */}
              <div className="flex items-center justify-between">
                <span className="text-sm">SENTRY_DSN</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(
                    diagnosis.config.environment.SENTRY_DSN === "***настроен***"
                      ? "configured"
                      : "not_configured"
                  )}
                  <span
                    className={`text-sm ${getStatusColor(
                      diagnosis.config.environment.SENTRY_DSN ===
                        "***настроен***"
                        ? "configured"
                        : "not_configured"
                    )}`}
                  >
                    {diagnosis.config.environment.SENTRY_DSN ===
                    "***настроен***"
                      ? "Настроен"
                      : "Не настроен"}
                  </span>
                </div>
              </div>

              {/* NEXT_PUBLIC_SENTRY_DSN */}
              <div className="flex items-center justify-between">
                <span className="text-sm">NEXT_PUBLIC_SENTRY_DSN</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(
                    diagnosis.config.environment.NEXT_PUBLIC_SENTRY_DSN ===
                      "***настроен***"
                      ? "configured"
                      : "not_configured"
                  )}
                  <span
                    className={`text-sm ${getStatusColor(
                      diagnosis.config.environment.NEXT_PUBLIC_SENTRY_DSN ===
                        "***настроен***"
                        ? "configured"
                        : "not_configured"
                    )}`}
                  >
                    {diagnosis.config.environment.NEXT_PUBLIC_SENTRY_DSN ===
                    "***настроен***"
                      ? "Настроен"
                      : "Не настроен"}
                  </span>
                </div>
              </div>

              {/* Sentry инициализация */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Sentry инициализация</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnosis.config.sentry.isInitialized)}
                  <span
                    className={`text-sm ${getStatusColor(
                      diagnosis.config.sentry.isInitialized
                    )}`}
                  >
                    {diagnosis.config.sentry.isInitialized
                      ? "Инициализирован"
                      : "Не инициализирован"}
                  </span>
                </div>
              </div>

              {/* Sentry клиент */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Sentry клиент</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnosis.config.sentry.client)}
                  <span
                    className={`text-sm ${getStatusColor(
                      diagnosis.config.sentry.client
                    )}`}
                  >
                    {diagnosis.config.sentry.client ? "Активен" : "Неактивен"}
                  </span>
                </div>
              </div>

              {/* Тестовое событие */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Тестовое событие</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnosis.testEvent === "отправлено")}
                  <span
                    className={`text-sm ${getStatusColor(
                      diagnosis.testEvent === "отправлено"
                    )}`}
                  >
                    {diagnosis.testEvent === "отправлено"
                      ? "Отправлено"
                      : "Не отправлено"}
                  </span>
                </div>
              </div>
            </div>

            {/* Кнопки тестирования */}
            <div className="pt-2 border-t">
              <div className="flex gap-2 mb-3">
                <Button
                  onClick={testError}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  🚨 Тест ошибки
                </Button>
                <Button
                  onClick={testMessage}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  📝 Тест сообщения
                </Button>
              </div>

              {testResults.error && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  ✅ Ошибка отправлена в Sentry
                </div>
              )}

              {testResults.message && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  ✅ Сообщение отправлено в Sentry
                </div>
              )}

              {/* Дополнительная информация */}
              <div className="text-xs text-muted-foreground">
                Последнее обновление:{" "}
                {new Date(diagnosis.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

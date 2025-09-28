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

interface ConfigStatusData {
  status: string;
  timestamp: string;
  environment: {
    nodeEnv: string;
    appName: string;
    appVersion: string;
    isDevelopment: boolean;
    database: {
      status: string;
      url: string;
    };
    redis: {
      status: string;
      url: string;
    };
    aws: {
      status: string;
      region: string;
      bucket: string;
      cdn: string;
    };
    auth: {
      nextauth: {
        secret: string;
        url: string;
      };
    };
    smtp: {
      status: string;
      host: string;
      from: string;
    };
    monitoring: {
      sentry: string;
      logLevel: string;
    };
    parsing: {
      batchSize: number;
      delayMs: number;
      maxRetries: number;
    };
    security: {
      corsOrigin: string;
      rateLimitMax: number;
      rateLimitWindowMs: number;
    };
  };
}

export function ConfigStatus() {
  const [configData, setConfigData] = useState<ConfigStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/config/simple");
      const data = await response.json();

      if (response.ok) {
        setConfigData(data);
      } else {
        setError(data.error?.message || "Ошибка загрузки конфигурации");
      }
    } catch (err) {
      setError("Не удалось загрузить статус конфигурации");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "available":
      case "configured":
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
      case "available":
      case "configured":
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Статус конфигурации</CardTitle>
          <CardDescription>
            Загрузка информации о конфигурации...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Статус конфигурации</CardTitle>
          <CardDescription>Ошибка загрузки конфигурации</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={fetchConfigStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!configData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Статус конфигурации</CardTitle>
            <CardDescription>
              Общий статус:{" "}
              {configData.status === "healthy" ? "Здоровый" : "Деградированный"}
            </CardDescription>
          </div>
          <Button onClick={fetchConfigStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Окружение:</span>
              <span className="ml-2">{configData.environment.nodeEnv}</span>
            </div>
            <div>
              <span className="font-medium">Версия:</span>
              <span className="ml-2">{configData.environment.appVersion}</span>
            </div>
          </div>

          {/* Сервисы */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Сервисы:</h4>

            {/* База данных */}
            <div className="flex items-center justify-between">
              <span className="text-sm">База данных</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(configData.environment.database.status)}
                <span
                  className={`text-sm ${getStatusColor(configData.environment.database.status)}`}
                >
                  {configData.environment.database.status === "configured"
                    ? "Подключена"
                    : configData.environment.database.status === "error"
                      ? "Ошибка"
                      : "Не настроена"}
                </span>
              </div>
            </div>

            {/* Redis */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Redis</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(configData.environment.redis.status)}
                <span
                  className={`text-sm ${getStatusColor(configData.environment.redis.status)}`}
                >
                  {configData.environment.redis.status === "configured"
                    ? "Настроен"
                    : "Не настроен"}
                </span>
              </div>
            </div>

            {/* AWS S3 */}
            <div className="flex items-center justify-between">
              <span className="text-sm">AWS S3</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(configData.environment.aws.status)}
                <span
                  className={`text-sm ${getStatusColor(configData.environment.aws.status)}`}
                >
                  {configData.environment.aws.status === "available"
                    ? "Доступен"
                    : configData.environment.aws.status === "error"
                      ? "Ошибка"
                      : "Не настроен"}
                </span>
              </div>
            </div>

            {/* SMTP */}
            <div className="flex items-center justify-between">
              <span className="text-sm">SMTP</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(configData.environment.smtp.status)}
                <span
                  className={`text-sm ${getStatusColor(configData.environment.smtp.status)}`}
                >
                  {configData.environment.smtp.status === "configured"
                    ? "Настроен"
                    : "Не настроен"}
                </span>
              </div>
            </div>

            {/* Sentry */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Sentry</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(configData.environment.monitoring.sentry)}
                <span
                  className={`text-sm ${getStatusColor(configData.environment.monitoring.sentry)}`}
                >
                  {configData.environment.monitoring.sentry === "configured"
                    ? "Настроен"
                    : "Не настроен"}
                </span>
              </div>
            </div>
          </div>

          {/* Дополнительная информация */}
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Последнее обновление:{" "}
              {new Date(configData.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

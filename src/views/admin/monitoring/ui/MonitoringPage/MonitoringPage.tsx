"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { Button } from "@/shared/ui/Button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfigStatus } from "../ConfigStatus";
import { DatabaseStatus } from "../DatabaseStatus";
import { SentryStatus } from "../SentryStatus";

export function MonitoringPage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    // Перезагружаем страницу для обновления всех компонентов
    window.location.reload();
  };

  useEffect(() => {
    // Устанавливаем время и статус клиента только на клиенте
    setCurrentTime(new Date().toLocaleString());
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Мониторинг системы
              </h1>
              <p className="mt-2 text-gray-600">
                Статус компонентов системы и диагностика
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Обновить все
            </Button>
            <div className="text-sm text-gray-500">
              Последнее обновление: {currentTime || "загрузка..."}
            </div>
          </div>
        </div>

        {/* Статус системы */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Статус системы</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DatabaseStatus />
            <ConfigStatus />
            <SentryStatus />
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Информация о системе</CardTitle>
              <CardDescription>Основные параметры и настройки</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Окружение:</span>
                  <span className="text-sm text-gray-600">
                    {isClient ? "browser" : "загрузка..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Время загрузки:</span>
                  <span className="text-sm text-gray-600">
                    {currentTime || "загрузка..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">User Agent:</span>
                  <span className="text-sm text-gray-600">
                    {isClient
                      ? window.navigator.userAgent.substring(0, 50) + "..."
                      : "загрузка..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Разрешение:</span>
                  <span className="text-sm text-gray-600">
                    {isClient
                      ? `${window.screen.width}x${window.screen.height}`
                      : "загрузка..."}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Производительность</CardTitle>
              <CardDescription>
                Метрики производительности системы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    Время загрузки страницы:
                  </span>
                  <span className="text-sm text-gray-600">
                    {isClient
                      ? `${Math.round(performance.now())} мс`
                      : "загрузка..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Язык браузера:</span>
                  <span className="text-sm text-gray-600">
                    {isClient ? window.navigator.language : "загрузка..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Онлайн статус:</span>
                  <span className="text-sm text-gray-600">
                    {isClient
                      ? window.navigator.onLine
                        ? "онлайн"
                        : "офлайн"
                      : "загрузка..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    Время последнего обновления:
                  </span>
                  <span className="text-sm text-gray-600">
                    {currentTime
                      ? new Date(currentTime).toLocaleTimeString()
                      : "загрузка..."}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

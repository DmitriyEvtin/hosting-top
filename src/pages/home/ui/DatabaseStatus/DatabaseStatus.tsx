"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { useEffect, useState } from "react";

interface DatabaseStats {
  users: number;
  categories: number;
  products: number;
  sessions: number;
}

interface DatabaseTestResponse {
  success: boolean;
  message: string;
  stats?: DatabaseStats;
  error?: string;
}

export function DatabaseStatus() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testDatabase = async () => {
      try {
        const response = await fetch("/api/database/test");
        const data: DatabaseTestResponse = await response.json();

        if (data.success && data.stats) {
          setStatus("success");
          setStats(data.stats);
        } else {
          setStatus("error");
          setError(data.error || "Неизвестная ошибка");
        }
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Ошибка подключения");
      }
    };

    testDatabase();
  }, []);

  if (status === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Статус базы данных</CardTitle>
          <CardDescription>Проверка подключения...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">
              Подключение к базе данных...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Ошибка базы данных</CardTitle>
          <CardDescription>
            Не удалось подключиться к базе данных
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="text-green-800">
          ✅ База данных работает
        </CardTitle>
        <CardDescription>
          Подключение к PostgreSQL успешно установлено
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">
              {stats?.users || 0}
            </div>
            <div className="text-sm text-green-600">Пользователи</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">
              {stats?.categories || 0}
            </div>
            <div className="text-sm text-green-600">Категории</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">
              {stats?.products || 0}
            </div>
            <div className="text-sm text-green-600">Товары</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">
              {stats?.sessions || 0}
            </div>
            <div className="text-sm text-green-600">Сессии парсинга</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

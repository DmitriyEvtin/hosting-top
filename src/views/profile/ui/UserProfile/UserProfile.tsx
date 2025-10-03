"use client";

import { Button } from "@/shared/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/Card";
import { ChangePasswordForm } from "@/shared/ui/ChangePasswordForm";
import { useSession } from "next-auth/react";
import { useState } from "react";

export function UserProfile() {
  const { data: session, update } = useSession();
  const [showChangePassword, setShowChangePassword] = useState(false);

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Доступ запрещен</CardTitle>
            <CardDescription>
              Необходимо войти в систему для доступа к профилю
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Администратор";
      case "MODERATOR":
        return "Модератор";
      case "USER":
        return "Пользователь";
      default:
        return "Неизвестно";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "MODERATOR":
        return "bg-yellow-100 text-yellow-800";
      case "USER":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Мой профиль</CardTitle>
            <CardDescription>Управление настройками профиля</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Имя</label>
                <p className="text-lg">{session.user.name || "Не указано"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="text-lg">{session.user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Роль
                </label>
                <p className="text-lg">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                      session.user.role
                    )}`}
                  >
                    {getRoleDisplayName(session.user.role)}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  ID пользователя
                </label>
                <p className="text-lg font-mono text-sm">{session.user.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Безопасность</CardTitle>
            <CardDescription>
              Управление паролем и настройками безопасности
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showChangePassword ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Для обеспечения безопасности рекомендуется регулярно менять
                  пароль
                </p>
                <Button
                  onClick={() => setShowChangePassword(true)}
                  variant="outline"
                >
                  Изменить пароль
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <ChangePasswordForm
                  onSuccess={() => {
                    setShowChangePassword(false);
                    // Можно добавить уведомление об успешной смене пароля
                  }}
                />
                <Button
                  onClick={() => setShowChangePassword(false)}
                  variant="outline"
                >
                  Отмена
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Системная информация</CardTitle>
            <CardDescription>Информация о системе и настройках</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Версия приложения:</span>
                <span className="font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Окружение:</span>
                <span className="font-mono">{process.env.NODE_ENV}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Последний вход:</span>
                <span className="font-mono">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { Alert, AlertDescription } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/Card";
import { ChangePasswordForm } from "@/shared/ui/ChangePasswordForm";
import { useProfile } from "@/views/profile/model/useProfile";
import { ProfileLogoUpload } from "@/views/profile/ui/ProfileLogoUpload";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

export function UserProfile() {
  const { data: session } = useSession();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { user, updateProfile, removeLogo } = useProfile();

  // Используем данные из useProfile, если они доступны, иначе fallback на сессию
  const currentUser = user || session?.user;

  // Обработчики для загрузки логотипа
  const handleLogoUpload = async (imageUrl: string) => {
    try {
      setUploadError(null);
      await updateProfile({ image: imageUrl });
      setUploadSuccess("Логотип успешно загружен");
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Ошибка загрузки логотипа"
      );
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  const handleLogoRemove = async () => {
    try {
      setUploadError(null);
      await removeLogo();
      setUploadSuccess("Логотип удален");
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Ошибка удаления логотипа"
      );
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  // Если нет пользователя, не рендерим компонент (лейаут уже обработает это)
  if (!currentUser) {
    return null;
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
        {/* Уведомления */}
        {uploadSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {uploadSuccess}
            </AlertDescription>
          </Alert>
        )}

        {uploadError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {uploadError}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Мой профиль</CardTitle>
            <CardDescription>Управление настройками профиля</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Логотип профиля */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {currentUser.image ? (
                  <Image
                    src={currentUser.image}
                    alt="Логотип профиля"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-lg">
                      {currentUser.name?.charAt(0)?.toUpperCase() ||
                        currentUser.email?.charAt(0)?.toUpperCase() ||
                        "?"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {currentUser.name || "Пользователь"}
                </h3>
                <p className="text-sm text-gray-500">{currentUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Имя</label>
                <p className="text-lg">{currentUser.name || "Не указано"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="text-lg">{currentUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Роль
                </label>
                <p className="text-lg">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                      currentUser.role
                    )}`}
                  >
                    {getRoleDisplayName(currentUser.role)}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  ID пользователя
                </label>
                <p className="text-lg font-mono text-sm">{currentUser.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Карточка загрузки логотипа */}
        <Card>
          <CardHeader>
            <CardTitle>Логотип профиля</CardTitle>
            <CardDescription>
              Загрузите изображение для вашего профиля
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileLogoUpload
              currentLogoUrl={currentUser.image || undefined}
              onUploadComplete={handleLogoUpload}
              onUploadError={error => setUploadError(error)}
              onRemoveLogo={handleLogoRemove}
              allowRemove={false} // Временно отключаем кнопку удаления
            />
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

"use client";

import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseProfileReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: {
    name?: string;
    image?: string | null;
  }) => Promise<void>;
  removeLogo: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Используем локальное состояние, если оно есть, иначе данные из сессии
  const user = localUser || (session?.user as User | null);

  // Убираем автоматическое обновление сессии, так как это может вызывать бесконечные циклы
  // JWT callback уже обновляет данные при вызове update()

  const updateProfile = useCallback(
    async (data: { name?: string; image?: string | null }) => {
      if (!session?.user?.id) {
        setError("Не авторизован");
        return;
      }

      if (isUpdating) {
        return; // Предотвращаем множественные обновления
      }

      setIsLoading(true);
      setIsUpdating(true);
      setError(null);

      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Ошибка обновления профиля");
        }

        const result = await response.json();

        // Сначала обновляем локальное состояние для немедленного отображения
        setLocalUser(result.user);

        // Обновляем сессию с новыми данными
        // JWT callback автоматически получит актуальные данные из БД
        await update();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
        setIsUpdating(false);
      }
    },
    [session, update, isUpdating]
  );

  const removeLogo = useCallback(async () => {
    await updateProfile({ image: null });
  }, [updateProfile]);

  return {
    user,
    isLoading,
    error,
    updateProfile,
    removeLogo,
  };
}

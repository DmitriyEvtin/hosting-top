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

  const user = session?.user as User | null;

  const updateProfile = useCallback(
    async (data: { name?: string; image?: string | null }) => {
      if (!session?.user?.id) {
        setError("Не авторизован");
        return;
      }

      setIsLoading(true);
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

        // Обновляем сессию с новыми данными
        await update({
          ...session,
          user: {
            ...session.user,
            ...result.user,
          },
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [session, update]
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

"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/Card";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Показываем загрузку пока проверяем сессию

    //if (!session?.user) {
    //  router.push("/auth/signin");
    //  return;
    //}
  }, [session, status, router]);

  // Показываем загрузку пока проверяем сессию
  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Загрузка...</CardTitle>
            <CardDescription>Проверка авторизации...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Если нет сессии, показываем сообщение о необходимости авторизации
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

  // Если пользователь авторизован, показываем содержимое
  return <>{children}</>;
}

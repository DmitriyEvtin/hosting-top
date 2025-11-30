"use client";

import { useSession } from "next-auth/react";

export function HomePage() {
  const { data: session } = useSession();

  // Главная страница теперь только для авторизованных пользователей
  // Проверка авторизации происходит в AuthGuard
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          Добро пожаловать в Паркет Retail
        </h1>
        <p className="text-muted-foreground">
          Добро пожаловать, {session?.user?.name || session?.user?.email}!
        </p>
      </div>
    </div>
  );
}

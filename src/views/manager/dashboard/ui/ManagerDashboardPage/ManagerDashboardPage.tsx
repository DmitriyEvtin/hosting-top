"use client";

import { useSession } from "next-auth/react";

export function ManagerDashboardPage() {
  const { data: session } = useSession();

  // Главная страница теперь только для авторизованных пользователей
  // Проверка авторизации происходит в AuthGuard
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      </div>
    </div>
  );
}


"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export function HomePage() {
  const { data: session } = useSession();

  // Главная страница теперь только для авторизованных пользователей
  // Проверка авторизации происходит в AuthGuard
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          Добро пожаловать в Паркет CRM
        </h1>
        <p className="text-muted-foreground">
          Добро пожаловать, {session?.user?.name || session?.user?.email}!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Link
          href="/profile"
          className="p-6 border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">Профиль</h3>
          <p className="text-muted-foreground">Управление личными данными</p>
        </Link>

        <Link
          href="/admin"
          className="p-6 border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">Админ панель</h3>
          <p className="text-muted-foreground">Управление системой</p>
        </Link>
      </div>
    </div>
  );
}

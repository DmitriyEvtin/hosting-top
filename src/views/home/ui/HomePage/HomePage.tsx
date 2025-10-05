"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth");
    }
  }, [status, router]);

  // Если не авторизован, сразу редиректим
  if (status === "unauthenticated") {
    return null; // Будет редирект через useEffect
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если нет сессии после загрузки, тоже редиректим
  if (!session) {
    return null; // Будет редирект через useEffect
  }

  // Главная страница теперь только для авторизованных пользователей
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

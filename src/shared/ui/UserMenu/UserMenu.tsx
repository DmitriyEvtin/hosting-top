"use client";

import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (status === "loading") {
    return (
      <div
        className={`animate-pulse ${className}`}
        data-testid="loading-skeleton"
      >
        <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={`flex space-x-2 ${className}`}>
        <Button asChild variant="outline" size="sm">
          <a href="/auth/signin">Войти</a>
        </Button>
        <Button asChild size="sm">
          <a href="/auth/signup">Регистрация</a>
        </Button>
      </div>
    );
  }

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "Пользователь"}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {session.user.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
        )}
        <span>{session.user.name || session.user.email}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-48 z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-sm text-gray-500 border-b">
              {session.user.email}
            </div>
            <div className="px-3 py-2 text-sm text-gray-500 border-b">
              Роль: {session.user.role}
            </div>

            <div className="mt-2 space-y-1">
              <a
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                Профиль
              </a>

              {session.user.role === "ADMIN" && (
                <a
                  href="/admin"
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  onClick={() => setIsOpen(false)}
                >
                  Админ-панель
                </a>
              )}

              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Выйти
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

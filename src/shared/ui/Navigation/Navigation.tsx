"use client";

import { UserMenu } from "@/shared/ui/UserMenu";

export function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <a
              href="/"
              className="text-xl font-bold text-gray-900 hover:text-gray-700"
            >
              Каталог металлопроката
            </a>
          </div>
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}

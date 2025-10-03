"use client";

import { UserMenu } from "@/shared/ui/UserMenu";
import Link from "next/link";

export function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 hover:text-gray-700"
            >
              Каталог металлопроката
            </Link>
          </div>
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}

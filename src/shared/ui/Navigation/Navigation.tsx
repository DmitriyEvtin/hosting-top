"use client";

import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { UserMenu } from "@/shared/ui/UserMenu";
import Link from "next/link";

export function Navigation() {
  return (
    <nav className="bg-background shadow-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-xl font-bold text-foreground hover:text-foreground/80"
            >
              Паркет Retail
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}

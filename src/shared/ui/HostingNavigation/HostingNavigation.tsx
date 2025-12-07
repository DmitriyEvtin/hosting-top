"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/utils";

interface HostingNavigationProps {
  hostingSlug: string;
  currentPage: "overview" | "tariffs";
  className?: string;
}

export function HostingNavigation({
  hostingSlug,
  currentPage,
  className,
}: HostingNavigationProps) {
  const navItems = [
    {
      label: "Обзор",
      href: `/hosting/${hostingSlug}`,
      page: "overview" as const,
    },
    {
      label: "Тарифы",
      href: `/hosting/${hostingSlug}/tariffs`,
      page: "tariffs" as const,
    },
  ];

  return (
    <nav
      aria-label="Навигация по хостингу"
      className={cn("flex items-center gap-1 border-b", className)}
    >
      {navItems.map((item) => {
        const isActive = currentPage === item.page;

        return (
          <Link
            key={item.page}
            href={item.href}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}


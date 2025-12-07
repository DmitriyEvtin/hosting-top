"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/utils";

interface HostingBreadcrumbsProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
  className?: string;
}

export function HostingBreadcrumbs({
  items,
  className,
}: HostingBreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Хлебные крошки"
      className={cn("flex items-center gap-2 text-sm", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isLink = !isLast && item.href;

        return (
          <div key={index} className="flex items-center gap-2">
            {isLink ? (
              <Link
                href={item.href!}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <span className="text-muted-foreground">→</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

"use client";

import { Scale } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/shared/ui/Badge";
import { useComparison } from "@/views/compare/model/useComparison";
import { cn } from "@/shared/lib/utils";

export interface ComparisonIndicatorProps {
  className?: string;
}

/**
 * Компонент индикатора количества выбранных тарифов для сравнения
 * 
 * Особенности:
 * - Показывает badge с количеством выбранных тарифов
 * - Кликабелен - открывает страницу сравнения
 * - Видим только когда есть выбранные тарифы (count > 0)
 * - Размещается в главной навигации (header)
 */
export function ComparisonIndicator({
  className,
}: ComparisonIndicatorProps) {
  const { count } = useComparison();

  // Не показываем индикатор, если нет выбранных тарифов
  if (count === 0) {
    return null;
  }

  return (
    <Link
      href="/compare"
      className={cn(
        "relative inline-flex items-center justify-center",
        "transition-opacity hover:opacity-80",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md",
        className
      )}
      aria-label={`Перейти к сравнению тарифов (${count} ${count === 1 ? "тариф" : count < 5 ? "тарифа" : "тарифов"})`}
    >
      <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
      <Badge
        variant="default"
        className={cn(
          "absolute -top-2 -right-2",
          "h-5 w-5 sm:h-6 sm:w-6",
          "flex items-center justify-center",
          "p-0 text-xs font-bold",
          "min-w-[1.25rem] sm:min-w-[1.5rem]"
        )}
      >
        {count}
      </Badge>
    </Link>
  );
}


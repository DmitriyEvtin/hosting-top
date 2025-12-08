"use client";

import { Scale, Check } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/lib/use-toast";
import { useComparison } from "@/views/compare/model/useComparison";
import { cn } from "@/shared/lib/utils";

export interface ComparisonButtonProps {
  tariffId: string;
  tariffName: string;
  variant?: "default" | "icon";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Компонент кнопки для добавления/удаления тарифов из сравнения
 * 
 * Особенности:
 * - Показывает состояние (добавлен/не добавлен)
 * - Обрабатывает добавление/удаление через useComparison
 * - Показывает toast уведомления при достижении лимита
 * - Визуально отмечает добавленные тарифы
 */
export function ComparisonButton({
  tariffId,
  tariffName,
  variant = "default",
  size = "md",
  className,
}: ComparisonButtonProps) {
  const { toast } = useToast();
  const { isTariffSelected, addTariff, removeTariff, canAddMore } =
    useComparison();

  const isSelected = isTariffSelected(tariffId);

  const handleClick = () => {
    if (isSelected) {
      removeTariff(tariffId);
      toast({
        title: "Тариф удален из сравнения",
        description: `${tariffName} больше не в списке сравнения`,
      });
    } else {
      if (!canAddMore) {
        toast({
          title: "Максимум 5 тарифов для сравнения",
          description: "Удалите один из выбранных тарифов, чтобы добавить новый",
          variant: "destructive",
        });
        return;
      }
      addTariff(tariffId);
      toast({
        title: "Тариф добавлен в сравнение",
        description: `${tariffName} добавлен в список сравнения`,
        variant: "success",
      });
    }
  };

  // Определяем размер кнопки
  const buttonSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default";

  // Определяем вариант кнопки
  const buttonVariant = isSelected ? "default" : "outline";

  // Определяем иконку
  const Icon = isSelected ? Check : Scale;

  // Определяем текст для варианта default
  const buttonText = isSelected
    ? "Добавлено в сравнение"
    : "Добавить к сравнению";

  return (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      onClick={handleClick}
      className={cn(className)}
      aria-label={
        isSelected
          ? `Удалить ${tariffName} из сравнения`
          : `Добавить ${tariffName} в сравнение`
      }
    >
      <Icon className={cn("h-4 w-4", variant === "default" && "mr-2")} />
      {variant === "default" && <span>{buttonText}</span>}
    </Button>
  );
}


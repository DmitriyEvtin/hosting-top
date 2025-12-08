"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "comparison-tariffs";
const MAX_TARIFFS = 5;

interface UseComparisonReturn {
  selectedTariffs: string[];
  addTariff: (tariffId: string) => void;
  removeTariff: (tariffId: string) => void;
  clearAll: () => void;
  isTariffSelected: (tariffId: string) => boolean;
  canAddMore: boolean;
  count: number;
}

/**
 * Хук для управления списком выбранных тарифов для сравнения
 * 
 * Особенности:
 * - Хранение в localStorage для незарегистрированных пользователей
 * - Синхронизация между вкладками через storage event
 * - Лимит: максимум 5 тарифов
 */
export function useComparison(): UseComparisonReturn {
  const [selectedTariffs, setSelectedTariffs] = useState<string[]>([]);

  // Инициализация из localStorage при монтировании
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
          setSelectedTariffs(parsed);
        }
      }
    } catch (error) {
      console.error("Ошибка при загрузке тарифов из localStorage:", error);
      // Очищаем поврежденные данные
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Сохранение в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedTariffs));
    } catch (error) {
      console.error("Ошибка при сохранении тарифов в localStorage:", error);
    }
  }, [selectedTariffs]);

  // Синхронизация между вкладками через storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
            setSelectedTariffs(parsed);
          }
        } catch (error) {
          console.error("Ошибка при синхронизации тарифов из другой вкладки:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Добавление тарифа с проверкой лимита
  const addTariff = useCallback((tariffId: string) => {
    if (!tariffId || typeof tariffId !== "string") {
      return;
    }

    setSelectedTariffs((prev) => {
      // Проверяем, не добавлен ли уже тариф
      if (prev.includes(tariffId)) {
        return prev;
      }

      // Проверяем лимит
      if (prev.length >= MAX_TARIFFS) {
        return prev;
      }

      return [...prev, tariffId];
    });
  }, []);

  // Удаление тарифа
  const removeTariff = useCallback((tariffId: string) => {
    if (!tariffId || typeof tariffId !== "string") {
      return;
    }

    setSelectedTariffs((prev) => prev.filter((id) => id !== tariffId));
  }, []);

  // Очистка всего списка
  const clearAll = useCallback(() => {
    setSelectedTariffs([]);
  }, []);

  // Проверка, выбран ли тариф
  const isTariffSelected = useCallback(
    (tariffId: string) => {
      return selectedTariffs.includes(tariffId);
    },
    [selectedTariffs]
  );

  // Вычисляемые свойства
  const count = selectedTariffs.length;
  const canAddMore = count < MAX_TARIFFS;

  return {
    selectedTariffs,
    addTariff,
    removeTariff,
    clearAll,
    isTariffSelected,
    canAddMore,
    count,
  };
}


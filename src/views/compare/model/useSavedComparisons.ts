"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

/**
 * Интерфейс для сохраненного сравнения
 */
export interface Comparison {
  id: string;
  name: string;
  tariffIds: string[];
  tariffCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Интерфейс возвращаемого значения хука
 */
export interface UseSavedComparisonsReturn {
  comparisons: Comparison[];
  isLoading: boolean;
  error: Error | null;
  saveComparison: (name: string, tariffIds: string[]) => Promise<void>;
  updateComparison: (id: string, name: string) => Promise<void>;
  deleteComparison: (id: string) => Promise<void>;
  loadComparison: (id: string) => Promise<Comparison>;
  refetch: () => Promise<void>;
}

/**
 * Хук для управления сохраненными сравнениями
 * 
 * Особенности:
 * - Требует аутентификации
 * - Кэширует данные для оптимизации
 * - Автоматически загружает список при монтировании
 * - Оптимистичные обновления для лучшего UX
 */
export function useSavedComparisons(): UseSavedComparisonsReturn {
  const { data: session } = useSession();
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Загрузка списка сохраненных сравнений
   */
  const fetchComparisons = useCallback(async () => {
    if (!session?.user?.id) {
      setError(new Error("Не авторизован"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/compare/saved", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error("Не авторизован");
        }
        
        throw new Error(errorData.error || "Ошибка загрузки списка сравнений");
      }

      const data = await response.json();
      setComparisons(data.comparisons || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Неизвестная ошибка";
      const error = new Error(errorMessage);
      setError(error);
      console.error("Ошибка загрузки списка сравнений:", err);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  /**
   * Автоматическая загрузка при монтировании
   */
  useEffect(() => {
    if (session?.user?.id) {
      fetchComparisons();
    }
  }, [session, fetchComparisons]);

  /**
   * Сохранение нового сравнения
   */
  const saveComparison = useCallback(
    async (name: string, tariffIds: string[]) => {
      if (!session?.user?.id) {
        setError(new Error("Не авторизован"));
        throw new Error("Не авторизован");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/compare/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, tariffIds }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 401) {
            throw new Error("Не авторизован");
          }
          
          if (response.status === 400) {
            throw new Error(errorData.error || "Ошибка сохранения сравнения");
          }
          
          throw new Error(errorData.error || "Ошибка сохранения сравнения");
        }

        const savedComparison = await response.json();
        
        // Добавляем вычисляемое поле tariffCount
        const comparisonWithCount: Comparison = {
          id: savedComparison.id,
          name: savedComparison.name,
          tariffIds: savedComparison.tariffIds,
          tariffCount: savedComparison.tariffIds.length,
          createdAt: savedComparison.createdAt,
          updatedAt: savedComparison.updatedAt,
        };

        // Оптимистичное обновление: добавляем новое сравнение в начало списка
        setComparisons((prev) => [comparisonWithCount, ...prev]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        const error = new Error(errorMessage);
        setError(error);
        console.error("Ошибка сохранения сравнения:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [session]
  );

  /**
   * Обновление названия сравнения
   */
  const updateComparison = useCallback(
    async (id: string, name: string) => {
      if (!session?.user?.id) {
        setError(new Error("Не авторизован"));
        throw new Error("Не авторизован");
      }

      setError(null);

      // Оптимистичное обновление: сразу обновляем в списке
      const previousComparisons = [...comparisons];
      setComparisons((prev) =>
        prev.map((comp) =>
          comp.id === id ? { ...comp, name: name.trim() } : comp
        )
      );

      try {
        const response = await fetch(`/api/compare/saved/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          // Откатываем оптимистичное обновление при ошибке
          setComparisons(previousComparisons);
          
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 401) {
            throw new Error("Не авторизован");
          }
          
          if (response.status === 403) {
            throw new Error("Доступ запрещен");
          }
          
          if (response.status === 404) {
            throw new Error("Сравнение не найдено");
          }
          
          throw new Error(errorData.error || "Ошибка обновления сравнения");
        }

        const updatedComparison = await response.json();
        
        // Обновляем с актуальными данными с сервера
        setComparisons((prev) =>
          prev.map((comp) =>
            comp.id === id
              ? {
                  ...comp,
                  name: updatedComparison.name,
                  updatedAt: updatedComparison.updatedAt,
                }
              : comp
          )
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        const error = new Error(errorMessage);
        setError(error);
        console.error("Ошибка обновления сравнения:", err);
        throw err;
      }
    },
    [session, comparisons]
  );

  /**
   * Удаление сравнения
   */
  const deleteComparison = useCallback(
    async (id: string) => {
      if (!session?.user?.id) {
        setError(new Error("Не авторизован"));
        throw new Error("Не авторизован");
      }

      setError(null);

      // Оптимистичное обновление: сразу удаляем из списка
      const previousComparisons = [...comparisons];
      setComparisons((prev) => prev.filter((comp) => comp.id !== id));

      try {
        const response = await fetch(`/api/compare/saved/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          // Откатываем оптимистичное обновление при ошибке
          setComparisons(previousComparisons);
          
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 401) {
            throw new Error("Не авторизован");
          }
          
          if (response.status === 403) {
            throw new Error("Доступ запрещен");
          }
          
          if (response.status === 404) {
            throw new Error("Сравнение не найдено");
          }
          
          throw new Error(errorData.error || "Ошибка удаления сравнения");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        const error = new Error(errorMessage);
        setError(error);
        console.error("Ошибка удаления сравнения:", err);
        throw err;
      }
    },
    [session, comparisons]
  );

  /**
   * Загрузка конкретного сравнения по ID
   * Использует кэшированный список для оптимизации
   */
  const loadComparison = useCallback(
    async (id: string): Promise<Comparison> => {
      // Сначала проверяем кэш
      const cachedComparison = comparisons.find((comp) => comp.id === id);
      if (cachedComparison) {
        return cachedComparison;
      }

      // Если не найдено в кэше, загружаем список заново
      // (GET endpoint для одного сравнения не реализован, используем список)
      if (!session?.user?.id) {
        setError(new Error("Не авторизован"));
        throw new Error("Не авторизован");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/compare/saved", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 401) {
            throw new Error("Не авторизован");
          }
          
          throw new Error(errorData.error || "Ошибка загрузки сравнения");
        }

        const data = await response.json();
        const allComparisons = data.comparisons || [];
        
        // Обновляем кэш
        setComparisons(allComparisons);
        
        // Ищем нужное сравнение
        const foundComparison = allComparisons.find(
          (comp: Comparison) => comp.id === id
        );

        if (!foundComparison) {
          throw new Error("Сравнение не найдено");
        }

        return foundComparison;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        const error = new Error(errorMessage);
        setError(error);
        console.error("Ошибка загрузки сравнения:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [session, comparisons]
  );

  /**
   * Обновление списка сравнений
   */
  const refetch = useCallback(async () => {
    await fetchComparisons();
  }, [fetchComparisons]);

  return {
    comparisons,
    isLoading,
    error,
    saveComparison,
    updateComparison,
    deleteComparison,
    loadComparison,
    refetch,
  };
}


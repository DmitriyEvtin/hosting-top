"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Save, Share2, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { useComparison } from "@/views/compare/model/useComparison";
import { ComparisonTable, type TariffWithHosting } from "@/views/compare/ui/ComparisonTable";
import { SaveComparisonModal } from "@/views/compare/ui/SaveComparisonModal";
import { ShareComparisonModal } from "@/views/compare/ui/ShareComparisonModal";
import { useToast } from "@/shared/lib/use-toast";

/**
 * Главная страница сравнения тарифов
 * 
 * Особенности:
 * - Три состояния: пустое (0 тарифов), недостаточно (1 тариф), таблица (2-5 тарифов)
 * - Загрузка данных тарифов из API
 * - Кнопки управления: сохранить, поделиться, очистить
 * - Интеграция модальных окон
 * - Проверка аутентификации для кнопки "Сохранить"
 */
export function ComparePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const {
    selectedTariffs,
    clearAll,
    removeTariff,
    count,
  } = useComparison();

  const [tariffs, setTariffs] = useState<TariffWithHosting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Загрузка данных тарифов
  useEffect(() => {
    if (selectedTariffs.length >= 2) {
      setIsLoading(true);
      setError(null);

      const queryParams = selectedTariffs.map((id) => `ids=${id}`).join("&");
      fetch(`/api/public/compare/tariffs?${queryParams}`)
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || "Ошибка при загрузке тарифов");
          }
          return res.json();
        })
        .then((data) => {
          setTariffs(data.tariffs || []);
        })
        .catch((err) => {
          const errorMessage =
            err instanceof Error ? err.message : "Неизвестная ошибка";
          setError(errorMessage);
          console.error("Ошибка загрузки тарифов:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Очищаем данные если тарифов недостаточно
      setTariffs([]);
      setError(null);
    }
  }, [selectedTariffs]);

  // Обработка открытия модалки сохранения
  const handleSaveClick = () => {
    if (!session) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему, чтобы сохранить сравнение",
        variant: "destructive",
      });
      router.push("/auth/signin");
      return;
    }

    if (selectedTariffs.length < 2) {
      toast({
        title: "Недостаточно тарифов",
        description: "Для сохранения необходимо минимум 2 тарифа",
        variant: "destructive",
      });
      return;
    }

    setSaveModalOpen(true);
  };

  // Обработка открытия модалки шаринга
  const handleShareClick = () => {
    if (selectedTariffs.length < 2) {
      toast({
        title: "Недостаточно тарифов",
        description: "Для шаринга необходимо минимум 2 тарифа",
        variant: "destructive",
      });
      return;
    }

    setShareModalOpen(true);
  };

  // Обработка очистки списка
  const handleClearClick = () => {
    if (
      window.confirm(
        "Вы уверены, что хотите очистить список сравнения? Это действие нельзя отменить."
      )
    ) {
      clearAll();
      toast({
        title: "Список очищен",
        description: "Все тарифы удалены из сравнения",
        variant: "success",
      });
    }
  };

  // Пустое состояние (0 тарифов)
  if (count === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-4">Сравнение тарифов</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Вы еще не выбрали тарифы для сравнения
          </p>
          <Button onClick={() => router.push("/hosting")} size="lg">
            Перейти к списку хостингов
          </Button>
        </div>
      </div>
    );
  }

  // Состояние недостаточно тарифов (1 тариф)
  if (count === 1) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-4">Сравнение тарифов</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Добавьте еще хотя бы один тариф для сравнения
          </p>
          <Button onClick={() => router.push("/hosting")} size="lg">
            Добавить тарифы
          </Button>
        </div>
      </div>
    );
  }

  // Состояние с таблицей сравнения (2-5 тарифов)
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Сравнение тарифов</h1>
        <p className="text-muted-foreground">
          Сравните выбранные тарифы по различным параметрам
        </p>
      </div>

      {/* Кнопки управления */}
      <div className="flex flex-wrap gap-3 mb-6">
        {session && (
          <Button
            onClick={handleSaveClick}
            variant="default"
            disabled={isLoading || selectedTariffs.length < 2}
          >
            <Save className="mr-2 h-4 w-4" />
            Сохранить сравнение
          </Button>
        )}
        <Button
          onClick={handleShareClick}
          variant="outline"
          disabled={isLoading || selectedTariffs.length < 2}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Поделиться
        </Button>
        <Button
          onClick={handleClearClick}
          variant="outline"
          disabled={isLoading}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Очистить
        </Button>
      </div>

      {/* Состояние загрузки */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">
            Загрузка данных тарифов...
          </span>
        </div>
      )}

      {/* Состояние ошибки */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <p className="text-red-600 text-lg mb-4">
            {error || "Ошибка при загрузке тарифов"}
          </p>
          <Button
            onClick={() => {
              setError(null);
              // Повторная загрузка
              const queryParams = selectedTariffs
                .map((id) => `ids=${id}`)
                .join("&");
              setIsLoading(true);
              fetch(`/api/public/compare/tariffs?${queryParams}`)
                .then(async (res) => {
                  if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.error || "Ошибка при загрузке тарифов");
                  }
                  return res.json();
                })
                .then((data) => {
                  setTariffs(data.tariffs || []);
                })
                .catch((err) => {
                  const errorMessage =
                    err instanceof Error ? err.message : "Неизвестная ошибка";
                  setError(errorMessage);
                })
                .finally(() => {
                  setIsLoading(false);
                });
            }}
            variant="outline"
          >
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Таблица сравнения */}
      {!isLoading && !error && tariffs.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <ComparisonTable
            tariffs={tariffs}
            onRemoveTariff={removeTariff}
            showActions={true}
          />
        </div>
      )}

      {/* Модалка сохранения */}
      <SaveComparisonModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        tariffIds={selectedTariffs}
      />

      {/* Модалка шаринга */}
      <ShareComparisonModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        tariffIds={selectedTariffs}
      />
    </div>
  );
}


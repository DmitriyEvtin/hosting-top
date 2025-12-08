"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/lib/use-toast";
import { useComparison } from "@/views/compare/model/useComparison";
import { ComparisonTable, type TariffWithHosting } from "@/views/compare/ui/ComparisonTable";
import { Button } from "@/shared/ui/Button";
import Link from "next/link";

interface SharedComparePageProps {
  shareId: string;
}

interface SharedComparisonResponse {
  tariffs: TariffWithHosting[];
  expiresAt: string;
}

/**
 * Компонент страницы публичного сравнения по ссылке шаринга
 * 
 * Особенности:
 * - Загружает данные сравнения по shareId
 * - Проверяет срок действия ссылки
 * - Показывает страницу истекшей ссылки при 404
 * - Отображает таблицу сравнения для действительных ссылок
 * - Позволяет скопировать тарифы в свое сравнение
 */
export function SharedComparePage({ shareId }: SharedComparePageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addTariff } = useComparison();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tariffs, setTariffs] = useState<TariffWithHosting[]>([]);

  // Загрузка данных сравнения
  useEffect(() => {
    const fetchComparison = async () => {
      setIsLoading(true);
      setError(null);
      setIsExpired(false);

      try {
        const response = await fetch(`/api/compare/share/${shareId}`);

        if (response.status === 404) {
          setIsExpired(true);
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Ошибка загрузки сравнения");
        }

        const data: SharedComparisonResponse = await response.json();
        setTariffs(data.tariffs);

        // Показываем toast при открытии страницы
        if (data.tariffs.length > 0) {
          toast({
            title: "Вы просматриваете общее сравнение",
            description: "Вы можете скопировать тарифы в свое сравнение",
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Ошибка загрузки сравнения";
        setError(errorMessage);
        toast({
          title: "Ошибка",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparison();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  // Обработчик копирования тарифов в свое сравнение
  const handleCreateOwn = () => {
    if (tariffs.length === 0) {
      return;
    }

    // Копируем все тарифы в сравнение
    tariffs.forEach((tariff) => {
      addTariff(tariff.id);
    });

    // Переходим на страницу сравнения
    router.push("/compare");

    toast({
      title: "Тарифы скопированы в ваше сравнение",
      description: `Добавлено ${tariffs.length} ${tariffs.length === 1 ? "тариф" : tariffs.length < 5 ? "тарифа" : "тарифов"}`,
      variant: "success",
    });
  };

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-muted-foreground">Загрузка сравнения...</p>
          </div>
        </div>
      </div>
    );
  }

  // Состояние истекшей ссылки
  if (isExpired) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="max-w-md w-full text-center">
            <h1 className="text-3xl font-bold mb-4">Ссылка истекла</h1>
            <p className="text-muted-foreground mb-8">
              Эта ссылка для сравнения больше недействительна
            </p>
            <Link href="/">
              <Button>Перейти к списку хостингов</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Состояние ошибки
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="max-w-md w-full text-center">
            <h1 className="text-3xl font-bold mb-4">Ошибка</h1>
            <p className="text-muted-foreground mb-8">{error}</p>
            <Link href="/">
              <Button>Перейти к списку хостингов</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Основной контент - таблица сравнения
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Сравнение тарифов</h1>
          <p className="text-muted-foreground">
            Вы просматриваете общее сравнение
          </p>
        </div>
        <Button onClick={handleCreateOwn} variant="default">
          Создать свое сравнение
        </Button>
      </div>

      {tariffs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            Нет тарифов для сравнения
          </p>
        </div>
      ) : (
        <ComparisonTable tariffs={tariffs} />
      )}
    </div>
  );
}


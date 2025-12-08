"use client";

import { useState, useEffect } from "react";
import { Copy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/Dialog";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/lib/use-toast";

interface ShareComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  tariffIds: string[];
}

interface ShareResponse {
  shareId: string;
  url: string;
  expiresAt: string;
}

/**
 * Модальное окно для шаринга сравнения
 *
 * Особенности:
 * - Автоматическая генерация ссылки при открытии
 * - Копирование ссылки в буфер обмена
 * - Отображение срока действия ссылки
 * - Обработка состояний загрузки и ошибок
 */
export function ShareComparisonModal({
  isOpen,
  onClose,
  tariffIds,
}: ShareComparisonModalProps) {
  const [shareUrl, setShareUrl] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const { toast } = useToast();

  // Генерация ссылки при открытии модалки
  useEffect(() => {
    if (isOpen) {
      if (tariffIds.length >= 2) {
        generateShareLink();
      } else {
        setError("Для шаринга необходимо минимум 2 тарифа");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Сброс состояния при закрытии модалки
  useEffect(() => {
    if (!isOpen) {
      setShareUrl("");
      setExpiresAt(null);
      setError(null);
      setIsLoading(false);
      setIsCopying(false);
    }
  }, [isOpen]);

  // Генерация ссылки для шаринга
  const generateShareLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/compare/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tariffIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || "Ошибка при генерации ссылки. Попробуйте позже.";
        throw new Error(errorMessage);
      }

      const data: ShareResponse = await response.json();
      setShareUrl(data.url);
      setExpiresAt(new Date(data.expiresAt));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Неизвестная ошибка";

      let displayError = "Ошибка при генерации ссылки. Попробуйте позже.";

      if (errorMessage.includes("минимум 2")) {
        displayError = "Для шаринга необходимо минимум 2 тарифа";
      } else if (errorMessage.includes("максимум 5")) {
        displayError = "Максимум 5 тарифов для сравнения";
      } else if (errorMessage.includes("400")) {
        displayError = errorMessage;
      } else if (errorMessage.includes("500")) {
        displayError = "Ошибка при генерации ссылки. Попробуйте позже.";
      } else {
        displayError = errorMessage;
      }

      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  // Копирование ссылки в буфер обмена
  const handleCopy = async () => {
    if (!shareUrl) return;

    setIsCopying(true);

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Ссылка скопирована в буфер обмена",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Ошибка при копировании",
        description: "Не удалось скопировать ссылку в буфер обмена",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  // Форматирование даты истечения
  const formatExpiryDate = (date: Date): string => {
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Обработка закрытия модалки
  const handleClose = () => {
    if (!isLoading && !isCopying) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Поделиться сравнением</DialogTitle>
          <DialogDescription>
            Создайте ссылку для шаринга текущего сравнения тарифов
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Состояние загрузки */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Генерация ссылки...
              </span>
            </div>
          )}

          {/* Ошибка */}
          {error && !isLoading && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateShareLink}
                className="mt-2"
              >
                Попробовать снова
              </Button>
            </div>
          )}

          {/* Успешная генерация ссылки */}
          {!isLoading && !error && shareUrl && (
            <>
              {/* Поле со ссылкой */}
              <div className="space-y-2">
                <label
                  htmlFor="share-url"
                  className="text-sm font-medium leading-none"
                >
                  Ссылка для шаринга
                </label>
                <div className="flex gap-2">
                  <Input
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    disabled={isCopying}
                    title="Скопировать ссылку"
                  >
                    {isCopying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Срок действия */}
              {expiresAt && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Ссылка действительна до:</span>{" "}
                    {formatExpiryDate(expiresAt)}
                  </p>
                </div>
              )}

              {/* Кнопка копирования */}
              <Button
                type="button"
                onClick={handleCopy}
                disabled={isCopying}
                className="w-full"
              >
                {isCopying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Копирование...
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Скопировать ссылку
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading || isCopying}
          >
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


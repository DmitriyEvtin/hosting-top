"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/shared/ui/Label";
import { useSavedComparisons } from "@/views/compare/model/useSavedComparisons";
import { useToast } from "@/shared/lib/use-toast";

interface SaveComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  tariffIds: string[];
}

/**
 * Модальное окно для сохранения сравнения
 * 
 * Особенности:
 * - Валидация названия (1-100 символов)
 * - Обработка ошибок сервера
 * - Состояния загрузки
 * - Автоматическое закрытие при успешном сохранении
 */
export function SaveComparisonModal({
  isOpen,
  onClose,
  tariffIds,
}: SaveComparisonModalProps) {
  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { saveComparison } = useSavedComparisons();
  const { toast } = useToast();

  // Сброс формы при открытии/закрытии модалки
  useEffect(() => {
    if (isOpen) {
      setName("");
      setValidationError(null);
      setServerError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  // Валидация названия
  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return "Название обязательно для заполнения";
    }
    if (trimmed.length > 100) {
      return "Название должно быть от 1 до 100 символов";
    }
    return null;
  };

  // Обработка изменения поля названия
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);

    // Очищаем ошибки при вводе
    if (validationError) {
      setValidationError(null);
    }
    if (serverError) {
      setServerError(null);
    }

    // Валидация в реальном времени (только если поле не пустое)
    if (value.trim().length > 0) {
      const error = validateName(value);
      setValidationError(error);
    }
  };

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация перед отправкой
    const trimmedName = name.trim();
    const error = validateName(trimmedName);
    
    if (error) {
      setValidationError(error);
      return;
    }

    // Проверка наличия тарифов
    if (tariffIds.length === 0) {
      setServerError("Нет тарифов для сохранения");
      return;
    }

    setIsSaving(true);
    setServerError(null);
    setValidationError(null);

    try {
      await saveComparison(trimmedName, tariffIds);

      // Успешное сохранение
      toast({
        title: "Сравнение сохранено",
        description: `Сравнение "${trimmedName}" успешно сохранено`,
      });

      // Закрываем модалку
      onClose();
    } catch (err) {
      // Обработка ошибок
      const errorMessage =
        err instanceof Error ? err.message : "Неизвестная ошибка";

      let displayError = "Ошибка при сохранении сравнения. Попробуйте позже.";

      // Специфичные сообщения об ошибках
      if (errorMessage.includes("лимит") || errorMessage.includes("limit")) {
        displayError =
          "Достигнут лимит сохраненных сравнений (10). Удалите старое сравнение.";
      } else if (
        errorMessage.includes("Не авторизован") ||
        errorMessage.includes("401")
      ) {
        displayError = "Необходимо войти в систему";
      } else if (errorMessage.includes("400")) {
        // Ошибка валидации на сервере
        displayError = errorMessage;
      } else if (errorMessage.includes("500")) {
        displayError = "Ошибка при сохранении сравнения. Попробуйте позже.";
      } else {
        // Используем сообщение от сервера, если оно есть
        displayError = errorMessage;
      }

      setServerError(displayError);
    } finally {
      setIsSaving(false);
    }
  };

  // Обработка закрытия модалки
  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  // Проверка валидности формы
  const isFormValid = name.trim().length > 0 && name.trim().length <= 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Сохранить сравнение</DialogTitle>
          <DialogDescription>
            Введите название для сохранения текущего сравнения тарифов
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Серверная ошибка */}
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}

          {/* Поле названия */}
          <div className="space-y-2">
            <Label htmlFor="comparison-name">
              Название сравнения <span className="text-red-500">*</span>
            </Label>
            <Input
              id="comparison-name"
              value={name}
              onChange={handleNameChange}
              placeholder="Введите название сравнения"
              disabled={isSaving}
              className={validationError ? "border-red-500" : ""}
              maxLength={100}
              autoFocus
            />
            {validationError && (
              <p className="text-sm text-red-500">{validationError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {name.length}/100 символов
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={!isFormValid || isSaving}>
              {isSaving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


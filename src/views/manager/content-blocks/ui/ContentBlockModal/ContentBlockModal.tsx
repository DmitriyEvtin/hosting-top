"use client";

import { useToast } from "@/shared/lib/use-toast";
import { Button } from "@/shared/ui/Button";
import { Checkbox } from "@/shared/ui/Checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/Dialog";
import { Input } from "@/shared/ui/Input";
import { Label } from "@/shared/ui/Label";
import { Textarea } from "@/shared/ui/Textarea";
import { useEffect, useState } from "react";

interface ContentBlock {
  id: string;
  key: string;
  title: string | null;
  content: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ContentBlockModalProps {
  open: boolean;
  mode: "create" | "edit";
  block: ContentBlock | null;
  onClose: () => void;
  onSave: () => void;
  hostingId?: string;
}

// Регулярное выражение для валидации key (snake_case)
const snakeCaseRegex = /^[a-z0-9_]+$/;

export function ContentBlockModal({
  open,
  mode,
  block,
  onClose,
  onSave,
  hostingId,
}: ContentBlockModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Форма
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Ошибки валидации
  const [keyError, setKeyError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  // Инициализация формы при открытии модального окна
  useEffect(() => {
    if (open) {
      if (mode === "edit" && block) {
        setKey(block.key);
        setTitle(block.title || "");
        setContent(block.content || "");
        setIsActive(block.isActive);
      } else {
        setKey("");
        setTitle("");
        setContent("");
        setIsActive(true);
      }
      // Сброс ошибок
      setKeyError(null);
      setTitleError(null);
      setContentError(null);
    }
  }, [open, mode, block]);

  // Валидация key
  const validateKey = (value: string): boolean => {
    if (!value.trim()) {
      setKeyError("Key обязателен");
      return false;
    }
    if (value.length > 255) {
      setKeyError("Key слишком длинный (максимум 255 символов)");
      return false;
    }
    if (!snakeCaseRegex.test(value)) {
      setKeyError(
        "Key должен быть в формате snake_case (только строчные буквы, цифры и подчеркивания)"
      );
      return false;
    }
    setKeyError(null);
    return true;
  };

  // Валидация title
  const validateTitle = (value: string): boolean => {
    if (value.length > 255) {
      setTitleError("Заголовок слишком длинный (максимум 255 символов)");
      return false;
    }
    setTitleError(null);
    return true;
  };

  // Валидация content
  const validateContent = (value: string): boolean => {
    if (value.length > 50000) {
      setContentError("Контент слишком длинный (максимум 50000 символов)");
      return false;
    }
    setContentError(null);
    return true;
  };

  // Обработка изменения key
  const handleKeyChange = (value: string) => {
    setKey(value);
    if (mode === "create") {
      validateKey(value);
    }
  };

  // Обработка изменения title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    validateTitle(value);
  };

  // Обработка изменения content
  const handleContentChange = (value: string) => {
    setContent(value);
    validateContent(value);
  };

  // Обработка сохранения
  const handleSave = async () => {
    // Валидация
    let isValid = true;

    if (mode === "create") {
      if (!validateKey(key)) {
        isValid = false;
      }
    }

    if (!validateTitle(title)) {
      isValid = false;
    }

    if (!validateContent(content)) {
      isValid = false;
    }

    if (!isValid) {
      toast({
        title: "Ошибка валидации",
        description: "Пожалуйста, исправьте ошибки в форме",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const url =
        mode === "create"
          ? "/api/manager/content-blocks"
          : `/api/manager/content-blocks/${block?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const body =
        mode === "create"
          ? {
              key: key.trim(),
              title: title.trim() || undefined,
              content: content.trim() || undefined,
              type: hostingId || undefined,
              isActive,
            }
          : {
              title: title.trim() || undefined,
              content: content.trim() || undefined,
              isActive,
            };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = "Ошибка сохранения блока контента";
        let data: { error?: string; details?: Array<{ path: string[]; message: string }> } = {};

        try {
          data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // Если ответ не содержит JSON, используем сообщение по умолчанию
        }

        // Обработка ошибок валидации от сервера
        if (response.status === 409) {
          setKeyError(data.error || "Блок контента с таким key уже существует");
          throw new Error(data.error || "Блок контента с таким key уже существует");
        }
        if (response.status === 400 && data.details) {
          // Обработка детальных ошибок валидации
          const errors = data.details;
          errors.forEach((error) => {
            if (error.path[0] === "key") {
              setKeyError(error.message);
            } else if (error.path[0] === "title") {
              setTitleError(error.message);
            } else if (error.path[0] === "content") {
              setContentError(error.message);
            }
          });
          throw new Error("Ошибка валидации данных");
        }
        throw new Error(errorMessage);
      }

      await response.json();

      toast({
        title: mode === "create" ? "Блок контента создан" : "Блок контента обновлен",
        description: `Блок "${key}" успешно ${mode === "create" ? "создан" : "обновлен"}`,
        variant: "success",
      });

      onSave();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка сохранения блока контента";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Создать блок контента" : "Редактировать блок контента"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Заполните форму для создания нового блока контента"
              : "Измените данные блока контента"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Key */}
          <div className="space-y-2">
            <Label htmlFor="key">
              Ключ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="key"
              value={key}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder="example_key"
              disabled={mode === "edit" || loading}
              readOnly={mode === "edit"}
              className={keyError ? "border-red-500" : ""}
            />
            {keyError && (
              <p className="text-sm text-red-500">{keyError}</p>
            )}
            <p className="text-sm text-gray-500">
              Уникальный ключ в формате snake_case (только строчные буквы, цифры и
              подчеркивания). Не может быть изменен после создания.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Заголовок блока контента"
              disabled={loading}
              maxLength={255}
              className={titleError ? "border-red-500" : ""}
            />
            {titleError && (
              <p className="text-sm text-red-500">{titleError}</p>
            )}
            <p className="text-sm text-gray-500">
              {title.length}/255 символов
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Содержимое</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Содержимое блока контента..."
              disabled={loading}
              rows={10}
              maxLength={50000}
              className={contentError ? "border-red-500" : ""}
            />
            {contentError && (
              <p className="text-sm text-red-500">{contentError}</p>
            )}
            <p className="text-sm text-gray-500">
              {content.length}/50000 символов
            </p>
          </div>

          {/* Is Active */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={loading}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Блок активен
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading
              ? mode === "create"
                ? "Создание..."
                : "Сохранение..."
              : mode === "create"
                ? "Создать"
                : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


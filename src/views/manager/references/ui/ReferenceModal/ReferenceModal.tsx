"use client";

import { useToast } from "@/shared/lib/use-toast";
import { generateSlug } from "@/shared/lib/slug-utils";
import { Button } from "@/shared/ui/Button";
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
import { useEffect, useState } from "react";

interface ReferenceItem {
  id: string;
  name: string;
  slug: string;
}

interface ReferenceModalProps {
  open: boolean;
  mode: "create" | "edit";
  item: ReferenceItem | null;
  type: string;
  title: string;
  apiEndpoint: string;
  onClose: () => void;
  onSave: () => void;
}

export function ReferenceModal({
  open,
  mode,
  item,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type: _type,
  title,
  apiEndpoint,
  onClose,
  onSave,
}: ReferenceModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  // Обновление slug при изменении названия
  useEffect(() => {
    if (name) {
      const generatedSlug = generateSlug(name);
      setSlug(generatedSlug);
    } else {
      setSlug("");
    }
  }, [name]);

  // Загрузка данных для редактирования
  useEffect(() => {
    if (open) {
      if (mode === "edit" && item) {
        setName(item.name);
        setSlug(item.slug);
      } else {
        setName("");
        setSlug("");
      }
    }
  }, [open, mode, item]);

  // Обработка сохранения
  const handleSave = async () => {
    // Валидация
    if (!name.trim()) {
      toast({
        title: "Ошибка валидации",
        description: "Название обязательно",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload: { name: string } = {
        name: name.trim(),
      };

      let response;
      if (mode === "create") {
        response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${apiEndpoint}/${item?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка сохранения");
      }

      toast({
        title: mode === "create" ? "Создано" : "Обновлено",
        description: `"${name}" успешно ${mode === "create" ? "создан" : "обновлен"}`,
        variant: "success",
      });

      onSave();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка сохранения";
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? `Создать ${title}` : `Редактировать ${title}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? `Заполните форму для создания нового элемента справочника "${title}"`
              : `Измените данные элемента справочника "${title}"`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Название <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (автоматически)</Label>
            <Input
              id="slug"
              value={slug}
              readOnly
              className="bg-muted cursor-not-allowed"
              placeholder="Slug будет сгенерирован автоматически"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


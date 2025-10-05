"use client";

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

interface Holding {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HoldingEditModalProps {
  holding: Holding | null;
  open: boolean;
  onClose: () => void;
  onSave: (holdingData: { name: string }) => Promise<void>;
  loading?: boolean;
}

export function HoldingEditModal({
  holding,
  open,
  onClose,
  onSave,
  loading = false,
}: HoldingEditModalProps) {
  const [formData, setFormData] = useState({
    name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>("");

  useEffect(() => {
    if (holding) {
      setFormData({
        name: holding.name,
      });
    } else {
      setFormData({
        name: "",
      });
    }
    setErrors({});
    setServerError("");
  }, [holding]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Название холдинга обязательно";
    } else if (formData.name.length > 100) {
      newErrors.name = "Название холдинга не должно превышать 100 символов";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setServerError("");

    try {
      await onSave({
        name: formData.name.trim(),
      });
      onClose();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Ошибка при сохранении"
      );
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {holding ? "Редактировать холдинг" : "Создать холдинг"}
          </DialogTitle>
          <DialogDescription>
            {holding
              ? "Внесите изменения в информацию о холдинге."
              : "Заполните информацию о новом холдинге."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название холдинга</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Введите название холдинга"
              className={errors.name ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : holding ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

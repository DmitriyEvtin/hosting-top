"use client";

import { Site } from "@/entities/site/model/types";
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
import { useEffect, useState } from "react";
import { Category } from "../../model/types";

interface CategoryEditModalProps {
  category: Category | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; siteIds: string[] }) => Promise<void>;
  sites: Site[];
  loading?: boolean;
}

export function CategoryEditModal({
  category,
  open,
  onClose,
  onSave,
  sites,
  loading = false,
}: CategoryEditModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    siteIds: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>("");

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        siteIds: category.sites?.map((cs) => cs.siteId) || [],
      });
    } else {
      setFormData({
        name: "",
        siteIds: [],
      });
    }
    setErrors({});
    setServerError("");
  }, [category, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Название обязательно";
    } else if (formData.name.length < 1) {
      newErrors.name = "Название должно содержать хотя бы 1 символ";
    } else if (formData.name.length > 100) {
      newErrors.name = "Название не должно превышать 100 символов";
    }

    if (formData.siteIds.length === 0) {
      newErrors.siteIds = "Выберите хотя бы один сайт";
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
        siteIds: formData.siteIds,
      });
      onClose();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Ошибка при сохранении"
      );
    }
  };

  const handleSiteToggle = (siteId: string) => {
    setFormData((prev) => {
      const isSelected = prev.siteIds.includes(siteId);
      return {
        ...prev,
        siteIds: isSelected
          ? prev.siteIds.filter((id) => id !== siteId)
          : [...prev.siteIds, siteId],
      };
    });
    // Очищаем ошибку при изменении выбора
    if (errors.siteIds) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.siteIds;
        return newErrors;
      });
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Редактировать категорию" : "Создать категорию"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Внесите изменения в информацию о категории."
              : "Заполните информацию о новой категории."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название категории</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Введите название категории"
              className={errors.name ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Сайты публикации</Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-4">
              {sites.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Нет доступных сайтов. Сначала создайте сайты.
                </p>
              ) : (
                sites.map((site) => (
                  <div key={site.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`site-${site.id}`}
                      checked={formData.siteIds.includes(site.id)}
                      onChange={() => handleSiteToggle(site.id)}
                      disabled={loading}
                    />
                    <Label
                      htmlFor={`site-${site.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {site.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
            {errors.siteIds && (
              <p className="text-sm text-red-500">{errors.siteIds}</p>
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
              {loading ? "Сохранение..." : category ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


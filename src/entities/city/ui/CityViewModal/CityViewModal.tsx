"use client";

import { Button } from "@/shared/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/Dialog";

interface City {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CityViewModalProps {
  city: City | null;
  open: boolean;
  onClose: () => void;
}

export function CityViewModal({ city, open, onClose }: CityViewModalProps) {
  if (!city) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Информация о городе</DialogTitle>
          <DialogDescription>
            Подробная информация о выбранном городе.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Название
            </label>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium">{city.name}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Дата создания
            </label>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm">{formatDate(city.createdAt)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Последнее обновление
            </label>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm">{formatDate(city.updatedAt)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

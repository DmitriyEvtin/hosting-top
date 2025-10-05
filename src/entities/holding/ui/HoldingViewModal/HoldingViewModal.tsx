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

interface Holding {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HoldingViewModalProps {
  holding: Holding | null;
  open: boolean;
  onClose: () => void;
}

export function HoldingViewModal({
  holding,
  open,
  onClose,
}: HoldingViewModalProps) {
  if (!holding) return null;

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
          <DialogTitle>Информация о холдинге</DialogTitle>
          <DialogDescription>
            Подробная информация о выбранном холдинге
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Название
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {holding.name}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Дата создания
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {formatDate(holding.createdAt)}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Последнее обновление
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {formatDate(holding.updatedAt)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

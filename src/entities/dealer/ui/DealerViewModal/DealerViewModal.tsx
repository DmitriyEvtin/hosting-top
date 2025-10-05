"use client";

import { Button } from "@/shared/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/Dialog";
import { Label } from "@/shared/ui/Label";
import { Dealer, DealerType } from "../../model/types";

interface DealerViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealer: Dealer | null;
}

export function DealerViewModal({
  open,
  onOpenChange,
  dealer,
}: DealerViewModalProps) {
  if (!dealer) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDealerTypeLabel = (type: DealerType) => {
    switch (type) {
      case DealerType.VIP:
        return "VIP";
      case DealerType.STANDARD:
        return "Стандарт";
      case DealerType.PREMIUM:
        return "Премиум";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Информация о дилере</DialogTitle>
          <DialogDescription>
            Подробная информация о дилере &quot;{dealer.name}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Основная информация</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Название
                </Label>
                <p className="text-sm font-medium">{dealer.name}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Тип дилера
                </Label>
                <p className="text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {getDealerTypeLabel(dealer.dealerType)}
                  </span>
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Холдинг
                </Label>
                <p className="text-sm">{dealer.holding?.name || "—"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Город
                </Label>
                <p className="text-sm">{dealer.city?.name || "—"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Ответственный менеджер
                </Label>
                <p className="text-sm">
                  {dealer.manager ? (
                    <span>
                      {dealer.manager.name} ({dealer.manager.email})
                    </span>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Финансовая информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Финансовая информация</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Общая сумма продаж
                </Label>
                <p className="text-sm font-medium">
                  {formatCurrency(dealer.totalSales)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Баланс (дебиторская задолженность)
                </Label>
                <p className="text-sm font-medium">
                  {formatCurrency(dealer.balance)}
                </p>
              </div>
            </div>
          </div>

          {/* Даты */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Даты</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Дата начала сотрудничества
                </Label>
                <p className="text-sm">
                  {dealer.cooperationStartDate
                    ? formatDate(dealer.cooperationStartDate)
                    : "—"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Дата последнего посещения
                </Label>
                <p className="text-sm">
                  {dealer.lastVisitDate
                    ? formatDate(dealer.lastVisitDate)
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Аудит */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Информация об изменениях</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Создано
                </Label>
                <p className="text-sm">
                  {formatDate(dealer.createdAt)}
                  {dealer.createdBy && (
                    <span className="text-muted-foreground ml-2">
                      пользователем {dealer.createdBy.name}
                    </span>
                  )}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Последнее обновление
                </Label>
                <p className="text-sm">
                  {formatDate(dealer.updatedAt)}
                  {dealer.updatedBy && (
                    <span className="text-muted-foreground ml-2">
                      пользователем {dealer.updatedBy.name}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

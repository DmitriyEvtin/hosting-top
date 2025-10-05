"use client";

import { useToast } from "@/shared/lib/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/Select";
import { useEffect, useState } from "react";
import {
  CreateDealerData,
  Dealer,
  DealerType,
  UpdateDealerData,
} from "../../model/types";

interface DealerEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealer?: Dealer | null;
  onSave: (data: CreateDealerData | UpdateDealerData) => Promise<void>;
  cities: Array<{ id: string; name: string }>;
  holdings: Array<{ id: string; name: string }>;
  managers: Array<{ id: string; name: string; email: string }>;
}

export function DealerEditModal({
  open,
  onOpenChange,
  dealer,
  onSave,
  cities,
  holdings,
  managers,
}: DealerEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateDealerData | UpdateDealerData>(
    {
      name: "",
      holdingId: undefined,
      cityId: undefined,
      dealerType: DealerType.VIP,
      totalSales: undefined,
      balance: undefined,
      managerId: undefined,
      cooperationStartDate: undefined,
      lastVisitDate: undefined,
    }
  );

  const isEditing = !!dealer;

  useEffect(() => {
    if (dealer) {
      setFormData({
        name: dealer.name,
        holdingId: dealer.holdingId || undefined,
        cityId: dealer.cityId || undefined,
        dealerType: dealer.dealerType,
        totalSales: dealer.totalSales,
        balance: dealer.balance,
        managerId: dealer.managerId || undefined,
        cooperationStartDate: dealer.cooperationStartDate,
        lastVisitDate: dealer.lastVisitDate,
      });
    } else {
      setFormData({
        name: "",
        holdingId: undefined,
        cityId: undefined,
        dealerType: DealerType.VIP,
        totalSales: undefined,
        balance: undefined,
        managerId: undefined,
        cooperationStartDate: undefined,
        lastVisitDate: undefined,
      });
    }
  }, [dealer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast({
        title: "Ошибка",
        description: "Название дилера обязательно",
        variant: "destructive",
      });
      return;
    }

    // Валидация сумм
    if (
      formData.totalSales !== undefined &&
      formData.totalSales !== null &&
      formData.totalSales < 0
    ) {
      toast({
        title: "Ошибка",
        description: "Сумма продаж должна быть положительным числом",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.balance !== undefined &&
      formData.balance !== null &&
      formData.balance < 0
    ) {
      toast({
        title: "Ошибка",
        description: "Баланс должен быть положительным числом",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
      toast({
        title: "Успех",
        description: isEditing ? "Дилер обновлен" : "Дилер создан",
      });
    } catch {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date?: Date | null) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const handleDateChange = (
    field: "cooperationStartDate" | "lastVisitDate",
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value ? new Date(value) : undefined,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Редактировать дилера" : "Создать дилера"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Внесите изменения в информацию о дилере"
              : "Заполните информацию о новом дилере"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Название */}
            <div className="md:col-span-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Введите название компании дилера"
                required
              />
            </div>

            {/* Холдинг */}
            <div>
              <Label htmlFor="holding">Холдинг</Label>
              <Select
                value={formData.holdingId || "none"}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    holdingId: value === "none" ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите холдинг" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не выбрано</SelectItem>
                  {holdings.map(holding => (
                    <SelectItem key={holding.id} value={holding.id}>
                      {holding.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Город */}
            <div>
              <Label htmlFor="city">Город</Label>
              <Select
                value={formData.cityId || "none"}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    cityId: value === "none" ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не выбрано</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Тип дилера */}
            <div>
              <Label htmlFor="dealerType">Тип дилера</Label>
              <Select
                value={formData.dealerType}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    dealerType: value as DealerType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DealerType.VIP}>VIP</SelectItem>
                  <SelectItem value={DealerType.STANDARD}>Стандарт</SelectItem>
                  <SelectItem value={DealerType.PREMIUM}>Премиум</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Менеджер */}
            <div>
              <Label htmlFor="manager">Ответственный менеджер</Label>
              <Select
                value={formData.managerId || "none"}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    managerId: value === "none" ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите менеджера" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не выбрано</SelectItem>
                  {managers.map(manager => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name} ({manager.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Сумма продаж */}
            <div>
              <Label htmlFor="totalSales">Сумма продаж</Label>
              <Input
                id="totalSales"
                type="number"
                step="0.01"
                min="0"
                value={formData.totalSales || ""}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    totalSales: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="0.00"
              />
            </div>

            {/* Баланс */}
            <div>
              <Label htmlFor="balance">
                Баланс (дебиторская задолженность)
              </Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                min="0"
                value={formData.balance || ""}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    balance: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="0.00"
              />
            </div>

            {/* Дата начала сотрудничества */}
            <div>
              <Label htmlFor="cooperationStartDate">
                Дата начала сотрудничества
              </Label>
              <Input
                id="cooperationStartDate"
                type="date"
                value={formatDateForInput(formData.cooperationStartDate)}
                onChange={e =>
                  handleDateChange("cooperationStartDate", e.target.value)
                }
              />
            </div>

            {/* Дата последнего посещения */}
            <div>
              <Label htmlFor="lastVisitDate">Дата последнего посещения</Label>
              <Input
                id="lastVisitDate"
                type="date"
                value={formatDateForInput(formData.lastVisitDate)}
                onChange={e =>
                  handleDateChange("lastVisitDate", e.target.value)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : isEditing ? "Обновить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

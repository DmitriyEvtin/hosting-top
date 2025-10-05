"use client";

import { Button } from "@/shared/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/Table";
import { Edit, Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dealer, DealerType } from "../../model/types";

interface DealerTableProps {
  dealers: Dealer[];
  onEdit: (dealer: Dealer) => void;
  onDelete: (dealer: Dealer) => void;
  onView: (dealer: Dealer) => void;
  loading?: boolean;
}

export function DealerTable({
  dealers,
  onEdit,
  onDelete,
  onView,
  loading = false,
}: DealerTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (dealerId: string) => {
    if (window.confirm("Вы уверены, что хотите удалить этого дилера?")) {
      setDeletingId(dealerId);
      try {
        const dealer = dealers.find(d => d.id === dealerId);
        if (dealer) {
          await onDelete(dealer);
        }
      } finally {
        setDeletingId(null);
      }
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (dealers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Дилеры не найдены</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Холдинг</TableHead>
            <TableHead>Город</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Сумма продаж</TableHead>
            <TableHead>Баланс</TableHead>
            <TableHead>Менеджер</TableHead>
            <TableHead>Дата сотрудничества</TableHead>
            <TableHead>Последний визит</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dealers.map(dealer => (
            <TableRow key={dealer.id}>
              <TableCell className="font-medium">{dealer.name}</TableCell>
              <TableCell>{dealer.holding?.name || "—"}</TableCell>
              <TableCell>{dealer.city?.name || "—"}</TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {getDealerTypeLabel(dealer.dealerType)}
                </span>
              </TableCell>
              <TableCell>{formatCurrency(dealer.totalSales)}</TableCell>
              <TableCell>{formatCurrency(dealer.balance)}</TableCell>
              <TableCell>{dealer.manager?.name || "—"}</TableCell>
              <TableCell>
                {dealer.cooperationStartDate
                  ? formatDate(dealer.cooperationStartDate)
                  : "—"}
              </TableCell>
              <TableCell>
                {dealer.lastVisitDate ? formatDate(dealer.lastVisitDate) : "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(dealer)}
                    className="h-8 w-8"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(dealer)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(dealer.id)}
                    disabled={deletingId === dealer.id}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

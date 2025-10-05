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
import { Holding } from "../../model/types";

interface HoldingTableProps {
  holdings: Holding[];
  onEdit: (holding: Holding) => void;
  onDelete: (holding: Holding) => void;
  onView: (holding: Holding) => void;
  loading?: boolean;
}

export function HoldingTable({
  holdings,
  onEdit,
  onDelete,
  onView,
  loading = false,
}: HoldingTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (holdingId: string) => {
    if (window.confirm("Вы уверены, что хотите удалить этот холдинг?")) {
      setDeletingId(holdingId);
      try {
        const holding = holdings.find(h => h.id === holdingId);
        if (holding) {
          await onDelete(holding);
        }
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Холдинги не найдены</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead>Последнее обновление</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map(holding => (
            <TableRow key={holding.id}>
              <TableCell className="font-medium">{holding.name}</TableCell>
              <TableCell>{formatDate(holding.createdAt)}</TableCell>
              <TableCell>{formatDate(holding.updatedAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(holding)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(holding)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(holding.id)}
                    disabled={deletingId === holding.id}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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

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
import { City } from "../../model/types";

interface CityTableProps {
  cities: City[];
  onEdit: (city: City) => void;
  onDelete: (city: City) => void;
  onView: (city: City) => void;
  loading?: boolean;
}

export function CityTable({
  cities,
  onEdit,
  onDelete,
  onView,
  loading = false,
}: CityTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (cityId: string) => {
    if (window.confirm("Вы уверены, что хотите удалить этот город?")) {
      setDeletingId(cityId);
      try {
        const city = cities.find(c => c.id === cityId);
        if (city) {
          await onDelete(city);
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

  if (cities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Города не найдены</p>
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
          {cities.map(city => (
            <TableRow key={city.id}>
              <TableCell className="font-medium">{city.name}</TableCell>
              <TableCell>{formatDate(city.createdAt)}</TableCell>
              <TableCell>{formatDate(city.updatedAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(city)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(city)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(city.id)}
                    disabled={deletingId === city.id}
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

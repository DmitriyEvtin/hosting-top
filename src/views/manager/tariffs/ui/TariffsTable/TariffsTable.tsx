"use client";

import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/Table";
import { Edit, Trash2 } from "lucide-react";

interface ReferenceItem {
  id: string;
  name: string;
  slug: string;
}

interface Tariff {
  id: string;
  name: string;
  currency: string;
  diskSpace: number | null;
  bandwidth: number | null;
  domainsCount: number | null;
  databasesCount: number | null;
  emailAccounts: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  cms: ReferenceItem[];
  controlPanels: ReferenceItem[];
  countries: ReferenceItem[];
  dataStores: ReferenceItem[];
  operationSystems: ReferenceItem[];
  programmingLanguages: ReferenceItem[];
}

interface TariffsTableProps {
  tariffs: Tariff[];
  onEdit: (tariff: Tariff) => void;
  onDelete: (tariff: Tariff) => void;
  loading?: boolean;
}

export function TariffsTable({
  tariffs,
  onEdit,
  onDelete,
  loading = false,
}: TariffsTableProps) {
  // Форматирование размера
  const formatSize = (size: number | null) => {
    if (size === null) return "—";
    return `${size} ГБ`;
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tariffs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          Тарифы не найдены. Добавьте первый тариф.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Диск</TableHead>
            <TableHead>Трафик</TableHead>
            <TableHead className="text-center">Статус</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tariffs.map(tariff => (
            <TableRow key={tariff.id}>
              <TableCell className="font-medium">{tariff.name}</TableCell>
              <TableCell>{formatSize(tariff.diskSpace)}</TableCell>
              <TableCell>{formatSize(tariff.bandwidth)}</TableCell>
              <TableCell className="text-center">
                <Badge variant={tariff.isActive ? "default" : "secondary"}>
                  {tariff.isActive ? "Активен" : "Неактивен"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(tariff)}
                    className="h-8 w-8 p-0"
                    title="Редактировать"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(tariff)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Удалить"
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

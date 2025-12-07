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
import { Edit, ExternalLink, Package, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Hosting {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  testPeriod: number | null;
  startYear: string | null;
  clients: number | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    tariffs: number;
    contentBlocks: number;
  };
}

interface HostingsTableProps {
  hostings: Hosting[];
  onEdit: (hosting: Hosting) => void;
  onDelete: (hosting: Hosting) => void;
  onViewTariffs: (hosting: Hosting) => void;
  loading?: boolean;
}

export function HostingsTable({
  hostings,
  onEdit,
  onDelete,
  onViewTariffs,
  loading = false,
}: HostingsTableProps) {
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

  if (hostings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          Хостинги не найдены. Добавьте первый хостинг.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Логотип</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Сайт</TableHead>
            <TableHead className="text-center">Контент блоков</TableHead>
            <TableHead className="text-center">Тестовый период</TableHead>
            <TableHead className="text-center">Дата запуска</TableHead>
            <TableHead className="text-center">Клиентов</TableHead>
            <TableHead className="text-center">Тарифов</TableHead>
            <TableHead className="text-center">Статус</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hostings.map(hosting => (
            <TableRow key={hosting.id}>
              <TableCell>
                {hosting.logoUrl ? (
                  <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100">
                    <Image
                      src={hosting.logoUrl}
                      alt={hosting.name}
                      fill
                      className="object-contain"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Нет</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/manager/hostings/${hosting.id}/edit`}
                  className="hover:underline"
                >
                  {hosting.name}
                </Link>
              </TableCell>
              <TableCell>
                {hosting.websiteUrl ? (
                  <a
                    href={hosting.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <span className="truncate max-w-[200px]">
                      {hosting.websiteUrl.replace(/^https?:\/\//, "")}
                    </span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <span>{hosting._count.contentBlocks}</span>
              </TableCell>
              <TableCell className="text-center">
                {hosting.testPeriod !== null ? (
                  <span>{hosting.testPeriod} дн.</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {hosting.startYear ? (
                  <span>{hosting.startYear}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {hosting.clients !== null ? (
                  <span>{hosting.clients}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span>{hosting._count.tariffs}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={hosting.isActive ? "default" : "secondary"}>
                  {hosting.isActive ? "Активен" : "Неактивен"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(hosting)}
                    className="h-8 w-8 p-0"
                    title="Редактировать"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewTariffs(hosting)}
                    className="h-8 w-8 p-0"
                    title="Тарифы"
                  >
                    <Package className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(hosting)}
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

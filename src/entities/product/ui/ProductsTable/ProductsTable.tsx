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
import { useState } from "react";
import { Product } from "../../model/types";

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  loading?: boolean;
}

export function ProductsTable({
  products,
  onEdit,
  onDelete,
  loading = false,
}: ProductsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (window.confirm(`Удалить товар "${product.name}"?`)) {
      setDeletingId(productId);
      try {
        await onDelete(product);
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

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          Нет товаров. Начните добавлять товары в каталог.
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
            <TableHead>Категория</TableHead>
            <TableHead>Сайты публикации</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                {product.category ? (
                  <span>{product.category.name}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {product.sites && product.sites.length > 0 ? (
                    product.sites.map((productSite) => (
                      <Badge key={productSite.siteId} variant="secondary">
                        {productSite.site.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">Нет сайтов</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatDate(product.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(product)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
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


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
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HostingsFilters } from "../HostingsFilters";
import { HostingsPagination } from "../HostingsPagination";
import { HostingsTable } from "../HostingsTable";

interface Hosting {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    tariffs: number;
  };
}

interface HostingsResponse {
  hostings: Hosting[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function HostingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hostings, setHostings] = useState<Hosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры и пагинация
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Модальное окно удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hostingToDelete, setHostingToDelete] = useState<Hosting | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Загрузка хостингов
  const fetchHostings = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(isActive !== "all" && { is_active: isActive }),
      });

      const response = await fetch(`/api/manager/hostings?${params}`);
      const data: HostingsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки хостингов");
      }

      setHostings(data.hostings);
      setTotalPages(data.pagination.pages);
      setTotalItems(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  // Обработчики фильтров
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleIsActiveChange = (value: string) => {
    setIsActive(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setIsActive("all");
    setPage(1);
  };

  // Обработчики пагинации
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Обработчики действий
  const handleCreateHosting = () => {
    router.push("/manager/hostings/new");
  };

  const handleEditHosting = (hosting: Hosting) => {
    router.push(`/manager/hostings/${hosting.id}/edit`);
  };

  const handleViewTariffs = (hosting: Hosting) => {
    router.push(`/manager/hostings/${hosting.id}/tariffs`);
  };

  const handleDeleteClick = (hosting: Hosting) => {
    setHostingToDelete(hosting);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!hostingToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/manager/hostings/${hostingToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка удаления хостинга");
      }

      toast({
        title: "Хостинг удален",
        description: `Хостинг "${hostingToDelete.name}" успешно удален`,
        variant: "success",
      });

      setDeleteDialogOpen(false);
      setHostingToDelete(null);
      await fetchHostings();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка удаления хостинга";
      toast({
        title: "Ошибка удаления",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleRefresh = () => {
    fetchHostings();
  };

  // Загружаем хостинги при изменении параметров
  useEffect(() => {
    fetchHostings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, isActive]);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление хостингами</h1>
          <p className="mt-2 text-gray-600">
            Создание, редактирование и управление хостингами
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={handleCreateHosting}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Добавить хостинг
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Обновить
          </Button>
        </div>
      </div>

      {/* Фильтры */}
      <div>
        <HostingsFilters
          search={search}
          isActive={isActive}
          onSearchChange={handleSearchChange}
          onIsActiveChange={handleIsActiveChange}
          onClear={handleClearFilters}
        />
      </div>

      {/* Ошибка загрузки данных */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Повторить
          </Button>
        </div>
      )}

      {/* Таблица хостингов */}
      <div className="bg-white rounded-lg border">
        <HostingsTable
          hostings={hostings}
          onEdit={handleEditHosting}
          onDelete={handleDeleteClick}
          onViewTariffs={handleViewTariffs}
          loading={loading}
        />
      </div>

      {/* Пагинация */}
      {totalPages > 0 && (
        <div>
          <HostingsPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={limit}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              {hostingToDelete?._count.tariffs > 0 ? (
                <>
                  Хостинг "{hostingToDelete?.name}" имеет{" "}
                  {hostingToDelete._count.tariffs} тарифов. Удаление хостинга
                  невозможно, пока не будут удалены все связанные тарифы.
                </>
              ) : (
                <>
                  Вы уверены, что хотите удалить хостинг "
                  {hostingToDelete?.name}"? Это действие нельзя отменить.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Отмена
            </Button>
            {hostingToDelete?._count.tariffs === 0 && (
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? "Удаление..." : "Удалить"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


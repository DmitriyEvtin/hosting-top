"use client";

import { HoldingEditModal } from "@/entities/holding/ui/HoldingEditModal";
import { HoldingsFilters } from "@/entities/holding/ui/HoldingsFilters";
import { HoldingsPagination } from "@/entities/holding/ui/HoldingsPagination";
import { HoldingTable } from "@/entities/holding/ui/HoldingTable";
import { HoldingViewModal } from "@/entities/holding/ui/HoldingViewModal";
import { Button } from "@/shared/ui/Button";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Holding {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface HoldingsResponse {
  holdings: Holding[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

export function HoldingsPage() {
  const router = useRouter();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры и пагинация
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Модальные окна
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Загрузка холдингов
  const fetchHoldings = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/crm/holdings?${params}`);
      const data: HoldingsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки холдингов");
      }

      setHoldings(data.holdings);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  // Обработчики фильтров
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Сбрасываем на первую страницу при поиске
  };

  const handleClearFilters = () => {
    setSearch("");
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

  // Обработчики холдингов
  const handleCreateHolding = () => {
    setSelectedHolding(null);
    setIsCreating(true);
    setEditModalOpen(true);
  };

  const handleEditHolding = (holding: Holding) => {
    setSelectedHolding(holding);
    setIsCreating(false);
    setEditModalOpen(true);
  };

  const handleViewHolding = (holding: Holding) => {
    setSelectedHolding(holding);
    setViewModalOpen(true);
  };

  const handleDeleteHolding = async (holdingId: string) => {
    try {
      const response = await fetch(`/api/crm/holdings/${holdingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка удаления холдинга");
      }

      // Обновляем список холдингов
      await fetchHoldings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления холдинга");
    }
  };

  const handleSaveHolding = async (holdingData: { name: string }) => {
    try {
      if (isCreating) {
        // Создание нового холдинга
        const response = await fetch("/api/crm/holdings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(holdingData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Ошибка создания холдинга");
        }
      } else if (selectedHolding) {
        // Обновление существующего холдинга
        const response = await fetch(
          `/api/crm/holdings/${selectedHolding.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(holdingData),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Ошибка обновления холдинга");
        }
      }

      // Обновляем список холдингов
      await fetchHoldings();
    } catch (err) {
      // Не устанавливаем ошибку на странице, только пробрасываем в модальное окно
      throw err; // Пробрасываем ошибку для отображения в модальном окне
    }
  };

  const handleRefresh = () => {
    fetchHoldings();
  };

  // Загружаем холдинги при изменении параметров
  useEffect(() => {
    fetchHoldings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Управление холдингами
              </h1>
              <p className="mt-2 text-gray-600">
                Создание, редактирование и управление холдингами системы
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleCreateHolding}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Создать холдинг
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
        <div className="mb-6">
          <HoldingsFilters
            search={search}
            onSearchChange={handleSearchChange}
            onClear={handleClearFilters}
          />
        </div>

        {/* Ошибка загрузки данных */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Таблица холдингов */}
        <div className="bg-white rounded-lg border">
          <HoldingTable
            holdings={holdings}
            onEdit={handleEditHolding}
            onDelete={handleDeleteHolding}
            onView={handleViewHolding}
            loading={loading}
          />
        </div>

        {/* Пагинация */}
        {totalPages > 0 && (
          <div className="mt-6">
            <HoldingsPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}

        {/* Модальные окна */}
        <HoldingEditModal
          holding={selectedHolding}
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveHolding}
        />

        <HoldingViewModal
          holding={selectedHolding}
          open={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
        />
      </div>
    </div>
  );
}

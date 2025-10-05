"use client";

import {
  CreateDealerData,
  Dealer,
  DealerFilters,
  DealerListResponse,
  UpdateDealerData,
} from "@/entities/dealer/model";
import {
  DealerEditModal,
  DealerFilters as DealerFiltersComponent,
  DealerPagination,
  DealerTable,
  DealerViewModal,
} from "@/entities/dealer/ui";
import { useToast } from "@/shared/lib/use-toast";
import { Button } from "@/shared/ui/Button";
import { ArrowLeft, Download, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function DealersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры и пагинация
  const [filters, setFilters] = useState<DealerFilters>({
    search: "",
    cityId: "",
    holdingId: "",
    managerId: "",
    dealerType: "",
    cooperationStartDateFrom: "",
    cooperationStartDateTo: "",
    lastVisitDateFrom: "",
    lastVisitDateTo: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Модальные окна
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Справочные данные
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
  const [holdings, setHoldings] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [managers, setManagers] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);

  // Загрузка дилеров
  const fetchDealers = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.cityId && { cityId: filters.cityId }),
        ...(filters.holdingId && { holdingId: filters.holdingId }),
        ...(filters.managerId && { managerId: filters.managerId }),
        ...(filters.dealerType && { dealerType: filters.dealerType }),
        ...(filters.cooperationStartDateFrom && {
          cooperationStartDateFrom: filters.cooperationStartDateFrom,
        }),
        ...(filters.cooperationStartDateTo && {
          cooperationStartDateTo: filters.cooperationStartDateTo,
        }),
        ...(filters.lastVisitDateFrom && {
          lastVisitDateFrom: filters.lastVisitDateFrom,
        }),
        ...(filters.lastVisitDateTo && {
          lastVisitDateTo: filters.lastVisitDateTo,
        }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      });

      const response = await fetch(`/api/dealers?${params}`);
      const data: DealerListResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при загрузке дилеров");
      }

      setDealers(data.dealers);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch (error) {
      console.error("Ошибка при загрузке дилеров:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить дилеров",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters, toast]);

  // Загрузка справочных данных
  const fetchReferenceData = async () => {
    try {
      const [citiesRes, holdingsRes, managersRes] = await Promise.all([
        fetch("/api/cities"),
        fetch("/api/holdings"),
        fetch("/api/users"),
      ]);

      const [citiesData, holdingsData, managersData] = await Promise.all([
        citiesRes.json(),
        holdingsRes.json(),
        managersRes.json(),
      ]);

      if (citiesRes.ok) {
        setCities(citiesData.cities || []);
      }

      if (holdingsRes.ok) {
        setHoldings(holdingsData.holdings || []);
      }

      if (managersRes.ok) {
        setManagers(managersData.users || []);
      }
    } catch (error) {
      console.error("Ошибка при загрузке справочных данных:", error);
    }
  };

  // Обработчики
  const handleCreate = () => {
    setSelectedDealer(null);
    setIsCreating(true);
    setEditModalOpen(true);
  };

  const handleEdit = (dealer: Dealer) => {
    setSelectedDealer(dealer);
    setIsCreating(false);
    setEditModalOpen(true);
  };

  const handleView = (dealer: Dealer) => {
    setSelectedDealer(dealer);
    setViewModalOpen(true);
  };

  const handleDelete = async (dealer: Dealer) => {
    try {
      const response = await fetch(`/api/dealers/${dealer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Ошибка при удалении дилера");
      }

      toast({
        title: "Успех",
        description: "Дилер удален",
      });

      await fetchDealers();
    } catch (error) {
      console.error("Ошибка при удалении дилера:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить дилера",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (data: CreateDealerData | UpdateDealerData) => {
    try {
      const url = isCreating
        ? "/api/dealers"
        : `/api/dealers/${selectedDealer?.id}`;
      const method = isCreating ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при сохранении дилера");
      }

      await fetchDealers();
    } catch (error) {
      console.error("Ошибка при сохранении дилера:", error);
      throw error;
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(filters.search && { search: filters.search }),
        ...(filters.cityId && { cityId: filters.cityId }),
        ...(filters.holdingId && { holdingId: filters.holdingId }),
        ...(filters.managerId && { managerId: filters.managerId }),
        ...(filters.dealerType && { dealerType: filters.dealerType }),
        ...(filters.cooperationStartDateFrom && {
          cooperationStartDateFrom: filters.cooperationStartDateFrom,
        }),
        ...(filters.cooperationStartDateTo && {
          cooperationStartDateTo: filters.cooperationStartDateTo,
        }),
        ...(filters.lastVisitDateFrom && {
          lastVisitDateFrom: filters.lastVisitDateFrom,
        }),
        ...(filters.lastVisitDateTo && {
          lastVisitDateTo: filters.lastVisitDateTo,
        }),
      });

      const response = await fetch(`/api/dealers/export?${params}`);

      if (!response.ok) {
        throw new Error("Ошибка при экспорте");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dealers-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Успех",
        description: "Экспорт завершен",
      });
    } catch (error) {
      console.error("Ошибка при экспорте:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось экспортировать данные",
        variant: "destructive",
      });
    }
  };

  const handleFiltersChange = (newFilters: DealerFilters) => {
    setFilters(newFilters);
    setPage(1); // Сброс на первую страницу при изменении фильтров
  };

  const handleFiltersReset = () => {
    setFilters({
      search: "",
      cityId: "",
      holdingId: "",
      managerId: "",
      dealerType: "",
      cooperationStartDateFrom: "",
      cooperationStartDateTo: "",
      lastVisitDateFrom: "",
      lastVisitDateTo: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Загрузка данных при монтировании и изменении параметров
  useEffect(() => {
    fetchDealers();
  }, [page, limit, filters, fetchDealers]);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Дилеры</h1>
            <p className="text-muted-foreground">
              Управление дилерами и их информацией
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          <Button variant="outline" onClick={fetchDealers} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Обновить
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить дилера
          </Button>
        </div>
      </div>

      {/* Фильтры */}
      <DealerFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleFiltersReset}
        cities={cities}
        holdings={holdings}
        managers={managers}
      />

      {/* Таблица */}
      <DealerTable
        dealers={dealers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        loading={loading}
      />

      {/* Пагинация */}
      {totalPages > 0 && (
        <DealerPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Модальные окна */}
      <DealerEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        dealer={selectedDealer}
        onSave={handleSave}
        cities={cities}
        holdings={holdings}
        managers={managers}
      />

      <DealerViewModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        dealer={selectedDealer}
      />
    </div>
  );
}

"use client";

import { City, CityListResponse } from "@/entities/city/model/types";
import {
  CitiesFilters,
  CitiesPagination,
  CityEditModal,
  CityTable,
  CityViewModal,
} from "@/entities/city/ui";
import { useToast } from "@/shared/lib/use-toast";
import { Button } from "@/shared/ui/Button";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CitiesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры и пагинация
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Модальные окна
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Загрузка городов
  const fetchCities = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/cities?${params}`);
      const data: CityListResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки городов");
      }

      setCities(data.cities);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: err instanceof Error ? err.message : "Неизвестная ошибка",
      });
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

  // Обработчики модальных окон
  const handleCreateCity = () => {
    setSelectedCity(null);
    setIsCreating(true);
    setEditModalOpen(true);
  };

  const handleEditCity = (city: City) => {
    setSelectedCity(city);
    setIsCreating(false);
    setEditModalOpen(true);
  };

  const handleViewCity = (city: City) => {
    setSelectedCity(city);
    setViewModalOpen(true);
  };

  const handleDeleteCity = async (city: City) => {
    try {
      const response = await fetch(`/api/cities/${city.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка при удалении города");
      }

      toast({
        variant: "success",
        title: "Город удален",
        description: `Город "${city.name}" успешно удален`,
      });

      await fetchCities();
    } catch (error) {
      console.error("Ошибка при удалении города:", error);
      toast({
        variant: "destructive",
        title: "Ошибка удаления",
        description:
          error instanceof Error ? error.message : "Ошибка при удалении города",
      });
    }
  };

  const handleSaveCity = async (cityData: { name: string }) => {
    try {
      if (isCreating) {
        const response = await fetch("/api/cities", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cityData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Ошибка при создании города");
        }

        toast({
          variant: "success",
          title: "Город создан",
          description: `Город "${cityData.name}" успешно создан`,
        });
      } else if (selectedCity) {
        const response = await fetch(`/api/cities/${selectedCity.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cityData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Ошибка при обновлении города");
        }

        toast({
          variant: "success",
          title: "Город обновлен",
          description: `Город "${cityData.name}" успешно обновлен`,
        });
      }

      await fetchCities();
      setEditModalOpen(false);
    } catch (error) {
      console.error("Ошибка при сохранении города:", error);
      toast({
        variant: "destructive",
        title: "Ошибка сохранения",
        description:
          error instanceof Error
            ? error.message
            : "Ошибка при сохранении города",
      });
      throw error;
    }
  };

  const handleRefresh = () => {
    fetchCities();
  };

  // Загрузка данных при изменении параметров
  useEffect(() => {
    fetchCities();
  }, [page, limit, search]); // eslint-disable-line react-hooks/exhaustive-deps

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
                Управление городами
              </h1>
              <p className="mt-2 text-gray-600">
                Создание, редактирование и управление городами системы
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleCreateCity}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Создать город
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
          <CitiesFilters
            search={search}
            onSearchChange={handleSearchChange}
            onClear={handleClearFilters}
          />
        </div>

        {/* Таблица городов */}
        <div className="bg-white rounded-lg border">
          <CityTable
            cities={cities}
            onEdit={handleEditCity}
            onDelete={handleDeleteCity}
            onView={handleViewCity}
            loading={loading}
          />
        </div>

        {/* Пагинация */}
        {totalPages > 0 && (
          <div className="mt-6">
            <CitiesPagination
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
        <CityEditModal
          city={selectedCity}
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveCity}
        />

        <CityViewModal
          city={selectedCity}
          open={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
        />
      </div>
    </div>
  );
}

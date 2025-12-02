"use client";

import { Category } from "@/entities/category/model/types";
import {
  CategoryEditModal,
  CategoriesFilters,
  CategoriesTable,
} from "@/entities/category/ui";
import { Site } from "@/entities/site/model/types";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { UserRole } from "@/shared/lib/types";
import { useToast } from "@/shared/lib/use-toast";
import { Button } from "@/shared/ui/Button";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(
    null
  );

  // Проверка прав доступа
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      if (!hasManagerOrAdminAccess(session.user.role as UserRole)) {
        toast({
          variant: "destructive",
          title: "Доступ запрещен",
          description: "У вас нет прав для доступа к этой странице",
        });
        router.push("/");
      }
    }
  }, [status, session, router, toast]);

  // Загрузка категорий
  const fetchCategories = async (siteId?: string | null) => {
    setLoading(true);

    try {
      const url = siteId
        ? `/api/categories?siteId=${siteId}`
        : "/api/categories";
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки категорий");
      }

      setCategories(data.categories || []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description:
          err instanceof Error ? err.message : "Неизвестная ошибка",
      });
    } finally {
      setLoading(false);
    }
  };

  // Загрузка сайтов
  const fetchSites = async () => {
    try {
      const response = await fetch("/api/sites");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки сайтов");
      }

      setSites(data.sites || []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description:
          err instanceof Error ? err.message : "Неизвестная ошибка",
      });
    }
  };

  // Обработчики модальных окон
  const handleCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка при удалении категории");
      }

      toast({
        variant: "success",
        title: "Категория удалена",
        description: `Категория "${category.name}" успешно удалена`,
      });

      await fetchCategories(selectedSiteFilter);
    } catch (error) {
      console.error("Ошибка при удалении категории:", error);
      toast({
        variant: "destructive",
        title: "Ошибка удаления",
        description:
          error instanceof Error
            ? error.message
            : "Ошибка при удалении категории",
      });
    }
  };

  const handleSave = async (categoryData: {
    name: string;
    siteIds: string[];
    image?: string | null;
  }) => {
    try {
      if (editingCategory) {
        // Обновление существующей категории
        const response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        });

        if (!response.ok) {
          const error = await response.json();
          const errorMessage =
            error.error === "Category name already exists"
              ? "Категория с таким названием уже существует"
              : error.error || "Ошибка при обновлении категории";
          throw new Error(errorMessage);
        }

        toast({
          variant: "success",
          title: "Категория обновлена",
          description: `Категория "${categoryData.name}" успешно обновлена`,
        });
      } else {
        // Создание новой категории
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        });

        if (!response.ok) {
          const error = await response.json();
          const errorMessage =
            error.error === "Category name already exists"
              ? "Категория с таким названием уже существует"
              : error.error || "Ошибка при создании категории";
          throw new Error(errorMessage);
        }

        toast({
          variant: "success",
          title: "Категория создана",
          description: `Категория "${categoryData.name}" успешно создана`,
        });
      }

      await fetchCategories(selectedSiteFilter);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Ошибка при сохранении категории:", error);
      toast({
        variant: "destructive",
        title: "Ошибка сохранения",
        description:
          error instanceof Error
            ? error.message
            : "Ошибка при сохранении категории",
      });
      throw error;
    }
  };

  const handleRefresh = () => {
    fetchCategories(selectedSiteFilter);
  };

  const handleSiteFilterChange = (siteId: string | null) => {
    setSelectedSiteFilter(siteId);
    fetchCategories(siteId);
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    if (status === "authenticated") {
      fetchSites();
      fetchCategories();
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Показываем загрузку, если проверяем сессию
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Проверка прав доступа
  if (
    status === "authenticated" &&
    session?.user?.role &&
    !hasManagerOrAdminAccess(session.user.role as UserRole)
  ) {
    return null; // Редирект уже произошел в useEffect
  }

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
                Управление категориями
              </h1>
              <p className="mt-2 text-gray-600">
                Создание, редактирование и управление категориями товаров
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Button
              onClick={handleCreate}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Добавить категорию
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
            <CategoriesFilters
              sites={sites}
              selectedSiteId={selectedSiteFilter}
              onSiteChange={handleSiteFilterChange}
            />
          </div>
        </div>

        {/* Таблица категорий */}
        <div className="bg-white rounded-lg border">
          <CategoriesTable
            categories={categories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        </div>

        {/* Модальное окно */}
        <CategoryEditModal
          category={editingCategory}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          sites={sites}
        />
      </div>
    </div>
  );
}


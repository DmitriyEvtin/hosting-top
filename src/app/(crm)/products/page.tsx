"use client";

import { Category } from "@/entities/category/model/types";
import { Product } from "@/entities/product/model/types";
import {
  ProductEditModal,
  ProductsFilters,
  ProductsTable,
} from "@/entities/product/ui";
import { Site } from "@/entities/site/model/types";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { UserRole } from "@/shared/lib/types";
import { useToast } from "@/shared/lib/use-toast";
import { Button } from "@/shared/ui/Button";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string | null>(
    null
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  // Загрузка товаров
  const fetchProducts = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (selectedSiteFilter) {
        params.append("siteId", selectedSiteFilter);
      }
      if (selectedCategoryFilter) {
        params.append("categoryId", selectedCategoryFilter);
      }

      const url = params.toString()
        ? `/api/products?${params.toString()}`
        : "/api/products";
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки товаров");
      }

      setProducts(data.products || []);
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

  // Загрузка категорий
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
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
    }
  };

  // Обработчики модальных окон
  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка при удалении товара");
      }

      toast({
        variant: "success",
        title: "Товар удален",
        description: `Товар "${product.name}" успешно удален`,
      });

      await fetchProducts();
    } catch (error) {
      console.error("Ошибка при удалении товара:", error);
      toast({
        variant: "destructive",
        title: "Ошибка удаления",
        description:
          error instanceof Error
            ? error.message
            : "Ошибка при удалении товара",
      });
    }
  };

  const handleSave = async (productData: {
    name: string;
    categoryId: string | null;
    siteIds: string[];
  }) => {
    try {
      if (editingProduct) {
        // Обновление существующего товара
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Ошибка при обновлении товара");
        }

        toast({
          variant: "success",
          title: "Товар обновлен",
          description: `Товар "${productData.name}" успешно обновлен`,
        });
      } else {
        // Создание нового товара
        const response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Ошибка при создании товара");
        }

        toast({
          variant: "success",
          title: "Товар создан",
          description: `Товар "${productData.name}" успешно создан`,
        });
      }

      await fetchProducts();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Ошибка при сохранении товара:", error);
      toast({
        variant: "destructive",
        title: "Ошибка сохранения",
        description:
          error instanceof Error
            ? error.message
            : "Ошибка при сохранении товара",
      });
      throw error;
    }
  };

  const handleRefresh = () => {
    fetchProducts();
  };

  const handleSiteFilterChange = (siteId: string | null) => {
    setSelectedSiteFilter(siteId);
  };

  const handleCategoryFilterChange = (categoryId: string | null) => {
    setSelectedCategoryFilter(categoryId);
  };

  // Применение фильтров
  useEffect(() => {
    if (status === "authenticated") {
      fetchProducts();
    }
  }, [status, selectedSiteFilter, selectedCategoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

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
                Управление товарами
              </h1>
              <p className="mt-2 text-gray-600">
                Создание, редактирование и управление товарами каталога
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Button
              onClick={handleCreate}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Добавить товар
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
            <ProductsFilters
              sites={sites}
              categories={categories}
              selectedSiteId={selectedSiteFilter}
              selectedCategoryId={selectedCategoryFilter}
              onSiteChange={handleSiteFilterChange}
              onCategoryChange={handleCategoryFilterChange}
            />
          </div>
        </div>

        {/* Таблица товаров */}
        <div className="bg-white rounded-lg border">
          <ProductsTable
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        </div>

        {/* Модальное окно */}
        <ProductEditModal
          product={editingProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          sites={sites}
          categories={categories}
        />
      </div>
    </div>
  );
}


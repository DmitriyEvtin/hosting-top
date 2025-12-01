"use client";

import { Site } from "@/entities/site/model/types";
import { SiteEditModal, SitesTable } from "@/entities/site/ui";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { UserRole } from "@/shared/lib/types";
import { useToast } from "@/shared/lib/use-toast";
import { Button } from "@/shared/ui/Button";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SitesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

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

  // Загрузка сайтов
  const fetchSites = async () => {
    setLoading(true);

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
        description: err instanceof Error ? err.message : "Неизвестная ошибка",
      });
    } finally {
      setLoading(false);
    }
  };

  // Обработчики модальных окон
  const handleCreate = () => {
    setEditingSite(null);
    setIsModalOpen(true);
  };

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setIsModalOpen(true);
  };

  const handleDelete = async (site: Site) => {
    try {
      const response = await fetch(`/api/sites/${site.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка при удалении сайта");
      }

      toast({
        variant: "success",
        title: "Сайт удален",
        description: `Сайт "${site.name}" успешно удален`,
      });

      await fetchSites();
    } catch (error) {
      console.error("Ошибка при удалении сайта:", error);
      toast({
        variant: "destructive",
        title: "Ошибка удаления",
        description:
          error instanceof Error ? error.message : "Ошибка при удалении сайта",
      });
    }
  };

  const handleSave = async (siteData: { name: string }) => {
    try {
      if (editingSite) {
        // Обновление существующего сайта
        const response = await fetch(`/api/sites/${editingSite.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(siteData),
        });

        if (!response.ok) {
          const error = await response.json();
          const errorMessage =
            error.error === "Site name already exists"
              ? "Сайт с таким названием уже существует"
              : error.error || "Ошибка при обновлении сайта";
          throw new Error(errorMessage);
        }

        toast({
          variant: "success",
          title: "Сайт обновлен",
          description: `Сайт "${siteData.name}" успешно обновлен`,
        });
      } else {
        // Создание нового сайта
        const response = await fetch("/api/sites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(siteData),
        });

        if (!response.ok) {
          const error = await response.json();
          const errorMessage =
            error.error === "Site name already exists"
              ? "Сайт с таким названием уже существует"
              : error.error || "Ошибка при создании сайта";
          throw new Error(errorMessage);
        }

        toast({
          variant: "success",
          title: "Сайт создан",
          description: `Сайт "${siteData.name}" успешно создан`,
        });
      }

      await fetchSites();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Ошибка при сохранении сайта:", error);
      toast({
        variant: "destructive",
        title: "Ошибка сохранения",
        description:
          error instanceof Error ? error.message : "Ошибка при сохранении сайта",
      });
      throw error;
    }
  };

  const handleRefresh = () => {
    fetchSites();
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    if (status === "authenticated") {
      fetchSites();
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
                Управление сайтами
              </h1>
              <p className="mt-2 text-gray-600">
                Создание, редактирование и управление сайтами системы
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleCreate}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Добавить сайт
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

        {/* Таблица сайтов */}
        <div className="bg-white rounded-lg border">
          <SitesTable
            sites={sites}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        </div>

        {/* Модальное окно */}
        <SiteEditModal
          site={editingSite}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}


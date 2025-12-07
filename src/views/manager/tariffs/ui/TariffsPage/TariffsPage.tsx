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
import Link from "next/link";
import { useEffect, useState } from "react";
import { TariffModal } from "../TariffModal";
import { TariffsTable } from "../TariffsTable";

interface ReferenceItem {
  id: string;
  name: string;
  slug: string;
}

interface Tariff {
  id: string;
  name: string;
  price: string;
  currency: string;
  period: "MONTH" | "YEAR";
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

interface Hosting {
  id: string;
  name: string;
  slug: string;
}

interface TariffsPageProps {
  hostingId: string;
}

export function TariffsPage({ hostingId }: TariffsPageProps) {
  const { toast } = useToast();
  const [hosting, setHosting] = useState<Hosting | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Модальное окно тарифа
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null);

  // Модальное окно удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tariffToDelete, setTariffToDelete] = useState<Tariff | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Загрузка данных хостинга
  const fetchHosting = async () => {
    try {
      const response = await fetch(`/api/manager/hostings/${hostingId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки хостинга");
      }

      setHosting(data.hosting);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    }
  };

  // Загрузка тарифов
  const fetchTariffs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/manager/hostings/${hostingId}/tariffs`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки тарифов");
      }

      setTariffs(data.tariffs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  // Обработчики действий
  const handleCreate = () => {
    setModalMode("create");
    setSelectedTariff(null);
    setModalOpen(true);
  };

  const handleEdit = (tariff: Tariff) => {
    setModalMode("edit");
    setSelectedTariff(tariff);
    setModalOpen(true);
  };

  const handleDeleteClick = (tariff: Tariff) => {
    setTariffToDelete(tariff);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tariffToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/manager/tariffs/${tariffToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка удаления тарифа");
      }

      toast({
        title: "Тариф удален",
        description: `Тариф "${tariffToDelete.name}" успешно удален`,
        variant: "success",
      });

      setDeleteDialogOpen(false);
      setTariffToDelete(null);
      await fetchTariffs();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка удаления тарифа";
      toast({
        title: "Ошибка удаления",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    await fetchTariffs();
    setModalOpen(false);
  };

  const handleRefresh = () => {
    fetchTariffs();
  };

  // Загружаем данные при монтировании
  useEffect(() => {
    fetchHosting();
    fetchTariffs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/manager/hostings" className="hover:text-gray-900">
          Хостинги
        </Link>
        <span>/</span>
        {hosting && (
          <>
            <Link
              href={`/manager/hostings/${hosting.id}/edit`}
              className="hover:text-gray-900"
            >
              {hosting.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 font-medium">Тарифы</span>
      </nav>

      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Тарифы {hosting && `— ${hosting.name}`}
          </h1>
          <p className="mt-2 text-gray-600">Управление тарифами хостинга</p>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Добавить тариф
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
        </div>
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

      {/* Таблица тарифов */}
      <div className="bg-white rounded-lg border">
        <TariffsTable
          tariffs={tariffs}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          loading={loading}
        />
      </div>

      {/* Модальное окно тарифа */}
      {hosting && (
        <TariffModal
          open={modalOpen}
          mode={modalMode}
          tariff={selectedTariff}
          hostingId={hosting.id}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* Модальное окно подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить тариф "{tariffToDelete?.name}"? Это
              действие нельзя отменить.
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
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

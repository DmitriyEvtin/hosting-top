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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/Table";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ReferenceModal } from "../ReferenceModal";

interface ReferenceItem {
  id: string;
  name: string;
  slug: string;
}

interface ReferenceSectionProps {
  type: string;
  title: string;
  apiEndpoint: string;
  responseKey: string;
}

export function ReferenceSection({
  type,
  title,
  apiEndpoint,
  responseKey,
}: ReferenceSectionProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedItem, setSelectedItem] = useState<ReferenceItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ReferenceItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Загрузка данных
  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiEndpoint}?limit=1000`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки данных");
      }

      setItems(data[responseKey] || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка загрузки данных";
      setError(errorMessage);
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiEndpoint, responseKey]);

  // Обработка создания
  const handleCreate = () => {
    setSelectedItem(null);
    setModalMode("create");
    setModalOpen(true);
  };

  // Обработка редактирования
  const handleEdit = (item: ReferenceItem) => {
    setSelectedItem(item);
    setModalMode("edit");
    setModalOpen(true);
  };

  // Обработка сохранения
  const handleSave = async () => {
    await fetchItems();
    setModalOpen(false);
  };

  // Обработка удаления
  const handleDeleteClick = (item: ReferenceItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`${apiEndpoint}/${itemToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        
        if (response.status === 409) {
          toast({
            title: "Ошибка удаления",
            description: data.error || "Нельзя удалить справочник, который используется в тарифах",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error || "Ошибка удаления");
        }
        return;
      }

      toast({
        title: "Успешно",
        description: `"${itemToDelete.name}" успешно удален`,
        variant: "success",
      });

      await fetchItems();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка удаления";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

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

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <Button onClick={fetchItems} size="sm" className="mt-2">
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок и кнопка добавления */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Добавить
        </Button>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-lg border">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Справочник пуст. Добавьте первый элемент.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.slug}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 p-0"
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(item)}
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
        )}
      </div>

      {/* Модальное окно создания/редактирования */}
      <ReferenceModal
        open={modalOpen}
        mode={modalMode}
        item={selectedItem}
        type={type}
        title={title}
        apiEndpoint={apiEndpoint}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      {/* Модальное окно подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить &quot;{itemToDelete?.name}&quot;?
              Это действие нельзя отменить.
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


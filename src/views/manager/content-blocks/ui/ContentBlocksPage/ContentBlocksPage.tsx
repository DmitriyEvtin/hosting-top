"use client";

import { useToast } from "@/shared/lib/use-toast";
import { Badge } from "@/shared/ui/Badge";
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
import { Edit, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ContentBlockModal } from "../ContentBlockModal";
import { ContentBlocksFilters } from "../ContentBlocksFilters";

interface ContentBlock {
  id: string;
  key: string;
  title: string | null;
  content: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ContentBlocksResponse {
  contentBlocks: ContentBlock[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function ContentBlocksPage() {
  const { toast } = useToast();
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Модальное окно создания/редактирования
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null);

  // Модальное окно удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<ContentBlock | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Загрузка блоков контента
  const fetchContentBlocks = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(isActive !== "all" && { is_active: isActive }),
      });

      const response = await fetch(`/api/manager/content-blocks?${params}`);
      const data: ContentBlocksResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки блоков контента");
      }

      setContentBlocks(data.contentBlocks);
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

  // Обработчики действий
  const handleCreate = () => {
    setSelectedBlock(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const handleEdit = (block: ContentBlock) => {
    setSelectedBlock(block);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleDeleteClick = (block: ContentBlock) => {
    setBlockToDelete(block);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!blockToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/manager/content-blocks/${blockToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "Ошибка удаления блока контента";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // Если ответ не содержит JSON (например, 204), используем сообщение по умолчанию
        }
        throw new Error(errorMessage);
      }

      toast({
        title: "Блок контента удален",
        description: `Блок "${blockToDelete.key}" успешно удален`,
        variant: "success",
      });

      setDeleteDialogOpen(false);
      setBlockToDelete(null);
      await fetchContentBlocks();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка удаления блока контента";
      toast({
        title: "Ошибка удаления",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = () => {
    setModalOpen(false);
    setSelectedBlock(null);
    fetchContentBlocks();
  };

  const handleRefresh = () => {
    fetchContentBlocks();
  };

  // Загружаем блоки при изменении параметров
  useEffect(() => {
    fetchContentBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, isActive]);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Управление блоками контента
          </h1>
          <p className="mt-2 text-gray-600">
            Создание, редактирование и управление блоками контента
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={handleCreate}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Добавить блок
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
        <ContentBlocksFilters
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

      {/* Таблица блоков контента */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="space-y-4 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : contentBlocks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Блоки контента не найдены. Добавьте первый блок.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ключ</TableHead>
                  <TableHead>Заголовок</TableHead>
                  <TableHead className="text-center">Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentBlocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {block.key}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">
                      {block.title || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={block.isActive ? "default" : "secondary"}>
                        {block.isActive ? "Активен" : "Неактивен"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(block)}
                          className="h-8 w-8 p-0"
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(block)}
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
      <ContentBlockModal
        open={modalOpen}
        mode={modalMode}
        block={selectedBlock}
        onClose={() => {
          setModalOpen(false);
          setSelectedBlock(null);
        }}
        onSave={handleSave}
      />

      {/* Модальное окно подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить блок контента "
              {blockToDelete?.key}"? Это действие нельзя отменить.
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


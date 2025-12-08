"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Pencil,
  Trash2,
  Share2,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/Table";
import { Button } from "@/shared/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/Dialog";
import { Input } from "@/shared/ui/Input";
import { Label } from "@/shared/ui/Label";
import { useSavedComparisons, type Comparison } from "@/views/compare/model/useSavedComparisons";
import { ShareComparisonModal } from "@/views/compare/ui/ShareComparisonModal";
import { useToast } from "@/shared/lib/use-toast";

/**
 * Страница управления сохраненными сравнениями
 * 
 * Особенности:
 * - Отображение списка сохраненных сравнений
 * - Действия: открыть, переименовать, удалить, поделиться
 * - Пустое состояние когда нет сравнений
 * - Состояния загрузки и ошибок
 */
export function SavedComparisonsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    comparisons,
    isLoading,
    error,
    updateComparison,
    deleteComparison,
  } = useSavedComparisons();

  // Состояние для модалки переименования
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [comparisonToRename, setComparisonToRename] = useState<Comparison | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  // Состояние для модалки подтверждения удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [comparisonToDelete, setComparisonToDelete] = useState<Comparison | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Состояние для модалки шаринга
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [tariffIdsToShare, setTariffIdsToShare] = useState<string[]>([]);

  /**
   * Форматирование даты в читаемый формат (DD.MM.YYYY)
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Обработка открытия сравнения
   */
  const handleOpen = (comparison: Comparison) => {
    router.push(`/compare?saved=${comparison.id}`);
  };

  /**
   * Обработка открытия модалки переименования
   */
  const handleRenameClick = (comparison: Comparison) => {
    setComparisonToRename(comparison);
    setRenameValue(comparison.name);
    setRenameError(null);
    setRenameDialogOpen(true);
  };

  /**
   * Обработка сохранения переименования
   */
  const handleRenameSave = async () => {
    if (!comparisonToRename) return;

    const trimmedName = renameValue.trim();

    // Валидация
    if (!trimmedName) {
      setRenameError("Название не может быть пустым");
      return;
    }

    if (trimmedName.length < 1) {
      setRenameError("Название должно содержать минимум 1 символ");
      return;
    }

    if (trimmedName.length > 100) {
      setRenameError("Название не должно превышать 100 символов");
      return;
    }

    setIsRenaming(true);
    setRenameError(null);

    try {
      await updateComparison(comparisonToRename.id, trimmedName);
      toast({
        title: "Сравнение переименовано",
        variant: "success",
      });
      setRenameDialogOpen(false);
      setComparisonToRename(null);
      setRenameValue("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка при переименовании";
      setRenameError(errorMessage);
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRenaming(false);
    }
  };

  /**
   * Обработка открытия модалки подтверждения удаления
   */
  const handleDeleteClick = (comparison: Comparison) => {
    setComparisonToDelete(comparison);
    setDeleteDialogOpen(true);
  };

  /**
   * Обработка подтверждения удаления
   */
  const handleDeleteConfirm = async () => {
    if (!comparisonToDelete) return;

    setIsDeleting(true);

    try {
      await deleteComparison(comparisonToDelete.id);
      toast({
        title: "Сравнение удалено",
        variant: "success",
      });
      setDeleteDialogOpen(false);
      setComparisonToDelete(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка при удалении";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Обработка открытия модалки шаринга
   */
  const handleShareClick = (comparison: Comparison) => {
    if (comparison.tariffIds.length < 2) {
      toast({
        title: "Ошибка",
        description: "Для шаринга необходимо минимум 2 тарифа",
        variant: "destructive",
      });
      return;
    }
    setTariffIdsToShare(comparison.tariffIds);
    setShareModalOpen(true);
  };

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Загрузка сравнений...</span>
      </div>
    );
  }

  // Состояние ошибки
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg mb-4">
          {error.message || "Ошибка при загрузке сравнений"}
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Обновить страницу
        </Button>
      </div>
    );
  }

  // Пустое состояние
  if (comparisons.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">
          У вас пока нет сохраненных сравнений
        </h3>
        <p className="text-muted-foreground mb-4">
          Сохраните сравнение тарифов, чтобы оно появилось здесь
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Сохраненные сравнения</h1>
        <p className="text-muted-foreground">
          Управляйте вашими сохраненными сравнениями тарифов
        </p>
      </div>

      {/* Таблица сравнений */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead className="text-center">Тарифов</TableHead>
              <TableHead>Создано</TableHead>
              <TableHead>Обновлено</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisons.map((comparison) => (
              <TableRow key={comparison.id}>
                <TableCell className="font-medium">
                  {comparison.name}
                </TableCell>
                <TableCell className="text-center">
                  {comparison.tariffCount}
                </TableCell>
                <TableCell>{formatDate(comparison.createdAt)}</TableCell>
                <TableCell>{formatDate(comparison.updatedAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpen(comparison)}
                      title="Открыть сравнение"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRenameClick(comparison)}
                      title="Переименовать"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShareClick(comparison)}
                      title="Поделиться"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(comparison)}
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Модалка переименования */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Переименовать сравнение</DialogTitle>
            <DialogDescription>
              Введите новое название для сравнения
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-input">Название</Label>
              <Input
                id="rename-input"
                value={renameValue}
                onChange={(e) => {
                  setRenameValue(e.target.value);
                  setRenameError(null);
                }}
                placeholder="Введите название"
                disabled={isRenaming}
                maxLength={100}
              />
              {renameError && (
                <p className="text-sm text-destructive">{renameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {renameValue.length}/100 символов
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false);
                setRenameError(null);
                setRenameValue("");
              }}
              disabled={isRenaming}
            >
              Отмена
            </Button>
            <Button
              onClick={handleRenameSave}
              disabled={isRenaming || !renameValue.trim()}
            >
              {isRenaming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модалка подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить сравнение &quot;
              {comparisonToDelete?.name}&quot;? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setComparisonToDelete(null);
              }}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модалка шаринга */}
      <ShareComparisonModal
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setTariffIdsToShare([]);
        }}
        tariffIds={tariffIdsToShare}
      />
    </div>
  );
}


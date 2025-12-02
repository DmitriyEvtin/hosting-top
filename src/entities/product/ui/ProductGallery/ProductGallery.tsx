"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Progress } from "@/shared/ui/Progress";
import { useToast } from "@/shared/lib/use-toast";
import { ProductImage } from "../../model/types";
import { GripVertical, Image as ImageIcon, Trash2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface ProductGalleryProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  disabled?: boolean;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

/**
 * Компонент сортируемого элемента изображения
 */
function SortableImageItem({
  image,
  isMain,
  onDelete,
  disabled,
}: {
  image: ProductImage;
  isMain: boolean;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group bg-white rounded-lg border-2 overflow-hidden
        ${isDragging ? "border-blue-500 shadow-lg z-50" : "border-gray-200"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}
      `}
    >
      {/* Бейдж "Главное" */}
      {isMain && (
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="default" className="bg-blue-600 text-white">
            Главное
          </Badge>
        </div>
      )}

      {/* Изображение */}
      <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
        <img
          src={image.imageUrl}
          alt={`Изображение товара ${image.id}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Overlay с кнопками при наведении */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
        {/* Кнопка перетаскивания */}
        <div
          {...attributes}
          {...listeners}
          className={`
            p-2 rounded-full bg-white/90 hover:bg-white shadow-md
            ${disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}
          `}
          title="Перетащите для изменения порядка"
        >
          <GripVertical className="h-4 w-4 text-gray-600" />
        </div>

        {/* Кнопка удаления */}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="h-8 w-8 bg-white/90 hover:bg-white shadow-md"
          onClick={onDelete}
          disabled={disabled}
          title="Удалить изображение"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Компонент галереи изображений товара с drag-and-drop
 */
export function ProductGallery({
  productId,
  images,
  onImagesChange,
  disabled = false,
}: ProductGalleryProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Загрузка файла на сервер
   */
  const uploadFile = useCallback(
    async (file: File, uploadIndex: number) => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("productId", productId);
        formData.append("generateThumbnails", "true");

        const xhr = new XMLHttpRequest();

        // Отслеживание прогресса
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploading((prev) =>
              prev.map((upload, index) =>
                index === uploadIndex ? { ...upload, progress } : upload
              )
            );
          }
        });

        // Обработка результата
        xhr.addEventListener("load", async () => {
          if (xhr.status === 201) {
            const result = JSON.parse(xhr.responseText);
            setUploading((prev) =>
              prev.map((upload, index) =>
                index === uploadIndex
                  ? { ...upload, status: "success", progress: 100 }
                  : upload
              )
            );

            // Добавляем изображение к товару
            try {
              const response = await fetch(`/api/products/${productId}/images`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  imageUrls: [result.image.url],
                }),
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Ошибка при добавлении изображения");
              }

              const newImages = await response.json();
              onImagesChange([...images, ...newImages]);

              // Удаляем из списка загрузок
              setUploading((prev) => prev.filter((_, i) => i !== uploadIndex));
            } catch (error) {
              setUploading((prev) =>
                prev.map((upload, index) =>
                  index === uploadIndex
                    ? {
                        ...upload,
                        status: "error",
                        error:
                          error instanceof Error
                            ? error.message
                            : "Ошибка при добавлении изображения",
                      }
                    : upload
                )
              );
              toast({
                variant: "destructive",
                title: "Ошибка",
                description:
                  error instanceof Error
                    ? error.message
                    : "Ошибка при добавлении изображения",
              });
            }
          } else {
            const error = JSON.parse(xhr.responseText).error || "Ошибка загрузки";
            setUploading((prev) =>
              prev.map((upload, index) =>
                index === uploadIndex
                  ? { ...upload, status: "error", error }
                  : upload
              )
            );
            toast({
              variant: "destructive",
              title: "Ошибка загрузки",
              description: error,
            });
          }
        });

        xhr.addEventListener("error", () => {
          setUploading((prev) =>
            prev.map((upload, index) =>
              index === uploadIndex
                ? { ...upload, status: "error", error: "Ошибка сети" }
                : upload
            )
          );
          toast({
            variant: "destructive",
            title: "Ошибка сети",
            description: "Не удалось загрузить изображение",
          });
        });

        xhr.open("POST", "/api/upload/image");
        xhr.send(formData);
      } catch (error) {
        setUploading((prev) =>
          prev.map((upload, index) =>
            index === uploadIndex
              ? {
                  ...upload,
                  status: "error",
                  error: "Ошибка загрузки",
                }
              : upload
          )
        );
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось загрузить изображение",
        });
      }
    },
    [productId, images, onImagesChange, toast]
  );

  /**
   * Обработка выбора файлов
   */
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((file) => {
        if (!file.type.startsWith("image/")) {
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: `Неподдерживаемый тип файла: ${file.type}`,
          });
          return false;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: `Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(2)}MB. Максимум: 10MB`,
          });
          return false;
        }

        return true;
      });

      // Создание прогресса загрузки
      const newUploads: UploadProgress[] = validFiles.map((file) => ({
        file,
        progress: 0,
        status: "uploading",
      }));

      setUploading((prev) => [...prev, ...newUploads]);

      // Загрузка файлов последовательно
      validFiles.forEach((file, index) => {
        uploadFile(file, newUploads.length - validFiles.length + index);
      });
    },
    [uploadFile, toast]
  );

  /**
   * Обработка завершения drag-and-drop
   */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      // Оптимистичное обновление UI
      const newImages = arrayMove(images, oldIndex, newIndex);
      onImagesChange(newImages);

      try {
        // Отправляем новый порядок на сервер
        const response = await fetch(
          `/api/products/${productId}/images/reorder`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageIds: newImages.map((img) => img.id),
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          // Откатываем изменения при ошибке
          onImagesChange(images);
          throw new Error(error.error || "Ошибка при изменении порядка");
        }

        const updatedImages = await response.json();
        onImagesChange(updatedImages);
      } catch (error) {
        // Откатываем изменения при ошибке
        onImagesChange(images);

        toast({
          variant: "destructive",
          title: "Ошибка",
          description:
            error instanceof Error
              ? error.message
              : "Не удалось изменить порядок изображений",
        });
      }
    },
    [images, productId, onImagesChange, toast]
  );

  /**
   * Удаление изображения
   */
  const handleDelete = useCallback(
    async (imageId: string, isMain: boolean) => {
      // Подтверждение для главного изображения
      if (isMain) {
        const confirmed = window.confirm(
          "Вы уверены, что хотите удалить главное изображение? Первое изображение в списке станет главным."
        );
        if (!confirmed) {
          return;
        }
      }

      try {
        const response = await fetch(
          `/api/products/${productId}/images/${imageId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Ошибка при удалении изображения");
        }

        // Удаляем изображение из списка
        const newImages = images.filter((img) => img.id !== imageId);
        onImagesChange(newImages);

        toast({
          title: "Успешно",
          description: "Изображение удалено",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description:
            error instanceof Error
              ? error.message
              : "Не удалось удалить изображение",
        });
      }
    },
    [productId, images, onImagesChange, toast]
  );

  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      {/* Кнопка загрузки */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Галерея изображений</h3>
          <p className="text-xs text-gray-500">
            Первое изображение является главным
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading.length > 0}
        >
          <Upload className="h-4 w-4 mr-2" />
          Загрузить
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Прогресс загрузок */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((upload, index) => (
            <div key={index} className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium truncate">
                    {upload.file.name}
                  </span>
                </div>
                {upload.status === "error" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setUploading((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {upload.status === "uploading" && (
                <Progress value={upload.progress} className="h-2" />
              )}
              {upload.status === "error" && upload.error && (
                <p className="text-xs text-red-600">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Галерея изображений */}
      {sortedImages.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedImages.map((img) => img.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sortedImages.map((image, index) => (
                <SortableImageItem
                  key={image.id}
                  image={image}
                  isMain={index === 0}
                  onDelete={() => handleDelete(image.id, index === 0)}
                  disabled={disabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">
            Нет изображений. Загрузите изображения для товара.
          </p>
        </div>
      )}
    </div>
  );
}


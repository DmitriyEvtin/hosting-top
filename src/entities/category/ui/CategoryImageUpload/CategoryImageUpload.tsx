"use client";

import { Alert, AlertDescription } from "@/shared/ui/Alert";
import { Progress } from "@/shared/ui/Progress";
import {
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useCallback, useRef, useState } from "react";

/**
 * Типы для компонента загрузки изображения категории
 */
interface CategoryImageUploadProps {
  currentImageUrl?: string | null;
  onUploadComplete?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  onRemoveImage?: () => void;
  className?: string;
  allowRemove?: boolean;
}

interface UploadResult {
  image: {
    key: string;
    url: string;
    size: number;
    etag: string;
  };
}

interface UploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
  result?: UploadResult;
}

export function CategoryImageUpload({
  currentImageUrl,
  onUploadComplete,
  onUploadError,
  onRemoveImage,
  className = "",
  allowRemove = true,
}: CategoryImageUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработка загрузки файла
  const handleFileUpload = useCallback(
    async (file: File) => {
      // Валидация файла
      const maxSize = 10 * 1024 * 1024; // 10MB
      const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];

      if (!acceptedTypes.includes(file.type)) {
        const error = "Поддерживаются только файлы JPEG, PNG, WebP и AVIF";
        onUploadError?.(error);
        return;
      }

      if (file.size > maxSize) {
        const error = "Размер файла не должен превышать 10MB";
        onUploadError?.(error);
        return;
      }

      // Создаем объект прогресса
      const progress: UploadProgress = {
        file,
        progress: 0,
        status: "uploading",
      };
      setUploadProgress(progress);

      try {
        // Создаем FormData для загрузки
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "category-images");
        formData.append("generateThumbnails", "false");

        // Используем XMLHttpRequest для отслеживания прогресса
        const xhr = new XMLHttpRequest();

        // Отслеживание прогресса
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progressPercent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress((prev) =>
              prev
                ? {
                    ...prev,
                    progress: progressPercent,
                  }
                : null
            );
          }
        });

        // Обработка результата
        xhr.addEventListener("load", () => {
          if (xhr.status === 201) {
            const result: UploadResult = JSON.parse(xhr.responseText);

            setUploadProgress({
              ...progress,
              progress: 100,
              status: "success",
              result,
            });

            // Вызываем callback
            onUploadComplete?.(result.image.url);

            // Очищаем прогресс через 2 секунды
            setTimeout(() => {
              setUploadProgress(null);
            }, 2000);
          } else {
            const errorData = JSON.parse(xhr.responseText);
            const errorMessage = errorData.error || "Ошибка загрузки файла";

            setUploadProgress({
              ...progress,
              status: "error",
              error: errorMessage,
            });

            onUploadError?.(errorMessage);

            // Очищаем прогресс через 5 секунд
            setTimeout(() => {
              setUploadProgress(null);
            }, 5000);
          }
        });

        xhr.addEventListener("error", () => {
          const errorMessage = "Ошибка сети при загрузке файла";

          setUploadProgress({
            ...progress,
            status: "error",
            error: errorMessage,
          });

          onUploadError?.(errorMessage);

          // Очищаем прогресс через 5 секунд
          setTimeout(() => {
            setUploadProgress(null);
          }, 5000);
        });

        xhr.open("POST", "/api/upload/image");
        xhr.send(formData);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Неизвестная ошибка";

        setUploadProgress({
          ...progress,
          status: "error",
          error: errorMessage,
        });

        onUploadError?.(errorMessage);

        // Очищаем прогресс через 5 секунд
        setTimeout(() => {
          setUploadProgress(null);
        }, 5000);
      }
    },
    [onUploadComplete, onUploadError]
  );

  // Обработка выбора файла
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  // Обработка перетаскивания
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);

      const file = event.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  // Обработка клика по области загрузки
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Обработка удаления изображения
  const handleRemoveImage = useCallback(() => {
    onRemoveImage?.();
  }, [onRemoveImage]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Текущее изображение */}
      {currentImageUrl && (
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={currentImageUrl}
              alt="Изображение категории"
              fill
              className="rounded-lg object-cover border-2 border-gray-200"
              sizes="96px"
            />
            {allowRemove && (
              <button
                onClick={handleRemoveImage}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Удалить изображение"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Текущее изображение
            </p>
            <p className="text-xs text-gray-500">Нажмите для изменения</p>
          </div>
        </div>
      )}

      {/* Область загрузки */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${
            isDragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${uploadProgress ? "pointer-events-none opacity-50" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-2">
          <ImageIcon className="w-8 h-8 mx-auto text-gray-400" />

          <div>
            <p className="text-sm font-medium text-gray-900">
              {currentImageUrl ? "Изменить изображение" : "Загрузить изображение"}
            </p>
            <p className="text-xs text-gray-500">
              Перетащите изображение или нажмите для выбора
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPEG, PNG, WebP, AVIF до 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Прогресс загрузки */}
      {uploadProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {uploadProgress.status === "uploading" && "Загрузка..."}
              {uploadProgress.status === "success" && "Загружено успешно"}
              {uploadProgress.status === "error" && "Ошибка загрузки"}
            </span>
            <span className="text-gray-500">
              {uploadProgress.status === "uploading" &&
                `${uploadProgress.progress}%`}
            </span>
          </div>

          {uploadProgress.status === "uploading" && (
            <Progress value={uploadProgress.progress} className="w-full" />
          )}

          {uploadProgress.status === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Изображение успешно загружено
              </AlertDescription>
            </Alert>
          )}

          {uploadProgress.status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadProgress.error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}


"use client";

import { Alert, AlertDescription } from "@/shared/ui/Alert";
import { Progress } from "@/shared/ui/Progress";
import {
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useCallback, useRef, useState } from "react";

/**
 * Типы для компонента загрузки логотипа профиля
 */
interface ProfileLogoUploadProps {
  currentLogoUrl?: string;
  onUploadComplete?: (logoUrl: string) => void;
  onUploadError?: (error: string) => void;
  onRemoveLogo?: () => void;
  className?: string;
  allowRemove?: boolean; // Новый проп для управления кнопкой удаления
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

export function ProfileLogoUpload({
  currentLogoUrl,
  onUploadComplete,
  onUploadError,
  onRemoveLogo,
  className = "",
  allowRemove = true, // По умолчанию разрешено удаление
}: ProfileLogoUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработка загрузки файла
  const handleFileUpload = useCallback(
    async (file: File) => {
      // Валидация файла
      const maxSize = 5 * 1024 * 1024; // 5MB
      const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!acceptedTypes.includes(file.type)) {
        const error = "Поддерживаются только файлы JPEG, PNG и WebP";
        onUploadError?.(error);
        return;
      }

      if (file.size > maxSize) {
        const error = "Размер файла не должен превышать 5MB";
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
        formData.append("category", "profile-logos");
        formData.append("generateThumbnails", "false");

        // Загружаем файл
        const response = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Ошибка загрузки файла");
        }

        const result: UploadResult = await response.json();

        // Обновляем прогресс
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

  // Обработка удаления логотипа
  const handleRemoveLogo = useCallback(() => {
    onRemoveLogo?.();
  }, [onRemoveLogo]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Текущий логотип */}
      {currentLogoUrl && (
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="relative w-16 h-16">
            <Image
              src={currentLogoUrl}
              alt="Логотип профиля"
              fill
              className="rounded-full object-cover border-2 border-gray-200"
              sizes="64px"
            />
            {allowRemove && (
              <button
                onClick={handleRemoveLogo}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Удалить логотип"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Текущий логотип</p>
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
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-2">
          {currentLogoUrl ? (
            <ImageIcon className="w-8 h-8 mx-auto text-gray-400" />
          ) : (
            <User className="w-8 h-8 mx-auto text-gray-400" />
          )}

          <div>
            <p className="text-sm font-medium text-gray-900">
              {currentLogoUrl ? "Изменить логотип" : "Загрузить логотип"}
            </p>
            <p className="text-xs text-gray-500">
              Перетащите изображение или нажмите для выбора
            </p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP до 5MB</p>
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
                Логотип успешно загружен
              </AlertDescription>
            </Alert>
          )}

          {uploadProgress.status === "error" && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {uploadProgress.error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}

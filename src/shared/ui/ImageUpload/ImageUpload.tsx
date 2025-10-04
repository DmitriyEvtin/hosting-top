/**
 * ImageUpload Component
 * Компонент для загрузки изображений в S3
 */

"use client";

import { Alert, AlertDescription } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Progress } from "@/shared/ui/Progress";
import { AlertCircle, CheckCircle, Image as ImageIcon, X } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

/**
 * Типы для компонента
 */
interface ImageUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  category?: string;
  productId?: string;
  generateThumbnails?: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSize?: number; // в байтах
  className?: string;
}

interface UploadResult {
  image: {
    key: string;
    url: string;
    size: number;
    etag: string;
  };
  thumbnails?: Array<{
    key: string;
    url: string;
    width: number;
    height: number;
    size: number;
  }>;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
  result?: UploadResult;
}

/**
 * ImageUpload Component
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  onUploadError,
  category,
  productId,
  generateThumbnails = true,
  maxFiles = 1,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"],
  maxSize = 10 * 1024 * 1024, // 10MB
  className = "",
}) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Обработка выбора файлов
   */
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(file => {
        // Проверка типа файла
        if (!acceptedTypes.includes(file.type)) {
          onUploadError?.(`Неподдерживаемый тип файла: ${file.type}`);
          return false;
        }

        // Проверка размера файла
        if (file.size > maxSize) {
          onUploadError?.(
            `Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(2)}MB. Максимум: ${(maxSize / 1024 / 1024).toFixed(2)}MB`
          );
          return false;
        }

        return true;
      });

      // Ограничение количества файлов
      const filesToUpload = validFiles.slice(0, maxFiles);

      // Создание прогресса загрузки
      const newUploads: UploadProgress[] = filesToUpload.map(file => ({
        file,
        progress: 0,
        status: "uploading",
      }));

      setUploads(prev => [...prev, ...newUploads]);

      // Загрузка файлов
      filesToUpload.forEach((file, index) => {
        uploadFile(file, newUploads.length - filesToUpload.length + index);
      });
    },
    [acceptedTypes, maxSize, maxFiles, onUploadError]
  );

  /**
   * Загрузка файла на сервер
   */
  const uploadFile = async (file: File, uploadIndex: number) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (category) formData.append("category", category);
      if (productId) formData.append("productId", productId);
      formData.append("generateThumbnails", generateThumbnails.toString());

      const xhr = new XMLHttpRequest();

      // Отслеживание прогресса
      xhr.upload.addEventListener("progress", event => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploads(prev =>
            prev.map((upload, index) =>
              index === uploadIndex ? { ...upload, progress } : upload
            )
          );
        }
      });

      // Обработка результата
      xhr.addEventListener("load", () => {
        if (xhr.status === 201) {
          const result: UploadResult = JSON.parse(xhr.responseText);
          setUploads(prev =>
            prev.map((upload, index) =>
              index === uploadIndex
                ? { ...upload, status: "success", result }
                : upload
            )
          );
          onUploadComplete?.(result);
        } else {
          const error = JSON.parse(xhr.responseText).error || "Ошибка загрузки";
          setUploads(prev =>
            prev.map((upload, index) =>
              index === uploadIndex
                ? { ...upload, status: "error", error }
                : upload
            )
          );
          onUploadError?.(error);
        }
      });

      xhr.addEventListener("error", () => {
        setUploads(prev =>
          prev.map((upload, index) =>
            index === uploadIndex
              ? { ...upload, status: "error", error: "Ошибка сети" }
              : upload
          )
        );
        onUploadError?.("Ошибка сети");
      });

      xhr.open("POST", "/api/upload/image");
      xhr.send(formData);
    } catch (error) {
      setUploads(prev =>
        prev.map((upload, index) =>
          index === uploadIndex
            ? { ...upload, status: "error", error: "Ошибка загрузки" }
            : upload
        )
      );
      onUploadError?.("Ошибка загрузки");
    }
  };

  /**
   * Обработка drag & drop
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  /**
   * Очистка загрузок
   */
  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  /**
   * Удаление конкретной загрузки
   */
  const removeUpload = useCallback((index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Область загрузки */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${
            isDragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedTypes.join(",")}
          onChange={e => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="space-y-2">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-sm text-gray-600">
            <Button
              type="button"
              variant="link"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-500"
            >
              Нажмите для выбора файлов
            </Button>{" "}
            или перетащите сюда
          </div>
          <p className="text-xs text-gray-500">
            Поддерживаемые форматы:{" "}
            {acceptedTypes.map(type => type.split("/")[1]).join(", ")}
            <br />
            Максимальный размер: {(maxSize / 1024 / 1024).toFixed(1)}MB
            {maxFiles > 1 && ` • Максимум файлов: ${maxFiles}`}
          </p>
        </div>
      </div>

      {/* Прогресс загрузок */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Загрузка файлов</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearUploads}
              className="text-gray-500 hover:text-gray-700"
            >
              Очистить все
            </Button>
          </div>

          {uploads.map((upload, index) => (
            <div key={index} className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium truncate">
                    {upload.file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({(upload.file.size / 1024 / 1024).toFixed(2)}MB)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {upload.status === "success" && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {upload.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUpload(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {upload.status === "uploading" && (
                <Progress value={upload.progress} className="h-2" />
              )}

              {upload.status === "error" && upload.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{upload.error}</AlertDescription>
                </Alert>
              )}

              {upload.status === "success" && upload.result && (
                <div className="text-xs text-green-600">
                  ✓ Загружено успешно
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * ProductImageUpload Component
 * Компонент для загрузки изображений товаров в админ-панели
 */

"use client";

import { Alert, AlertDescription } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { ImageUpload } from "@/shared/ui/ImageUpload";
import { ExternalLink, Image as ImageIcon, Trash2 } from "lucide-react";
import React, { useState } from "react";

/**
 * Типы для компонента
 */
interface ProductImageUploadProps {
  productId?: string;
  category?: string;
  onImagesChange?: (images: UploadedImage[]) => void;
  className?: string;
}

interface UploadedImage {
  key: string;
  url: string;
  size: number;
  etag: string;
  thumbnails?: Array<{
    key: string;
    url: string;
    width: number;
    height: number;
    size: number;
  }>;
}

/**
 * ProductImageUpload Component
 */
export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  productId,
  category = "products",
  onImagesChange,
  className = "",
}) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Обработка успешной загрузки
   */
  const handleUploadComplete = (result: any) => {
    const newImage: UploadedImage = {
      key: result.image.key,
      url: result.image.url,
      size: result.image.size,
      etag: result.image.etag,
      thumbnails: result.thumbnails,
    };

    setUploadedImages(prev => [...prev, newImage]);
    onImagesChange?.([...uploadedImages, newImage]);
    setError(null);
  };

  /**
   * Обработка ошибки загрузки
   */
  const handleUploadError = (error: string) => {
    setError(error);
    console.error("Ошибка загрузки изображения:", error);
  };

  /**
   * Удаление изображения
   */
  const handleDeleteImage = async (imageKey: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/upload/image/${encodeURIComponent(imageKey)}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setUploadedImages(prev => prev.filter(img => img.key !== imageKey));
        onImagesChange?.(uploadedImages.filter(img => img.key !== imageKey));
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || "Ошибка удаления изображения");
      }
    } catch (error) {
      setError("Ошибка удаления изображения");
      console.error("Ошибка удаления:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Открытие изображения в новой вкладке
   */
  const handleOpenImage = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Загрузка изображений */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ImageIcon className="h-5 w-5" />
            <span>Загрузка изображений товара</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            category={category}
            productId={productId}
            generateThumbnails={true}
            maxFiles={10}
            maxSize={10 * 1024 * 1024} // 10MB
            acceptedTypes={[
              "image/jpeg",
              "image/png",
              "image/webp",
              "image/avif",
            ]}
          />
        </CardContent>
      </Card>

      {/* Ошибки */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Загруженные изображения */}
      {uploadedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Загруженные изображения ({uploadedImages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedImages.map((image, index) => (
                <div
                  key={image.key}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Превью изображения */}
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={image.url}
                      alt={`Изображение ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Информация об изображении */}
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <div>
                        Размер: {(image.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      {image.thumbnails && (
                        <div>Миниатюры: {image.thumbnails.length}</div>
                      )}
                    </div>

                    {/* Действия */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenImage(image.url)}
                        className="flex-1"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Открыть
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteImage(image.key)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Информация о загрузке */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-medium">Информация о загрузке:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Поддерживаемые форматы: JPEG, PNG, WebP, AVIF</li>
              <li>Максимальный размер файла: 10 MB</li>
              <li>Максимальное количество файлов: 10</li>
              <li>
                Автоматическое создание миниатюр: 150px, 300px, 600px, 1200px
              </li>
              <li>Оптимизация для веб с конвертацией в WebP</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

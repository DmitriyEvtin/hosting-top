/**
 * Image Processing Utilities
 * Утилиты для обработки и оптимизации изображений
 */

import { S3_BUCKET_CONFIG } from "./aws-config";
import { s3KeyUtils, s3Service } from "./s3-utils";

/**
 * Типы для обработки изображений
 */
export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp" | "avif";
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ThumbnailResult {
  key: string;
  url: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Image Processing Service
 * Сервис для обработки изображений с использованием Canvas API
 */
export class ImageProcessingService {
  /**
   * Обработка изображения с изменением размера
   */
  async processImage(
    imageBuffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    try {
      // В браузерной среде используем Canvas API
      if (typeof window !== "undefined") {
        return this.processImageBrowser(imageBuffer, options);
      }

      // В серверной среде используем Node.js библиотеки
      return this.processImageServer(imageBuffer, options);
    } catch (error) {
      throw new Error(`Ошибка обработки изображения: ${error}`);
    }
  }

  /**
   * Обработка изображения в браузере
   */
  private async processImageBrowser(
    imageBuffer: Buffer,
    options: ImageProcessingOptions
  ): Promise<ProcessedImage> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Не удалось получить контекст Canvas"));
        return;
      }

      const img = new Image();

      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          options.width,
          options.height,
          options.fit || "cover"
        );

        canvas.width = width;
        canvas.height = height;

        // Настройка качества рендеринга
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Рисование изображения
        ctx.drawImage(img, 0, 0, width, height);

        // Конвертация в нужный формат
        const format = options.format || "jpeg";
        const quality = options.quality || 0.8;

        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error("Ошибка создания blob"));
              return;
            }

            const reader = new FileReader();
            reader.onload = () => {
              const buffer = Buffer.from(reader.result as ArrayBuffer);
              resolve({
                buffer,
                width,
                height,
                format,
                size: buffer.length,
              });
            };
            reader.readAsArrayBuffer(blob);
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => reject(new Error("Ошибка загрузки изображения"));
      img.src = URL.createObjectURL(new Blob([imageBuffer]));
    });
  }

  /**
   * Обработка изображения на сервере
   * В реальном проекте здесь должна быть интеграция с Sharp или Jimp
   */
  private async processImageServer(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _imageBuffer: Buffer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: ImageProcessingOptions
  ): Promise<ProcessedImage> {
    // Заглушка для серверной обработки
    // В реальном проекте здесь должна быть интеграция с Sharp
    throw new Error(
      "Серверная обработка изображений не реализована. Установите Sharp: npm install sharp"
    );
  }

  /**
   * Создание миниатюр изображения
   */
  async createThumbnails(
    originalKey: string,
    imageBuffer: Buffer,
    sizes: number[] = S3_BUCKET_CONFIG.images.thumbnailSizes
  ): Promise<ThumbnailResult[]> {
    const results: ThumbnailResult[] = [];

    for (const size of sizes) {
      try {
        const processed = await this.processImage(imageBuffer, {
          width: size,
          height: size,
          fit: "cover",
          format: "webp",
          quality: 0.8,
        });

        const thumbnailKey = s3KeyUtils.generateThumbnailKey(originalKey, size);

        const uploadResult = await s3Service.uploadFile(
          thumbnailKey,
          processed.buffer,
          {
            contentType: `image/${processed.format}`,
            metadata: {
              "thumbnail-size": size.toString(),
              "original-key": originalKey,
            },
            cacheControl: "public, max-age=31536000, immutable",
          }
        );

        results.push({
          key: thumbnailKey,
          url: uploadResult.url,
          width: processed.width,
          height: processed.height,
          size: processed.size,
        });
      } catch (error) {
        console.error(`Ошибка создания миниатюры ${size}px:`, error);
      }
    }

    return results;
  }

  /**
   * Оптимизация изображения для веб
   */
  async optimizeForWeb(
    imageBuffer: Buffer,
    maxWidth: number = 1200,
    quality: number = 0.8
  ): Promise<ProcessedImage> {
    return this.processImage(imageBuffer, {
      width: maxWidth,
      format: "webp",
      quality,
      fit: "inside",
    });
  }

  /**
   * Расчет размеров изображения с учетом пропорций
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    targetWidth?: number,
    targetHeight?: number,
    fit: "cover" | "contain" | "fill" | "inside" | "outside" = "cover"
  ): { width: number; height: number } {
    if (!targetWidth && !targetHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    if (!targetWidth) targetWidth = originalWidth;
    if (!targetHeight) targetHeight = originalHeight;

    const aspectRatio = originalWidth / originalHeight;
    const targetAspectRatio = targetWidth / targetHeight;

    let width: number;
    let height: number;

    switch (fit) {
      case "cover":
        if (aspectRatio > targetAspectRatio) {
          width = targetWidth;
          height = targetWidth / aspectRatio;
        } else {
          height = targetHeight;
          width = targetHeight * aspectRatio;
        }
        break;

      case "contain":
        if (aspectRatio > targetAspectRatio) {
          width = targetWidth;
          height = targetWidth / aspectRatio;
        } else {
          height = targetHeight;
          width = targetHeight * aspectRatio;
        }
        break;

      case "fill":
        width = targetWidth;
        height = targetHeight;
        break;

      case "inside":
        if (originalWidth <= targetWidth && originalHeight <= targetHeight) {
          width = originalWidth;
          height = originalHeight;
        } else {
          const scale = Math.min(
            targetWidth / originalWidth,
            targetHeight / originalHeight
          );
          width = originalWidth * scale;
          height = originalHeight * scale;
        }
        break;

      case "outside":
        const scale = Math.max(
          targetWidth / originalWidth,
          targetHeight / originalHeight
        );
        width = originalWidth * scale;
        height = originalHeight * scale;
        break;

      default:
        width = targetWidth;
        height = targetHeight;
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  /**
   * Валидация изображения
   */
  validateImage(
    buffer: Buffer,
    contentType: string
  ): { valid: boolean; error?: string } {
    // Проверка типа контента
    if (!S3_BUCKET_CONFIG.images.allowedTypes.includes(contentType)) {
      return {
        valid: false,
        error: `Неподдерживаемый тип изображения: ${contentType}`,
      };
    }

    // Проверка размера
    if (buffer.length > S3_BUCKET_CONFIG.images.maxSize) {
      return {
        valid: false,
        error: `Размер изображения превышает максимально допустимый: ${S3_BUCKET_CONFIG.images.maxSize} байт`,
      };
    }

    // Проверка минимального размера
    if (buffer.length < 100) {
      return {
        valid: false,
        error: "Файл слишком мал для изображения",
      };
    }

    return { valid: true };
  }

  /**
   * Получение метаданных изображения
   */
  async getImageMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined") {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
            format: "unknown",
            size: buffer.length,
          });
        };
        img.onerror = () => reject(new Error("Ошибка загрузки изображения"));
        img.src = URL.createObjectURL(new Blob([buffer]));
      } else {
        // Серверная реализация
        reject(new Error("Серверная обработка метаданных не реализована"));
      }
    });
  }
}

/**
 * Экспорт экземпляра сервиса
 */
export const imageProcessingService = new ImageProcessingService();

/**
 * Утилиты для работы с изображениями
 */
export const imageUtils = {
  /**
   * Генерация responsive изображений
   */
  generateResponsiveImages(
    originalUrl: string,
    sizes: number[] = [320, 640, 1024, 1200]
  ): Array<{ url: string; width: number; descriptor: string }> {
    return sizes.map(size => ({
      url: originalUrl,
      width: size,
      descriptor: `${size}w`,
    }));
  },

  /**
   * Создание srcset для responsive изображений
   */
  createSrcSet(images: Array<{ url: string; width: number }>): string {
    return images.map(img => `${img.url} ${img.width}w`).join(", ");
  },

  /**
   * Получение оптимального размера изображения для viewport
   */
  getOptimalSize(availableWidth: number, sizes: number[]): number {
    return (
      sizes.find(size => size >= availableWidth) || sizes[sizes.length - 1]
    );
  },
};

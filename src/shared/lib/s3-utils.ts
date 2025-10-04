/**
 * S3 Utilities
 * Утилиты для работы с Amazon S3
 */

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { AWS_CONFIG, S3_BUCKET_CONFIG, s3Client } from "./aws-config";

/**
 * Типы для S3 операций
 */
export interface S3UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  acl?: "private" | "public-read" | "public-read-write";
}

export interface S3ObjectInfo {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
}

export interface S3UploadResult {
  key: string;
  url: string;
  etag: string;
  size: number;
}

/**
 * S3 Service Class
 */
export class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor(
    client: S3Client = s3Client,
    bucket: string = AWS_CONFIG.S3_BUCKET
  ) {
    this.client = client;
    this.bucket = bucket;
  }

  /**
   * Загрузка файла в S3
   */
  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | string,
    options: S3UploadOptions = {}
  ): Promise<S3UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options.contentType,
        Metadata: options.metadata,
        CacheControl: options.cacheControl || "public, max-age=31536000",
        ACL: options.acl || "public-read",
      });

      const response = await this.client.send(command);

      return {
        key,
        url: this.getPublicUrl(key),
        etag: response.ETag || "",
        size: Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body),
      };
    } catch (error) {
      throw new Error(`Ошибка загрузки файла в S3: ${error}`);
    }
  }

  /**
   * Загрузка изображения с автоматической обработкой
   */
  async uploadImage(
    key: string,
    imageBuffer: Buffer,
    contentType: string,
    metadata: Record<string, string> = {}
  ): Promise<S3UploadResult> {
    // Валидация типа изображения
    if (!S3_BUCKET_CONFIG.images.allowedTypes.includes(contentType)) {
      throw new Error(`Неподдерживаемый тип изображения: ${contentType}`);
    }

    // Валидация размера
    if (imageBuffer.length > S3_BUCKET_CONFIG.images.maxSize) {
      throw new Error(
        `Размер изображения превышает максимально допустимый: ${S3_BUCKET_CONFIG.images.maxSize} байт`
      );
    }

    // Если ключ уже содержит папку images, не добавляем её повторно
    const fullKey = key.startsWith("images/")
      ? key
      : `${S3_BUCKET_CONFIG.images.folder}/${key}`;

    return this.uploadFile(fullKey, imageBuffer, {
      contentType,
      metadata: {
        ...metadata,
        "original-size": imageBuffer.length.toString(),
        "upload-timestamp": new Date().toISOString(),
      },
      cacheControl: "public, max-age=31536000, immutable",
    });
  }

  /**
   * Получение файла из S3
   */
  async getFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new Error("Файл не найден");
      }

      // Конвертация stream в Buffer
      const chunks: Uint8Array[] = [];
      const stream = response.Body as ReadableStream;

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      throw new Error(`Ошибка получения файла из S3: ${error}`);
    }
  }

  /**
   * Получение информации о файле
   */
  async getFileInfo(key: string): Promise<S3ObjectInfo> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        etag: response.ETag || "",
        contentType: response.ContentType,
      };
    } catch (error) {
      throw new Error(`Ошибка получения информации о файле: ${error}`);
    }
  }

  /**
   * Удаление файла из S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
    } catch (error) {
      throw new Error(`Ошибка удаления файла из S3: ${error}`);
    }
  }

  /**
   * Копирование файла в S3
   */
  async copyFile(
    sourceKey: string,
    destinationKey: string,
    metadata: Record<string, string> = {}
  ): Promise<S3UploadResult> {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
        Metadata: metadata,
        MetadataDirective: "REPLACE",
      });

      const response = await this.client.send(command);

      return {
        key: destinationKey,
        url: this.getPublicUrl(destinationKey),
        etag: response.CopyObjectResult?.ETag || "",
        size: 0, // Размер будет получен отдельно при необходимости
      };
    } catch (error) {
      throw new Error(`Ошибка копирования файла в S3: ${error}`);
    }
  }

  /**
   * Список файлов в папке
   */
  async listFiles(
    prefix: string = "",
    maxKeys: number = 1000
  ): Promise<S3ObjectInfo[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.client.send(command);

      return (response.Contents || []).map(object => ({
        key: object.Key || "",
        size: object.Size || 0,
        lastModified: object.LastModified || new Date(),
        etag: object.ETag || "",
      }));
    } catch (error) {
      throw new Error(`Ошибка получения списка файлов: ${error}`);
    }
  }

  /**
   * Проверка существования файла
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileInfo(key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Получение публичного URL файла
   */
  getPublicUrl(key: string): string {
    if (AWS_CONFIG.CLOUDFRONT_DOMAIN) {
      return `https://${AWS_CONFIG.CLOUDFRONT_DOMAIN}/${key}`;
    }

    // MinIO endpoint для локальной разработки
    if (process.env.AWS_S3_ENDPOINT) {
      const endpoint = process.env.AWS_S3_ENDPOINT.replace(/^https?:\/\//, "");
      return `http://${endpoint}/${this.bucket}/${key}`;
    }

    return `https://${this.bucket}.s3.${AWS_CONFIG.REGION}.amazonaws.com/${key}`;
  }

  /**
   * Получение подписанного URL для временного доступа
   */
  async getSignedUrl(key: string, _expiresIn: number = 3600): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const expiresIn = _expiresIn;
    // Для подписанных URL нужно использовать отдельную утилиту
    // Пока возвращаем публичный URL
    return this.getPublicUrl(key);
  }

  /**
   * Извлечение ключа S3 из публичного URL
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      // CloudFront URL
      if (
        AWS_CONFIG.CLOUDFRONT_DOMAIN &&
        url.includes(AWS_CONFIG.CLOUDFRONT_DOMAIN)
      ) {
        return url.replace(`https://${AWS_CONFIG.CLOUDFRONT_DOMAIN}/`, "");
      }

      // MinIO URL для локальной разработки
      if (process.env.AWS_S3_ENDPOINT) {
        const endpoint = process.env.AWS_S3_ENDPOINT.replace(
          /^https?:\/\//,
          ""
        );
        const minioPattern = new RegExp(
          `http://${endpoint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/${this.bucket}/(.+)`
        );
        const match = url.match(minioPattern);
        if (match) {
          return match[1];
        }
      }

      // AWS S3 URL
      const s3Pattern = new RegExp(
        `https://${this.bucket}\\.s3\\.${AWS_CONFIG.REGION}\\.amazonaws\\.com/(.+)`
      );
      const match = url.match(s3Pattern);
      if (match) {
        return match[1];
      }

      return null;
    } catch (error) {
      console.error("Ошибка извлечения ключа из URL:", error);
      return null;
    }
  }
}

/**
 * Экспорт экземпляра S3Service по умолчанию
 */
export const s3Service = new S3Service();

/**
 * Утилиты для работы с ключами S3
 */
export const s3KeyUtils = {
  /**
   * Генерация уникального ключа для изображения
   */
  generateImageKey(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
    const baseName = originalName.split(".")[0].replace(/[^a-zA-Z0-9]/g, "_");

    const key = `${baseName}_${timestamp}_${random}.${extension}`;
    return prefix ? `${prefix}/${key}` : key;
  },

  /**
   * Генерация ключа для миниатюры
   */
  generateThumbnailKey(originalKey: string, size: number): string {
    const pathParts = originalKey.split("/");
    const fileName = pathParts.pop() || "";
    const nameWithoutExt = fileName.split(".")[0];
    const extension = fileName.split(".").pop() || "jpg";

    return `${pathParts.join("/")}/thumbnails/${nameWithoutExt}_${size}w.${extension}`;
  },

  /**
   * Валидация ключа S3
   */
  isValidKey(key: string): boolean {
    // S3 ключи не могут начинаться с '/' и не могут содержать определенные символы
    return key.length > 0 && key.length <= 1024 && !key.startsWith("/");
  },
};

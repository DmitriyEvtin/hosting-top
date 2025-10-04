/**
 * AWS S3 Tests
 * Unit тесты для AWS S3 интеграции
 */

import { imageProcessingService } from "@/shared/lib/image-processing";
import { S3Service } from "@/shared/lib/s3-utils";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Моки для AWS SDK
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
}));

// Моки для переменных окружения
const mockEnv = {
  AWS_ACCESS_KEY_ID: "test-access-key",
  AWS_SECRET_ACCESS_KEY: "test-secret-key",
  AWS_REGION: "eu-west-1",
  AWS_S3_BUCKET: "test-bucket",
  // MinIO настройки для тестов
  AWS_S3_ENDPOINT: "http://localhost:9000",
  AWS_S3_FORCE_PATH_STYLE: "true",
};

describe("AWS S3 Integration", () => {
  beforeEach(() => {
    // Сброс всех моков
    jest.clearAllMocks();

    // Установка переменных окружения
    Object.assign(process.env, mockEnv);
  });

  describe("S3Service", () => {
    let s3Service: S3Service;
    let mockS3Client: any;

    beforeEach(() => {
      mockS3Client = {
        send: jest.fn(),
      };
      s3Service = new S3Service(mockS3Client, "test-bucket");
    });

    describe("uploadFile", () => {
      it("должен загружать файл в S3", async () => {
        const mockResponse = {
          ETag: '"test-etag"',
        };

        mockS3Client.send.mockResolvedValue(mockResponse);

        const result = await s3Service.uploadFile(
          "test-key",
          Buffer.from("test content"),
          { contentType: "text/plain" }
        );

        expect(result).toEqual({
          key: "test-key",
          url: expect.stringContaining("test-bucket"),
          etag: '"test-etag"',
          size: expect.any(Number),
        });

        expect(mockS3Client.send).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              Bucket: "test-bucket",
              Key: "test-key",
              Body: expect.any(Buffer),
              ContentType: "text/plain",
            }),
          })
        );
      });

      it("должен обрабатывать ошибки загрузки", async () => {
        const error = new Error("S3 Error");
        mockS3Client.send.mockRejectedValue(error);

        await expect(
          s3Service.uploadFile("test-key", Buffer.from("test"))
        ).rejects.toThrow("Ошибка загрузки файла в S3");
      });
    });

    describe("uploadImage", () => {
      it("должен загружать изображение с валидацией", async () => {
        const mockResponse = {
          ETag: '"image-etag"',
        };

        mockS3Client.send.mockResolvedValue(mockResponse);

        const imageBuffer = Buffer.from("fake-image-data");
        const result = await s3Service.uploadImage(
          "test-image.jpg",
          imageBuffer,
          "image/jpeg",
          { "test-meta": "value" }
        );

        expect(result.key).toBe("images/test-image.jpg");
        expect(result.etag).toBe('"image-etag"');
      });

      it("должен отклонять неподдерживаемые типы изображений", async () => {
        const imageBuffer = Buffer.from("fake-image-data");

        await expect(
          s3Service.uploadImage("test-image.gif", imageBuffer, "image/gif")
        ).rejects.toThrow("Неподдерживаемый тип изображения");
      });

      it("должен отклонять слишком большие изображения", async () => {
        const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

        await expect(
          s3Service.uploadImage("test-image.jpg", largeBuffer, "image/jpeg")
        ).rejects.toThrow(
          "Размер изображения превышает максимально допустимый"
        );
      });
    });

    describe("getFile", () => {
      it("должен получать файл из S3", async () => {
        const mockResponse = {
          Body: {
            [Symbol.asyncIterator]: async function* () {
              yield Buffer.from("test content");
            },
          },
        };

        mockS3Client.send.mockResolvedValue(mockResponse);

        const result = await s3Service.getFile("test-key");

        expect(result).toEqual(Buffer.from("test content"));
      });

      it("должен обрабатывать ошибки получения файла", async () => {
        mockS3Client.send.mockRejectedValue(new Error("File not found"));

        await expect(s3Service.getFile("test-key")).rejects.toThrow(
          "Ошибка получения файла из S3"
        );
      });
    });

    describe("deleteFile", () => {
      it("должен удалять файл из S3", async () => {
        mockS3Client.send.mockResolvedValue({});

        await s3Service.deleteFile("test-key");

        expect(mockS3Client.send).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              Bucket: "test-bucket",
              Key: "test-key",
            }),
          })
        );
      });
    });

    describe("fileExists", () => {
      it("должен возвращать true для существующего файла", async () => {
        mockS3Client.send.mockResolvedValue({
          ContentLength: 100,
          LastModified: new Date(),
          ETag: '"test-etag"',
        });

        const exists = await s3Service.fileExists("test-key");

        expect(exists).toBe(true);
      });

      it("должен возвращать false для несуществующего файла", async () => {
        mockS3Client.send.mockRejectedValue(new Error("Not found"));

        const exists = await s3Service.fileExists("test-key");

        expect(exists).toBe(false);
      });
    });
  });

  describe("ImageProcessingService", () => {
    describe("validateImage", () => {
      it("должен валидировать корректные изображения", () => {
        const buffer = Buffer.from("fake-jpeg-data");
        const result = imageProcessingService.validateImage(
          buffer,
          "image/jpeg"
        );

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it("должен отклонять неподдерживаемые типы", () => {
        const buffer = Buffer.from("fake-gif-data");
        const result = imageProcessingService.validateImage(
          buffer,
          "image/gif"
        );

        expect(result.valid).toBe(false);
        expect(result.error).toContain("Неподдерживаемый тип изображения");
      });

      it("должен отклонять слишком большие файлы", () => {
        const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
        const result = imageProcessingService.validateImage(
          largeBuffer,
          "image/jpeg"
        );

        expect(result.valid).toBe(false);
        expect(result.error).toContain(
          "Размер изображения превышает максимально допустимый"
        );
      });

      it("должен отклонять слишком маленькие файлы", () => {
        const smallBuffer = Buffer.from("x");
        const result = imageProcessingService.validateImage(
          smallBuffer,
          "image/jpeg"
        );

        expect(result.valid).toBe(false);
        expect(result.error).toContain("Файл слишком мал для изображения");
      });
    });
  });
});

/**
 * AWS Upload API Tests
 * Интеграционные тесты для API загрузки изображений
 */

import { DELETE } from "@/app/api/upload/image/[key]/route";
import { GET, POST } from "@/app/api/upload/image/route";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { NextRequest } from "next/server";

// Моки для NextAuth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Моки для AWS S3
jest.mock("@/shared/lib/s3-utils", () => ({
  s3Service: {
    uploadImage: jest.fn(),
    listFiles: jest.fn(),
    deleteFile: jest.fn(),
    fileExists: jest.fn(),
    getFileInfo: jest.fn(),
    getPublicUrl: jest.fn(),
  },
  s3KeyUtils: {
    generateImageKey: jest.fn(),
  },
}));

// Моки для обработки изображений
jest.mock("@/shared/lib/image-processing", () => ({
  imageProcessingService: {
    validateImage: jest.fn(),
    createThumbnails: jest.fn(),
  },
}));

import { imageProcessingService } from "@/shared/lib/image-processing";
import { s3Service } from "@/shared/lib/s3-utils";
import { getServerSession } from "next-auth";

describe("AWS Upload API", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe("POST /api/upload/image", () => {
    it("должен загружать изображение для аутентифицированного пользователя", async () => {
      // Настройка моков
      (imageProcessingService.validateImage as jest.Mock).mockReturnValue({
        valid: true,
      });

      (s3Service.uploadImage as jest.Mock).mockResolvedValue({
        key: "images/test-image.jpg",
        url: "https://test-bucket.s3.eu-west-1.amazonaws.com/images/test-image.jpg",
        etag: '"test-etag"',
        size: 1024,
      });

      (imageProcessingService.createThumbnails as jest.Mock).mockResolvedValue([
        {
          key: "images/thumbnails/test-image_150w.webp",
          url: "https://test-bucket.s3.eu-west-1.amazonaws.com/images/thumbnails/test-image_150w.webp",
          width: 150,
          height: 150,
          size: 512,
        },
      ]);

      // Создание FormData
      const formData = new FormData();
      const file = new File(["fake-image-data"], "test-image.jpg", {
        type: "image/jpeg",
      });
      formData.append("file", file);
      formData.append("category", "products");
      formData.append("generateThumbnails", "true");

      const request = new NextRequest(
        "http://localhost:3000/api/upload/image",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.image).toBeDefined();
      expect(data.image.key).toBe("images/test-image.jpg");
      expect(data.thumbnails).toHaveLength(1);
    });

    it("должен отклонять запросы неаутентифицированных пользователей", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      const file = new File(["fake-image-data"], "test-image.jpg", {
        type: "image/jpeg",
      });
      formData.append("file", file);

      const request = new NextRequest(
        "http://localhost:3000/api/upload/image",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Необходима аутентификация");
    });

    it("должен отклонять запросы без файла", async () => {
      const formData = new FormData();

      const request = new NextRequest(
        "http://localhost:3000/api/upload/image",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Файл не найден");
    });

    it("должен отклонять неподдерживаемые типы файлов", async () => {
      const formData = new FormData();
      const file = new File(["fake-data"], "test.txt", {
        type: "text/plain",
      });
      formData.append("file", file);

      const request = new NextRequest(
        "http://localhost:3000/api/upload/image",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Файл должен быть изображением");
    });

    it("должен отклонять невалидные изображения", async () => {
      (imageProcessingService.validateImage as jest.Mock).mockReturnValue({
        valid: false,
        error: "Неподдерживаемый тип изображения",
      });

      const formData = new FormData();
      const file = new File(["fake-image-data"], "test-image.gif", {
        type: "image/gif",
      });
      formData.append("file", file);

      const request = new NextRequest(
        "http://localhost:3000/api/upload/image",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Неподдерживаемый тип изображения");
    });
  });

  describe("GET /api/upload/image", () => {
    it("должен возвращать список изображений для аутентифицированного пользователя", async () => {
      (s3Service.listFiles as jest.Mock).mockResolvedValue([
        {
          key: "images/test-image1.jpg",
          size: 1024,
          lastModified: new Date("2024-01-01"),
          etag: '"etag1"',
        },
        {
          key: "images/test-image2.jpg",
          size: 2048,
          lastModified: new Date("2024-01-02"),
          etag: '"etag2"',
        },
      ]);

      (s3Service.getPublicUrl as jest.Mock).mockImplementation(
        key => `https://test-bucket.s3.eu-west-1.amazonaws.com/${key}`
      );

      const request = new NextRequest("http://localhost:3000/api/upload/image");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.images).toHaveLength(2);
      expect(data.images[0].key).toBe("images/test-image1.jpg");
    });

    it("должен отклонять запросы неаутентифицированных пользователей", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/upload/image");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Необходима аутентификация");
    });
  });

  describe("DELETE /api/upload/image/[key]", () => {
    it("должен удалять изображение для аутентифицированного пользователя", async () => {
      (s3Service.fileExists as jest.Mock).mockResolvedValue(true);
      (s3Service.deleteFile as jest.Mock).mockResolvedValue(undefined);
      (s3Service.listFiles as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/upload/image/test-image.jpg"
      );

      const response = await DELETE(request, {
        params: { key: "test-image.jpg" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Изображение успешно удалено");
    });

    it("должен отклонять удаление несуществующего изображения", async () => {
      (s3Service.fileExists as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost:3000/api/upload/image/non-existent.jpg"
      );

      const response = await DELETE(request, {
        params: { key: "non-existent.jpg" },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Изображение не найдено");
    });

    it("должен отклонять запросы неаутентифицированных пользователей", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/upload/image/test-image.jpg"
      );

      const response = await DELETE(request, {
        params: { key: "test-image.jpg" },
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Необходима аутентификация");
    });
  });
});

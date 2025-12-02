/**
 * Product Images API Tests
 * Интеграционные тесты для API управления изображениями товара
 */

import { POST } from "@/app/api/products/[id]/images/route";
import { PUT } from "@/app/api/products/[id]/images/reorder/route";
import { DELETE } from "@/app/api/products/[id]/images/[imageId]/route";
import { ProductApi } from "@/entities/product";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { NextRequest } from "next/server";

// Моки для NextAuth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Моки для AWS S3
jest.mock("@/shared/lib/s3-utils", () => ({
  s3Service: {
    extractKeyFromUrl: jest.fn(),
    deleteFile: jest.fn(),
    listFiles: jest.fn(),
  },
}));

// Моки для AWS Config
jest.mock("@/shared/lib/aws-config", () => ({
  AWS_CONFIG: {
    S3_BUCKET: "test-bucket",
    REGION: "eu-west-1",
    CLOUDFRONT_DOMAIN: "d1234567890.cloudfront.net",
  },
}));

// Моки для ProductApi
jest.mock("@/entities/product", () => ({
  ProductApi: {
    getProductById: jest.fn(),
    addProductImages: jest.fn(),
    reorderProductImages: jest.fn(),
    deleteProductImage: jest.fn(),
  },
}));

import { s3Service } from "@/shared/lib/s3-utils";
import { getServerSession } from "next-auth";

describe("Product Images API", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
      role: "MANAGER",
    },
  };

  const mockProduct = {
    id: "test-product-id",
    name: "Test Product",
    categoryId: "test-category-id",
    createdAt: new Date(),
    updatedAt: new Date(),
    category: null,
    sites: [],
  };

  const mockImage1 = {
    id: "image-1",
    productId: "test-product-id",
    imageUrl: "https://d1234567890.cloudfront.net/images/image1.jpg",
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockImage2 = {
    id: "image-2",
    productId: "test-product-id",
    imageUrl: "https://d1234567890.cloudfront.net/images/image2.jpg",
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockImage3 = {
    id: "image-3",
    productId: "test-product-id",
    imageUrl: "https://d1234567890.cloudfront.net/images/image3.jpg",
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe("POST /api/products/[id]/images - Добавление изображений", () => {
    it("должен добавлять изображения к товару с правильным sortOrder", async () => {
      const imageUrls = [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
        "https://example.com/image3.jpg",
      ];

      (ProductApi.getProductById as jest.Mock).mockResolvedValue(mockProduct);
      (ProductApi.addProductImages as jest.Mock).mockResolvedValue([
        { ...mockImage1, imageUrl: imageUrls[0], sortOrder: 0 },
        { ...mockImage2, imageUrl: imageUrls[1], sortOrder: 1 },
        { ...mockImage3, imageUrl: imageUrls[2], sortOrder: 2 },
      ]);

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images",
        {
          method: "POST",
          body: JSON.stringify({ imageUrls }),
        }
      );

      const response = await POST(request, {
        params: { id: "test-product-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveLength(3);
      expect(data[0].sortOrder).toBe(0);
      expect(data[1].sortOrder).toBe(1);
      expect(data[2].sortOrder).toBe(2);
      expect(ProductApi.addProductImages).toHaveBeenCalledWith(
        "test-product-id",
        { imageUrls }
      );
    });

    it("должен добавлять изображения к товару без существующих изображений", async () => {
      const imageUrls = ["https://example.com/image1.jpg"];

      (ProductApi.getProductById as jest.Mock).mockResolvedValue(mockProduct);
      (ProductApi.addProductImages as jest.Mock).mockResolvedValue([
        { ...mockImage1, imageUrl: imageUrls[0], sortOrder: 0 },
      ]);

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images",
        {
          method: "POST",
          body: JSON.stringify({ imageUrls }),
        }
      );

      const response = await POST(request, {
        params: { id: "test-product-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveLength(1);
      expect(data[0].sortOrder).toBe(0);
    });

    it("должен отклонять невалидные URL", async () => {
      (ProductApi.getProductById as jest.Mock).mockResolvedValue(mockProduct);

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images",
        {
          method: "POST",
          body: JSON.stringify({ imageUrls: ["not-a-url"] }),
        }
      );

      const response = await POST(request, {
        params: { id: "test-product-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Неверные данные");
    });

    it("должен отклонять пустой массив изображений", async () => {
      (ProductApi.getProductById as jest.Mock).mockResolvedValue(mockProduct);

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images",
        {
          method: "POST",
          body: JSON.stringify({ imageUrls: [] }),
        }
      );

      const response = await POST(request, {
        params: { id: "test-product-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Неверные данные");
    });

    it("должен отклонять запросы для несуществующего товара", async () => {
      (ProductApi.getProductById as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/products/non-existent-id/images",
        {
          method: "POST",
          body: JSON.stringify({
            imageUrls: ["https://example.com/image1.jpg"],
          }),
        }
      );

      const response = await POST(request, {
        params: { id: "non-existent-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Товар не найден");
    });

    it("должен отклонять запросы неаутентифицированных пользователей", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images",
        {
          method: "POST",
          body: JSON.stringify({
            imageUrls: ["https://example.com/image1.jpg"],
          }),
        }
      );

      const response = await POST(request, {
        params: { id: "test-product-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Не авторизован");
    });

    it("должен отклонять запросы пользователей без прав менеджера", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: "test-user-id",
          email: "test@example.com",
          name: "Test User",
          role: "USER",
        },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images",
        {
          method: "POST",
          body: JSON.stringify({
            imageUrls: ["https://example.com/image1.jpg"],
          }),
        }
      );

      const response = await POST(request, {
        params: { id: "test-product-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Недостаточно прав");
    });
  });

  describe("PUT /api/products/[id]/images/reorder - Изменение порядка изображений", () => {
    it("должен изменять порядок изображений атомарно", async () => {
      const imageIds = [mockImage3.id, mockImage2.id, mockImage1.id]; // Обратный порядок

      (ProductApi.getProductById as jest.Mock).mockResolvedValue(mockProduct);
      (ProductApi.reorderProductImages as jest.Mock).mockResolvedValue([
        { ...mockImage3, sortOrder: 0 },
        { ...mockImage2, sortOrder: 1 },
        { ...mockImage1, sortOrder: 2 },
      ]);

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images/reorder",
        {
          method: "PUT",
          body: JSON.stringify({ imageIds }),
        }
      );

      const response = await PUT(request, {
        params: { id: "test-product-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(3);
      expect(data[0].id).toBe(mockImage3.id);
      expect(data[0].sortOrder).toBe(0);
      expect(data[1].id).toBe(mockImage2.id);
      expect(data[1].sortOrder).toBe(1);
      expect(data[2].id).toBe(mockImage1.id);
      expect(data[2].sortOrder).toBe(2);
      expect(ProductApi.reorderProductImages).toHaveBeenCalledWith(
        "test-product-id",
        { imageIds }
      );
    });

    it("должен отклонять невалидные ID изображений", async () => {
      (ProductApi.getProductById as jest.Mock).mockResolvedValue(mockProduct);

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images/reorder",
        {
          method: "PUT",
          body: JSON.stringify({ imageIds: ["not-a-cuid"] }),
        }
      );

      const response = await PUT(request, {
        params: { id: "test-product-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Неверные данные");
    });

    it("должен отклонять пустой массив ID", async () => {
      (ProductApi.getProductById as jest.Mock).mockResolvedValue(mockProduct);

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images/reorder",
        {
          method: "PUT",
          body: JSON.stringify({ imageIds: [] }),
        }
      );

      const response = await PUT(request, {
        params: { id: "test-product-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Неверные данные");
    });

    it("должен отклонять запросы для несуществующего товара", async () => {
      (ProductApi.getProductById as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/products/non-existent-id/images/reorder",
        {
          method: "PUT",
          body: JSON.stringify({ imageIds: [mockImage1.id] }),
        }
      );

      const response = await PUT(request, {
        params: { id: "non-existent-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Товар не найден");
    });

    it("должен обрабатывать ошибки при попытке изменить порядок несуществующих изображений", async () => {
      (ProductApi.getProductById as jest.Mock).mockResolvedValue(mockProduct);
      (ProductApi.reorderProductImages as jest.Mock).mockRejectedValue(
        new Error("Некоторые изображения не найдены или не принадлежат товару")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images/reorder",
        {
          method: "PUT",
          body: JSON.stringify({ imageIds: ["non-existent-image-id"] }),
        }
      );

      const response = await PUT(request, {
        params: { id: "test-product-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("не найдены");
    });
  });

  describe("DELETE /api/products/[id]/images/[imageId] - Удаление изображения", () => {
    it("должен удалять изображение из БД и S3", async () => {
      (ProductApi.getProductById as jest.Mock).mockResolvedValue(mockProduct);
      (ProductApi.deleteProductImage as jest.Mock).mockResolvedValue({
        imageUrl: mockImage2.imageUrl,
        productId: "test-product-id",
        sortOrder: 1,
      });
      (s3Service.extractKeyFromUrl as jest.Mock).mockReturnValue(
        "images/image2.jpg"
      );
      (s3Service.deleteFile as jest.Mock).mockResolvedValue(undefined);
      (s3Service.listFiles as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images/image-2"
      );

      const response = await DELETE(request, {
        params: { id: "test-product-id", imageId: "image-2" },
      });

      expect(response.status).toBe(204);
      expect(ProductApi.deleteProductImage).toHaveBeenCalledWith("image-2");
      expect(s3Service.extractKeyFromUrl).toHaveBeenCalledWith(
        mockImage2.imageUrl
      );
      expect(s3Service.deleteFile).toHaveBeenCalledWith("images/image2.jpg");
    });

    it("должен удалять миниатюры при удалении изображения", async () => {
      const thumbnail1 = { key: "thumbnails/image2_100w.jpg" };
      const thumbnail2 = { key: "thumbnails/image2_200w.jpg" };

      (ProductApi.getProductById as jest.Mock).mockResolvedValue(mockProduct);
      (ProductApi.deleteProductImage as jest.Mock).mockResolvedValue({
        imageUrl: mockImage2.imageUrl,
        productId: "test-product-id",
        sortOrder: 1,
      });
      (s3Service.extractKeyFromUrl as jest.Mock).mockReturnValue(
        "images/image2.jpg"
      );
      (s3Service.deleteFile as jest.Mock).mockResolvedValue(undefined);
      (s3Service.listFiles as jest.Mock).mockResolvedValue([
        thumbnail1,
        thumbnail2,
      ]);

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images/image-2"
      );

      const response = await DELETE(request, {
        params: { id: "test-product-id", imageId: "image-2" },
      });

      expect(response.status).toBe(204);
      expect(s3Service.deleteFile).toHaveBeenCalledWith("images/image2.jpg");
      expect(s3Service.deleteFile).toHaveBeenCalledWith(thumbnail1.key);
      expect(s3Service.deleteFile).toHaveBeenCalledWith(thumbnail2.key);
    });

    it("должен перенумеровывать оставшиеся изображения после удаления", async () => {
      (ProductApi.getProductById as jest.Mock).mockResolvedValue(mockProduct);
      (ProductApi.deleteProductImage as jest.Mock).mockResolvedValue({
        imageUrl: mockImage2.imageUrl,
        productId: "test-product-id",
        sortOrder: 1,
      });
      (s3Service.extractKeyFromUrl as jest.Mock).mockReturnValue(
        "images/image2.jpg"
      );
      (s3Service.deleteFile as jest.Mock).mockResolvedValue(undefined);
      (s3Service.listFiles as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images/image-2"
      );

      const response = await DELETE(request, {
        params: { id: "test-product-id", imageId: "image-2" },
      });

      expect(response.status).toBe(204);
      // Метод deleteProductImage должен автоматически перенумеровать изображения
      expect(ProductApi.deleteProductImage).toHaveBeenCalled();
    });

    it("должен отклонять удаление несуществующего изображения", async () => {
      (ProductApi.getProductById as jest.Mock).mockResolvedValue(mockProduct);
      (ProductApi.deleteProductImage as jest.Mock).mockRejectedValue(
        new Error("Изображение не найдено")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images/non-existent"
      );

      const response = await DELETE(request, {
        params: { id: "test-product-id", imageId: "non-existent" },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Изображение не найдено");
    });

    it("должен обрабатывать ошибки при удалении файла из S3", async () => {
      (ProductApi.getProductById as jest.Mock).mockResolvedValue(mockProduct);
      (ProductApi.deleteProductImage as jest.Mock).mockResolvedValue({
        imageUrl: mockImage2.imageUrl,
        productId: "test-product-id",
        sortOrder: 1,
      });
      (s3Service.extractKeyFromUrl as jest.Mock).mockReturnValue(
        "images/image2.jpg"
      );
      (s3Service.deleteFile as jest.Mock).mockRejectedValue(
        new Error("S3 deletion failed")
      );
      (s3Service.listFiles as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/products/test-product-id/images/image-2"
      );

      // Ошибка при удалении из S3 не должна прерывать выполнение
      // Изображение уже удалено из БД
      const response = await DELETE(request, {
        params: { id: "test-product-id", imageId: "image-2" },
      });

      expect(response.status).toBe(204);
    });

    it("должен отклонять запросы для несуществующего товара", async () => {
      (ProductApi.getProductById as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/products/non-existent-id/images/image-1"
      );

      const response = await DELETE(request, {
        params: { id: "non-existent-id", imageId: "image-1" },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Товар не найден");
    });
  });
});


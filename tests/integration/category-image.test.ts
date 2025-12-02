/**
 * Category Image API Tests
 * Интеграционные тесты для API категорий с поддержкой изображений
 */

import { PATCH } from "@/app/api/categories/[id]/route";
import { CategoryApi } from "@/entities/category";
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

// Моки для CategoryApi
jest.mock("@/entities/category", () => ({
  CategoryApi: {
    getCategoryById: jest.fn(),
    updateCategory: jest.fn(),
    validateSiteIds: jest.fn(),
  },
}));

import { s3Service } from "@/shared/lib/s3-utils";
import { getServerSession } from "next-auth";

describe("Category Image API", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
      role: "MANAGER",
    },
  };

  const mockCategory = {
    id: "test-category-id",
    name: "Test Category",
    image: "https://d1234567890.cloudfront.net/images/old-image.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
    sites: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe("PATCH /api/categories/[id] - Обновление изображения категории", () => {
    it("должен обновлять изображение категории и удалять старое из S3", async () => {
      const oldImageUrl = "https://d1234567890.cloudfront.net/images/old-image.jpg";
      const newImageUrl = "https://d1234567890.cloudfront.net/images/new-image.jpg";

      (CategoryApi.getCategoryById as jest.Mock).mockResolvedValue({
        ...mockCategory,
        image: oldImageUrl,
      });

      (s3Service.extractKeyFromUrl as jest.Mock).mockReturnValue("images/old-image.jpg");
      (s3Service.deleteFile as jest.Mock).mockResolvedValue(undefined);

      (CategoryApi.updateCategory as jest.Mock).mockResolvedValue({
        ...mockCategory,
        image: newImageUrl,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/categories/test-category-id",
        {
          method: "PATCH",
          body: JSON.stringify({
            image: newImageUrl,
          }),
        }
      );

      const response = await PATCH(request, {
        params: { id: "test-category-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.image).toBe(newImageUrl);
      expect(CategoryApi.updateCategory).toHaveBeenCalledWith(
        "test-category-id",
        { image: newImageUrl },
        oldImageUrl
      );
      expect(s3Service.extractKeyFromUrl).toHaveBeenCalledWith(oldImageUrl);
      expect(s3Service.deleteFile).toHaveBeenCalledWith("images/old-image.jpg");
    });

    it("должен удалять изображение при передаче null", async () => {
      const oldImageUrl = "https://d1234567890.cloudfront.net/images/old-image.jpg";

      (CategoryApi.getCategoryById as jest.Mock).mockResolvedValue({
        ...mockCategory,
        image: oldImageUrl,
      });

      (s3Service.extractKeyFromUrl as jest.Mock).mockReturnValue("images/old-image.jpg");
      (s3Service.deleteFile as jest.Mock).mockResolvedValue(undefined);

      (CategoryApi.updateCategory as jest.Mock).mockResolvedValue({
        ...mockCategory,
        image: null,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/categories/test-category-id",
        {
          method: "PATCH",
          body: JSON.stringify({
            image: null,
          }),
        }
      );

      const response = await PATCH(request, {
        params: { id: "test-category-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.image).toBeNull();
      expect(CategoryApi.updateCategory).toHaveBeenCalledWith(
        "test-category-id",
        { image: null },
        oldImageUrl
      );
      expect(s3Service.deleteFile).toHaveBeenCalledWith("images/old-image.jpg");
    });

    it("должен обновлять категорию без удаления изображения, если оно не изменилось", async () => {
      const imageUrl = "https://d1234567890.cloudfront.net/images/same-image.jpg";

      (CategoryApi.getCategoryById as jest.Mock).mockResolvedValue({
        ...mockCategory,
        image: imageUrl,
      });

      (CategoryApi.updateCategory as jest.Mock).mockResolvedValue({
        ...mockCategory,
        image: imageUrl,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/categories/test-category-id",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated Name",
            image: imageUrl, // То же изображение
          }),
        }
      );

      const response = await PATCH(request, {
        params: { id: "test-category-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.image).toBe(imageUrl);
      expect(s3Service.deleteFile).not.toHaveBeenCalled();
    });

    it("должен отклонять невалидный URL изображения", async () => {
      (CategoryApi.getCategoryById as jest.Mock).mockResolvedValue(mockCategory);

      const request = new NextRequest(
        "http://localhost:3000/api/categories/test-category-id",
        {
          method: "PATCH",
          body: JSON.stringify({
            image: "https://example.com/images/invalid.jpg",
          }),
        }
      );

      const response = await PATCH(request, {
        params: { id: "test-category-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Неверные данные");
    });

    it("должен отклонять запросы неаутентифицированных пользователей", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/categories/test-category-id",
        {
          method: "PATCH",
          body: JSON.stringify({
            image: "https://d1234567890.cloudfront.net/images/new-image.jpg",
          }),
        }
      );

      const response = await PATCH(request, {
        params: { id: "test-category-id" },
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
        "http://localhost:3000/api/categories/test-category-id",
        {
          method: "PATCH",
          body: JSON.stringify({
            image: "https://d1234567890.cloudfront.net/images/new-image.jpg",
          }),
        }
      );

      const response = await PATCH(request, {
        params: { id: "test-category-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Недостаточно прав");
    });

    it("должен обрабатывать ошибки при удалении изображения из S3", async () => {
      const oldImageUrl = "https://d1234567890.cloudfront.net/images/old-image.jpg";
      const newImageUrl = "https://d1234567890.cloudfront.net/images/new-image.jpg";

      (CategoryApi.getCategoryById as jest.Mock).mockResolvedValue({
        ...mockCategory,
        image: oldImageUrl,
      });

      (s3Service.extractKeyFromUrl as jest.Mock).mockReturnValue("images/old-image.jpg");
      (s3Service.deleteFile as jest.Mock).mockRejectedValue(
        new Error("S3 deletion failed")
      );

      (CategoryApi.updateCategory as jest.Mock).mockResolvedValue({
        ...mockCategory,
        image: newImageUrl,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/categories/test-category-id",
        {
          method: "PATCH",
          body: JSON.stringify({
            image: newImageUrl,
          }),
        }
      );

      // Ошибка при удалении не должна прерывать обновление категории
      const response = await PATCH(request, {
        params: { id: "test-category-id" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.image).toBe(newImageUrl);
    });
  });
});


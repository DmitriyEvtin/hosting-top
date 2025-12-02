/**
 * Public Catalog API Tests
 * Интеграционные тесты для публичного API каталога с изображениями
 */

import { GET } from "@/app/api/public/catalog/[siteId]/route";
import { NextRequest } from "next/server";

// Моки для Prisma
jest.mock("@/shared/api/database", () => ({
  prisma: {
    site: {
      findUnique: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from "@/shared/api/database";

describe("Public Catalog API", () => {
  const mockSiteId = "test-site-id";
  const mockSite = {
    id: mockSiteId,
    name: "Test Site",
  };

  const mockCategoryWithImage = {
    id: "category-1",
    name: "Category with Image",
    image: "https://d1234567890.cloudfront.net/images/category.jpg",
  };

  const mockCategoryWithoutImage = {
    id: "category-2",
    name: "Category without Image",
    image: null,
  };

  const mockProductImages = [
    {
      id: "image-1",
      productId: "product-1",
      imageUrl: "https://d1234567890.cloudfront.net/images/image1.jpg",
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "image-2",
      productId: "product-1",
      imageUrl: "https://d1234567890.cloudfront.net/images/image2.jpg",
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "image-3",
      productId: "product-1",
      imageUrl: "https://d1234567890.cloudfront.net/images/image3.jpg",
      sortOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/public/catalog/[siteId]", () => {
    it("должен возвращать категорию с изображением", async () => {
      (prisma.site.findUnique as jest.Mock).mockResolvedValue(mockSite);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        {
          ...mockCategoryWithImage,
          products: [],
        },
      ]);
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/public/catalog/${mockSiteId}`
      );
      const response = await GET(request, {
        params: { siteId: mockSiteId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.site).toEqual(mockSite);
      expect(data.categories).toHaveLength(1);
      expect(data.categories[0]).toMatchObject({
        id: mockCategoryWithImage.id,
        name: mockCategoryWithImage.name,
        image: mockCategoryWithImage.image,
      });
    });

    it("должен возвращать категорию без изображения (null)", async () => {
      (prisma.site.findUnique as jest.Mock).mockResolvedValue(mockSite);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        {
          ...mockCategoryWithoutImage,
          products: [],
        },
      ]);
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/public/catalog/${mockSiteId}`
      );
      const response = await GET(request, {
        params: { siteId: mockSiteId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories[0].image).toBeNull();
    });

    it("должен возвращать товар с несколькими изображениями, отсортированными по sortOrder", async () => {
      const mockProduct = {
        id: "product-1",
        name: "Test Product",
        categoryId: "category-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        images: mockProductImages,
      };

      (prisma.site.findUnique as jest.Mock).mockResolvedValue(mockSite);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        {
          ...mockCategoryWithImage,
          products: [mockProduct],
        },
      ]);
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/public/catalog/${mockSiteId}`
      );
      const response = await GET(request, {
        params: { siteId: mockSiteId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories[0].products).toHaveLength(1);
      const product = data.categories[0].products[0];
      expect(product.images).toHaveLength(3);
      expect(product.images[0]).toMatchObject({
        id: "image-1",
        url: "https://d1234567890.cloudfront.net/images/image1.jpg",
        sortOrder: 0,
        isMain: true,
      });
      expect(product.images[1]).toMatchObject({
        id: "image-2",
        url: "https://d1234567890.cloudfront.net/images/image2.jpg",
        sortOrder: 1,
        isMain: false,
      });
      expect(product.images[2]).toMatchObject({
        id: "image-3",
        url: "https://d1234567890.cloudfront.net/images/image3.jpg",
        sortOrder: 2,
        isMain: false,
      });
    });

    it("должен возвращать товар без изображений (пустой массив)", async () => {
      const mockProduct = {
        id: "product-2",
        name: "Product without Images",
        categoryId: "category-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };

      (prisma.site.findUnique as jest.Mock).mockResolvedValue(mockSite);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        {
          ...mockCategoryWithImage,
          products: [mockProduct],
        },
      ]);
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/public/catalog/${mockSiteId}`
      );
      const response = await GET(request, {
        params: { siteId: mockSiteId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories[0].products[0].images).toEqual([]);
    });

    it("должен возвращать товары без категории с изображениями", async () => {
      const mockUncategorizedProduct = {
        id: "product-3",
        name: "Uncategorized Product",
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [mockProductImages[0]],
      };

      (prisma.site.findUnique as jest.Mock).mockResolvedValue(mockSite);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        mockUncategorizedProduct,
      ]);

      const request = new NextRequest(
        `http://localhost:3000/api/public/catalog/${mockSiteId}`
      );
      const response = await GET(request, {
        params: { siteId: mockSiteId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.uncategorizedProducts).toHaveLength(1);
      expect(data.uncategorizedProducts[0].images).toHaveLength(1);
      expect(data.uncategorizedProducts[0].images[0]).toMatchObject({
        id: "image-1",
        url: "https://d1234567890.cloudfront.net/images/image1.jpg",
        sortOrder: 0,
        isMain: true,
      });
    });

    it("должен возвращать 404 если сайт не найден", async () => {
      (prisma.site.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/public/catalog/non-existent-site`
      );
      const response = await GET(request, {
        params: { siteId: "non-existent-site" },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Site not found");
    });
  });
});


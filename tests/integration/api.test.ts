import { handlers } from "@/shared/lib/test-utils/api-mocks";
import { setupServer } from "msw/node";

// Setup MSW server
const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("API Integration Tests", () => {
  describe("Products API", () => {
    it("should fetch products list", async () => {
      const response = await fetch("/api/products");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(10);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it("should fetch single product", async () => {
      const productId = "test-product-id";
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(productId);
      expect(data.name).toBeDefined();
      expect(data.price).toBeDefined();
    });

    it("should create new product", async () => {
      const newProduct = {
        name: "Test Product",
        description: "Test Description",
        price: 100,
        categoryId: "test-category-id",
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe(newProduct.name);
      expect(data.description).toBe(newProduct.description);
      expect(data.price).toBe(newProduct.price);
    });

    it("should update product", async () => {
      const productId = "test-product-id";
      const updateData = {
        name: "Updated Product",
        price: 150,
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(productId);
      expect(data.name).toBe(updateData.name);
      expect(data.price).toBe(updateData.price);
    });

    it("should delete product", async () => {
      const productId = "test-product-id";
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(productId);
      expect(data.deleted).toBe(true);
    });
  });

  describe("Categories API", () => {
    it("should fetch categories list", async () => {
      const response = await fetch("/api/categories");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(5);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("should fetch single category", async () => {
      const categoryId = "test-category-id";
      const response = await fetch(`/api/categories/${categoryId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(categoryId);
      expect(data.name).toBeDefined();
    });
  });

  describe("Search API", () => {
    it("should search products", async () => {
      const query = "steel";
      const response = await fetch(`/api/search?q=${query}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(5);
      expect(data.query).toBe(query);
      expect(data.total).toBe(5);
    });

    it("should return empty results for empty query", async () => {
      const response = await fetch("/api/search");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(0);
      expect(data.total).toBe(0);
    });
  });

  describe("Admin API", () => {
    it("should fetch admin stats", async () => {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalProducts).toBeDefined();
      expect(data.totalCategories).toBeDefined();
      expect(data.totalUsers).toBeDefined();
      expect(data.parsingStatus).toBeDefined();
    });

    it("should start parsing session", async () => {
      const response = await fetch("/api/admin/parsing/start", {
        method: "POST",
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionId).toBeDefined();
      expect(data.status).toBe("STARTED");
    });

    it("should get parsing status", async () => {
      const sessionId = "mock-session-id";
      const response = await fetch(`/api/admin/parsing/status/${sessionId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe(sessionId);
      expect(data.status).toBe("RUNNING");
      expect(data.progress).toBeDefined();
      expect(data.processed).toBeDefined();
      expect(data.total).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle 500 errors", async () => {
      const response = await fetch("/api/error");
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should handle 404 errors", async () => {
      const response = await fetch("/api/not-found");
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Not found");
    });
  });

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
});

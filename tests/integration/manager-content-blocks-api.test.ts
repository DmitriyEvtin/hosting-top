/**
 * Integration tests for Manager Content Blocks API
 * Tests CRUD operations for content blocks
 */

import { GET as contentBlocksGet, POST as contentBlocksPost } from "@/app/api/manager/content-blocks/route";
import {
  GET as contentBlocksGetById,
  PUT as contentBlocksPut,
  DELETE as contentBlocksDelete,
} from "@/app/api/manager/content-blocks/[id]/route";
import { prisma } from "@/shared/api/database";
import { UserRole } from "@/shared/lib/types";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

describe("Manager Content Blocks API", () => {
  let managerUser: { id: string; email: string; name: string; role: UserRole };
  let adminUser: { id: string; email: string; name: string; role: UserRole };
  let regularUser: { id: string; email: string; name: string; role: UserRole };
  let createdIds: string[] = [];

  beforeAll(async () => {
    // Создаем тестовых пользователей
    managerUser = await prisma.user.create({
      data: {
        email: `manager-${Date.now()}@test.com`,
        name: "Manager User",
        role: UserRole.MANAGER,
        password: "hashed-password",
      },
    });

    adminUser = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        name: "Admin User",
        role: UserRole.ADMIN,
        password: "hashed-password",
      },
    });

    regularUser = await prisma.user.create({
      data: {
        email: `user-${Date.now()}@test.com`,
        name: "Regular User",
        role: UserRole.USER,
        password: "hashed-password",
      },
    });
  });

  afterAll(async () => {
    // Удаляем созданные блоки контента
    if (createdIds.length > 0) {
      await prisma.contentBlock.deleteMany({
        where: { id: { in: createdIds } },
      });
    }

    // Удаляем тестовых пользователей
    await prisma.user.deleteMany({
      where: {
        id: { in: [managerUser.id, adminUser.id, regularUser.id] },
      },
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/manager/content-blocks", () => {
    it("should create content block with valid key (snake_case)", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/manager/content-blocks", {
        method: "POST",
        body: JSON.stringify({
          key: "hero_section",
          title: "Hero Section",
          content: "<h1>Welcome</h1>",
          isActive: true,
        }),
      });

      const response = await contentBlocksPost(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.contentBlock).toBeDefined();
      const block = data.contentBlock;
      expect(block.key).toBe("hero_section");
      expect(block.title).toBe("Hero Section");
      expect(block.content).toBe("<h1>Welcome</h1>");
      expect(block.isActive).toBe(true);

      if (block.id) {
        createdIds.push(block.id);
      }
    });

    it("should reject content block with invalid key format (spaces)", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/manager/content-blocks", {
        method: "POST",
        body: JSON.stringify({
          key: "Hero Section", // Пробелы недопустимы
          title: "Hero Section",
        }),
      });

      const response = await contentBlocksPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Некорректные данные");
      expect(data.details).toBeDefined();
      const keyError = data.details.find((issue: { path: string[] }) =>
        issue.path.includes("key")
      );
      expect(keyError).toBeDefined();
      expect(keyError.message).toContain("snake_case");
    });

    it("should reject content block with invalid key format (uppercase)", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/manager/content-blocks", {
        method: "POST",
        body: JSON.stringify({
          key: "HeroSection", // Заглавные буквы недопустимы
          title: "Hero Section",
        }),
      });

      const response = await contentBlocksPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Некорректные данные");
      const keyError = data.details.find((issue: { path: string[] }) =>
        issue.path.includes("key")
      );
      expect(keyError).toBeDefined();
      expect(keyError.message).toContain("snake_case");
    });

    it("should reject duplicate key", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      // Создаем первую запись
      const firstRequest = new NextRequest("http://localhost:3000/api/manager/content-blocks", {
        method: "POST",
        body: JSON.stringify({
          key: "about_us",
          title: "About Us",
        }),
      });

      const firstResponse = await contentBlocksPost(firstRequest);
      const firstData = await firstResponse.json();
      const firstBlock = firstData.contentBlock;
      if (firstBlock?.id) {
        createdIds.push(firstBlock.id);
      }

      // Пытаемся создать дубликат
      const secondRequest = new NextRequest("http://localhost:3000/api/manager/content-blocks", {
        method: "POST",
        body: JSON.stringify({
          key: "about_us", // Дубликат
          title: "About Us Again",
        }),
      });

      const secondResponse = await contentBlocksPost(secondRequest);
      const secondData = await secondResponse.json();

      expect(secondResponse.status).toBe(409);
      expect(secondData.error).toContain("уже существует");
    });

    it("should reject request from non-manager user", async () => {
      mockGetServerSession.mockResolvedValue({
        user: regularUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/manager/content-blocks", {
        method: "POST",
        body: JSON.stringify({
          key: "test_section",
          title: "Test Section",
        }),
      });

      const response = await contentBlocksPost(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Недостаточно прав доступа");
    });

    it("should allow admin user to create", async () => {
      mockGetServerSession.mockResolvedValue({
        user: adminUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/manager/content-blocks", {
        method: "POST",
        body: JSON.stringify({
          key: "admin_section",
          title: "Admin Section",
        }),
      });

      const response = await contentBlocksPost(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      const block = data.contentBlock;
      if (block?.id) {
        createdIds.push(block.id);
      }
    });

    it("should accept valid snake_case keys with numbers and underscores", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const validKeys = [
        "section_1",
        "hero_section_v2",
        "about_us_page",
        "test_123",
        "a_b_c_d",
      ];

      for (const key of validKeys) {
        const request = new NextRequest("http://localhost:3000/api/manager/content-blocks", {
          method: "POST",
          body: JSON.stringify({
            key,
            title: `Test ${key}`,
          }),
        });

        const response = await contentBlocksPost(request);
        expect(response.status).toBe(201);
        const data = await response.json();
        const block = data.contentBlock;
        if (block?.id) {
          createdIds.push(block.id);
        }
      }
    });

    it("should enforce maximum content length (50000 characters)", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const longContent = "a".repeat(50001); // Превышает лимит

      const request = new NextRequest("http://localhost:3000/api/manager/content-blocks", {
        method: "POST",
        body: JSON.stringify({
          key: "long_content_test",
          content: longContent,
        }),
      });

      const response = await contentBlocksPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Некорректные данные");
      const contentError = data.details.find((issue: { path: string[] }) =>
        issue.path.includes("content")
      );
      expect(contentError).toBeDefined();
      expect(contentError.message).toContain("50000");
    });
  });

  describe("GET /api/manager/content-blocks", () => {
    it("should return list with pagination", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/content-blocks?page=1&limit=10"
      );

      const response = await contentBlocksGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contentBlocks).toBeDefined();
      expect(Array.isArray(data.contentBlocks)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it("should filter by search query", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      // Создаем тестовый блок
      const testBlock = await prisma.contentBlock.create({
        data: {
          key: `search_test_${Date.now()}`,
          title: "Searchable Title",
        },
      });
      createdIds.push(testBlock.id);

      const request = new NextRequest(
        "http://localhost:3000/api/manager/content-blocks?search=Searchable"
      );

      const response = await contentBlocksGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const blocks = data.contentBlocks;
      const found = blocks.some((block: { id: string }) => block.id === testBlock.id);
      expect(found).toBe(true);
    });

    it("should filter by is_active", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      // Создаем активный и неактивный блоки
      const activeBlock = await prisma.contentBlock.create({
        data: {
          key: `active_${Date.now()}`,
          isActive: true,
        },
      });
      const inactiveBlock = await prisma.contentBlock.create({
        data: {
          key: `inactive_${Date.now()}`,
          isActive: false,
        },
      });
      createdIds.push(activeBlock.id, inactiveBlock.id);

      const request = new NextRequest(
        "http://localhost:3000/api/manager/content-blocks?is_active=true"
      );

      const response = await contentBlocksGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const blocks = data.contentBlocks;
      blocks.forEach((block: { isActive: boolean }) => {
        expect(block.isActive).toBe(true);
      });
    });
  });

  describe("GET /api/manager/content-blocks/[id]", () => {
    let testBlock: { id: string; key: string; title: string | null };

    beforeAll(async () => {
      testBlock = await prisma.contentBlock.create({
        data: {
          key: `test_details_${Date.now()}`,
          title: "Test Block Details",
          content: "Test content",
        },
      });
      createdIds.push(testBlock.id);
    });

    it("should return content block details", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/content-blocks/${testBlock.id}`
      );

      const response = await contentBlocksGetById(request, {
        params: Promise.resolve({ id: testBlock.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contentBlock).toBeDefined();
      const block = data.contentBlock;
      expect(block.id).toBe(testBlock.id);
      expect(block.key).toBe(testBlock.key);
      expect(block.title).toBe(testBlock.title);
    });

    it("should return 404 for non-existent block", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/content-blocks/non-existent-id"
      );

      const response = await contentBlocksGetById(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("не найден");
    });
  });

  describe("PUT /api/manager/content-blocks/[id]", () => {
    let testBlock: { id: string; key: string; title: string | null; content: string | null };

    beforeAll(async () => {
      testBlock = await prisma.contentBlock.create({
        data: {
          key: `original_${Date.now()}`,
          title: "Original Title",
          content: "Original content",
          isActive: true,
        },
      });
      createdIds.push(testBlock.id);
    });

    it("should update content block with new content", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const newContent = "<p>Updated content</p>";

      const request = new NextRequest(
        `http://localhost:3000/api/manager/content-blocks/${testBlock.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            content: newContent,
          }),
        }
      );

      const response = await contentBlocksPut(request, {
        params: Promise.resolve({ id: testBlock.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      const block = data.contentBlock;
      expect(block.content).toBe(newContent);
      expect(block.key).toBe(testBlock.key); // key не должен измениться
      expect(block.title).toBe(testBlock.title); // title не должен измениться
    });

    it("should not allow updating key", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const originalKey = testBlock.key;

      const request = new NextRequest(
        `http://localhost:3000/api/manager/content-blocks/${testBlock.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: "Updated Title",
            // Попытка изменить key (не должно работать)
            key: "new_key",
          }),
        }
      );

      const response = await contentBlocksPut(request, {
        params: Promise.resolve({ id: testBlock.id }),
      });
      const data = await response.json();

      // Zod схема не принимает key, поэтому он будет проигнорирован
      expect(response.status).toBe(200);
      const block = data.contentBlock;
      expect(block.key).toBe(originalKey); // key остался прежним
    });

    it("should update isActive status", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/content-blocks/${testBlock.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            isActive: false,
          }),
        }
      );

      const response = await contentBlocksPut(request, {
        params: Promise.resolve({ id: testBlock.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      const block = data.contentBlock;
      expect(block.isActive).toBe(false);
    });

    it("should return 404 for non-existent block", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/content-blocks/non-existent-id",
        {
          method: "PUT",
          body: JSON.stringify({
            title: "Updated Title",
          }),
        }
      );

      const response = await contentBlocksPut(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("не найден");
    });
  });

  describe("DELETE /api/manager/content-blocks/[id]", () => {
    it("should delete content block", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const blockToDelete = await prisma.contentBlock.create({
        data: {
          key: `to_delete_${Date.now()}`,
          title: "Block To Delete",
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/content-blocks/${blockToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const response = await contentBlocksDelete(request, {
        params: Promise.resolve({ id: blockToDelete.id }),
      });

      expect(response.status).toBe(204);

      // Проверяем, что запись удалена
      const deletedBlock = await prisma.contentBlock.findUnique({
        where: { id: blockToDelete.id },
      });
      expect(deletedBlock).toBeNull();
    });

    it("should return 404 for non-existent block", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/content-blocks/non-existent-id",
        {
          method: "DELETE",
        }
      );

      const response = await contentBlocksDelete(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("не найден");
    });
  });
});


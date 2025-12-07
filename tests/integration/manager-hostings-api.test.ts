/**
 * Integration tests for Manager Hostings API
 * Tests CRUD operations for hostings management
 */

import { GET as hostingsGet, POST as hostingsPost } from "@/app/api/manager/hostings/route";
import {
  GET as hostingGet,
  PUT as hostingPut,
  DELETE as hostingDelete,
} from "@/app/api/manager/hostings/[id]/route";
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

describe("Manager Hostings API", () => {
  let managerUser: { id: string; email: string; name: string; role: UserRole };
  let adminUser: { id: string; email: string; name: string; role: UserRole };
  let regularUser: { id: string; email: string; name: string; role: UserRole };
  let createdHostingIds: string[] = [];

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
    // Удаляем созданные хостинги
    if (createdHostingIds.length > 0) {
      await prisma.hosting.deleteMany({
        where: { id: { in: createdHostingIds } },
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

  describe("POST /api/manager/hostings", () => {
    it("should create hosting with valid data", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/manager/hostings", {
        method: "POST",
        body: JSON.stringify({
          name: "Test Hosting",
          description: "Test description",
          websiteUrl: "https://example.com",
          isActive: true,
        }),
      });

      const response = await hostingsPost(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.hosting).toBeDefined();
      expect(data.hosting.name).toBe("Test Hosting");
      expect(data.hosting.slug).toBe("test-hosting");
      expect(data.hosting.description).toBe("Test description");
      expect(data.hosting.websiteUrl).toBe("https://example.com");
      expect(data.hosting.isActive).toBe(true);

      if (data.hosting.id) {
        createdHostingIds.push(data.hosting.id);
      }
    });

    it("should generate unique slug when name already exists", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      // Создаем первый хостинг
      const firstRequest = new NextRequest(
        "http://localhost:3000/api/manager/hostings",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Unique Hosting",
            isActive: true,
          }),
        }
      );

      const firstResponse = await hostingsPost(firstRequest);
      const firstData = await firstResponse.json();
      if (firstData.hosting?.id) {
        createdHostingIds.push(firstData.hosting.id);
      }

      // Создаем второй хостинг с таким же названием
      const secondRequest = new NextRequest(
        "http://localhost:3000/api/manager/hostings",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Unique Hosting",
            isActive: true,
          }),
        }
      );

      const secondResponse = await hostingsPost(secondRequest);
      const secondData = await secondResponse.json();

      expect(secondResponse.status).toBe(201);
      expect(secondData.hosting.slug).toBe("unique-hosting-2");
      if (secondData.hosting.id) {
        createdHostingIds.push(secondData.hosting.id);
      }
    });

    it("should reject request from non-manager user", async () => {
      mockGetServerSession.mockResolvedValue({
        user: regularUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/manager/hostings", {
        method: "POST",
        body: JSON.stringify({
          name: "Test Hosting",
          isActive: true,
        }),
      });

      const response = await hostingsPost(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Недостаточно прав доступа");
    });

    it("should reject request without authentication", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/manager/hostings", {
        method: "POST",
        body: JSON.stringify({
          name: "Test Hosting",
          isActive: true,
        }),
      });

      const response = await hostingsPost(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Недостаточно прав доступа");
    });

    it("should validate required fields", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/manager/hostings", {
        method: "POST",
        body: JSON.stringify({
          // name отсутствует
          description: "Test description",
        }),
      });

      const response = await hostingsPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Некорректные данные");
    });
  });

  describe("GET /api/manager/hostings", () => {
    beforeEach(async () => {
      // Создаем тестовые хостинги
      const hostings = await Promise.all([
        prisma.hosting.create({
          data: {
            name: "Active Hosting 1",
            slug: `active-hosting-1-${Date.now()}`,
            isActive: true,
          },
        }),
        prisma.hosting.create({
          data: {
            name: "Active Hosting 2",
            slug: `active-hosting-2-${Date.now()}`,
            isActive: true,
          },
        }),
        prisma.hosting.create({
          data: {
            name: "Inactive Hosting 1",
            slug: `inactive-hosting-1-${Date.now()}`,
            isActive: false,
          },
        }),
        prisma.hosting.create({
          data: {
            name: "Inactive Hosting 2",
            slug: `inactive-hosting-2-${Date.now()}`,
            isActive: false,
          },
        }),
      ]);

      createdHostingIds.push(...hostings.map((h) => h.id));
    });

    it("should return list of hostings with pagination", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/hostings?page=1&limit=10"
      );

      const response = await hostingsGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hostings).toBeDefined();
      expect(Array.isArray(data.hostings)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBeGreaterThanOrEqual(0);
    });

    it("should filter hostings by is_active", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/hostings?is_active=true"
      );

      const response = await hostingsGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hostings).toBeDefined();
      data.hostings.forEach((hosting: { isActive: boolean }) => {
        expect(hosting.isActive).toBe(true);
      });
    });

    it("should filter hostings by search query", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/hostings?search=Active"
      );

      const response = await hostingsGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hostings).toBeDefined();
      data.hostings.forEach((hosting: { name: string }) => {
        expect(hosting.name.toLowerCase()).toContain("active");
      });
    });

    it("should allow admin user to access", async () => {
      mockGetServerSession.mockResolvedValue({
        user: adminUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/hostings"
      );

      const response = await hostingsGet(request);
      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/manager/hostings/[id]", () => {
    let testHosting: { id: string; name: string; slug: string };

    beforeAll(async () => {
      testHosting = await prisma.hosting.create({
        data: {
          name: "Test Hosting Details",
          slug: `test-hosting-details-${Date.now()}`,
          description: "Test description",
          isActive: true,
        },
      });
      createdHostingIds.push(testHosting.id);
    });

    it("should return hosting details with tariffs", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/hostings/${testHosting.id}`
      );

      const response = await hostingGet(request, {
        params: Promise.resolve({ id: testHosting.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hosting).toBeDefined();
      expect(data.hosting.id).toBe(testHosting.id);
      expect(data.hosting.name).toBe(testHosting.name);
      expect(data.hosting.tariffs).toBeDefined();
      expect(Array.isArray(data.hosting.tariffs)).toBe(true);
    });

    it("should return 404 for non-existent hosting", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/hostings/non-existent-id"
      );

      const response = await hostingGet(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Хостинг не найден");
    });
  });

  describe("PUT /api/manager/hostings/[id]", () => {
    let testHosting: { id: string; name: string; slug: string };

    beforeAll(async () => {
      testHosting = await prisma.hosting.create({
        data: {
          name: "Original Hosting Name",
          slug: `original-hosting-${Date.now()}`,
          isActive: true,
        },
      });
      createdHostingIds.push(testHosting.id);
    });

    it("should update hosting with new name and regenerate slug", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/hostings/${testHosting.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Hosting Name",
            description: "Updated description",
            isActive: false,
          }),
        }
      );

      const response = await hostingPut(request, {
        params: Promise.resolve({ id: testHosting.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hosting).toBeDefined();
      expect(data.hosting.name).toBe("Updated Hosting Name");
      expect(data.hosting.slug).toBe("updated-hosting-name");
      expect(data.hosting.description).toBe("Updated description");
      expect(data.hosting.isActive).toBe(false);
    });

    it("should update only provided fields", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/hostings/${testHosting.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            isActive: true,
          }),
        }
      );

      const response = await hostingPut(request, {
        params: Promise.resolve({ id: testHosting.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hosting.isActive).toBe(true);
    });
  });

  describe("DELETE /api/manager/hostings/[id]", () => {
    it("should delete hosting without tariffs", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const hostingToDelete = await prisma.hosting.create({
        data: {
          name: "Hosting To Delete",
          slug: `hosting-to-delete-${Date.now()}`,
          isActive: true,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/hostings/${hostingToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const response = await hostingDelete(request, {
        params: Promise.resolve({ id: hostingToDelete.id }),
      });

      expect(response.status).toBe(204);

      // Проверяем, что хостинг удален
      const deletedHosting = await prisma.hosting.findUnique({
        where: { id: hostingToDelete.id },
      });
      expect(deletedHosting).toBeNull();
    });

    it("should reject deletion of hosting with tariffs", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const hostingWithTariffs = await prisma.hosting.create({
        data: {
          name: "Hosting With Tariffs",
          slug: `hosting-with-tariffs-${Date.now()}`,
          isActive: true,
        },
      });

      // Создаем тарифы для хостинга
      await prisma.tariff.createMany({
        data: [
          {
            hostingId: hostingWithTariffs.id,
            name: "Tariff 1",
            price: 100,
            currency: "RUB",
            period: "MONTH",
          },
          {
            hostingId: hostingWithTariffs.id,
            name: "Tariff 2",
            price: 200,
            currency: "RUB",
            period: "MONTH",
          },
        ],
      });

      createdHostingIds.push(hostingWithTariffs.id);

      const request = new NextRequest(
        `http://localhost:3000/api/manager/hostings/${hostingWithTariffs.id}`,
        {
          method: "DELETE",
        }
      );

      const response = await hostingDelete(request, {
        params: Promise.resolve({ id: hostingWithTariffs.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Нельзя удалить хостинг с тарифами");
      expect(data.tariffsCount).toBe(2);

      // Удаляем тарифы для очистки
      await prisma.tariff.deleteMany({
        where: { hostingId: hostingWithTariffs.id },
      });
    });

    it("should return 404 for non-existent hosting", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/hostings/non-existent-id",
        {
          method: "DELETE",
        }
      );

      const response = await hostingDelete(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Хостинг не найден");
    });
  });
});


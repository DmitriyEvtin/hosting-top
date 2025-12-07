/**
 * Integration tests for Manager Tariffs API
 * Tests CRUD operations for tariffs management
 */

import { GET as hostingsTariffsGet, POST as hostingsTariffsPost } from "@/app/api/manager/hostings/[id]/tariffs/route";
import {
  GET as tariffGet,
  PUT as tariffPut,
  DELETE as tariffDelete,
} from "@/app/api/manager/tariffs/[id]/route";
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

describe("Manager Tariffs API", () => {
  let managerUser: { id: string; email: string; name: string; role: UserRole };
  let adminUser: { id: string; email: string; name: string; role: UserRole };
  let regularUser: { id: string; email: string; name: string; role: UserRole };
  let testHosting: { id: string; name: string; slug: string };
  let testCMS1: { id: string; name: string; slug: string };
  let testCMS2: { id: string; name: string; slug: string };
  let testControlPanel: { id: string; name: string; slug: string };
  let testCountry: { id: string; name: string; slug: string };
  let createdTariffIds: string[] = [];

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

    // Создаем тестовый хостинг
    testHosting = await prisma.hosting.create({
      data: {
        name: "Test Hosting",
        slug: `test-hosting-${Date.now()}`,
        isActive: true,
      },
    });

    // Создаем тестовые справочники
    testCMS1 = await prisma.cMS.create({
      data: {
        name: "WordPress",
        slug: `wordpress-${Date.now()}`,
      },
    });

    testCMS2 = await prisma.cMS.create({
      data: {
        name: "Joomla",
        slug: `joomla-${Date.now()}`,
      },
    });

    testControlPanel = await prisma.controlPanel.create({
      data: {
        name: "cPanel",
        slug: `cpanel-${Date.now()}`,
      },
    });

    testCountry = await prisma.country.create({
      data: {
        name: "Russia",
        slug: `russia-${Date.now()}`,
      },
    });
  });

  afterAll(async () => {
    // Удаляем созданные тарифы
    if (createdTariffIds.length > 0) {
      await prisma.tariff.deleteMany({
        where: { id: { in: createdTariffIds } },
      });
    }

    // Удаляем тестовые справочники
    await Promise.all([
      prisma.cMS.deleteMany({ where: { id: { in: [testCMS1.id, testCMS2.id] } } }),
      prisma.controlPanel.deleteMany({ where: { id: testControlPanel.id } }),
      prisma.country.deleteMany({ where: { id: testCountry.id } }),
    ]);

    // Удаляем тестовый хостинг
    await prisma.hosting.delete({ where: { id: testHosting.id } });

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

  describe("POST /api/manager/hostings/[id]/tariffs", () => {
    it("should create tariff with valid data", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/hostings/${testHosting.id}/tariffs`,
        {
          method: "POST",
          body: JSON.stringify({
            name: "Basic Plan",
            price: 100.50,
            currency: "RUB",
            period: "MONTH",
            disk_space: 10,
            bandwidth: 100,
            domains_count: 1,
            databases_count: 1,
            email_accounts: 5,
            is_active: true,
          }),
        }
      );

      const response = await hostingsTariffsPost(request, {
        params: Promise.resolve({ id: testHosting.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.tariff).toBeDefined();
      expect(data.tariff.name).toBe("Basic Plan");
      expect(data.tariff.price).toBe("100.50");
      expect(data.tariff.currency).toBe("RUB");
      expect(data.tariff.period).toBe("MONTH");
      expect(data.tariff.diskSpace).toBe(10);
      expect(data.tariff.bandwidth).toBe(100);
      expect(data.tariff.domainsCount).toBe(1);
      expect(data.tariff.databasesCount).toBe(1);
      expect(data.tariff.emailAccounts).toBe(5);
      expect(data.tariff.isActive).toBe(true);

      if (data.tariff.id) {
        createdTariffIds.push(data.tariff.id);
      }
    });

    it("should create tariff with relations", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/hostings/${testHosting.id}/tariffs`,
        {
          method: "POST",
          body: JSON.stringify({
            name: "Premium Plan",
            price: 200,
            currency: "RUB",
            period: "YEAR",
            cms_ids: [testCMS1.id, testCMS2.id],
            control_panel_ids: [testControlPanel.id],
            country_ids: [testCountry.id],
            is_active: true,
          }),
        }
      );

      const response = await hostingsTariffsPost(request, {
        params: Promise.resolve({ id: testHosting.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.tariff).toBeDefined();
      expect(data.tariff.cms).toBeDefined();
      expect(data.tariff.cms.length).toBe(2);
      expect(data.tariff.controlPanels).toBeDefined();
      expect(data.tariff.controlPanels.length).toBe(1);
      expect(data.tariff.countries).toBeDefined();
      expect(data.tariff.countries.length).toBe(1);

      if (data.tariff.id) {
        createdTariffIds.push(data.tariff.id);
      }
    });

    it("should reject request from non-manager user", async () => {
      mockGetServerSession.mockResolvedValue({
        user: regularUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/hostings/${testHosting.id}/tariffs`,
        {
          method: "POST",
          body: JSON.stringify({
            name: "Basic Plan",
            price: 100,
            currency: "RUB",
            period: "MONTH",
          }),
        }
      );

      const response = await hostingsTariffsPost(request, {
        params: Promise.resolve({ id: testHosting.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Недостаточно прав доступа");
    });

    it("should reject request without authentication", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/manager/hostings/${testHosting.id}/tariffs`,
        {
          method: "POST",
          body: JSON.stringify({
            name: "Basic Plan",
            price: 100,
            currency: "RUB",
            period: "MONTH",
          }),
        }
      );

      const response = await hostingsTariffsPost(request, {
        params: Promise.resolve({ id: testHosting.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Недостаточно прав доступа");
    });

    it("should validate required fields", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/hostings/${testHosting.id}/tariffs`,
        {
          method: "POST",
          body: JSON.stringify({
            // name отсутствует
            price: 100,
            currency: "RUB",
            period: "MONTH",
          }),
        }
      );

      const response = await hostingsTariffsPost(request, {
        params: Promise.resolve({ id: testHosting.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Некорректные данные");
    });

    it("should return 404 for non-existent hosting", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/hostings/non-existent-id/tariffs",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Basic Plan",
            price: 100,
            currency: "RUB",
            period: "MONTH",
          }),
        }
      );

      const response = await hostingsTariffsPost(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Хостинг не найден");
    });

    it("should reject invalid relation IDs", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/hostings/${testHosting.id}/tariffs`,
        {
          method: "POST",
          body: JSON.stringify({
            name: "Basic Plan",
            price: 100,
            currency: "RUB",
            period: "MONTH",
            cms_ids: ["non-existent-cms-id"],
          }),
        }
      );

      const response = await hostingsTariffsPost(request, {
        params: Promise.resolve({ id: testHosting.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("не найдены");
    });
  });

  describe("GET /api/manager/hostings/[id]/tariffs", () => {
    let testTariff: { id: string; name: string };

    beforeAll(async () => {
      testTariff = await prisma.tariff.create({
        data: {
          hostingId: testHosting.id,
          name: "Test Tariff",
          price: 150,
          currency: "RUB",
          period: "MONTH",
          isActive: true,
        },
      });
      createdTariffIds.push(testTariff.id);
    });

    it("should return list of tariffs for hosting", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/hostings/${testHosting.id}/tariffs`
      );

      const response = await hostingsTariffsGet(request, {
        params: Promise.resolve({ id: testHosting.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tariffs).toBeDefined();
      expect(Array.isArray(data.tariffs)).toBe(true);
      expect(data.tariffs.length).toBeGreaterThan(0);
    });

    it("should return tariffs with relations", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/hostings/${testHosting.id}/tariffs`
      );

      const response = await hostingsTariffsGet(request, {
        params: Promise.resolve({ id: testHosting.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tariffs).toBeDefined();
      // Проверяем, что у тарифов есть поля для связей
      if (data.tariffs.length > 0) {
        const tariff = data.tariffs[0];
        expect(tariff.cms).toBeDefined();
        expect(tariff.controlPanels).toBeDefined();
        expect(tariff.countries).toBeDefined();
        expect(tariff.dataStores).toBeDefined();
        expect(tariff.operationSystems).toBeDefined();
        expect(tariff.programmingLanguages).toBeDefined();
      }
    });

    it("should return 404 for non-existent hosting", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/hostings/non-existent-id/tariffs"
      );

      const response = await hostingsTariffsGet(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Хостинг не найден");
    });
  });

  describe("GET /api/manager/tariffs/[id]", () => {
    let testTariff: { id: string; name: string };

    beforeAll(async () => {
      testTariff = await prisma.tariff.create({
        data: {
          hostingId: testHosting.id,
          name: "Detailed Tariff",
          price: 200,
          currency: "RUB",
          period: "YEAR",
          isActive: true,
        },
      });
      createdTariffIds.push(testTariff.id);
    });

    it("should return tariff details with all relations", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/tariffs/${testTariff.id}`
      );

      const response = await tariffGet(request, {
        params: Promise.resolve({ id: testTariff.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tariff).toBeDefined();
      expect(data.tariff.id).toBe(testTariff.id);
      expect(data.tariff.name).toBe("Detailed Tariff");
      expect(data.tariff.hosting).toBeDefined();
      expect(data.tariff.cms).toBeDefined();
      expect(data.tariff.controlPanels).toBeDefined();
      expect(data.tariff.countries).toBeDefined();
      expect(data.tariff.dataStores).toBeDefined();
      expect(data.tariff.operationSystems).toBeDefined();
      expect(data.tariff.programmingLanguages).toBeDefined();
    });

    it("should return 404 for non-existent tariff", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/tariffs/non-existent-id"
      );

      const response = await tariffGet(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Тариф не найден");
    });
  });

  describe("PUT /api/manager/tariffs/[id]", () => {
    let testTariff: { id: string; name: string };

    beforeAll(async () => {
      // Создаем тариф с связями
      testTariff = await prisma.tariff.create({
        data: {
          hostingId: testHosting.id,
          name: "Original Tariff",
          price: 100,
          currency: "RUB",
          period: "MONTH",
          isActive: true,
        },
      });

      // Создаем связи
      await prisma.tariffCMS.create({
        data: {
          tariffId: testTariff.id,
          cmsId: testCMS1.id,
        },
      });

      createdTariffIds.push(testTariff.id);
    });

    it("should update tariff with new relations", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/tariffs/${testTariff.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Tariff",
            price: 250,
            cms_ids: [testCMS1.id, testCMS2.id], // Обновляем связи: добавляем вторую CMS
            control_panel_ids: [testControlPanel.id],
          }),
        }
      );

      const response = await tariffPut(request, {
        params: Promise.resolve({ id: testTariff.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tariff).toBeDefined();
      expect(data.tariff.name).toBe("Updated Tariff");
      expect(data.tariff.price).toBe("250.00");
      expect(data.tariff.cms).toBeDefined();
      expect(data.tariff.cms.length).toBe(2); // Должно быть 2 CMS
      expect(data.tariff.controlPanels).toBeDefined();
      expect(data.tariff.controlPanels.length).toBe(1);
    });

    it("should update only provided fields", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/tariffs/${testTariff.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            is_active: false,
          }),
        }
      );

      const response = await tariffPut(request, {
        params: Promise.resolve({ id: testTariff.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tariff.isActive).toBe(false);
    });

    it("should remove all relations when empty arrays provided", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      // Сначала создаем связи
      await prisma.tariffCMS.create({
        data: {
          tariffId: testTariff.id,
          cmsId: testCMS1.id,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/tariffs/${testTariff.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            cms_ids: [],
            control_panel_ids: [],
          }),
        }
      );

      const response = await tariffPut(request, {
        params: Promise.resolve({ id: testTariff.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tariff.cms.length).toBe(0);
      expect(data.tariff.controlPanels.length).toBe(0);
    });

    it("should preserve relations when not provided in update", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      // Создаем тариф с связями
      const tariffWithRelations = await prisma.tariff.create({
        data: {
          hostingId: testHosting.id,
          name: "Tariff With Preserved Relations",
          price: 120,
          currency: "RUB",
          period: "MONTH",
          isActive: true,
        },
      });

      // Создаем связи
      await prisma.tariffCMS.create({
        data: {
          tariffId: tariffWithRelations.id,
          cmsId: testCMS1.id,
        },
      });

      await prisma.tariffControlPanel.create({
        data: {
          tariffId: tariffWithRelations.id,
          controlPanelId: testControlPanel.id,
        },
      });

      createdTariffIds.push(tariffWithRelations.id);

      // Обновляем только название, не передавая связи
      const request = new NextRequest(
        `http://localhost:3000/api/manager/tariffs/${tariffWithRelations.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Name Only",
          }),
        }
      );

      const response = await tariffPut(request, {
        params: Promise.resolve({ id: tariffWithRelations.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tariff.name).toBe("Updated Name Only");
      // Связи должны остаться без изменений
      expect(data.tariff.cms.length).toBe(1);
      expect(data.tariff.controlPanels.length).toBe(1);
    });
  });

  describe("DELETE /api/manager/tariffs/[id]", () => {
    it("should delete tariff without relations", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const tariffToDelete = await prisma.tariff.create({
        data: {
          hostingId: testHosting.id,
          name: "Tariff To Delete",
          price: 50,
          currency: "RUB",
          period: "MONTH",
          isActive: true,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/tariffs/${tariffToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const response = await tariffDelete(request, {
        params: Promise.resolve({ id: tariffToDelete.id }),
      });

      expect(response.status).toBe(204);

      // Проверяем, что тариф удален
      const deletedTariff = await prisma.tariff.findUnique({
        where: { id: tariffToDelete.id },
      });
      expect(deletedTariff).toBeNull();
    });

    it("should delete tariff with relations (cascade)", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const tariffWithRelations = await prisma.tariff.create({
        data: {
          hostingId: testHosting.id,
          name: "Tariff With Relations",
          price: 75,
          currency: "RUB",
          period: "MONTH",
          isActive: true,
        },
      });

      // Создаем связи
      await prisma.tariffCMS.create({
        data: {
          tariffId: tariffWithRelations.id,
          cmsId: testCMS1.id,
        },
      });

      await prisma.tariffControlPanel.create({
        data: {
          tariffId: tariffWithRelations.id,
          controlPanelId: testControlPanel.id,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/manager/tariffs/${tariffWithRelations.id}`,
        {
          method: "DELETE",
        }
      );

      const response = await tariffDelete(request, {
        params: Promise.resolve({ id: tariffWithRelations.id }),
      });

      expect(response.status).toBe(204);

      // Проверяем, что тариф удален
      const deletedTariff = await prisma.tariff.findUnique({
        where: { id: tariffWithRelations.id },
      });
      expect(deletedTariff).toBeNull();

      // Проверяем, что связи удалены (cascade)
      const cmsRelations = await prisma.tariffCMS.findMany({
        where: { tariffId: tariffWithRelations.id },
      });
      expect(cmsRelations.length).toBe(0);

      const controlPanelRelations = await prisma.tariffControlPanel.findMany({
        where: { tariffId: tariffWithRelations.id },
      });
      expect(controlPanelRelations.length).toBe(0);
    });

    it("should return 404 for non-existent tariff", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/manager/tariffs/non-existent-id",
        {
          method: "DELETE",
        }
      );

      const response = await tariffDelete(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Тариф не найден");
    });
  });
});


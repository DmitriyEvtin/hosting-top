/**
 * Integration tests for Manager References API
 * Tests CRUD operations for all reference dictionaries (CMS, ControlPanel, Country, DataStore, OperationSystem, ProgrammingLanguage)
 */

import { GET as cmsGet, POST as cmsPost } from "@/app/api/manager/cms/route";
import {
  GET as cmsGetById,
  PUT as cmsPut,
  DELETE as cmsDelete,
} from "@/app/api/manager/cms/[id]/route";
import { GET as controlPanelsGet, POST as controlPanelsPost } from "@/app/api/manager/control-panels/route";
import {
  GET as controlPanelsGetById,
  PUT as controlPanelsPut,
  DELETE as controlPanelsDelete,
} from "@/app/api/manager/control-panels/[id]/route";
import { GET as countriesGet, POST as countriesPost } from "@/app/api/manager/countries/route";
import {
  GET as countriesGetById,
  PUT as countriesPut,
  DELETE as countriesDelete,
} from "@/app/api/manager/countries/[id]/route";
import { GET as dataStoresGet, POST as dataStoresPost } from "@/app/api/manager/data-stores/route";
import {
  GET as dataStoresGetById,
  PUT as dataStoresPut,
  DELETE as dataStoresDelete,
} from "@/app/api/manager/data-stores/[id]/route";
import { GET as operationSystemsGet, POST as operationSystemsPost } from "@/app/api/manager/operation-systems/route";
import {
  GET as operationSystemsGetById,
  PUT as operationSystemsPut,
  DELETE as operationSystemsDelete,
} from "@/app/api/manager/operation-systems/[id]/route";
import { GET as programmingLanguagesGet, POST as programmingLanguagesPost } from "@/app/api/manager/programming-languages/route";
import {
  GET as programmingLanguagesGetById,
  PUT as programmingLanguagesPut,
  DELETE as programmingLanguagesDelete,
} from "@/app/api/manager/programming-languages/[id]/route";
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

// Helper function to test reference CRUD operations
function createReferenceTests(
  referenceName: string,
  routePath: string,
  getList: typeof cmsGet,
  postCreate: typeof cmsPost,
  getById: typeof cmsGetById,
  putUpdate: typeof cmsPut,
  deleteItem: typeof cmsDelete,
  prismaModel: any,
  responseKey: string,
  responseListKey: string
) {
  describe(`${referenceName} API`, () => {
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
      // Удаляем созданные записи
      if (createdIds.length > 0) {
        await prismaModel.deleteMany({
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

    describe(`POST /api/manager/${routePath}`, () => {
      it("should create reference with valid data", async () => {
        mockGetServerSession.mockResolvedValue({
          user: managerUser,
          expires: new Date().toISOString(),
        });

        const request = new NextRequest(`http://localhost:3000/api/manager/${routePath}`, {
          method: "POST",
          body: JSON.stringify({
            name: `Test ${referenceName}`,
          }),
        });

        const response = await postCreate(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data[responseKey]).toBeDefined();
        const item = data[responseKey];
        expect(item.name).toBe(`Test ${referenceName}`);
        expect(item.slug).toBe(`test-${referenceName.toLowerCase()}`);

        if (item.id) {
          createdIds.push(item.id);
        }
      });

      it("should reject duplicate name", async () => {
        mockGetServerSession.mockResolvedValue({
          user: managerUser,
          expires: new Date().toISOString(),
        });

        // Создаем первую запись
        const firstRequest = new NextRequest(`http://localhost:3000/api/manager/${routePath}`, {
          method: "POST",
          body: JSON.stringify({
            name: `Unique ${referenceName}`,
          }),
        });

        const firstResponse = await postCreate(firstRequest);
        const firstData = await firstResponse.json();
        const firstItem = firstData[responseKey];
        if (firstItem?.id) {
          createdIds.push(firstItem.id);
        }

        // Пытаемся создать дубликат
        const secondRequest = new NextRequest(`http://localhost:3000/api/manager/${routePath}`, {
          method: "POST",
          body: JSON.stringify({
            name: `Unique ${referenceName}`,
          }),
        });

        const secondResponse = await postCreate(secondRequest);
        const secondData = await secondResponse.json();

        expect(secondResponse.status).toBe(409);
        expect(secondData.error).toContain("уже существует");
      });

      it("should reject request from non-manager user", async () => {
        mockGetServerSession.mockResolvedValue({
          user: regularUser,
          expires: new Date().toISOString(),
        });

        const request = new NextRequest(`http://localhost:3000/api/manager/${routePath}`, {
          method: "POST",
          body: JSON.stringify({
            name: `Test ${referenceName}`,
          }),
        });

        const response = await postCreate(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe("Недостаточно прав доступа");
      });

      it("should allow admin user to create", async () => {
        mockGetServerSession.mockResolvedValue({
          user: adminUser,
          expires: new Date().toISOString(),
        });

        const request = new NextRequest(`http://localhost:3000/api/manager/${routePath}`, {
          method: "POST",
          body: JSON.stringify({
            name: `Admin Test ${referenceName}`,
          }),
        });

        const response = await postCreate(request);
        expect(response.status).toBe(201);
        const data = await response.json();
        const item = data[responseKey];
        if (item?.id) {
          createdIds.push(item.id);
        }
      });
    });

    describe(`GET /api/manager/${routePath}`, () => {
      it("should return list with pagination", async () => {
        mockGetServerSession.mockResolvedValue({
          user: managerUser,
          expires: new Date().toISOString(),
        });

        const request = new NextRequest(
          `http://localhost:3000/api/manager/${routePath}?page=1&limit=10`
        );

        const response = await getList(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data[responseListKey]).toBeDefined();
        expect(Array.isArray(data[responseListKey])).toBe(true);
        expect(data.pagination).toBeDefined();
      });

      it("should filter by search query", async () => {
        mockGetServerSession.mockResolvedValue({
          user: managerUser,
          expires: new Date().toISOString(),
        });

        const request = new NextRequest(
          `http://localhost:3000/api/manager/${routePath}?search=Test`
        );

        const response = await getList(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        const items = data[responseListKey];
        items.forEach((item: { name: string }) => {
          expect(item.name.toLowerCase()).toContain("test");
        });
      });
    });

    describe(`GET /api/manager/${routePath}/[id]`, () => {
      let testItem: { id: string; name: string; slug: string };

      beforeAll(async () => {
        testItem = await prismaModel.create({
          data: {
            name: `Test ${referenceName} Details`,
            slug: `test-${referenceName.toLowerCase()}-details-${Date.now()}`,
          },
        });
        createdIds.push(testItem.id);
      });

      it("should return reference details", async () => {
        mockGetServerSession.mockResolvedValue({
          user: managerUser,
          expires: new Date().toISOString(),
        });

        const request = new NextRequest(
          `http://localhost:3000/api/manager/${routePath}/${testItem.id}`
        );

        const response = await getById(request, {
          params: Promise.resolve({ id: testItem.id }),
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data[responseKey]).toBeDefined();
        const item = data[responseKey];
        expect(item.id).toBe(testItem.id);
        expect(item.name).toBe(testItem.name);
      });

      it("should return 404 for non-existent reference", async () => {
        mockGetServerSession.mockResolvedValue({
          user: managerUser,
          expires: new Date().toISOString(),
        });

        const request = new NextRequest(
          `http://localhost:3000/api/manager/${routePath}/non-existent-id`
        );

        const response = await getById(request, {
          params: Promise.resolve({ id: "non-existent-id" }),
        });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toContain("не найден");
      });
    });

    describe(`PUT /api/manager/${routePath}/[id]`, () => {
      let testItem: { id: string; name: string; slug: string };

      beforeAll(async () => {
        testItem = await prismaModel.create({
          data: {
            name: `Original ${referenceName}`,
            slug: `original-${referenceName.toLowerCase()}-${Date.now()}`,
          },
        });
        createdIds.push(testItem.id);
      });

      it("should update reference with new name and regenerate slug", async () => {
        mockGetServerSession.mockResolvedValue({
          user: managerUser,
          expires: new Date().toISOString(),
        });

        const request = new NextRequest(
          `http://localhost:3000/api/manager/${routePath}/${testItem.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              name: `Updated ${referenceName}`,
            }),
          }
        );

        const response = await putUpdate(request, {
          params: Promise.resolve({ id: testItem.id }),
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        const item = data[responseKey];
        expect(item.name).toBe(`Updated ${referenceName}`);
        expect(item.slug).toBe(`updated-${referenceName.toLowerCase()}`);
      });
    });

    describe(`DELETE /api/manager/${routePath}/[id]`, () => {
      it("should delete reference without tariffs", async () => {
        mockGetServerSession.mockResolvedValue({
          user: managerUser,
          expires: new Date().toISOString(),
        });

        const itemToDelete = await prismaModel.create({
          data: {
            name: `${referenceName} To Delete`,
            slug: `${referenceName.toLowerCase()}-to-delete-${Date.now()}`,
          },
        });

        const request = new NextRequest(
          `http://localhost:3000/api/manager/${routePath}/${itemToDelete.id}`,
          {
            method: "DELETE",
          }
        );

        const response = await deleteItem(request, {
          params: Promise.resolve({ id: itemToDelete.id }),
        });

        expect(response.status).toBe(204);

        // Проверяем, что запись удалена
        const deletedItem = await prismaModel.findUnique({
          where: { id: itemToDelete.id },
        });
        expect(deletedItem).toBeNull();
      });

      it("should reject deletion of reference with tariffs", async () => {
        mockGetServerSession.mockResolvedValue({
          user: managerUser,
          expires: new Date().toISOString(),
        });

        // Создаем хостинг и тариф
        const hosting = await prisma.hosting.create({
          data: {
            name: `Test Hosting for ${referenceName}`,
            slug: `test-hosting-${referenceName.toLowerCase()}-${Date.now()}`,
          },
        });

        const tariff = await prisma.tariff.create({
          data: {
            hostingId: hosting.id,
            name: "Test Tariff",
            price: 100,
            currency: "RUB",
            period: "MONTH",
          },
        });

        const itemWithTariffs = await prismaModel.create({
          data: {
            name: `${referenceName} With Tariffs`,
            slug: `${referenceName.toLowerCase()}-with-tariffs-${Date.now()}`,
          },
        });

        // Связываем справочник с тарифом
        const relationMap: Record<string, { model: string; field: string }> = {
          cms: { model: "tariffCMS", field: "cmsId" },
          "control-panels": { model: "tariffControlPanel", field: "controlPanelId" },
          countries: { model: "tariffCountry", field: "countryId" },
          "data-stores": { model: "tariffDataStore", field: "dataStoreId" },
          "operation-systems": { model: "tariffOperationSystem", field: "operationSystemId" },
          "programming-languages": { model: "tariffProgrammingLanguage", field: "programmingLanguageId" },
        };

        const relation = relationMap[routePath] || { model: "tariffCMS", field: "cmsId" };
        const relationModel = (prisma as any)[relation.model];

        await relationModel.create({
          data: {
            tariffId: tariff.id,
            [relation.field]: itemWithTariffs.id,
          },
        });

        createdIds.push(itemWithTariffs.id);

        const request = new NextRequest(
          `http://localhost:3000/api/manager/${routePath}/${itemWithTariffs.id}`,
          {
            method: "DELETE",
          }
        );

        const response = await deleteItem(request, {
          params: Promise.resolve({ id: itemWithTariffs.id }),
        });
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toContain("используется в тарифах");
        expect(data.tariffsCount).toBeGreaterThan(0);

        // Очистка
        await relationModel.deleteMany({
          where: { tariffId: tariff.id },
        });
        await prisma.tariff.delete({ where: { id: tariff.id } });
        await prisma.hosting.delete({ where: { id: hosting.id } });
      });
    });
  });
}

describe("Manager References API", () => {
  // CMS tests
  createReferenceTests(
    "CMS",
    "cms",
    cmsGet,
    cmsPost,
    cmsGetById,
    cmsPut,
    cmsDelete,
    prisma.cMS,
    "cms",
    "cms"
  );

  // ControlPanel tests
  createReferenceTests(
    "ControlPanel",
    "control-panels",
    controlPanelsGet,
    controlPanelsPost,
    controlPanelsGetById,
    controlPanelsPut,
    controlPanelsDelete,
    prisma.controlPanel,
    "controlPanel",
    "controlPanels"
  );

  // Country tests
  createReferenceTests(
    "Country",
    "countries",
    countriesGet,
    countriesPost,
    countriesGetById,
    countriesPut,
    countriesDelete,
    prisma.country,
    "country",
    "countries"
  );

  // DataStore tests
  createReferenceTests(
    "DataStore",
    "data-stores",
    dataStoresGet,
    dataStoresPost,
    dataStoresGetById,
    dataStoresPut,
    dataStoresDelete,
    prisma.dataStore,
    "dataStore",
    "dataStores"
  );

  // OperationSystem tests
  createReferenceTests(
    "OperationSystem",
    "operation-systems",
    operationSystemsGet,
    operationSystemsPost,
    operationSystemsGetById,
    operationSystemsPut,
    operationSystemsDelete,
    prisma.operationSystem,
    "operationSystem",
    "operationSystems"
  );

  // ProgrammingLanguage tests
  createReferenceTests(
    "ProgrammingLanguage",
    "programming-languages",
    programmingLanguagesGet,
    programmingLanguagesPost,
    programmingLanguagesGetById,
    programmingLanguagesPut,
    programmingLanguagesDelete,
    prisma.programmingLanguage,
    "programmingLanguage",
    "programmingLanguages"
  );
});


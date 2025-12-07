/**
 * Integration tests for Admin Migration API
 */

import { prisma } from "@/shared/api/database";
import { UserRole } from "@/shared/lib/types";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import {
  resetMigrationStatus,
  saveMigrationStatus,
} from "@/shared/lib/migration-status";
import { POST as startMigration } from "@/app/api/admin/migration/start/route";
import { GET as getMigrationStatus } from "@/app/api/admin/migration/status/route";
import { POST as rollbackMigration } from "@/app/api/admin/migration/rollback/route";

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

describe("Admin Migration API", () => {
  let adminUser: { id: string; email: string; name: string; role: UserRole };
  let managerUser: { id: string; email: string; name: string; role: UserRole };
  let regularUser: { id: string; email: string; name: string; role: UserRole };

  beforeAll(async () => {
    // Создаем тестовых пользователей
    adminUser = await prisma.user.create({
      data: {
        email: `admin-migration-${Date.now()}@test.com`,
        name: "Admin User",
        role: UserRole.ADMIN,
        password: "hashed-password",
      },
    });

    managerUser = await prisma.user.create({
      data: {
        email: `manager-migration-${Date.now()}@test.com`,
        name: "Manager User",
        role: UserRole.MANAGER,
        password: "hashed-password",
      },
    });

    regularUser = await prisma.user.create({
      data: {
        email: `user-migration-${Date.now()}@test.com`,
        name: "Regular User",
        role: UserRole.USER,
        password: "hashed-password",
      },
    });
  });

  afterAll(async () => {
    // Очищаем статус миграции
    await resetMigrationStatus();

    // Удаляем тестовых пользователей
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUser.id, managerUser.id, regularUser.id] },
      },
    });
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Сбрасываем статус миграции перед каждым тестом
    await resetMigrationStatus();
  });

  describe("POST /api/admin/migration/start", () => {
    it("should start migration for admin user", async () => {
      mockGetServerSession.mockResolvedValue({
        user: adminUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/admin/migration/start", {
        method: "POST",
        body: JSON.stringify({
          dryRun: false,
          skipImages: false,
        }),
      });

      const response = await startMigration(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.message).toBe("Миграция запущена");
      expect(data.migrationId).toBeDefined();
      expect(data.status).toBe("running");
    });

    it("should start migration with dry-run flag", async () => {
      mockGetServerSession.mockResolvedValue({
        user: adminUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/admin/migration/start", {
        method: "POST",
        body: JSON.stringify({
          dryRun: true,
          skipImages: false,
        }),
      });

      const response = await startMigration(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.migrationId).toBeDefined();
    });

    it("should start migration with skip-images flag", async () => {
      mockGetServerSession.mockResolvedValue({
        user: adminUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/admin/migration/start", {
        method: "POST",
        body: JSON.stringify({
          dryRun: false,
          skipImages: true,
        }),
      });

      const response = await startMigration(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.migrationId).toBeDefined();
    });

    it("should reject migration start if already running", async () => {
      mockGetServerSession.mockResolvedValue({
        user: adminUser,
        expires: new Date().toISOString(),
      });

      // Устанавливаем статус "running"
      await saveMigrationStatus({
        id: "test-migration-id",
        status: "running",
        progress: { current: 0, total: 100 },
        startedAt: new Date().toISOString(),
        completedAt: null,
        errors: [],
        results: null,
        dryRun: false,
        skippedImages: false,
      });

      const request = new NextRequest("http://localhost:3000/api/admin/migration/start", {
        method: "POST",
        body: JSON.stringify({
          dryRun: false,
          skipImages: false,
        }),
      });

      const response = await startMigration(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Миграция уже запущена");
    });

    it("should reject migration start for non-admin user", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/admin/migration/start", {
        method: "POST",
        body: JSON.stringify({
          dryRun: false,
          skipImages: false,
        }),
      });

      const response = await startMigration(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("администратора");
    });

    it("should reject migration start for unauthenticated user", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/admin/migration/start", {
        method: "POST",
        body: JSON.stringify({
          dryRun: false,
          skipImages: false,
        }),
      });

      const response = await startMigration(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("администратора");
    });
  });

  describe("GET /api/admin/migration/status", () => {
    it("should return idle status when no migration", async () => {
      mockGetServerSession.mockResolvedValue({
        user: adminUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/admin/migration/status");

      const response = await getMigrationStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("idle");
      expect(data.message).toBe("Миграция не запущена");
    });

    it("should return migration status when running", async () => {
      mockGetServerSession.mockResolvedValue({
        user: adminUser,
        expires: new Date().toISOString(),
      });

      const testStatus = {
        id: "test-migration-id",
        status: "running" as const,
        progress: { current: 50, total: 100, stage: "migrating-hostings" },
        startedAt: new Date().toISOString(),
        completedAt: null,
        errors: [],
        results: null,
        dryRun: false,
        skippedImages: false,
      };

      await saveMigrationStatus(testStatus);

      const request = new NextRequest("http://localhost:3000/api/admin/migration/status");

      const response = await getMigrationStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(testStatus.id);
      expect(data.status).toBe("running");
      expect(data.progress.current).toBe(50);
      expect(data.progress.total).toBe(100);
    });

    it("should return completed migration status", async () => {
      mockGetServerSession.mockResolvedValue({
        user: adminUser,
        expires: new Date().toISOString(),
      });

      const testStatus = {
        id: "test-migration-id",
        status: "completed" as const,
        progress: { current: 100, total: 100 },
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date().toISOString(),
        errors: [],
        results: {
          hostings: 10,
          tariffs: 20,
          images: 5,
          references: {
            cms: 3,
            controlPanels: 2,
            countries: 5,
            dataStores: 2,
            operationSystems: 4,
            programmingLanguages: 3,
          },
          tariffRelations: {
            cms: 15,
            controlPanels: 10,
            countries: 12,
            dataStores: 8,
            operationSystems: 9,
            programmingLanguages: 11,
          },
          contentBlocks: 7,
        },
        dryRun: false,
        skippedImages: false,
      };

      await saveMigrationStatus(testStatus);

      const request = new NextRequest("http://localhost:3000/api/admin/migration/status");

      const response = await getMigrationStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("completed");
      expect(data.results).toBeDefined();
      expect(data.results?.hostings).toBe(10);
      expect(data.results?.tariffs).toBe(20);
    });

    it("should reject status request for non-admin user", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/admin/migration/status");

      const response = await getMigrationStatus(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("администратора");
    });
  });

  describe("POST /api/admin/migration/rollback", () => {
    it("should reject rollback when migration is running", async () => {
      mockGetServerSession.mockResolvedValue({
        user: adminUser,
        expires: new Date().toISOString(),
      });

      await saveMigrationStatus({
        id: "test-migration-id",
        status: "running",
        progress: { current: 50, total: 100 },
        startedAt: new Date().toISOString(),
        completedAt: null,
        errors: [],
        results: null,
        dryRun: false,
        skippedImages: false,
      });

      const request = new NextRequest("http://localhost:3000/api/admin/migration/rollback", {
        method: "POST",
      });

      const response = await rollbackMigration(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain("выполняется");
    });

    it("should reject rollback when no completed migration", async () => {
      mockGetServerSession.mockResolvedValue({
        user: adminUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/admin/migration/rollback", {
        method: "POST",
      });

      const response = await rollbackMigration(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("завершенной миграции");
    });

    it("should return not implemented for rollback", async () => {
      mockGetServerSession.mockResolvedValue({
        user: adminUser,
        expires: new Date().toISOString(),
      });

      await saveMigrationStatus({
        id: "test-migration-id",
        status: "completed",
        progress: { current: 100, total: 100 },
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date().toISOString(),
        errors: [],
        results: {
          hostings: 10,
          tariffs: 20,
          images: 5,
          references: {
            cms: 3,
            controlPanels: 2,
            countries: 5,
            dataStores: 2,
            operationSystems: 4,
            programmingLanguages: 3,
          },
          tariffRelations: {
            cms: 15,
            controlPanels: 10,
            countries: 12,
            dataStores: 8,
            operationSystems: 9,
            programmingLanguages: 11,
          },
          contentBlocks: 7,
        },
        dryRun: false,
        skippedImages: false,
      });

      const request = new NextRequest("http://localhost:3000/api/admin/migration/rollback", {
        method: "POST",
      });

      const response = await rollbackMigration(request);
      const data = await response.json();

      expect(response.status).toBe(501);
      expect(data.message).toContain("не реализован");
    });

    it("should reject rollback for non-admin user", async () => {
      mockGetServerSession.mockResolvedValue({
        user: managerUser,
        expires: new Date().toISOString(),
      });

      const request = new NextRequest("http://localhost:3000/api/admin/migration/rollback", {
        method: "POST",
      });

      const response = await rollbackMigration(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("администратора");
    });
  });
});


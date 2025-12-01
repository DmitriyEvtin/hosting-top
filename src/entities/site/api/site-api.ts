import { prisma } from "@/shared/api/database/prisma";
import {
  Site,
  CreateSiteData,
  UpdateSiteData,
} from "../model/types";

export class SiteApi {
  /**
   * Получить список всех сайтов
   */
  static async getSites(): Promise<Site[]> {
    return await prisma.site.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Получить сайт по ID
   */
  static async getSiteById(id: string): Promise<Site | null> {
    return await prisma.site.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Создать новый сайт
   */
  static async createSite(data: CreateSiteData): Promise<Site> {
    return await prisma.site.create({
      data,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Обновить сайт
   */
  static async updateSite(id: string, data: UpdateSiteData): Promise<Site> {
    return await prisma.site.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Удалить сайт
   */
  static async deleteSite(id: string): Promise<Site> {
    return await prisma.site.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Проверить существование сайта по названию
   */
  static async siteExists(name: string, excludeId?: string): Promise<boolean> {
    const where: { name: string; id?: { not: string } } = { name };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const site = await prisma.site.findFirst({ where });
    return !!site;
  }
}


import { prisma } from "@/shared/api/database/prisma";
import { s3Service } from "@/shared/lib/s3-utils";
import {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from "../model/types";

export class CategoryApi {
  /**
   * Получить список всех категорий с опциональной фильтрацией по сайту
   */
  static async getCategories(siteId?: string): Promise<Category[]> {
    const where = siteId
      ? {
          sites: {
            some: {
              siteId,
            },
          },
        }
      : {};

    return await prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        sites: {
          include: {
            site: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Получить категорию по ID
   */
  static async getCategoryById(id: string): Promise<Category | null> {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        sites: {
          include: {
            site: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Проверить существование сайтов по ID
   */
  static async validateSiteIds(siteIds: string[]): Promise<{
    valid: boolean;
    missingIds: string[];
  }> {
    const sites = await prisma.site.findMany({
      where: {
        id: {
          in: siteIds,
        },
      },
      select: {
        id: true,
      },
    });

    const foundIds = new Set(sites.map((s) => s.id));
    const missingIds = siteIds.filter((id) => !foundIds.has(id));

    return {
      valid: missingIds.length === 0,
      missingIds,
    };
  }

  /**
   * Создать новую категорию с привязкой к сайтам
   */
  static async createCategory(data: CreateCategoryData): Promise<Category> {
    return await prisma.category.create({
      data: {
        name: data.name,
        image: data.image || null,
        sites: {
          create: data.siteIds.map((siteId) => ({
            siteId,
          })),
        },
      },
      include: {
        sites: {
          include: {
            site: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Удалить старое изображение из S3
   */
  static async deleteOldImage(imageUrl: string | null | undefined): Promise<void> {
    if (!imageUrl) {
      return;
    }

    try {
      const key = s3Service.extractKeyFromUrl(imageUrl);
      if (key) {
        await s3Service.deleteFile(key);
      }
    } catch (error) {
      // Логируем ошибку, но не прерываем выполнение
      console.error("Ошибка при удалении старого изображения:", error);
    }
  }

  /**
   * Обновить категорию и связи с сайтами
   */
  static async updateCategory(
    id: string,
    data: UpdateCategoryData,
    oldImageUrl?: string | null
  ): Promise<Category> {
    return await prisma.$transaction(async (tx) => {
      // Обновляем название категории, если оно указано
      const updateData: { name?: string; image?: string | null } = {};
      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      // Обработка изображения
      if (data.image !== undefined) {
        updateData.image = data.image;

        // Если изображение изменилось (включая удаление через null) и старое существует, удаляем его из S3
        if (oldImageUrl && oldImageUrl !== data.image) {
          await this.deleteOldImage(oldImageUrl);
        }
      }

      // Если указаны siteIds, обновляем связи
      if (data.siteIds !== undefined) {
        // Удаляем все существующие связи
        await tx.categorySite.deleteMany({
          where: {
            categoryId: id,
          },
        });

        // Создаем новые связи
        if (data.siteIds.length > 0) {
          await tx.categorySite.createMany({
            data: data.siteIds.map((siteId) => ({
              categoryId: id,
              siteId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Обновляем категорию
      return await tx.category.update({
        where: { id },
        data: updateData,
        include: {
          sites: {
            include: {
              site: {
                select: {
                  id: true,
                  name: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Удалить категорию
   * Товары автоматически получат categoryId = null (onDelete: SetNull)
   */
  static async deleteCategory(id: string): Promise<void> {
    await prisma.category.delete({
      where: { id },
    });
  }
}


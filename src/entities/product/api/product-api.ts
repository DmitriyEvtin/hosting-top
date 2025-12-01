import { prisma } from "@/shared/api/database/prisma";
import {
  Product,
  CreateProductData,
  UpdateProductData,
} from "../model/types";

export class ProductApi {
  /**
   * Получить список товаров с опциональной фильтрацией по сайту и категории
   */
  static async getProducts(
    siteId?: string,
    categoryId?: string
  ): Promise<Product[]> {
    const whereConditions: Array<Record<string, unknown>> = [];

    if (siteId) {
      whereConditions.push({
        sites: {
          some: {
            siteId,
          },
        },
      });
    }

    if (categoryId) {
      whereConditions.push({
        categoryId,
      });
    }

    return await prisma.product.findMany({
      where: whereConditions.length > 0 ? { AND: whereConditions } : {},
      orderBy: { name: "asc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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
   * Получить товар по ID
   */
  static async getProductById(id: string): Promise<Product | null> {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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
   * Проверить существование категории по ID
   */
  static async validateCategoryId(categoryId: string): Promise<boolean> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    return category !== null;
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
   * Создать новый товар с опциональной категорией и привязкой к сайтам
   */
  static async createProduct(data: CreateProductData): Promise<Product> {
    return await prisma.product.create({
      data: {
        name: data.name,
        categoryId: data.categoryId || null,
        sites: {
          create: data.siteIds.map((siteId) => ({
            siteId,
          })),
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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
   * Обновить товар, категорию и связи с сайтами
   */
  static async updateProduct(
    id: string,
    data: UpdateProductData
  ): Promise<Product> {
    return await prisma.$transaction(async (tx) => {
      // Подготавливаем данные для обновления
      const updateData: {
        name?: string;
        categoryId?: string | null;
      } = {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      if (data.categoryId !== undefined) {
        updateData.categoryId = data.categoryId;
      }

      // Если указаны siteIds, обновляем связи
      if (data.siteIds !== undefined) {
        // Удаляем все существующие связи
        await tx.productSite.deleteMany({
          where: {
            productId: id,
          },
        });

        // Создаем новые связи
        if (data.siteIds.length > 0) {
          await tx.productSite.createMany({
            data: data.siteIds.map((siteId) => ({
              productId: id,
              siteId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Обновляем товар
      return await tx.product.update({
        where: { id },
        data: updateData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              createdAt: true,
              updatedAt: true,
            },
          },
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
   * Удалить товар
   * Связи ProductSite удаляются каскадно (onDelete: Cascade)
   */
  static async deleteProduct(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id },
    });
  }
}


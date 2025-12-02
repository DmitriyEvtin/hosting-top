import { prisma } from "@/shared/api/database/prisma";
import {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductImage,
  CreateProductImagesData,
  ReorderProductImagesData,
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

  /**
   * Получить все изображения товара, отсортированные по sortOrder
   */
  static async getProductImages(productId: string): Promise<ProductImage[]> {
    return await prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: "asc" },
    });
  }

  /**
   * Получить максимальный sortOrder для товара
   */
  static async getMaxSortOrder(productId: string): Promise<number> {
    const result = await prisma.productImage.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });
    return result._max.sortOrder ?? -1;
  }

  /**
   * Добавить изображения к товару
   */
  static async addProductImages(
    productId: string,
    data: CreateProductImagesData
  ): Promise<ProductImage[]> {
    return await prisma.$transaction(async (tx) => {
      // Получаем максимальный sortOrder
      const maxSortOrderResult = await tx.productImage.aggregate({
        where: { productId },
        _max: { sortOrder: true },
      });
      const maxSortOrder = maxSortOrderResult._max.sortOrder ?? -1;

      // Создаем изображения с автоинкрементом sortOrder
      const images = await Promise.all(
        data.imageUrls.map((imageUrl, index) =>
          tx.productImage.create({
            data: {
              productId,
              imageUrl,
              sortOrder: maxSortOrder + 1 + index,
            },
          })
        )
      );

      return images;
    });
  }

  /**
   * Изменить порядок изображений товара
   */
  static async reorderProductImages(
    productId: string,
    data: ReorderProductImagesData
  ): Promise<ProductImage[]> {
    return await prisma.$transaction(async (tx) => {
      // Проверяем, что все изображения принадлежат товару
      const existingImages = await tx.productImage.findMany({
        where: {
          productId,
          id: { in: data.imageIds },
        },
      });

      if (existingImages.length !== data.imageIds.length) {
        throw new Error("Некоторые изображения не найдены или не принадлежат товару");
      }

      // Обновляем sortOrder для каждого изображения по индексу в массиве
      const updatePromises = data.imageIds.map((imageId, index) =>
        tx.productImage.update({
          where: { id: imageId },
          data: { sortOrder: index },
        })
      );

      await Promise.all(updatePromises);

      // Возвращаем обновленные изображения
      return await tx.productImage.findMany({
        where: { productId },
        orderBy: { sortOrder: "asc" },
      });
    });
  }

  /**
   * Удалить изображение товара
   */
  static async deleteProductImage(imageId: string): Promise<{
    imageUrl: string;
    productId: string;
    sortOrder: number;
  }> {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
      select: {
        imageUrl: true,
        productId: true,
        sortOrder: true,
      },
    });

    if (!image) {
      throw new Error("Изображение не найдено");
    }

    await prisma.$transaction(async (tx) => {
      // Удаляем изображение
      await tx.productImage.delete({
        where: { id: imageId },
      });

      // Получаем все изображения с sortOrder больше удаленного
      const imagesToRenumber = await tx.productImage.findMany({
        where: {
          productId: image.productId,
          sortOrder: { gt: image.sortOrder },
        },
        orderBy: { sortOrder: "asc" },
      });

      // Перенумеровываем оставшиеся изображения
      await Promise.all(
        imagesToRenumber.map((img) =>
          tx.productImage.update({
            where: { id: img.id },
            data: { sortOrder: img.sortOrder - 1 },
          })
        )
      );
    });

    return image;
  }
}


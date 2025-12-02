import { prisma } from "@/shared/api/database";
import { NextRequest, NextResponse } from "next/server";
import type { ProductImage } from "@prisma/client";

/**
 * Трансформирует массив изображений товара для публичного API
 * Добавляет флаг isMain для первого изображения (с наименьшим sortOrder)
 * 
 * @param images - Массив изображений товара, отсортированный по sortOrder
 * @returns Трансформированный массив изображений с флагом isMain
 */
function transformProductImages(images: ProductImage[]) {
  return images.map((img, index) => ({
    id: img.id,
    url: img.imageUrl,
    sortOrder: img.sortOrder,
    isMain: index === 0,
  }));
}

/**
 * GET /api/public/catalog/[siteId] - Получить публичный каталог товаров для конкретного сайта
 * 
 * Публичный endpoint без авторизации.
 * 
 * Правила фильтрации:
 * - Товар виден только если он опубликован на сайте И его категория (если есть) тоже опубликована на сайте
 * - Товары без категории включаются в отдельный массив uncategorizedProducts
 * 
 * @param request - Next.js request object
 * @param params - Route parameters с siteId
 * @returns Структурированный каталог с категориями и товарами, включая изображения
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const { siteId } = params;

    // Проверяем существование сайта
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    // Получаем категории, опубликованные на сайте, с товарами
    // Товар включается только если:
    // 1. Товар опубликован на сайте (есть в ProductSite)
    // 2. И категория товара тоже опубликована на сайте (есть в CategorySite)
    const categories = await prisma.category.findMany({
      where: {
        sites: {
          some: {
            siteId: siteId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        products: {
          where: {
            // Товар должен быть опубликован на сайте
            sites: {
              some: {
                siteId: siteId,
              },
            },
          },
          select: {
            id: true,
            name: true,
            categoryId: true,
            createdAt: true,
            updatedAt: true,
            images: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Получаем товары без категории, опубликованные на сайте
    const uncategorizedProducts = await prisma.product.findMany({
      where: {
        categoryId: null,
        sites: {
          some: {
            siteId: siteId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Формируем структурированный ответ
    const response = {
      site: {
        id: site.id,
        name: site.name,
      },
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        image: category.image,
        products: category.products.map((product) => ({
          id: product.id,
          name: product.name,
          categoryId: product.categoryId,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          images: transformProductImages(product.images),
        })),
      })),
      uncategorizedProducts: uncategorizedProducts.map((product) => ({
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        images: transformProductImages(product.images),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Ошибка при получении каталога:", error);

    return NextResponse.json(
      {
        error: "Внутренняя ошибка сервера",
        message:
          error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      { status: 500 }
    );
  }
}


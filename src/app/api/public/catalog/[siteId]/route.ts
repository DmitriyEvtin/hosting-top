import { prisma } from "@/shared/api/database";
import { NextRequest, NextResponse } from "next/server";

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
 * @returns Структурированный каталог с категориями и товарами
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
      include: {
        products: {
          where: {
            // Товар должен быть опубликован на сайте
            sites: {
              some: {
                siteId: siteId,
              },
            },
            // Товар автоматически принадлежит категории через include
          },
          select: {
            id: true,
            name: true,
            categoryId: true,
            createdAt: true,
            updatedAt: true,
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
        products: category.products,
      })),
      uncategorizedProducts,
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


import { ProductApi } from "@/entities/product";
import { createProductSchema } from "@/entities/product/model/validation";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/products - Получить список товаров с фильтрацией по сайту и категории
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем права доступа (Менеджер или Админ)
    if (!hasManagerOrAdminAccess(session.user.role)) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    // Парсим опциональные параметры siteId и categoryId из query string
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;

    const products = await ProductApi.getProducts(siteId, categoryId);

    return NextResponse.json({
      products,
      total: products.length,
    });
  } catch (error) {
    console.error("Ошибка при получении списка товаров:", error);

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products - Создать новый товар с опциональной категорией и привязкой к сайтам
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем права доступа (Менеджер или Админ)
    if (!hasManagerOrAdminAccess(session.user.role)) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    // Проверяем существование categoryId, если он указан
    if (validatedData.categoryId) {
      const categoryExists = await ProductApi.validateCategoryId(
        validatedData.categoryId
      );
      if (!categoryExists) {
        return NextResponse.json(
          { error: "Категория не найдена" },
          { status: 400 }
        );
      }
    }

    // Проверяем существование всех указанных сайтов
    const siteValidation = await ProductApi.validateSiteIds(
      validatedData.siteIds
    );
    if (!siteValidation.valid) {
      return NextResponse.json(
        {
          error: "Некоторые сайты не найдены",
          missingSiteIds: siteValidation.missingIds,
        },
        { status: 400 }
      );
    }

    const product = await ProductApi.createProduct(validatedData);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Ошибка при создании товара:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Неверные данные",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


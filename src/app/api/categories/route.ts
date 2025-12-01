import { CategoryApi } from "@/entities/category";
import { createCategorySchema } from "@/entities/category/model/validation";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/categories - Получить список категорий с опциональной фильтрацией по сайту
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

    // Парсим опциональный параметр siteId из query string
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId") || undefined;

    const categories = await CategoryApi.getCategories(siteId);

    return NextResponse.json({
      categories,
      total: categories.length,
    });
  } catch (error) {
    console.error("Ошибка при получении списка категорий:", error);

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories - Создать новую категорию с привязкой к сайтам
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
    const validatedData = createCategorySchema.parse(body);

    // Проверяем существование всех указанных сайтов
    const siteValidation = await CategoryApi.validateSiteIds(
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

    const category = await CategoryApi.createCategory(validatedData);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Ошибка при создании категории:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Неверные данные",
          details: error.errors,
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


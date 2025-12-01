import { CategoryApi } from "@/entities/category";
import { updateCategorySchema } from "@/entities/category/model/validation";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/categories/[id] - Получить категорию по ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем права доступа (Менеджер или Админ)
    if (!hasManagerOrAdminAccess(session.user.role)) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const category = await CategoryApi.getCategoryById(params.id);

    if (!category) {
      return NextResponse.json(
        { error: "Категория не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Ошибка при получении категории:", error);

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/[id] - Обновить категорию и список сайтов
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем права доступа (Менеджер или Админ)
    if (!hasManagerOrAdminAccess(session.user.role)) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    // Проверяем существование категории
    const existingCategory = await CategoryApi.getCategoryById(params.id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Категория не найдена" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    // Если указаны siteIds, проверяем их существование
    if (validatedData.siteIds !== undefined) {
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
    }

    const category = await CategoryApi.updateCategory(params.id, validatedData);

    return NextResponse.json(category);
  } catch (error) {
    console.error("Ошибка при обновлении категории:", error);

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

/**
 * DELETE /api/categories/[id] - Удалить категорию
 * Товары автоматически получат categoryId = null (onDelete: SetNull)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем права доступа (Менеджер или Админ)
    if (!hasManagerOrAdminAccess(session.user.role)) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    // Проверяем существование категории
    const existingCategory = await CategoryApi.getCategoryById(params.id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Категория не найдена" },
        { status: 404 }
      );
    }

    // Удаляем категорию (товары автоматически получат categoryId = null)
    await CategoryApi.deleteCategory(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при удалении категории:", error);

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


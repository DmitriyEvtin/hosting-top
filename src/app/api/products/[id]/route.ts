import { ProductApi } from "@/entities/product";
import { updateProductSchema } from "@/entities/product/model/validation";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/products/[id] - Получить товар по ID
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

    const product = await ProductApi.getProductById(params.id);

    if (!product) {
      return NextResponse.json(
        { error: "Товар не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Ошибка при получении товара:", error);

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[id] - Обновить товар, категорию и связи с сайтами
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

    // Проверяем существование товара
    const existingProduct = await ProductApi.getProductById(params.id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Товар не найден" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Проверяем существование categoryId, если он указан и не null
    if (validatedData.categoryId !== undefined && validatedData.categoryId !== null) {
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

    // Проверяем существование всех указанных сайтов, если они указаны
    if (validatedData.siteIds) {
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
    }

    const product = await ProductApi.updateProduct(params.id, validatedData);

    return NextResponse.json(product);
  } catch (error) {
    console.error("Ошибка при обновлении товара:", error);

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

/**
 * DELETE /api/products/[id] - Удалить товар
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

    // Проверяем существование товара
    const existingProduct = await ProductApi.getProductById(params.id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Товар не найден" },
        { status: 404 }
      );
    }

    await ProductApi.deleteProduct(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при удалении товара:", error);

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


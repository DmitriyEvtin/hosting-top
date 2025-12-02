import { ProductApi } from "@/entities/product";
import { createProductImagesSchema } from "@/entities/product/model/validation";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * POST /api/products/[id]/images - Добавить изображения к товару
 */
export async function POST(
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
    const validatedData = createProductImagesSchema.parse(body);

    const images = await ProductApi.addProductImages(params.id, validatedData);

    return NextResponse.json(images, { status: 201 });
  } catch (error) {
    console.error("Ошибка при добавлении изображений:", error);

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


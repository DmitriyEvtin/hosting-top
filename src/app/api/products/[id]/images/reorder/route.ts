import { ProductApi } from "@/entities/product";
import { reorderProductImagesSchema } from "@/entities/product/model/validation";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * PUT /api/products/[id]/images/reorder - Изменить порядок изображений товара
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
    const validatedData = reorderProductImagesSchema.parse(body);

    const images = await ProductApi.reorderProductImages(
      params.id,
      validatedData
    );

    return NextResponse.json(images);
  } catch (error) {
    console.error("Ошибка при изменении порядка изображений:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Неверные данные",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("не найдены")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


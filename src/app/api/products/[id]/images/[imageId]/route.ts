import { ProductApi } from "@/entities/product";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerOrAdminAccess } from "@/shared/lib/permissions";
import { s3Service } from "@/shared/lib/s3-utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/products/[id]/images/[imageId] - Удалить изображение товара
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
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

    // Удаляем изображение из БД и получаем информацию о нем
    const deletedImage = await ProductApi.deleteProductImage(params.imageId);

    // Удаляем файл из S3
    try {
      const key = s3Service.extractKeyFromUrl(deletedImage.imageUrl);
      if (key) {
        await s3Service.deleteFile(key);

        // Удаляем миниатюры
        try {
          const thumbnails = await s3Service.listFiles(
            `thumbnails/${key.split("/").pop()?.split(".")[0]}`
          );
          for (const thumbnail of thumbnails) {
            await s3Service.deleteFile(thumbnail.key);
          }
        } catch (error) {
          console.error("Ошибка удаления миниатюр:", error);
          // Не прерываем процесс из-за ошибки удаления миниатюр
        }
      }
    } catch (error) {
      console.error("Ошибка при удалении файла из S3:", error);
      // Логируем ошибку, но не прерываем выполнение
      // Файл уже удален из БД, поэтому продолжаем
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Ошибка при удалении изображения:", error);

    if (error instanceof Error && error.message.includes("не найдено")) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


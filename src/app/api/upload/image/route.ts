/**
 * API Route: Upload Image
 * POST /api/upload/image
 */

import { authOptions } from "@/shared/lib/auth-config";
import { imageProcessingService } from "@/shared/lib/image-processing";
import { s3KeyUtils, s3Service } from "@/shared/lib/s3-utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для загрузки изображения
 */
const uploadImageSchema = z.object({
  file: z.string().min(1, "Файл обязателен"),
  category: z.string().optional(),
  productId: z.string().optional(),
  generateThumbnails: z.boolean().default(true),
});

/**
 * POST /api/upload/image
 * Загрузка изображения в S3
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходима аутентификация" },
        { status: 401 }
      );
    }

    // Парсинг form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string;
    const productId = formData.get("productId") as string;
    const generateThumbnails = formData.get("generateThumbnails") === "true";

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    // Валидация типа файла
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Файл должен быть изображением" },
        { status: 400 }
      );
    }

    // Конвертация файла в Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Валидация изображения
    const validation = imageProcessingService.validateImage(buffer, file.type);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Генерация ключа для S3
    const key = s3KeyUtils.generateImageKey(file.name, category || "images");

    // Загрузка оригинального изображения
    const uploadResult = await s3Service.uploadImage(key, buffer, file.type, {
      "original-name": file.name,
      "uploaded-by": session.user.id,
      "product-id": productId || "",
      category: category || "",
    });

    const result: any = {
      success: true,
      image: {
        key: uploadResult.key,
        url: uploadResult.url,
        size: uploadResult.size,
        etag: uploadResult.etag,
      },
    };

    // Создание миниатюр если требуется
    if (generateThumbnails) {
      try {
        const thumbnails = await imageProcessingService.createThumbnails(
          uploadResult.key,
          buffer
        );

        result.thumbnails = thumbnails;
      } catch (error) {
        console.error("Ошибка создания миниатюр:", error);
        // Не прерываем загрузку из-за ошибки миниатюр
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Ошибка загрузки изображения:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/image
 * Получение информации о загруженных изображениях
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходима аутентификация" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Получение списка изображений
    const prefix = category ? `images/${category}/` : "images/";
    const images = await s3Service.listFiles(prefix, limit);

    return NextResponse.json({
      success: true,
      images: images.map(img => ({
        key: img.key,
        url: s3Service.getPublicUrl(img.key),
        size: img.size,
        lastModified: img.lastModified,
        etag: img.etag,
      })),
    });
  } catch (error) {
    console.error("Ошибка получения изображений:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

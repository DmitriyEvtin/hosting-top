/**
 * API Route: Image Management
 * DELETE /api/upload/image/[key]
 * GET /api/upload/image/[key]
 */

import { authOptions } from "@/shared/lib/auth-config";
import { s3Service } from "@/shared/lib/s3-utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/upload/image/[key]
 * Удаление изображения из S3
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходима аутентификация" },
        { status: 401 }
      );
    }

    const { key } = params;
    const decodedKey = decodeURIComponent(key);

    // Проверка существования файла
    const exists = await s3Service.fileExists(decodedKey);
    if (!exists) {
      return NextResponse.json(
        { error: "Изображение не найдено" },
        { status: 404 }
      );
    }

    // Удаление основного файла
    await s3Service.deleteFile(decodedKey);

    // Удаление миниатюр
    try {
      const thumbnails = await s3Service.listFiles(
        `thumbnails/${decodedKey.split("/").pop()?.split(".")[0]}`
      );
      for (const thumbnail of thumbnails) {
        await s3Service.deleteFile(thumbnail.key);
      }
    } catch (error) {
      console.error("Ошибка удаления миниатюр:", error);
      // Не прерываем процесс из-за ошибки удаления миниатюр
    }

    return NextResponse.json({
      success: true,
      message: "Изображение успешно удалено",
    });
  } catch (error) {
    console.error("Ошибка удаления изображения:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/image/[key]
 * Получение информации об изображении
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params;
    const decodedKey = decodeURIComponent(key);

    // Получение информации о файле
    const fileInfo = await s3Service.getFileInfo(decodedKey);

    return NextResponse.json({
      success: true,
      image: {
        key: fileInfo.key,
        url: s3Service.getPublicUrl(fileInfo.key),
        size: fileInfo.size,
        lastModified: fileInfo.lastModified,
        etag: fileInfo.etag,
        contentType: fileInfo.contentType,
      },
    });
  } catch (error) {
    console.error("Ошибка получения информации об изображении:", error);
    return NextResponse.json(
      { error: "Изображение не найдено" },
      { status: 404 }
    );
  }
}

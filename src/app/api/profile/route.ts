import { prisma } from "@/shared/api/database/prisma";
import { authOptions } from "@/shared/lib/auth-config";
import { s3Service } from "@/shared/lib/s3-utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/profile - Получить данные профиля пользователя
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Ошибка получения профиля:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile - Обновить данные профиля пользователя
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { name, image } = body;

    // Валидация данных
    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim().length === 0)
    ) {
      return NextResponse.json(
        { error: "Имя не может быть пустым" },
        { status: 400 }
      );
    }

    if (image !== undefined && typeof image !== "string") {
      return NextResponse.json(
        { error: "URL изображения должен быть строкой" },
        { status: 400 }
      );
    }

    // Получаем текущего пользователя для проверки старого логотипа
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    // Если обновляется логотип и есть старый логотип, удаляем его из S3
    if (
      image !== undefined &&
      currentUser?.image &&
      currentUser.image !== image
    ) {
      try {
        const oldImageKey = s3Service.extractKeyFromUrl(currentUser.image);
        if (oldImageKey) {
          // Удаляем старый логотип из S3
          await s3Service.deleteFile(oldImageKey);

          // Также удаляем миниатюры старого логотипа
          try {
            const thumbnails = await s3Service.listFiles(
              `thumbnails/${oldImageKey.split("/").pop()?.split(".")[0]}`
            );
            for (const thumbnail of thumbnails) {
              await s3Service.deleteFile(thumbnail.key);
            }
          } catch (error) {
            console.error("Ошибка удаления миниатюр старого логотипа:", error);
            // Не прерываем процесс из-за ошибки удаления миниатюр
          }
        }
      } catch (error) {
        console.error("Ошибка удаления старого логотипа:", error);
        // Не прерываем обновление профиля из-за ошибки удаления файла
      }
    }

    // Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(image !== undefined && { image }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: "Профиль успешно обновлен",
    });
  } catch (error) {
    console.error("Ошибка обновления профиля:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

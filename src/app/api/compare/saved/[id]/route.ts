import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для обновления названия сравнения
 */
const UpdateComparisonSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(100, "Название не должно превышать 100 символов"),
});

/**
 * PUT /api/compare/saved/[id] - Обновить название сохраненного сравнения
 * Требует аутентификации
 * Пользователь может обновлять только свои сравнения
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const userId = session.user.id;
    const comparisonId = params.id;

    // Парсинг и валидация request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Некорректный формат JSON" },
        { status: 400 }
      );
    }

    // Валидация данных через Zod
    const validationResult = UpdateComparisonSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { name } = validationResult.data;

    // Поиск сравнения и проверка владельца
    const existingComparison = await prisma.comparison.findUnique({
      where: { id: comparisonId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!existingComparison) {
      return NextResponse.json(
        { error: "Сравнение не найдено" },
        { status: 404 }
      );
    }

    // Проверка владельца
    if (existingComparison.userId !== userId) {
      return NextResponse.json(
        { error: "Доступ запрещен. Сравнение принадлежит другому пользователю" },
        { status: 403 }
      );
    }

    // Обновление названия сравнения
    const updatedComparison = await prisma.comparison.update({
      where: { id: comparisonId },
      data: {
        name: name.trim(),
      },
      select: {
        id: true,
        name: true,
        tariffIds: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedComparison, { status: 200 });
  } catch (error) {
    console.error("Ошибка обновления сравнения:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/compare/saved/[id] - Удалить сохраненное сравнение
 * Требует аутентификации
 * Пользователь может удалять только свои сравнения
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const userId = session.user.id;
    const comparisonId = params.id;

    // Поиск сравнения и проверка владельца
    const existingComparison = await prisma.comparison.findUnique({
      where: { id: comparisonId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!existingComparison) {
      return NextResponse.json(
        { error: "Сравнение не найдено" },
        { status: 404 }
      );
    }

    // Проверка владельца
    if (existingComparison.userId !== userId) {
      return NextResponse.json(
        { error: "Доступ запрещен. Сравнение принадлежит другому пользователю" },
        { status: 403 }
      );
    }

    // Удаление сравнения
    await prisma.comparison.delete({
      where: { id: comparisonId },
    });

    return NextResponse.json(
      { message: "Сравнение успешно удалено" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ошибка удаления сравнения:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


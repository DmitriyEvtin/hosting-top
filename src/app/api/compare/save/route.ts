import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для сохранения сравнения
 */
const SaveComparisonSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(100, "Название не должно превышать 100 символов"),
  tariffIds: z
    .array(z.string())
    .min(2, "Необходимо минимум 2 тарифа")
    .max(5, "Максимум 5 тарифов для сравнения"),
});

/**
 * POST /api/compare/save - Сохранить сравнение (требует аутентификации)
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const userId = session.user.id;

    // Парсинг и валидация request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Некорректный формат JSON" },
        { status: 400 }
      );
    }

    // Валидация данных через Zod
    const validationResult = SaveComparisonSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { name, tariffIds } = validationResult.data;

    // Проверка лимита: максимум 10 сравнений на пользователя
    const existingComparisonsCount = await prisma.comparison.count({
      where: { userId },
    });

    if (existingComparisonsCount >= 10) {
      return NextResponse.json(
        { error: "Достигнут лимит сохраненных сравнений (максимум 10)" },
        { status: 400 }
      );
    }

    // Создание нового сравнения
    const comparison = await prisma.comparison.create({
      data: {
        name: name.trim(),
        tariffIds,
        userId,
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

    return NextResponse.json(comparison, { status: 201 });
  } catch (error) {
    console.error("Ошибка сохранения сравнения:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


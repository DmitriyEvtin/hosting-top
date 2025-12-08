import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * GET /api/compare/saved - Получить список сохраненных сравнений текущего пользователя
 * Требует аутентификации
 */
export async function GET() {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const userId = session.user.id;

    // Получение всех сравнений пользователя
    const comparisons = await prisma.comparison.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        tariffIds: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Трансформация данных: добавление вычисляемого поля tariffCount
    const comparisonsWithCount = comparisons.map((comparison) => ({
      id: comparison.id,
      name: comparison.name,
      tariffIds: comparison.tariffIds,
      tariffCount: comparison.tariffIds.length,
      createdAt: comparison.createdAt.toISOString(),
      updatedAt: comparison.updatedAt.toISOString(),
    }));

    return NextResponse.json({ comparisons: comparisonsWithCount });
  } catch (error) {
    console.error("Ошибка получения списка сравнений:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


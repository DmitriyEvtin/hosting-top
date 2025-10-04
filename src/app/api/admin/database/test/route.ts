import { prisma } from "@/shared/api/database/prisma";
import { withAdminAuth } from "@/shared/lib/admin-middleware";
import { NextRequest, NextResponse } from "next/server";

async function handler(request: NextRequest) {
  try {
    // Тестируем подключение к базе данных
    await prisma.$connect();

    // Получаем статистику
    const [users, categories, products, sessions] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.parsingSession.count(),
    ]);

    return NextResponse.json({
      success: true,
      message: "База данных работает корректно",
      stats: {
        users,
        categories,
        products,
        sessions,
      },
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export const GET = (request: NextRequest) => withAdminAuth(request, handler);

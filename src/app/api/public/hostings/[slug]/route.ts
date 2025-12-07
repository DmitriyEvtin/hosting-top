import { prisma } from "@/shared/api/database";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/public/hostings/[slug] - Получить детальную информацию о хостинге по slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { slug } = resolvedParams;

    // Получаем хостинг по slug
    const hosting = await prisma.hosting.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        websiteUrl: true,
        startYear: true,
        clients: true,
        testPeriod: true,
        isActive: true,
        contentBlocks: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            key: true,
            title: true,
            content: true,
            type: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // Если хостинг не найден или неактивен, возвращаем 404
    if (!hosting || !hosting.isActive) {
      return NextResponse.json(
        { error: "Хостинг не найден" },
        { status: 404 }
      );
    }

    // Исключаем isActive из ответа (публичный endpoint)
    const { isActive, ...hostingData } = hosting;

    return NextResponse.json({ hosting: hostingData });
  } catch (error) {
    console.error("Ошибка получения хостинга:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/manager/hostings/[id]/content-blocks - Получить контентные блоки хостинга
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Проверяем авторизацию и права менеджера
    const session = await getServerSession(authOptions);
    if (!session || !hasManagerAccess(session.user.role)) {
      return NextResponse.json(
        { error: "Недостаточно прав доступа" },
        { status: 403 }
      );
    }

    const resolvedParams =
      params instanceof Promise ? await params : params;
    const hostingId = resolvedParams.id;

    // Проверяем существование хостинга
    const hosting = await prisma.hosting.findUnique({
      where: { id: hostingId },
      select: { id: true, name: true },
    });

    if (!hosting) {
      return NextResponse.json(
        { error: "Хостинг не найден" },
        { status: 404 }
      );
    }

    // Получаем контентные блоки, связанные с хостингом
    // Фильтруем по типу (type = hosting_id) или по ключу (key начинается с hosting_{id}_)
    const contentBlocks = await prisma.contentBlock.findMany({
      where: {
        OR: [
          { type: hostingId },
          { key: { startsWith: `hosting_${hostingId}_` } },
        ],
      },
      select: {
        id: true,
        key: true,
        title: true,
        content: true,
        type: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      contentBlocks,
      hosting: {
        id: hosting.id,
        name: hosting.name,
      },
    });
  } catch (error) {
    console.error("Ошибка получения контентных блоков хостинга:", error);

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


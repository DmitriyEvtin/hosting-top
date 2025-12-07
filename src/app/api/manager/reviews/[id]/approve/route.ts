import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/manager/reviews/[id]/approve - Одобрить отзыв
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Проверка авторизации и прав менеджера
    const session = await getServerSession(authOptions);
    if (!session || !hasManagerAccess(session.user.role)) {
      return NextResponse.json(
        { error: "Недостаточно прав доступа" },
        { status: 403 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Проверить существование отзыва
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Отзыв не найден" },
        { status: 404 }
      );
    }

    // Одобрить отзыв
    const review = await prisma.review.update({
      where: { id },
      data: {
        status: "APPROVED",
        rejectionReason: null, // Очистить причину отклонения если была
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        hosting: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Ошибка одобрения отзыва:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const HelpfulSchema = z.object({
  fingerprint: z.string().optional(),
});

/**
 * POST /api/public/reviews/[id]/helpful - Отметить отзыв как полезный
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id: reviewId } = resolvedParams;

    // Проверить существование отзыва
    const review = await prisma.review.findUnique({
      where: { id: reviewId, status: "APPROVED" },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Отзыв не найден" },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { fingerprint } = HelpfulSchema.parse(body);

    // Проверить, не отмечал ли уже
    const existing = await prisma.reviewHelpful.findFirst({
      where: {
        reviewId,
        OR: [
          ...(session?.user?.id ? [{ userId: session.user.id }] : []),
          ...(fingerprint ? [{ fingerprint }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Вы уже отметили этот отзыв" },
        { status: 400 }
      );
    }

    // Создать отметку и обновить счетчик
    await prisma.$transaction([
      prisma.reviewHelpful.create({
        data: {
          reviewId,
          userId: session?.user?.id || null,
          fingerprint: fingerprint || null,
        },
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { increment: 1 } },
      }),
    ]);

    const updatedReview = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { helpfulCount: true },
    });

    return NextResponse.json({
      helpfulCount: updatedReview?.helpfulCount || 0,
    });
  } catch (error) {
    console.error("Ошибка отметки полезности:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные данные", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


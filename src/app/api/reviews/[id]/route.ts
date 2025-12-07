import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для создания/редактирования отзыва
 */
const ReviewCreateSchema = z.object({
  hostingId: z.string().uuid("Некорректный ID хостинга"),
  content: z
    .string()
    .min(50, "Отзыв должен содержать минимум 50 символов")
    .max(2000, "Отзыв не может быть длиннее 2000 символов"),
  performanceRating: z.number().int().min(1).max(5),
  supportRating: z.number().int().min(1).max(5),
  priceQualityRating: z.number().int().min(1).max(5),
  reliabilityRating: z.number().int().min(1).max(5),
  easeOfUseRating: z.number().int().min(1).max(5),
});

/**
 * PUT /api/reviews/[id] - Редактировать свой отзыв
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    // Проверить существование пользователя в базе данных
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден. Пожалуйста, войдите заново." },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Проверить существование отзыва и права доступа
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Отзыв не найден" },
        { status: 404 }
      );
    }

    if (existingReview.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Вы можете редактировать только свои отзывы" },
        { status: 403 }
      );
    }

    // Валидировать и обновить
    const body = await request.json();
    const validatedData = ReviewCreateSchema.parse(body);

    // Проверить существование хостинга
    const hosting = await prisma.hosting.findUnique({
      where: { id: validatedData.hostingId },
    });
    if (!hosting) {
      return NextResponse.json(
        { error: "Хостинг не найден" },
        { status: 404 }
      );
    }

    // Проверить на дубликаты (исключая текущий отзыв)
    const duplicate = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        hostingId: validatedData.hostingId,
        content: validatedData.content,
        status: { in: ["PENDING", "APPROVED"] },
        id: { not: id },
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Вы уже оставляли такой же отзыв для этого провайдера" },
        { status: 400 }
      );
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        content: validatedData.content,
        performanceRating: validatedData.performanceRating,
        supportRating: validatedData.supportRating,
        priceQualityRating: validatedData.priceQualityRating,
        reliabilityRating: validatedData.reliabilityRating,
        easeOfUseRating: validatedData.easeOfUseRating,
        status: "PENDING", // Вернуть на модерацию
      },
      include: {
        user: { select: { id: true, name: true } },
        hosting: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Ошибка редактирования отзыва:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные данные", details: error.issues },
        { status: 400 }
      );
    }

    // Обработка ошибок Prisma
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2003"
    ) {
      // Ошибка внешнего ключа
      const meta = error.meta as { field_name?: string } | undefined;
      if (meta?.field_name?.includes("user_id")) {
        return NextResponse.json(
          { error: "Пользователь не найден. Пожалуйста, войдите заново." },
          { status: 401 }
        );
      }
      if (meta?.field_name?.includes("hosting_id")) {
        return NextResponse.json(
          { error: "Хостинг не найден" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Ошибка валидации данных" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


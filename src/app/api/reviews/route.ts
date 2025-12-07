import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для создания отзыва
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
 * GET /api/reviews - Получить список своих отзывов с пагинацией
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId: session.user.id },
        include: {
          hosting: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Ошибка получения отзывов:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews - Создать новый отзыв
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Проверить авторизацию
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    // 2. Валидировать данные
    const body = await request.json();
    const validatedData = ReviewCreateSchema.parse(body);

    // 3. Проверить существование хостинга
    const hosting = await prisma.hosting.findUnique({
      where: { id: validatedData.hostingId },
    });
    if (!hosting) {
      return NextResponse.json(
        { error: "Хостинг не найден" },
        { status: 404 }
      );
    }

    // 4. Проверить на дубликаты
    const duplicate = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        hostingId: validatedData.hostingId,
        content: validatedData.content,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Вы уже оставляли такой же отзыв для этого провайдера" },
        { status: 400 }
      );
    }

    // 5. Создать отзыв
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        hostingId: validatedData.hostingId,
        content: validatedData.content,
        performanceRating: validatedData.performanceRating,
        supportRating: validatedData.supportRating,
        priceQualityRating: validatedData.priceQualityRating,
        reliabilityRating: validatedData.reliabilityRating,
        easeOfUseRating: validatedData.easeOfUseRating,
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        hosting: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания отзыва:", error);

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


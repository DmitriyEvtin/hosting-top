import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ReviewQuerySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || "1", 10)),
  limit: z.string().optional().transform((val) => parseInt(val || "20", 10)),
  sort: z.enum(["date", "helpful", "rating"]).optional().default("date"),
});

/**
 * GET /api/public/reviews - Получить все отзывы с сортировкой и пагинацией
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const validatedQuery = ReviewQuerySchema.parse({
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sort: searchParams.get("sort") || undefined,
    });

    const { page, limit, sort } = validatedQuery;
    const skip = (page - 1) * limit;

    // Фильтр: APPROVED для всех, + свои отзывы для автора
    const where: Record<string, unknown> = {
      OR: [
        { status: "APPROVED" },
        ...(userId
          ? [{ userId, status: { in: ["PENDING", "APPROVED", "REJECTED"] } }]
          : []),
      ],
    };

    // Определить сортировку
    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "helpful") {
      orderBy = { helpfulCount: "desc" };
    } else if (sort === "rating") {
      // Сортировка по среднему рейтингу (вычисляется на лету)
      // Для простоты используем performanceRating как основной
      orderBy = { performanceRating: "desc" };
    }

    // Получить отзывы
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          hosting: {
            select: { id: true, name: true, slug: true, logoUrl: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Ошибка получения отзывов:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные параметры", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


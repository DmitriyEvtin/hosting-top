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
 * GET /api/public/hostings/[slug]/reviews - Получить отзывы конкретного провайдера
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { slug } = resolvedParams;

    // Проверить существование хостинга
    const hosting = await prisma.hosting.findUnique({
      where: { slug, isActive: true },
      select: { id: true, name: true },
    });

    if (!hosting) {
      return NextResponse.json(
        { error: "Хостинг не найден" },
        { status: 404 }
      );
    }

    // Получить опциональную сессию
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
      hostingId: hosting.id,
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
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Рассчитать средний рейтинг хостинга по одобренным отзывам
    const approvedReviews = await prisma.review.findMany({
      where: {
        hostingId: hosting.id,
        status: "APPROVED",
      },
      select: {
        performanceRating: true,
        supportRating: true,
        priceQualityRating: true,
        reliabilityRating: true,
        easeOfUseRating: true,
      },
    });

    const hostingRating = {
      average: 0,
      count: approvedReviews.length,
      criteria: {
        performance: 0,
        support: 0,
        priceQuality: 0,
        reliability: 0,
        easeOfUse: 0,
      },
    };

    if (approvedReviews.length > 0) {
      const totals = approvedReviews.reduce(
        (acc, review) => ({
          performance: acc.performance + review.performanceRating,
          support: acc.support + review.supportRating,
          priceQuality: acc.priceQuality + review.priceQualityRating,
          reliability: acc.reliability + review.reliabilityRating,
          easeOfUse: acc.easeOfUse + review.easeOfUseRating,
        }),
        {
          performance: 0,
          support: 0,
          priceQuality: 0,
          reliability: 0,
          easeOfUse: 0,
        }
      );

      hostingRating.criteria = {
        performance: totals.performance / approvedReviews.length,
        support: totals.support / approvedReviews.length,
        priceQuality: totals.priceQuality / approvedReviews.length,
        reliability: totals.reliability / approvedReviews.length,
        easeOfUse: totals.easeOfUse / approvedReviews.length,
      };

      // Общий рейтинг = среднее всех критериев
      hostingRating.average =
        (hostingRating.criteria.performance +
          hostingRating.criteria.support +
          hostingRating.criteria.priceQuality +
          hostingRating.criteria.reliability +
          hostingRating.criteria.easeOfUse) /
        5;
    }

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      hostingRating,
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


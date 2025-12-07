import { HostingReviewsPage } from "@/views/public/reviews/ui/HostingReviewsPage";
import { notFound } from "next/navigation";
import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { getServerSession } from "next-auth";

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

async function getHosting(slug: string) {
  try {
    const hosting = await prisma.hosting.findUnique({
      where: { slug, isActive: true },
      select: { id: true, name: true, slug: true },
    });

    return hosting;
  } catch (error) {
    console.error("Ошибка получения хостинга:", error);
    return null;
  }
}

async function getInitialReviewsData(hostingId: string) {
  try {
    // Получить опциональную сессию
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const page = 1;
    const limit = 20;
    const sort = "date" as const;
    const skip = (page - 1) * limit;

    // Фильтр: APPROVED для всех, + свои отзывы для автора
    const where: Record<string, unknown> = {
      hostingId,
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
        hostingId,
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

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      hostingRating,
    };
  } catch (error) {
    console.error("Ошибка получения отзывов:", error);
    // Возвращаем пустые данные вместо null, чтобы страница все равно отображалась
    return {
      reviews: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      hostingRating: {
        average: 0,
        count: 0,
        criteria: {
          performance: 0,
          support: 0,
          priceQuality: 0,
          reliability: 0,
          easeOfUse: 0,
        },
      },
    };
  }
}

export default async function HostingReviews({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;

  // Получить данные хостинга
  const hosting = await getHosting(slug);

  // Если хостинг не найден, возвращаем 404
  if (!hosting) {
    notFound();
  }

  // Получить данные отзывов (всегда возвращает объект, даже если отзывов нет)
  const reviewsData = await getInitialReviewsData(hosting.id);

  return (
    <HostingReviewsPage
      hostingId={hosting.id}
      hostingSlug={slug}
      hostingName={hosting.name}
      initialData={reviewsData}
    />
  );
}

import { prisma } from "@/shared/api/database";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для query параметров сравнения тарифов
 */
const ComparisonQuerySchema = z.object({
  ids: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .refine((val) => val.length >= 1 && val.length <= 5, {
      message: "Необходимо от 1 до 5 ID тарифов",
    }),
});

/**
 * GET /api/public/compare/tariffs - Получить данные тарифов для сравнения
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Парсим query параметры
    // Поддерживаем оба формата: ids[] и ids
    const idsParams = [
      ...searchParams.getAll("ids[]"),
      ...searchParams.getAll("ids"),
    ];

    if (idsParams.length === 0) {
      return NextResponse.json(
        { error: "Необходимо указать хотя бы один ID тарифа" },
        { status: 400 }
      );
    }

    const queryParams: Record<string, unknown> = {
      ids: idsParams.length === 1 ? idsParams[0] : idsParams,
    };

    // Валидируем параметры
    const validatedQuery = ComparisonQuerySchema.parse(queryParams);
    const { ids } = validatedQuery;

    // Загружаем тарифы с полными связями
    const tariffs = await prisma.tariff.findMany({
      where: {
        id: { in: ids },
        isActive: true,
        hosting: {
          isActive: true,
        },
      },
      select: {
        id: true,
        name: true,
        subtitle: true,
        link: true,
        priceMonth: true,
        priceYear: true,
        currency: true,
        diskSpace: true,
        traffic: true,
        domains: true,
        sites: true,
        countDb: true,
        ftpAccounts: true,
        mailboxes: true,
        ssl: true,
        backup: true,
        ssh: true,
        automaticCms: true,
        ddosDef: true,
        antivirus: true,
        countTestDays: true,
        hosting: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            websiteUrl: true,
            startYear: true,
            clients: true,
            testPeriod: true,
          },
        },
        cms: {
          select: {
            cms: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        controlPanels: {
          select: {
            controlPanel: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        countries: {
          select: {
            country: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        dataStores: {
          select: {
            dataStore: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        operationSystems: {
          select: {
            operationSystem: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        programmingLanguages: {
          select: {
            programmingLanguage: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    // Проверяем, что все запрошенные тарифы найдены и активны
    const foundIds = new Set(tariffs.map((t) => t.id));
    const missingIds = ids.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          error: "Один или несколько тарифов не найдены или неактивны",
          missingIds,
        },
        { status: 404 }
      );
    }

    // Получаем уникальные ID хостингов для загрузки reviews
    const hostingIds = Array.from(new Set(tariffs.map((t) => t.hosting.id)));

    // Загружаем approved reviews для расчета рейтинга
    const reviews = await prisma.review.findMany({
      where: {
        hostingId: { in: hostingIds },
        status: "APPROVED",
      },
      select: {
        hostingId: true,
        performanceRating: true,
        supportRating: true,
        priceQualityRating: true,
        reliabilityRating: true,
        easeOfUseRating: true,
      },
    });

    // Группируем reviews по hostingId и рассчитываем рейтинг
    const hostingRatings = new Map<string, number | null>();

    for (const hostingId of hostingIds) {
      const hostingReviews = reviews.filter((r) => r.hostingId === hostingId);

      if (hostingReviews.length === 0) {
        hostingRatings.set(hostingId, null);
        continue;
      }

      // Рассчитываем средний рейтинг каждого отзыва
      const totalRating = hostingReviews.reduce((sum, review) => {
        const reviewAvg =
          (review.performanceRating +
            review.supportRating +
            review.priceQualityRating +
            review.reliabilityRating +
            review.easeOfUseRating) /
          5;
        return sum + reviewAvg;
      }, 0);

      const averageRating = totalRating / hostingReviews.length;
      hostingRatings.set(
        hostingId,
        Number(averageRating.toFixed(1))
      );
    }

    // Трансформируем данные
    const transformedTariffs = tariffs.map((tariff) => {
      const hostingRating = hostingRatings.get(tariff.hosting.id) ?? null;

      return {
        id: tariff.id,
        name: tariff.name,
        subtitle: tariff.subtitle,
        link: tariff.link,
        priceMonth: tariff.priceMonth,
        priceYear: tariff.priceYear,
        currency: tariff.currency,
        diskSpace: tariff.diskSpace,
        traffic: tariff.traffic,
        domains: tariff.domains,
        sites: tariff.sites,
        countDb: tariff.countDb,
        ftpAccounts: tariff.ftpAccounts,
        mailboxes: tariff.mailboxes,
        ssl: tariff.ssl,
        backup: tariff.backup,
        ssh: tariff.ssh,
        automaticCms: tariff.automaticCms,
        ddosDef: tariff.ddosDef,
        antivirus: tariff.antivirus,
        countTestDays: tariff.countTestDays,
        hosting: {
          id: tariff.hosting.id,
          name: tariff.hosting.name,
          slug: tariff.hosting.slug,
          logoUrl: tariff.hosting.logoUrl,
          websiteUrl: tariff.hosting.websiteUrl,
          startYear: tariff.hosting.startYear,
          clients: tariff.hosting.clients,
          testPeriod: tariff.hosting.testPeriod,
          averageRating: hostingRating,
        },
        cms: tariff.cms.map((tc) => tc.cms),
        controlPanels: tariff.controlPanels.map((tcp) => tcp.controlPanel),
        countries: tariff.countries.map((tc) => tc.country),
        dataStores: tariff.dataStores.map((tds) => tds.dataStore),
        operationSystems: tariff.operationSystems.map(
          (tos) => tos.operationSystem
        ),
        programmingLanguages: tariff.programmingLanguages.map(
          (tpl) => tpl.programmingLanguage
        ),
      };
    });

    return NextResponse.json({
      tariffs: transformedTariffs,
    });
  } catch (error) {
    console.error("Ошибка получения тарифов для сравнения:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные параметры запроса", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


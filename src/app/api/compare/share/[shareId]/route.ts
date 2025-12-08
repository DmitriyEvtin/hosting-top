import { prisma } from "@/shared/api/database";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/compare/share/[shareId] - Получить данные сравнения по публичной ссылке
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> | { shareId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { shareId } = resolvedParams;

    // Находим ссылку в БД
    const sharedComparison = await prisma.sharedComparison.findUnique({
      where: { shareId },
      select: {
        id: true,
        shareId: true,
        tariffIds: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Проверяем существование ссылки
    if (!sharedComparison) {
      return NextResponse.json(
        { error: "Ссылка для сравнения не найдена" },
        { status: 404 }
      );
    }

    // Проверяем срок действия ссылки
    if (sharedComparison.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Ссылка для сравнения истекла" },
        { status: 404 }
      );
    }

    // Загружаем тарифы с полными связями
    const tariffs = await prisma.tariff.findMany({
      where: {
        id: { in: sharedComparison.tariffIds },
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
    const missingIds = sharedComparison.tariffIds.filter(
      (id) => !foundIds.has(id)
    );

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
      expiresAt: sharedComparison.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Ошибка получения сравнения по ссылке:", error);

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


import { prisma } from "@/shared/api/database";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/public/filters - Получить все доступные значения фильтров
 * с количеством хостингов для каждого значения и диапазоном цен
 */
export async function GET(request: NextRequest) {
  try {
    // Базовое условие для активных тарифов активных хостингов
    const activeTariffCondition = {
      isActive: true,
      hosting: {
        isActive: true,
      },
    };

    // Получаем страны с подсчетом уникальных хостингов
    const countriesData = await prisma.country.findMany({
      where: {
        tariffs: {
          some: {
            tariff: activeTariffCondition,
          },
        },
      },
      select: {
        slug: true,
        name: true,
        tariffs: {
          where: {
            tariff: activeTariffCondition,
          },
          select: {
            tariff: {
              select: {
                hostingId: true,
              },
            },
          },
        },
      },
    });

    // Получаем CMS с подсчетом уникальных хостингов
    const cmsData = await prisma.cMS.findMany({
      where: {
        tariffs: {
          some: {
            tariff: activeTariffCondition,
          },
        },
      },
      select: {
        slug: true,
        name: true,
        tariffs: {
          where: {
            tariff: activeTariffCondition,
          },
          select: {
            tariff: {
              select: {
                hostingId: true,
              },
            },
          },
        },
      },
    });

    // Получаем панели управления с подсчетом уникальных хостингов
    const controlPanelsData = await prisma.controlPanel.findMany({
      where: {
        tariffs: {
          some: {
            tariff: activeTariffCondition,
          },
        },
      },
      select: {
        slug: true,
        name: true,
        tariffs: {
          where: {
            tariff: activeTariffCondition,
          },
          select: {
            tariff: {
              select: {
                hostingId: true,
              },
            },
          },
        },
      },
    });

    // Получаем ОС с подсчетом уникальных хостингов
    const operationSystemsData = await prisma.operationSystem.findMany({
      where: {
        tariffs: {
          some: {
            tariff: activeTariffCondition,
          },
        },
      },
      select: {
        slug: true,
        name: true,
        tariffs: {
          where: {
            tariff: activeTariffCondition,
          },
          select: {
            tariff: {
              select: {
                hostingId: true,
              },
            },
          },
        },
      },
    });

    // Функция для подсчета уникальных хостингов
    const countUniqueHostings = (
      items: Array<{ hostingId: string } | { tariff: { hostingId: string } }>
    ): number => {
      const hostingIds = new Set<string>();
      items.forEach((item) => {
        const hostingId =
          "hostingId" in item ? item.hostingId : item.tariff.hostingId;
        hostingIds.add(hostingId);
      });
      return hostingIds.size;
    };

    // Преобразуем страны
    const countries = countriesData.map((country) => ({
      slug: country.slug,
      name: country.name,
      count: countUniqueHostings(country.tariffs),
    }));

    // Преобразуем CMS
    const cms = cmsData.map((cmsItem) => ({
      slug: cmsItem.slug,
      name: cmsItem.name,
      count: countUniqueHostings(cmsItem.tariffs),
    }));

    // Преобразуем панели управления
    const controlPanels = controlPanelsData.map((panel) => ({
      slug: panel.slug,
      name: panel.name,
      count: countUniqueHostings(panel.tariffs),
    }));

    // Преобразуем ОС
    const operationSystems = operationSystemsData.map((os) => ({
      slug: os.slug,
      name: os.name,
      count: countUniqueHostings(os.tariffs),
    }));

    // Получаем диапазон цен
    const priceRangeData = await prisma.tariff.aggregate({
      where: {
        ...activeTariffCondition,
        OR: [
          { priceMonth: { not: null } },
          { priceYear: { not: null } },
        ],
      },
      _min: {
        priceMonth: true,
        priceYear: true,
      },
      _max: {
        priceMonth: true,
        priceYear: true,
      },
    });

    // Вычисляем общий min и max из priceMonth и priceYear
    const prices: number[] = [];
    if (priceRangeData._min.priceMonth) {
      prices.push(Number(priceRangeData._min.priceMonth));
    }
    if (priceRangeData._min.priceYear) {
      prices.push(Number(priceRangeData._min.priceYear));
    }
    if (priceRangeData._max.priceMonth) {
      prices.push(Number(priceRangeData._max.priceMonth));
    }
    if (priceRangeData._max.priceYear) {
      prices.push(Number(priceRangeData._max.priceYear));
    }

    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    };

    return NextResponse.json({
      countries,
      cms,
      controlPanels,
      operationSystems,
      priceRange,
    });
  } catch (error) {
    console.error("Ошибка получения фильтров:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


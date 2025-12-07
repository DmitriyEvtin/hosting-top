import { prisma } from "@/shared/api/database";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для query параметров списка хостингов
 */
const HostingQuerySchema = z.object({
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "1", 10))
    .refine((val) => val > 0, "Страница должна быть больше 0"),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "20", 10))
    .refine((val) => val > 0 && val <= 100, "Лимит должен быть от 1 до 100"),
  country: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || val >= 0, "Минимальная цена должна быть неотрицательной"),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || val >= 0, "Максимальная цена должна быть неотрицательной"),
  cms: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
  controlPanel: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
  os: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
});

/**
 * GET /api/public/hostings - Получить список активных хостингов с фильтрацией и пагинацией
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Парсим query параметры
    // Для массивов используем getAll, для остальных - get
    const queryParams: Record<string, unknown> = {
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
    };

    // Обрабатываем массивы (поддерживаем оба формата: country[] и country)
    const countryParams = [
      ...searchParams.getAll("country[]"),
      ...searchParams.getAll("country"),
    ];
    if (countryParams.length > 0) {
      queryParams.country = countryParams.length === 1 ? countryParams[0] : countryParams;
    }

    const cmsParams = [...searchParams.getAll("cms[]"), ...searchParams.getAll("cms")];
    if (cmsParams.length > 0) {
      queryParams.cms = cmsParams.length === 1 ? cmsParams[0] : cmsParams;
    }

    const controlPanelParams = [
      ...searchParams.getAll("controlPanel[]"),
      ...searchParams.getAll("controlPanel"),
    ];
    if (controlPanelParams.length > 0) {
      queryParams.controlPanel =
        controlPanelParams.length === 1 ? controlPanelParams[0] : controlPanelParams;
    }

    const osParams = [...searchParams.getAll("os[]"), ...searchParams.getAll("os")];
    if (osParams.length > 0) {
      queryParams.os = osParams.length === 1 ? osParams[0] : osParams;
    }

    // Валидируем параметры
    const validatedQuery = HostingQuerySchema.parse(queryParams);
    const { search, page, limit, country, minPrice, maxPrice, cms, controlPanel, os } =
      validatedQuery;

    // Проверяем, что minPrice <= maxPrice если оба указаны
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return NextResponse.json(
        { error: "Минимальная цена не может быть больше максимальной" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Строим фильтры для where условия
    const where: Record<string, unknown> = {
      // Обязательный фильтр: только активные хостинги
      isActive: true,
      // Фильтр: хостинг должен иметь хотя бы один активный тариф
      tariffs: {
        some: {
          isActive: true,
        },
      },
    };

    // Фильтр по поиску (название или описание)
    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    // Фильтр по странам
    if (country && country.length > 0) {
      const countryFilter = {
        tariffs: {
          some: {
            isActive: true,
            countries: {
              some: {
                country: {
                  slug: { in: country },
                },
              },
            },
          },
        },
      };

      if (where.AND) {
        (where.AND as unknown[]).push(countryFilter);
      } else {
        where.AND = [countryFilter];
      }
    }

    // Фильтр по CMS
    if (cms && cms.length > 0) {
      const cmsFilter = {
        tariffs: {
          some: {
            isActive: true,
            cms: {
              some: {
                cms: {
                  slug: { in: cms },
                },
              },
            },
          },
        },
      };

      if (where.AND) {
        (where.AND as unknown[]).push(cmsFilter);
      } else {
        where.AND = [cmsFilter];
      }
    }

    // Фильтр по панелям управления
    if (controlPanel && controlPanel.length > 0) {
      const controlPanelFilter = {
        tariffs: {
          some: {
            isActive: true,
            controlPanels: {
              some: {
                controlPanel: {
                  slug: { in: controlPanel },
                },
              },
            },
          },
        },
      };

      if (where.AND) {
        (where.AND as unknown[]).push(controlPanelFilter);
      } else {
        where.AND = [controlPanelFilter];
      }
    }

    // Фильтр по операционным системам
    if (os && os.length > 0) {
      const osFilter = {
        tariffs: {
          some: {
            isActive: true,
            operationSystems: {
              some: {
                operationSystem: {
                  slug: { in: os },
                },
              },
            },
          },
        },
      };

      if (where.AND) {
        (where.AND as unknown[]).push(osFilter);
      } else {
        where.AND = [osFilter];
      }
    }

    // Фильтр по ценам
    if (minPrice !== undefined || maxPrice !== undefined) {
      let priceCondition: unknown;

      if (minPrice !== undefined && maxPrice !== undefined) {
        // Диапазон цен
        priceCondition = {
          OR: [
            { priceMonth: { gte: minPrice, lte: maxPrice } },
            { priceYear: { gte: minPrice, lte: maxPrice } },
          ],
        };
      } else if (minPrice !== undefined) {
        // Только минимальная цена
        priceCondition = {
          OR: [
            { priceMonth: { gte: minPrice } },
            { priceYear: { gte: minPrice } },
          ],
        };
      } else if (maxPrice !== undefined) {
        // Только максимальная цена
        priceCondition = {
          OR: [
            { priceMonth: { lte: maxPrice } },
            { priceYear: { lte: maxPrice } },
          ],
        };
      }

      const priceFilter = {
        tariffs: {
          some: {
            isActive: true,
            ...priceCondition,
          },
        },
      };

      if (where.AND) {
        (where.AND as unknown[]).push(priceFilter);
      } else {
        where.AND = [priceFilter];
      }
    }

    // Выполняем запросы параллельно
    const [hostings, total] = await Promise.all([
      prisma.hosting.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          websiteUrl: true,
          startYear: true,
          clients: true,
          testPeriod: true,
          _count: {
            select: {
              tariffs: {
                where: {
                  isActive: true,
                },
              },
            },
          },
          reviews: {
            where: {
              status: "APPROVED",
            },
            select: {
              performanceRating: true,
              supportRating: true,
              priceQualityRating: true,
              reliabilityRating: true,
              easeOfUseRating: true,
            },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.hosting.count({ where }),
    ]);

    // Рассчитываем рейтинг для каждого хостинга
    const hostingsWithRating = hostings.map(hosting => {
      const approvedReviews = hosting.reviews;
      let averageRating: number | null = null;

      if (approvedReviews.length > 0) {
        // Рассчитываем средний рейтинг каждого отзыва
        const totalRating = approvedReviews.reduce((sum, review) => {
          const reviewAvg =
            (review.performanceRating +
              review.supportRating +
              review.priceQualityRating +
              review.reliabilityRating +
              review.easeOfUseRating) /
            5;
          return sum + reviewAvg;
        }, 0);

        averageRating = totalRating / approvedReviews.length;
      }

      // Исключаем reviews из результата
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { reviews, ...hostingData } = hosting;

      return {
        ...hostingData,
        averageRating: averageRating !== null ? Number(averageRating.toFixed(1)) : null,
        reviewCount: approvedReviews.length,
      };
    });

    return NextResponse.json({
      hostings: hostingsWithRating,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Ошибка получения хостингов:", error);

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


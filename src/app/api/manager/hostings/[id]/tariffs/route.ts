import { prisma } from "@/shared/api/database";
import { TariffPeriod } from "@/shared/api/database/prisma";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для связей тарифа
 */
const TariffRelationsSchema = z.object({
  cms_ids: z.array(z.string().uuid()).optional(),
  control_panel_ids: z.array(z.string().uuid()).optional(),
  country_ids: z.array(z.string().uuid()).optional(),
  data_store_ids: z.array(z.string().uuid()).optional(),
  operation_system_ids: z.array(z.string().uuid()).optional(),
  programming_language_ids: z.array(z.string().uuid()).optional(),
});

/**
 * Схема валидации для создания тарифа
 */
const TariffCreateSchema = z
  .object({
    name: z
      .string()
      .min(1, "Название обязательно")
      .max(255, "Название слишком длинное"),
    subtitle: z
      .string()
      .max(255, "Подзаголовок слишком длинный")
      .optional()
      .nullable(),
    price: z
      .number()
      .positive("Цена должна быть положительной")
      .or(z.string().transform(val => parseFloat(val))),
    currency: z
      .string()
      .min(1, "Валюта обязательна")
      .max(10, "Валюта слишком длинная")
      .default("RUB"),
    period: z.nativeEnum(TariffPeriod),
    disk_space: z.number().int().positive().optional().nullable(),
    bandwidth: z.number().int().positive().optional().nullable(),
    domains_count: z.number().int().nonnegative().optional().nullable(),
    databases_count: z.number().int().nonnegative().optional().nullable(),
    email_accounts: z.number().int().nonnegative().optional().nullable(),
    is_active: z.boolean().default(true),
  })
  .merge(TariffRelationsSchema);

/**
 * GET /api/manager/hostings/[id]/tariffs - Получить список тарифов хостинга
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Проверяем авторизацию и права менеджера
    const session = await getServerSession(authOptions);
    if (!session || !hasManagerAccess(session.user.role)) {
      return NextResponse.json(
        { error: "Недостаточно прав доступа" },
        { status: 403 }
      );
    }

    const resolvedParams = await Promise.resolve(params);

    // Проверяем существование хостинга
    const hosting = await prisma.hosting.findUnique({
      where: { id: resolvedParams.id },
      select: { id: true },
    });

    if (!hosting) {
      return NextResponse.json({ error: "Хостинг не найден" }, { status: 404 });
    }

    // Загружаем тарифы с связями
    const tariffs = await prisma.tariff.findMany({
      where: { hostingId: resolvedParams.id },
      include: {
        cms: {
          include: {
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
          include: {
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
          include: {
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
          include: {
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
          include: {
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
          include: {
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
      orderBy: { createdAt: "desc" },
    });

    // Трансформируем данные для совместимости с UI
    const transformedTariffs = tariffs.map(tariff => ({
      ...tariff,
      cms: tariff.cms.map(tc => tc.cms),
      controlPanels: tariff.controlPanels.map(tcp => tcp.controlPanel),
      countries: tariff.countries.map(tc => tc.country),
      dataStores: tariff.dataStores.map(tds => tds.dataStore),
      operationSystems: tariff.operationSystems.map(tos => tos.operationSystem),
      programmingLanguages: tariff.programmingLanguages.map(
        tpl => tpl.programmingLanguage
      ),
    }));

    return NextResponse.json({ tariffs: transformedTariffs });
  } catch (error) {
    console.error("Ошибка получения тарифов:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manager/hostings/[id]/tariffs - Создать новый тариф
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Проверяем авторизацию и права менеджера
    const session = await getServerSession(authOptions);
    if (!session || !hasManagerAccess(session.user.role)) {
      return NextResponse.json(
        { error: "Недостаточно прав доступа" },
        { status: 403 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const body = await request.json();

    // Валидируем данные через Zod
    const validatedData = TariffCreateSchema.parse(body);
    const {
      name,
      subtitle,
      price,
      currency,
      period,
      disk_space,
      bandwidth,
      domains_count,
      databases_count,
      email_accounts,
      is_active,
      cms_ids,
      control_panel_ids,
      country_ids,
      data_store_ids,
      operation_system_ids,
      programming_language_ids,
    } = validatedData;

    // Проверяем существование хостинга
    const hosting = await prisma.hosting.findUnique({
      where: { id: resolvedParams.id },
      select: { id: true },
    });

    if (!hosting) {
      return NextResponse.json({ error: "Хостинг не найден" }, { status: 404 });
    }

    // Валидируем существование связанных сущностей
    const validationPromises: Promise<unknown>[] = [];

    if (cms_ids && cms_ids.length > 0) {
      validationPromises.push(
        prisma.cMS.count({ where: { id: { in: cms_ids } } }).then(count => {
          if (count !== cms_ids.length) {
            throw new Error("Один или несколько CMS не найдены");
          }
        })
      );
    }

    if (control_panel_ids && control_panel_ids.length > 0) {
      validationPromises.push(
        prisma.controlPanel
          .count({ where: { id: { in: control_panel_ids } } })
          .then(count => {
            if (count !== control_panel_ids.length) {
              throw new Error(
                "Одна или несколько панелей управления не найдены"
              );
            }
          })
      );
    }

    if (country_ids && country_ids.length > 0) {
      validationPromises.push(
        prisma.country
          .count({ where: { id: { in: country_ids } } })
          .then(count => {
            if (count !== country_ids.length) {
              throw new Error("Одна или несколько стран не найдены");
            }
          })
      );
    }

    if (data_store_ids && data_store_ids.length > 0) {
      validationPromises.push(
        prisma.dataStore
          .count({ where: { id: { in: data_store_ids } } })
          .then(count => {
            if (count !== data_store_ids.length) {
              throw new Error("Одно или несколько хранилищ данных не найдены");
            }
          })
      );
    }

    if (operation_system_ids && operation_system_ids.length > 0) {
      validationPromises.push(
        prisma.operationSystem
          .count({ where: { id: { in: operation_system_ids } } })
          .then(count => {
            if (count !== operation_system_ids.length) {
              throw new Error(
                "Одна или несколько операционных систем не найдены"
              );
            }
          })
      );
    }

    if (programming_language_ids && programming_language_ids.length > 0) {
      validationPromises.push(
        prisma.programmingLanguage
          .count({ where: { id: { in: programming_language_ids } } })
          .then(count => {
            if (count !== programming_language_ids.length) {
              throw new Error(
                "Один или несколько языков программирования не найдены"
              );
            }
          })
      );
    }

    await Promise.all(validationPromises);

    // Создаем тариф через транзакцию
    const tariff = await prisma.$transaction(async tx => {
      // Создаем тариф
      const newTariff = await tx.tariff.create({
        data: {
          hostingId: resolvedParams.id,
          name,
          subtitle: subtitle || null,
          price: typeof price === "string" ? parseFloat(price) : price,
          currency: currency || "RUB",
          period,
          diskSpace: disk_space ?? null,
          bandwidth: bandwidth ?? null,
          domainsCount: domains_count ?? null,
          databasesCount: databases_count ?? null,
          emailAccounts: email_accounts ?? null,
          isActive: is_active ?? true,
        },
      });

      // Создаем связи
      const relationPromises: Promise<unknown>[] = [];

      if (cms_ids && cms_ids.length > 0) {
        relationPromises.push(
          tx.tariffCMS.createMany({
            data: cms_ids.map(cmsId => ({
              tariffId: newTariff.id,
              cmsId,
            })),
          })
        );
      }

      if (control_panel_ids && control_panel_ids.length > 0) {
        relationPromises.push(
          tx.tariffControlPanel.createMany({
            data: control_panel_ids.map(controlPanelId => ({
              tariffId: newTariff.id,
              controlPanelId,
            })),
          })
        );
      }

      if (country_ids && country_ids.length > 0) {
        relationPromises.push(
          tx.tariffCountry.createMany({
            data: country_ids.map(countryId => ({
              tariffId: newTariff.id,
              countryId,
            })),
          })
        );
      }

      if (data_store_ids && data_store_ids.length > 0) {
        relationPromises.push(
          tx.tariffDataStore.createMany({
            data: data_store_ids.map(dataStoreId => ({
              tariffId: newTariff.id,
              dataStoreId,
            })),
          })
        );
      }

      if (operation_system_ids && operation_system_ids.length > 0) {
        relationPromises.push(
          tx.tariffOperationSystem.createMany({
            data: operation_system_ids.map(operationSystemId => ({
              tariffId: newTariff.id,
              operationSystemId,
            })),
          })
        );
      }

      if (programming_language_ids && programming_language_ids.length > 0) {
        relationPromises.push(
          tx.tariffProgrammingLanguage.createMany({
            data: programming_language_ids.map(programmingLanguageId => ({
              tariffId: newTariff.id,
              programmingLanguageId,
            })),
          })
        );
      }

      await Promise.all(relationPromises);

      // Загружаем созданный тариф со всеми связями
      const createdTariff = await tx.tariff.findUnique({
        where: { id: newTariff.id },
        include: {
          cms: {
            include: {
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
            include: {
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
            include: {
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
            include: {
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
            include: {
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
            include: {
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

      if (!createdTariff) {
        throw new Error("Не удалось загрузить созданный тариф");
      }

      // Трансформируем данные для совместимости с UI
      return {
        ...createdTariff,
        cms: createdTariff.cms.map(tc => tc.cms),
        controlPanels: createdTariff.controlPanels.map(tcp => tcp.controlPanel),
        countries: createdTariff.countries.map(tc => tc.country),
        dataStores: createdTariff.dataStores.map(tds => tds.dataStore),
        operationSystems: createdTariff.operationSystems.map(
          tos => tos.operationSystem
        ),
        programmingLanguages: createdTariff.programmingLanguages.map(
          tpl => tpl.programmingLanguage
        ),
      };
    });

    return NextResponse.json(
      {
        message: "Тариф успешно создан",
        tariff,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка создания тарифа:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные данные", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("не найдены")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

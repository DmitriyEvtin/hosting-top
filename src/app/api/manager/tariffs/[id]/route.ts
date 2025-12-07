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
 * Схема валидации для обновления тарифа
 */
const TariffUpdateSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(255, "Название слишком длинное").optional(),
  subtitle: z.string().max(255, "Подзаголовок слишком длинный").optional().nullable(),
  price: z.number().positive("Цена должна быть положительной").or(z.string().transform((val) => parseFloat(val))).optional(),
  currency: z.string().min(1, "Валюта обязательна").max(10, "Валюта слишком длинная").optional(),
  period: z.nativeEnum(TariffPeriod).optional(),
  disk_space: z.number().int().positive().optional().nullable(),
  bandwidth: z.number().int().positive().optional().nullable(),
  domains_count: z.number().int().nonnegative().optional().nullable(),
  databases_count: z.number().int().nonnegative().optional().nullable(),
  email_accounts: z.number().int().nonnegative().optional().nullable(),
  is_active: z.boolean().optional(),
}).merge(TariffRelationsSchema);

/**
 * GET /api/manager/tariffs/[id] - Получить детали тарифа
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

    // Загружаем тариф со всеми связями
    const tariff = await prisma.tariff.findUnique({
      where: { id: resolvedParams.id },
      include: {
        hosting: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
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

    if (!tariff) {
      return NextResponse.json(
        { error: "Тариф не найден" },
        { status: 404 }
      );
    }

    // Трансформируем данные для совместимости с UI
    const transformedTariff = {
      ...tariff,
      cms: tariff.cms.map(tc => tc.cms),
      controlPanels: tariff.controlPanels.map(tcp => tcp.controlPanel),
      countries: tariff.countries.map(tc => tc.country),
      dataStores: tariff.dataStores.map(tds => tds.dataStore),
      operationSystems: tariff.operationSystems.map(tos => tos.operationSystem),
      programmingLanguages: tariff.programmingLanguages.map(tpl => tpl.programmingLanguage),
    };

    return NextResponse.json({ tariff: transformedTariff });
  } catch (error) {
    console.error("Ошибка получения тарифа:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/manager/tariffs/[id] - Обновить тариф
 */
export async function PUT(
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
    const validatedData = TariffUpdateSchema.parse(body);
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

    // Проверяем существование тарифа
    const existingTariff = await prisma.tariff.findUnique({
      where: { id: resolvedParams.id },
      select: { id: true },
    });

    if (!existingTariff) {
      return NextResponse.json(
        { error: "Тариф не найден" },
        { status: 404 }
      );
    }

    // Валидируем существование связанных сущностей
    const validationPromises: Promise<unknown>[] = [];

    if (cms_ids && cms_ids.length > 0) {
      validationPromises.push(
        prisma.cMS.count({ where: { id: { in: cms_ids } } }).then((count) => {
          if (count !== cms_ids.length) {
            throw new Error("Один или несколько CMS не найдены");
          }
        })
      );
    }

    if (control_panel_ids && control_panel_ids.length > 0) {
      validationPromises.push(
        prisma.controlPanel.count({ where: { id: { in: control_panel_ids } } }).then((count) => {
          if (count !== control_panel_ids.length) {
            throw new Error("Одна или несколько панелей управления не найдены");
          }
        })
      );
    }

    if (country_ids && country_ids.length > 0) {
      validationPromises.push(
        prisma.country.count({ where: { id: { in: country_ids } } }).then((count) => {
          if (count !== country_ids.length) {
            throw new Error("Одна или несколько стран не найдены");
          }
        })
      );
    }

    if (data_store_ids && data_store_ids.length > 0) {
      validationPromises.push(
        prisma.dataStore.count({ where: { id: { in: data_store_ids } } }).then((count) => {
          if (count !== data_store_ids.length) {
            throw new Error("Одно или несколько хранилищ данных не найдены");
          }
        })
      );
    }

    if (operation_system_ids && operation_system_ids.length > 0) {
      validationPromises.push(
        prisma.operationSystem.count({ where: { id: { in: operation_system_ids } } }).then((count) => {
          if (count !== operation_system_ids.length) {
            throw new Error("Одна или несколько операционных систем не найдены");
          }
        })
      );
    }

    if (programming_language_ids && programming_language_ids.length > 0) {
      validationPromises.push(
        prisma.programmingLanguage.count({ where: { id: { in: programming_language_ids } } }).then((count) => {
          if (count !== programming_language_ids.length) {
            throw new Error("Один или несколько языков программирования не найдены");
          }
        })
      );
    }

    await Promise.all(validationPromises);

    // Обновляем тариф через транзакцию
    const tariff = await prisma.$transaction(async (tx) => {
      // Подготавливаем данные для обновления
      const updateData: Record<string, unknown> = {};

      if (name !== undefined) {
        updateData.name = name;
      }

      if (subtitle !== undefined) {
        updateData.subtitle = subtitle || null;
      }

      if (price !== undefined) {
        updateData.price = typeof price === "string" ? parseFloat(price) : price;
      }

      if (currency !== undefined) {
        updateData.currency = currency;
      }

      if (period !== undefined) {
        updateData.period = period;
      }

      if (disk_space !== undefined) {
        updateData.diskSpace = disk_space;
      }

      if (bandwidth !== undefined) {
        updateData.bandwidth = bandwidth;
      }

      if (domains_count !== undefined) {
        updateData.domainsCount = domains_count;
      }

      if (databases_count !== undefined) {
        updateData.databasesCount = databases_count;
      }

      if (email_accounts !== undefined) {
        updateData.emailAccounts = email_accounts;
      }

      if (is_active !== undefined) {
        updateData.isActive = is_active;
      }

      // Обновляем основные поля тарифа
      await tx.tariff.update({
        where: { id: resolvedParams.id },
        data: updateData,
      });

      // Пересоздаем связи только если они явно переданы в запросе
      // Если связи переданы (даже пустые массивы), удаляем старые и создаем новые
      // Если связи не переданы (undefined), оставляем их без изменений
      const relationPromises: Promise<unknown>[] = [];

      if (cms_ids !== undefined) {
        // Удаляем старые связи CMS
        relationPromises.push(
          tx.tariffCMS.deleteMany({ where: { tariffId: resolvedParams.id } })
        );
        // Создаем новые связи CMS, если они переданы
        if (cms_ids.length > 0) {
          relationPromises.push(
            tx.tariffCMS.createMany({
              data: cms_ids.map((cmsId) => ({
                tariffId: resolvedParams.id,
                cmsId,
              })),
            })
          );
        }
      }

      if (control_panel_ids !== undefined) {
        relationPromises.push(
          tx.tariffControlPanel.deleteMany({ where: { tariffId: resolvedParams.id } })
        );
        if (control_panel_ids.length > 0) {
          relationPromises.push(
            tx.tariffControlPanel.createMany({
              data: control_panel_ids.map((controlPanelId) => ({
                tariffId: resolvedParams.id,
                controlPanelId,
              })),
            })
          );
        }
      }

      if (country_ids !== undefined) {
        relationPromises.push(
          tx.tariffCountry.deleteMany({ where: { tariffId: resolvedParams.id } })
        );
        if (country_ids.length > 0) {
          relationPromises.push(
            tx.tariffCountry.createMany({
              data: country_ids.map((countryId) => ({
                tariffId: resolvedParams.id,
                countryId,
              })),
            })
          );
        }
      }

      if (data_store_ids !== undefined) {
        relationPromises.push(
          tx.tariffDataStore.deleteMany({ where: { tariffId: resolvedParams.id } })
        );
        if (data_store_ids.length > 0) {
          relationPromises.push(
            tx.tariffDataStore.createMany({
              data: data_store_ids.map((dataStoreId) => ({
                tariffId: resolvedParams.id,
                dataStoreId,
              })),
            })
          );
        }
      }

      if (operation_system_ids !== undefined) {
        relationPromises.push(
          tx.tariffOperationSystem.deleteMany({ where: { tariffId: resolvedParams.id } })
        );
        if (operation_system_ids.length > 0) {
          relationPromises.push(
            tx.tariffOperationSystem.createMany({
              data: operation_system_ids.map((operationSystemId) => ({
                tariffId: resolvedParams.id,
                operationSystemId,
              })),
            })
          );
        }
      }

      if (programming_language_ids !== undefined) {
        relationPromises.push(
          tx.tariffProgrammingLanguage.deleteMany({ where: { tariffId: resolvedParams.id } })
        );
        if (programming_language_ids.length > 0) {
          relationPromises.push(
            tx.tariffProgrammingLanguage.createMany({
              data: programming_language_ids.map((programmingLanguageId) => ({
                tariffId: resolvedParams.id,
                programmingLanguageId,
              })),
            })
          );
        }
      }

      await Promise.all(relationPromises);

      // Загружаем обновленный тариф со всеми связями
      const updatedTariff = await tx.tariff.findUnique({
        where: { id: resolvedParams.id },
        include: {
          hosting: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
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

      if (!updatedTariff) {
        throw new Error("Не удалось загрузить обновленный тариф");
      }

      // Трансформируем данные для совместимости с UI
      return {
        ...updatedTariff,
        cms: updatedTariff.cms.map(tc => tc.cms),
        controlPanels: updatedTariff.controlPanels.map(tcp => tcp.controlPanel),
        countries: updatedTariff.countries.map(tc => tc.country),
        dataStores: updatedTariff.dataStores.map(tds => tds.dataStore),
        operationSystems: updatedTariff.operationSystems.map(tos => tos.operationSystem),
        programmingLanguages: updatedTariff.programmingLanguages.map(tpl => tpl.programmingLanguage),
      };
    });

    // Трансформируем данные для совместимости с UI
    const transformedTariff = {
      ...tariff,
      cms: tariff.cms.map(tc => tc.cms),
      controlPanels: tariff.controlPanels.map(tcp => tcp.controlPanel),
      countries: tariff.countries.map(tc => tc.country),
      dataStores: tariff.dataStores.map(tds => tds.dataStore),
      operationSystems: tariff.operationSystems.map(tos => tos.operationSystem),
      programmingLanguages: tariff.programmingLanguages.map(tpl => tpl.programmingLanguage),
    };

    return NextResponse.json({
      message: "Тариф успешно обновлен",
      tariff: transformedTariff,
    });
  } catch (error) {
    console.error("Ошибка обновления тарифа:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные данные", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("не найдены")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/manager/tariffs/[id] - Удалить тариф
 */
export async function DELETE(
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

    // Проверяем существование тарифа
    const existingTariff = await prisma.tariff.findUnique({
      where: { id: resolvedParams.id },
      select: { id: true },
    });

    if (!existingTariff) {
      return NextResponse.json(
        { error: "Тариф не найден" },
        { status: 404 }
      );
    }

    // Удаляем тариф (связи удалятся автоматически через onDelete: Cascade)
    await prisma.tariff.delete({
      where: { id: resolvedParams.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Ошибка удаления тарифа:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


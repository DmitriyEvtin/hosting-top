import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerAccess } from "@/shared/lib/permissions";
import { generateSlug, ensureUniqueSlug } from "@/shared/lib/slug-utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для создания DataStore
 */
const DataStoreCreateSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(255, "Название слишком длинное"),
});

/**
 * Схема валидации для query параметров списка DataStore
 */
const DataStoreQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.enum(["name", "createdAt"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.string().optional().transform((val) => parseInt(val || "1", 10)),
  limit: z.string().optional().transform((val) => parseInt(val || "10", 10)),
});

/**
 * GET /api/manager/data-stores - Получить список DataStore с поиском и сортировкой
 */
export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию и права менеджера
    const session = await getServerSession(authOptions);
    if (!session || !hasManagerAccess(session.user.role)) {
      return NextResponse.json(
        { error: "Недостаточно прав доступа" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Парсим и валидируем query параметры
    const queryParams = {
      search: searchParams.get("search") || undefined,
      sort: searchParams.get("sort") || "name",
      order: searchParams.get("order") || "asc",
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const validatedQuery = DataStoreQuerySchema.parse(queryParams);
    const { search, sort, order, page, limit } = validatedQuery;

    const skip = (page - 1) * limit;

    // Строим фильтры
    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    // Определяем сортировку
    const orderBy: Record<string, string> = {};
    orderBy[sort] = order;

    // Получаем DataStore с пагинацией
    const [dataStores, total] = await Promise.all([
      prisma.dataStore.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              tariffs: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.dataStore.count({ where }),
    ]);

    return NextResponse.json({
      dataStores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Ошибка получения DataStore:", error);
    
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

/**
 * POST /api/manager/data-stores - Создать новый DataStore
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию и права менеджера
    const session = await getServerSession(authOptions);
    if (!session || !hasManagerAccess(session.user.role)) {
      return NextResponse.json(
        { error: "Недостаточно прав доступа" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Валидируем данные через Zod
    const validatedData = DataStoreCreateSchema.parse(body);
    const { name } = validatedData;

    // Проверяем уникальность name
    const existingByName = await prisma.dataStore.findFirst({
      where: { name },
    });

    if (existingByName) {
      return NextResponse.json(
        { error: "DataStore с таким названием уже существует" },
        { status: 409 }
      );
    }

    // Генерируем slug из названия
    const baseSlug = generateSlug(name);

    // Получаем все существующие slug для проверки уникальности
    const existingDataStores = await prisma.dataStore.findMany({
      select: { slug: true },
    });
    const existingSlugs = existingDataStores.map((ds) => ds.slug);

    // Обеспечиваем уникальность slug
    const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);

    // Создаем DataStore
    const dataStore = await prisma.dataStore.create({
      data: {
        name,
        slug: uniqueSlug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return NextResponse.json(
      {
        message: "DataStore успешно создан",
        dataStore,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка создания DataStore:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные данные", details: error.issues },
        { status: 400 }
      );
    }

    // Проверка на уникальность slug (Prisma error)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "DataStore с таким slug уже существует" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


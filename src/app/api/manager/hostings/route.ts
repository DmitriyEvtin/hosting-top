import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerAccess } from "@/shared/lib/permissions";
import { generateSlug, ensureUniqueSlug } from "@/shared/lib/slug-utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для создания хостинга
 */
const HostingCreateSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(255, "Название слишком длинное"),
  description: z.string().optional(),
  websiteUrl: z.string().url("Некорректный URL").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

/**
 * Схема валидации для обновления хостинга
 */
const HostingUpdateSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(255, "Название слишком длинное").optional(),
  description: z.string().optional(),
  logoUrl: z.string().url("Некорректный URL").optional().or(z.literal("")),
  websiteUrl: z.string().url("Некорректный URL").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

/**
 * Схема валидации для query параметров списка хостингов
 */
const HostingQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.string().optional().transform((val) => val === "true" ? true : val === "false" ? false : undefined),
  page: z.string().optional().transform((val) => parseInt(val || "1", 10)),
  limit: z.string().optional().transform((val) => parseInt(val || "10", 10)),
});

/**
 * GET /api/manager/hostings - Получить список хостингов с пагинацией и фильтрами
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
      isActive: searchParams.get("is_active") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const validatedQuery = HostingQuerySchema.parse(queryParams);
    const { search, isActive, page, limit } = validatedQuery;

    const skip = (page - 1) * limit;

    // Строим фильтры
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Получаем хостинги с пагинацией
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
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              tariffs: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.hosting.count({ where }),
    ]);

    return NextResponse.json({
      hostings,
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

/**
 * POST /api/manager/hostings - Создать новый хостинг
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
    const validatedData = HostingCreateSchema.parse(body);
    const { name, description, websiteUrl, isActive } = validatedData;

    // Генерируем slug из названия
    const baseSlug = generateSlug(name);

    // Получаем все существующие slug для проверки уникальности
    const existingHostings = await prisma.hosting.findMany({
      select: { slug: true },
    });
    const existingSlugs = existingHostings.map((h) => h.slug);

    // Обеспечиваем уникальность slug
    const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);

    // Создаем хостинг
    const hosting = await prisma.hosting.create({
      data: {
        name,
        slug: uniqueSlug,
        description: description || null,
        websiteUrl: websiteUrl || null,
        isActive: isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        websiteUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Хостинг успешно создан",
        hosting,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка создания хостинга:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные данные", details: error.issues },
        { status: 400 }
      );
    }

    // Проверка на уникальность slug (Prisma error)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Хостинг с таким slug уже существует" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


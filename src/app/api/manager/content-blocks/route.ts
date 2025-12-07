import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для key формата (snake_case)
 */
const snakeCaseRegex = /^[a-z0-9_]+$/;

/**
 * Схема валидации для создания ContentBlock
 */
const ContentBlockCreateSchema = z.object({
  key: z
    .string()
    .min(1, "Key обязателен")
    .max(255, "Key слишком длинный")
    .regex(snakeCaseRegex, "Key должен быть в формате snake_case (только строчные буквы, цифры и подчеркивания)"),
  title: z.string().max(255, "Название слишком длинное").optional(),
  content: z.string().max(50000, "Контент слишком длинный (максимум 50000 символов)").optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Схема валидации для query параметров списка ContentBlock
 */
const ContentBlockQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  sort: z.enum(["key", "title", "createdAt", "updatedAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.string().optional().transform((val) => parseInt(val || "1", 10)),
  limit: z.string().optional().transform((val) => parseInt(val || "10", 10)),
});

/**
 * GET /api/manager/content-blocks - Получить список блоков контента с поиском и фильтрацией
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
      sort: searchParams.get("sort") || "createdAt",
      order: searchParams.get("order") || "desc",
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const validatedQuery = ContentBlockQuerySchema.parse(queryParams);
    const { search, isActive, sort, order, page, limit } = validatedQuery;

    const skip = (page - 1) * limit;

    // Строим фильтры
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { key: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Определяем сортировку
    const orderBy: Record<string, string> = {};
    orderBy[sort] = order;

    // Получаем блоки контента с пагинацией
    const [contentBlocks, total] = await Promise.all([
      prisma.contentBlock.findMany({
        where,
        select: {
          id: true,
          key: true,
          title: true,
          content: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.contentBlock.count({ where }),
    ]);

    return NextResponse.json({
      contentBlocks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Ошибка получения блоков контента:", error);

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
 * POST /api/manager/content-blocks - Создать новый блок контента
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
    const validatedData = ContentBlockCreateSchema.parse(body);
    const { key, title, content, isActive } = validatedData;

    // Проверяем уникальность key
    const existingByKey = await prisma.contentBlock.findUnique({
      where: { key },
    });

    if (existingByKey) {
      return NextResponse.json(
        { error: "Блок контента с таким key уже существует" },
        { status: 409 }
      );
    }

    // Создаем блок контента
    const contentBlock = await prisma.contentBlock.create({
      data: {
        key,
        title: title || null,
        content: content || null,
        isActive: isActive ?? true,
      },
      select: {
        id: true,
        key: true,
        title: true,
        content: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Блок контента успешно создан",
        contentBlock,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка создания блока контента:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные данные", details: error.issues },
        { status: 400 }
      );
    }

    // Проверка на уникальность key (Prisma error)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Блок контента с таким key уже существует" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


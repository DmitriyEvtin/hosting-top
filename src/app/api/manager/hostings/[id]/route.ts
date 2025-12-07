import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerAccess } from "@/shared/lib/permissions";
import { generateSlug, ensureUniqueSlug } from "@/shared/lib/slug-utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
 * GET /api/manager/hostings/[id] - Получить детали хостинга
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
    const hosting = await prisma.hosting.findUnique({
      where: { id: resolvedParams.id },
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
        tariffs: {
          select: {
            id: true,
            name: true,
            currency: true,
            isActive: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!hosting) {
      return NextResponse.json(
        { error: "Хостинг не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ hosting });
  } catch (error) {
    console.error("Ошибка получения хостинга:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/manager/hostings/[id] - Обновить хостинг
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
    const validatedData = HostingUpdateSchema.parse(body);

    // Проверяем, существует ли хостинг
    const existingHosting = await prisma.hosting.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingHosting) {
      return NextResponse.json(
        { error: "Хостинг не найден" },
        { status: 404 }
      );
    }

    // Подготавливаем данные для обновления
    const updateData: Record<string, unknown> = {};

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
      
      // Если изменилось название, пересоздаем slug
      if (validatedData.name !== existingHosting.name) {
        const baseSlug = generateSlug(validatedData.name);
        
        // Получаем все существующие slug (кроме текущего)
        const existingHostings = await prisma.hosting.findMany({
          where: { id: { not: resolvedParams.id } },
          select: { slug: true },
        });
        const existingSlugs = existingHostings.map((h) => h.slug);
        
        // Обеспечиваем уникальность slug
        const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);
        updateData.slug = uniqueSlug;
      }
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description || null;
    }

    if (validatedData.logoUrl !== undefined) {
      updateData.logoUrl = validatedData.logoUrl || null;
    }

    if (validatedData.websiteUrl !== undefined) {
      updateData.websiteUrl = validatedData.websiteUrl || null;
    }

    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    // Обновляем хостинг
    const hosting = await prisma.hosting.update({
      where: { id: resolvedParams.id },
      data: updateData,
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

    return NextResponse.json({
      message: "Хостинг успешно обновлен",
      hosting,
    });
  } catch (error) {
    console.error("Ошибка обновления хостинга:", error);

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

/**
 * DELETE /api/manager/hostings/[id] - Удалить хостинг
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
    // Проверяем, существует ли хостинг
    const existingHosting = await prisma.hosting.findUnique({
      where: { id: resolvedParams.id },
      include: {
        tariffs: {
          select: { id: true },
        },
      },
    });

    if (!existingHosting) {
      return NextResponse.json(
        { error: "Хостинг не найден" },
        { status: 404 }
      );
    }

    // Проверяем наличие связанных тарифов
    if (existingHosting.tariffs.length > 0) {
      return NextResponse.json(
        { 
          error: "Нельзя удалить хостинг с тарифами",
          tariffsCount: existingHosting.tariffs.length,
        },
        { status: 400 }
      );
    }

    // Удаляем хостинг
    await prisma.hosting.delete({
      where: { id: resolvedParams.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Ошибка удаления хостинга:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerAccess } from "@/shared/lib/permissions";
import { generateSlug, ensureUniqueSlug } from "@/shared/lib/slug-utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для обновления CMS
 */
const CMSUpdateSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(255, "Название слишком длинное").optional(),
});

/**
 * GET /api/manager/cms/[id] - Получить детали CMS
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
    const cms = await prisma.cMS.findUnique({
      where: { id: resolvedParams.id },
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
    });

    if (!cms) {
      return NextResponse.json(
        { error: "CMS не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ cms });
  } catch (error) {
    console.error("Ошибка получения CMS:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/manager/cms/[id] - Обновить CMS
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
    const validatedData = CMSUpdateSchema.parse(body);

    // Проверяем, существует ли CMS
    const existingCMS = await prisma.cMS.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingCMS) {
      return NextResponse.json(
        { error: "CMS не найден" },
        { status: 404 }
      );
    }

    // Подготавливаем данные для обновления
    const updateData: Record<string, unknown> = {};

    if (validatedData.name !== undefined) {
      // Проверяем уникальность name (кроме текущего)
      const existingByName = await prisma.cMS.findFirst({
        where: {
          name: validatedData.name,
          id: { not: resolvedParams.id },
        },
      });

      if (existingByName) {
        return NextResponse.json(
          { error: "CMS с таким названием уже существует" },
          { status: 409 }
        );
      }

      updateData.name = validatedData.name;
      
      // Если изменилось название, пересоздаем slug
      if (validatedData.name !== existingCMS.name) {
        const baseSlug = generateSlug(validatedData.name);
        
        // Получаем все существующие slug (кроме текущего)
        const existingCMSList = await prisma.cMS.findMany({
          where: { id: { not: resolvedParams.id } },
          select: { slug: true },
        });
        const existingSlugs = existingCMSList.map((c) => c.slug);
        
        // Обеспечиваем уникальность slug
        const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);
        updateData.slug = uniqueSlug;
      }
    }

    // Обновляем CMS
    const cms = await prisma.cMS.update({
      where: { id: resolvedParams.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return NextResponse.json({
      message: "CMS успешно обновлен",
      cms,
    });
  } catch (error) {
    console.error("Ошибка обновления CMS:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные данные", details: error.issues },
        { status: 400 }
      );
    }

    // Проверка на уникальность slug (Prisma error)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "CMS с таким slug уже существует" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/manager/cms/[id] - Удалить CMS
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
    
    // Проверяем, существует ли CMS
    const existingCMS = await prisma.cMS.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        _count: {
          select: {
            tariffs: true,
          },
        },
      },
    });

    if (!existingCMS) {
      return NextResponse.json(
        { error: "CMS не найден" },
        { status: 404 }
      );
    }

    // Проверяем наличие связанных тарифов
    if (existingCMS._count.tariffs > 0) {
      return NextResponse.json(
        { 
          error: "Нельзя удалить CMS, который используется в тарифах",
          tariffsCount: existingCMS._count.tariffs,
        },
        { status: 409 }
      );
    }

    // Удаляем CMS
    await prisma.cMS.delete({
      where: { id: resolvedParams.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Ошибка удаления CMS:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}


import { prisma } from "@/shared/api/database";
import { authOptions } from "@/shared/lib/auth-config";
import { hasManagerAccess } from "@/shared/lib/permissions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Схема валидации для обновления ContentBlock
 * key не может быть изменен при обновлении
 */
const ContentBlockUpdateSchema = z.object({
  title: z.string().max(255, "Название слишком длинное").optional(),
  content: z.string().max(50000, "Контент слишком длинный (максимум 50000 символов)").optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/manager/content-blocks/[id] - Получить детали блока контента
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
    const contentBlock = await prisma.contentBlock.findUnique({
      where: { id: resolvedParams.id },
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

    if (!contentBlock) {
      return NextResponse.json(
        { error: "Блок контента не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contentBlock });
  } catch (error) {
    console.error("Ошибка получения блока контента:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/manager/content-blocks/[id] - Обновить блок контента
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
    const validatedData = ContentBlockUpdateSchema.parse(body);

    // Проверяем, существует ли блок контента
    const existingContentBlock = await prisma.contentBlock.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingContentBlock) {
      return NextResponse.json(
        { error: "Блок контента не найден" },
        { status: 404 }
      );
    }

    // Подготавливаем данные для обновления
    const updateData: Record<string, unknown> = {};

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title || null;
    }

    if (validatedData.content !== undefined) {
      updateData.content = validatedData.content || null;
    }

    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    // Обновляем блок контента (key не изменяется)
    const contentBlock = await prisma.contentBlock.update({
      where: { id: resolvedParams.id },
      data: updateData,
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

    return NextResponse.json({
      message: "Блок контента успешно обновлен",
      contentBlock,
    });
  } catch (error) {
    console.error("Ошибка обновления блока контента:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные данные", details: error.issues },
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
 * DELETE /api/manager/content-blocks/[id] - Удалить блок контента
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

    // Проверяем, существует ли блок контента
    const existingContentBlock = await prisma.contentBlock.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingContentBlock) {
      return NextResponse.json(
        { error: "Блок контента не найден" },
        { status: 404 }
      );
    }

    // Удаляем блок контента
    await prisma.contentBlock.delete({
      where: { id: resolvedParams.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Ошибка удаления блока контента:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

